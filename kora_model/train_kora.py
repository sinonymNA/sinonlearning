#!/usr/bin/env python3
"""
KORA model training pipeline.

KORA is Sinon Learning's pedagogical understanding engine. It is not a
tutor and does not replace the teacher. Given lesson content and/or a
student response, KORA returns structured JSON that makes student
understanding visible to the teacher.

Usage:
    python train_kora.py bootstrap
    python train_kora.py synthesize
    python train_kora.py validate
    python train_kora.py train
    python train_kora.py eval

See README.md for the full pipeline walkthrough and environment variables
used by `train` / `eval`.
"""

import argparse
import hashlib
import json
import os
import random
import sys
from collections import Counter
from pathlib import Path

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTPUTS_DIR = BASE_DIR / "outputs"

SEED_CONCEPTS_PATH = DATA_DIR / "seed_concepts.json"
TRAIN_PATH = DATA_DIR / "kora_train.jsonl"
EVAL_PATH = DATA_DIR / "kora_eval.jsonl"

DEFAULT_ADAPTER_DIR = OUTPUTS_DIR / "kora-lora"

# --------------------------------------------------------------------------
# Shared constants
# --------------------------------------------------------------------------

SYSTEM_PROMPT = (
    "You are KORA, Sinon Learning's pedagogical understanding engine. "
    "You do not act as a tutor. You do not replace the teacher. You return "
    "structured JSON that makes student understanding visible."
)

# The four evidence states KORA may report for any understanding dimension.
EVIDENCE_LEVELS = ["Not Yet Shown", "Emerging", "Solid", "Strong"]

# Allowed node/edge types for the "understanding graph" task.
NODE_TYPES = [
    "concept",
    "prerequisite",
    "misconception",
    "example",
    "non-example",
    "transfer-context",
    "evidence-skill",
]
EDGE_TYPES = [
    "requires",
    "causes",
    "contrasts-with",
    "commonly-confused-with",
    "transfers-to",
    "evidence-for",
    "example-of",
    "non-example-of",
]

# Allowed event types for the "evidence events" task.
EVENT_TYPES = [
    "recognition",
    "explanation",
    "application",
    "discrimination",
    "transfer",
    "generation",
    "model-building",
    "revision",
]

# The 8 required answer-quality variants for "evaluate" / "diagnosis" tasks.
ANSWER_VARIANTS = [
    "strong",
    "partial",
    "vague",
    "confidently_wrong",
    "misconception_based",
    "transfer_failure",
    "vocab_without_application",
    "application_without_vocab",
]

# The 9 KORA tasks this pipeline teaches.
TASK_TYPES = [
    "anchor",
    "graph",
    "evidence_events",
    "misconception_sim",
    "evaluate",
    "next_probe",
    "diagnosis",
    "notes_generation",
    "game_response_eval",
]

EVIDENCE_DIMENSIONS = ["accuracy", "causality", "application", "transfer", "model_quality"]

# --------------------------------------------------------------------------
# Shared helpers
# --------------------------------------------------------------------------


def load_jsonl(path):
    """Load a .jsonl file into a list of dicts."""
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def write_jsonl(path, rows):
    """Write a list of dicts to a .jsonl file, one JSON object per line."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False))
            f.write("\n")


def make_chat_example(user_text, assistant_obj):
    """
    Build one KORA training example in the required chat JSONL schema.

    This is the single place that enforces the schema (system/user/assistant
    roles in order) and serializes the assistant's structured response, so
    every generated example's assistant content is guaranteed to be valid
    JSON by construction.
    """
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_text},
            {
                "role": "assistant",
                "content": json.dumps(assistant_obj, ensure_ascii=False),
            },
        ]
    }


# --------------------------------------------------------------------------
# bootstrap
# --------------------------------------------------------------------------

SEED_CONCEPTS = [
    {
        "id": "opportunity-cost",
        "concept": "Opportunity Cost",
        "subject": "Economics",
        "grade_band": "9-10",
        "source_content": (
            "Opportunity cost is the value of the next-best alternative you give "
            "up when you make a choice. Every decision -- spending money, "
            "spending time, allocating resources -- involves a trade-off, and "
            "the opportunity cost is whatever you would have gotten from the "
            "option you didn't choose. It is not the same as the total cost of "
            "all alternatives, only the single best one foregone."
        ),
        "standard": "HS.Econ.2.3 - Analyze the role of opportunity cost in decision-making.",
        "teacher_goal": (
            "Students should be able to identify the next-best alternative in a "
            "decision and explain why opportunity cost is about trade-offs, not "
            "just money spent."
        ),
    },
    {
        "id": "inflation",
        "concept": "Inflation",
        "subject": "Economics",
        "grade_band": "9-10",
        "source_content": (
            "Inflation is a sustained increase in the general price level of "
            "goods and services in an economy over time, which reduces the "
            "purchasing power of money. It is typically measured using a price "
            "index, such as the Consumer Price Index (CPI). Moderate inflation "
            "is normal in a growing economy, but high or unpredictable "
            "inflation erodes savings and makes planning difficult."
        ),
        "standard": "HS.Econ.4.1 - Explain how inflation affects purchasing power and economic decision-making.",
        "teacher_goal": (
            "Students should distinguish inflation (a sustained rise in the "
            "general price level) from a single price increase, and connect it "
            "to purchasing power."
        ),
    },
    {
        "id": "supply-and-demand",
        "concept": "Supply and Demand",
        "subject": "Economics",
        "grade_band": "9-10",
        "source_content": (
            "Supply and demand describes how the price and quantity of a good "
            "are determined in a market. Demand is the relationship between "
            "price and the quantity buyers are willing to purchase; supply is "
            "the relationship between price and the quantity sellers are "
            "willing to produce. The market price tends toward equilibrium, "
            "where quantity supplied equals quantity demanded. A shift in "
            "either curve -- not just a movement along it -- changes the "
            "equilibrium price and quantity."
        ),
        "standard": "HS.Econ.1.2 - Explain how supply and demand determine market price and quantity.",
        "teacher_goal": (
            "Students should distinguish a shift in a supply/demand curve from "
            "a movement along it, and explain how each changes equilibrium."
        ),
    },
    {
        "id": "separation-of-powers",
        "concept": "Separation of Powers",
        "subject": "Civics",
        "grade_band": "11-12",
        "source_content": (
            "Separation of powers divides government authority among "
            "independent branches -- legislative, executive, and judicial -- "
            "so that no single branch can dominate the others. Each branch is "
            "given distinct powers, and a system of checks and balances allows "
            "each branch to limit the others, for example through veto power, "
            "judicial review, or the power to impeach. The goal is to prevent "
            "the concentration and abuse of power."
        ),
        "standard": "HS.Civics.3.1 - Analyze how separation of powers and checks and balances limit government authority.",
        "teacher_goal": (
            "Students should explain not just what the three branches do, but "
            "how specific checks-and-balances mechanisms prevent any one "
            "branch from becoming too powerful."
        ),
    },
    {
        "id": "silk-roads",
        "concept": "Silk Roads",
        "subject": "World History",
        "grade_band": "9-10",
        "source_content": (
            "The Silk Roads were a network of overland and maritime trade "
            "routes connecting East Asia, Central Asia, South Asia, the Middle "
            "East, and Europe from roughly 200 BCE to 1450 CE. Goods such as "
            "silk, spices, and precious metals were exchanged, but the routes "
            "also enabled the spread of religions, technologies, art, and "
            "diseases such as the Black Death. No single merchant typically "
            "traveled the entire route; goods and ideas passed through many "
            "hands across interconnected regional networks."
        ),
        "standard": "HS.WH.2.4 - Explain how trade networks facilitated the exchange of goods, ideas, and disease across Afro-Eurasia.",
        "teacher_goal": (
            "Students should explain the Silk Roads as a network that "
            "transmitted more than goods -- including ideas, religion, and "
            "disease -- not as a single fixed road."
        ),
    },
    {
        "id": "photosynthesis",
        "concept": "Photosynthesis",
        "subject": "Biology",
        "grade_band": "9-10",
        "source_content": (
            "Photosynthesis is the process by which plants, algae, and some "
            "bacteria convert light energy into chemical energy stored in "
            "glucose. Using carbon dioxide and water, and capturing light "
            "energy with chlorophyll in the chloroplasts, the overall reaction "
            "produces glucose and oxygen: 6CO2 + 6H2O + light -> C6H12O6 + "
            "6O2. Photosynthesis is the foundation of most food chains and is "
            "the primary source of atmospheric oxygen."
        ),
        "standard": "HS.LS.1.5 - Use a model to illustrate that photosynthesis transforms light energy into stored chemical energy.",
        "teacher_goal": (
            "Students should explain photosynthesis as an energy "
            "transformation (light to chemical energy) with specific inputs "
            "and outputs, not just 'plants make food from sunlight.'"
        ),
    },
]


def cmd_bootstrap(_args):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(SEED_CONCEPTS_PATH, "w", encoding="utf-8") as f:
        json.dump(SEED_CONCEPTS, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"[KORA] Wrote {len(SEED_CONCEPTS)} seed concepts to {SEED_CONCEPTS_PATH}")
    for concept in SEED_CONCEPTS:
        print(f"  - {concept['id']}: {concept['concept']} ({concept['subject']}, grade {concept['grade_band']})")


# --------------------------------------------------------------------------
# synthesize — per-concept knowledge banks
# --------------------------------------------------------------------------

CONCEPT_FACTS = {
    "opportunity-cost": {
        "anchor_statement": "Every choice involves a trade-off; opportunity cost is the value of the single best alternative you didn't choose.",
        "core_understanding": [
            "Opportunity cost is the value of the next-best foregone alternative, not all alternatives combined.",
            "Every choice uses scarce resources, so every choice has an opportunity cost.",
            "Opportunity cost may be non-monetary (time, enjoyment, safety).",
        ],
        "prerequisites": ["Scarcity of resources", "Trade-offs in decision-making", "Marginal thinking"],
        "misconceptions": [
            {"label": "Opportunity cost equals total monetary cost", "description": "Students confuse opportunity cost with the dollar amount spent, ignoring the value of what was given up.", "student_response": "The opportunity cost of buying a $50 concert ticket is $50."},
            {"label": "Opportunity cost includes all forgone alternatives", "description": "Students sum up all unchosen options rather than identifying only the single next-best one.", "student_response": "If I have three options, my opportunity cost is the sum of the other two options I didn't pick."},
            {"label": "Non-monetary choices have no opportunity cost", "description": "Students think opportunity cost only applies when money is involved, not when time or effort is the resource.", "student_response": "Choosing to play video games instead of studying doesn't have an opportunity cost since no money is spent."},
        ],
        "examples": [
            "A student spends Saturday studying instead of working; the opportunity cost is the wages they could have earned.",
            "A government spends its budget on roads instead of hospitals; the opportunity cost is the healthcare not provided.",
            "A farmer plants wheat instead of corn; the opportunity cost is the corn revenue they forgo.",
        ],
        "non_examples": [
            "The total price you pay at the checkout for groceries (that is an explicit cost, not the foregone alternative).",
            "Regretting a past purchase (regret is emotional; opportunity cost is an economic concept about value of alternatives).",
        ],
        "transfer_contexts": [
            "Applying opportunity cost logic to college choice versus entering the workforce.",
            "Analyzing a country's decision to invest in military versus education spending.",
        ],
        "evidence_skills": [
            "Identify the single next-best alternative in a given decision scenario.",
            "Explain why opportunity cost is not the total cost of all alternatives.",
            "Apply opportunity cost reasoning to a non-monetary trade-off such as time use.",
        ],
    },
    "inflation": {
        "anchor_statement": "Inflation is a sustained rise in the general price level, reducing how much a unit of money can buy.",
        "core_understanding": [
            "Inflation measures a change in the average price level across many goods, not a single price rise.",
            "Inflation reduces purchasing power — each dollar buys fewer goods and services over time.",
            "Moderate inflation is typical in growing economies; high or unpredictable inflation is harmful.",
        ],
        "prerequisites": ["Money as a medium of exchange", "Price levels and indexes", "Supply and demand basics"],
        "misconceptions": [
            {"label": "One price rising equals inflation", "description": "Students conflate a single good becoming more expensive with economy-wide inflation.", "student_response": "Gas prices went up, so we are having inflation right now."},
            {"label": "Inflation only affects the poor", "description": "Students do not realize inflation has unequal effects depending on what people own.", "student_response": "Inflation does not really affect rich people since they have a lot of money."},
            {"label": "Inflation is always bad", "description": "Students do not know that moderate inflation signals economic growth and that deflation can also be harmful.", "student_response": "All inflation is bad and we should always try to make it zero."},
        ],
        "examples": [
            "The CPI rises 3% over a year, meaning the average basket of consumer goods now costs 3% more.",
            "In hyperinflationary periods such as 1920s Germany, savings became worthless in weeks.",
            "A 2% annual inflation target is maintained by central banks as normal and healthy.",
        ],
        "non_examples": [
            "A single store raising prices on milk due to a local shortage (not economy-wide).",
            "A seasonal price increase in airfares around holidays (temporary, single-sector, not sustained).",
        ],
        "transfer_contexts": [
            "Analyzing how a retiree on a fixed income is affected differently by inflation than a homeowner.",
            "Comparing inflation effects in different countries using historical CPI data.",
        ],
        "evidence_skills": [
            "Distinguish a single price increase from economy-wide inflation.",
            "Explain the relationship between inflation and purchasing power with a concrete example.",
            "Evaluate who benefits and who is harmed by moderate inflation.",
        ],
    },
    "supply-and-demand": {
        "anchor_statement": "Market price and quantity are determined by how supply and demand interact; each curve can shift independently, changing equilibrium.",
        "core_understanding": [
            "A change in price causes movement along a curve, not a shift of the curve.",
            "A change in non-price factors such as income, input costs, or technology shifts the curve itself.",
            "Equilibrium is where quantity demanded equals quantity supplied; when a curve shifts, equilibrium changes.",
        ],
        "prerequisites": ["What a market is", "Price as a signal", "Ceteris paribus assumption"],
        "misconceptions": [
            {"label": "A price change shifts the demand curve", "description": "Students confuse a movement along the demand curve with a shift of the entire curve.", "student_response": "When prices go up, the demand curve shifts to the left."},
            {"label": "Supply always equals demand", "description": "Students think markets are always at equilibrium and do not understand that surpluses and shortages can exist temporarily.", "student_response": "Whatever is produced will be bought, so supply always equals demand."},
            {"label": "Higher price always means higher demand", "description": "Students mix up the relationship between price and quantity demanded.", "student_response": "If a luxury bag price goes up, demand increases because people want it more for status."},
        ],
        "examples": [
            "A drought reduces the supply of oranges; the supply curve shifts left, raising the equilibrium price.",
            "Consumer incomes rise; the demand curve for restaurant meals shifts right, raising equilibrium price and quantity.",
            "A new technology cuts the cost of making solar panels; supply shifts right, lowering the equilibrium price.",
        ],
        "non_examples": [
            "Consumers buy less coffee when the price of coffee rises (movement along the demand curve, not a curve shift).",
            "A business produces more at a higher price (movement along the supply curve, not a shift).",
        ],
        "transfer_contexts": [
            "Applying supply-demand analysis to housing markets and rent control debates.",
            "Analyzing how a new trade tariff shifts supply and affects equilibrium price in a global market.",
        ],
        "evidence_skills": [
            "Identify whether a scenario causes a shift of a curve or movement along it.",
            "Predict the direction of change in equilibrium price and quantity when a curve shifts.",
            "Distinguish between quantity demanded and demand as the whole relationship.",
        ],
    },
    "separation-of-powers": {
        "anchor_statement": "Separation of powers prevents tyranny by dividing government authority so no single branch can dominate the others.",
        "core_understanding": [
            "Each branch (legislative, executive, judicial) has distinct, enumerated powers.",
            "Checks and balances give each branch specific tools to limit the others.",
            "The goal is not efficiency but preventing concentrated, unchecked authority.",
        ],
        "prerequisites": ["What a democratic government is", "Constitutional law basics", "Federalism vs. separation of powers"],
        "misconceptions": [
            {"label": "Separation of powers means equal power in all situations", "description": "Students think all three branches are exactly equal in all respects, ignoring that specific powers differ.", "student_response": "Separation of powers means every branch has the same amount of power in every situation."},
            {"label": "The president can make laws", "description": "Students conflate executive and legislative powers, believing the president both proposes and enacts laws.", "student_response": "The president makes new laws by signing executive orders."},
            {"label": "Checks and balances are the same as separation of powers", "description": "Students do not distinguish the principle from the mechanism.", "student_response": "Separation of powers and checks and balances mean exactly the same thing."},
        ],
        "examples": [
            "Congress passes a law, but the president vetoes it; Congress can override with a two-thirds majority.",
            "The Supreme Court strikes down a law as unconstitutional (judicial review as a check on Congress).",
            "The Senate must confirm presidential cabinet appointments (legislative check on executive appointments).",
        ],
        "non_examples": [
            "A monarchy where the king holds all legislative, executive, and judicial authority (no separation).",
            "A parliamentary system where the executive is drawn from the legislature (fusion of powers, not separation).",
        ],
        "transfer_contexts": [
            "Comparing the U.S. system to a parliamentary system to evaluate trade-offs in governmental design.",
            "Analyzing a historical moment when checks and balances prevented an executive overreach.",
        ],
        "evidence_skills": [
            "Identify which branch holds a specific constitutional power in a given scenario.",
            "Explain how a specific check such as veto or judicial review limits another branch.",
            "Distinguish separation of powers (the principle) from checks and balances (the mechanism).",
        ],
    },
    "silk-roads": {
        "anchor_statement": "The Silk Roads were an interconnected network that spread not just goods but religions, ideas, and diseases across Afro-Eurasia.",
        "core_understanding": [
            "The Silk Roads were a network of routes, not a single road traveled end-to-end by one merchant.",
            "Cultural and biological exchange including religion, technology, and disease was as significant as the exchange of goods.",
            "Intermediaries and relay trade meant goods and ideas changed hands many times across the network.",
        ],
        "prerequisites": ["Geography of Afro-Eurasia", "What trade networks are", "Concept of cultural diffusion"],
        "misconceptions": [
            {"label": "The Silk Roads were a single road", "description": "Students think it was one physical route rather than a vast network of land and sea routes.", "student_response": "Merchants traveled the single Silk Road from China to Rome."},
            {"label": "Only silk was traded on the Silk Roads", "description": "Students assume the routes were named for their main cargo and do not recognize the breadth of exchange.", "student_response": "The Silk Roads were primarily about trading silk and not much else."},
            {"label": "Merchants traveled the entire Silk Road route", "description": "Students imagine individual merchants making the whole journey rather than relay trade through many intermediaries.", "student_response": "A Chinese merchant would carry silk all the way to Rome and back."},
        ],
        "examples": [
            "Buddhism spreading from India to China and Central Asia via Silk Road trade contacts.",
            "Paper-making technology diffusing from China to the Islamic world and eventually Europe.",
            "The Black Death spreading rapidly along Silk Road trade routes in the 14th century.",
        ],
        "non_examples": [
            "A direct diplomatic embassy sailing from China to East Africa (a singular state-to-state exchange, not the Silk Road network).",
            "Modern container shipping routes (contemporary infrastructure with entirely different economic logic).",
        ],
        "transfer_contexts": [
            "Comparing Silk Road cultural diffusion to how ideas spread across modern digital networks.",
            "Analyzing how control of Silk Road routes gave Central Asian and Middle Eastern states geopolitical leverage.",
        ],
        "evidence_skills": [
            "Explain why the Silk Roads should be described as a network, not a single route.",
            "Identify at least two non-commercial forms of exchange that traveled the Silk Roads.",
            "Connect a specific historical spread of religion, technology, or disease to Silk Road mechanisms.",
        ],
    },
    "photosynthesis": {
        "anchor_statement": "Photosynthesis converts light energy into chemical energy stored in glucose, making it the foundation of most food chains.",
        "core_understanding": [
            "Photosynthesis is an energy transformation: light energy is captured and stored as chemical energy in glucose.",
            "The inputs are carbon dioxide and water; the outputs are glucose and oxygen.",
            "Chlorophyll in chloroplasts is the site where light energy is captured.",
        ],
        "prerequisites": ["Cell structure including chloroplasts", "Energy transformation basics", "Chemical equations and reactants and products"],
        "misconceptions": [
            {"label": "Plants get food from the soil", "description": "Students think plants absorb nutrients from the soil rather than manufacturing glucose via photosynthesis.", "student_response": "Plants get their food by absorbing nutrients from the ground through their roots."},
            {"label": "Photosynthesis and respiration cancel each other out completely", "description": "Students think the processes exactly cancel so plants have no net energy gain.", "student_response": "During the day plants photosynthesize and make oxygen; at night they do the opposite and use all that oxygen back up."},
            {"label": "Oxygen is the main product of photosynthesis, not a byproduct", "description": "Students think the purpose of photosynthesis is to produce oxygen for animals.", "student_response": "The whole point of photosynthesis is to release oxygen for animals to breathe."},
        ],
        "examples": [
            "A leaf capturing sunlight and producing glucose that feeds the plant's growth and a caterpillar that eats the leaf.",
            "Algae in the ocean performing photosynthesis, forming the base of marine food webs.",
            "A potted plant turning toward a window to maximize light capture for photosynthesis.",
        ],
        "non_examples": [
            "A mushroom decomposing a log (decomposers break down organic matter rather than build glucose from light).",
            "A solar panel converting light to electrical energy (energy conversion but not biological glucose synthesis).",
        ],
        "transfer_contexts": [
            "Analyzing why deforestation reduces carbon sequestration capacity, connecting photosynthesis to the carbon cycle.",
            "Explaining why aquatic dead zones form when excessive nutrients block light and shut down photosynthesis.",
        ],
        "evidence_skills": [
            "State the inputs and outputs of photosynthesis and their roles.",
            "Distinguish energy transformation in photosynthesis from energy release in cellular respiration.",
            "Trace the path of carbon from CO2 in the air to glucose in a plant cell.",
        ],
    },
}

# --------------------------------------------------------------------------
# synthesize — answer-quality variant profiles
# --------------------------------------------------------------------------

VARIANT_PROFILES = {
    "strong": {
        "evidence": {"accuracy": "Strong", "causality": "Strong", "application": "Strong", "transfer": "Solid", "model_quality": "Strong"},
        "advance": True,
        "misconception_mode": "none",
        "strengths_templates": [
            "Accurately states the core mechanism with precise vocabulary.",
            "Causally connects {concept} to a real-world outcome.",
            "Applies the concept to a concrete example correctly.",
        ],
        "missing_ideas_templates": [],
        "pushback": "",
        "next_probe_type": "transfer",
    },
    "partial": {
        "evidence": {"accuracy": "Solid", "causality": "Emerging", "application": "Solid", "transfer": "Emerging", "model_quality": "Emerging"},
        "advance": False,
        "misconception_mode": "none",
        "strengths_templates": [
            "Correctly identifies the core concept with reasonable accuracy.",
            "Provides a working example that demonstrates basic understanding.",
        ],
        "missing_ideas_templates": [
            "Causal mechanism linking {concept} to its effects",
            "Transfer to an unfamiliar context beyond the in-class example",
        ],
        "pushback": "You've shown a solid foundation. Can you explain why {concept} works the way it does, not just what it is?",
        "next_probe_type": "explanation",
    },
    "vague": {
        "evidence": {"accuracy": "Emerging", "causality": "Not Yet Shown", "application": "Emerging", "transfer": "Not Yet Shown", "model_quality": "Not Yet Shown"},
        "advance": False,
        "misconception_mode": "none",
        "strengths_templates": ["Shows some familiarity with the term."],
        "missing_ideas_templates": [
            "A precise definition or anchor statement for {concept}",
            "Any concrete example illustrating {concept}",
            "Causal explanation connecting {concept} to its effects",
        ],
        "pushback": "Tell me more specifically: what exactly happens with {concept}? Can you give me a concrete example?",
        "next_probe_type": "recognition",
    },
    "confidently_wrong": {
        "evidence": {"accuracy": "Not Yet Shown", "causality": "Not Yet Shown", "application": "Not Yet Shown", "transfer": "Not Yet Shown", "model_quality": "Not Yet Shown"},
        "advance": False,
        "misconception_mode": "dominant",
        "strengths_templates": [],
        "missing_ideas_templates": [
            "Correct definition of {concept}",
            "Recognition that their current understanding contains a significant error",
        ],
        "pushback": "That is a confident answer, but let us examine it closely. Consider: {concept_specific_pushback} What evidence supports your reasoning?",
        "next_probe_type": "discrimination",
    },
    "misconception_based": {
        "evidence": {"accuracy": "Emerging", "causality": "Not Yet Shown", "application": "Emerging", "transfer": "Not Yet Shown", "model_quality": "Not Yet Shown"},
        "advance": False,
        "misconception_mode": "present",
        "strengths_templates": ["Demonstrates partial familiarity with surface features of {concept}."],
        "missing_ideas_templates": [
            "Correct causal mechanism distinguishing {concept} from the common misconception",
            "A counter-example that disproves the misconception",
        ],
        "pushback": "You are on the right track but there is an error embedded here. Consider: {concept_specific_pushback}",
        "next_probe_type": "discrimination",
    },
    "transfer_failure": {
        "evidence": {"accuracy": "Solid", "causality": "Solid", "application": "Solid", "transfer": "Not Yet Shown", "model_quality": "Emerging"},
        "advance": False,
        "misconception_mode": "none",
        "strengths_templates": [
            "Accurately understands {concept} in the classroom context.",
            "Can apply the concept to examples given in instruction.",
        ],
        "missing_ideas_templates": [
            "Application of {concept} to an unfamiliar real-world context",
            "Recognition that {concept} applies broadly beyond the textbook scenario",
        ],
        "pushback": "You have got it for the classroom examples. Now try: how would {concept} apply in {transfer_context}?",
        "next_probe_type": "transfer",
    },
    "vocab_without_application": {
        "evidence": {"accuracy": "Solid", "causality": "Emerging", "application": "Not Yet Shown", "transfer": "Not Yet Shown", "model_quality": "Not Yet Shown"},
        "advance": False,
        "misconception_mode": "none",
        "strengths_templates": ["Uses the correct vocabulary and terminology for {concept}."],
        "missing_ideas_templates": [
            "A concrete example demonstrating the concept in action",
            "Explanation of how {concept} actually operates beyond its name and definition",
        ],
        "pushback": "You are using the right words. Now show me what {concept} actually does: give me a concrete example where we would see it in action.",
        "next_probe_type": "application",
    },
    "application_without_vocab": {
        "evidence": {"accuracy": "Emerging", "causality": "Solid", "application": "Solid", "transfer": "Emerging", "model_quality": "Solid"},
        "advance": False,
        "misconception_mode": "none",
        "strengths_templates": [
            "Demonstrates genuine functional understanding through a concrete example.",
            "Applies causal reasoning correctly even without precise vocabulary.",
        ],
        "missing_ideas_templates": [
            "Precise vocabulary and terminology for {concept}",
            "Ability to articulate the concept in generalizable, abstract terms",
        ],
        "pushback": "Your example shows you understand how it works. Can you tell me what the technical term for this phenomenon is and why the term fits?",
        "next_probe_type": "explanation",
    },
}

# --------------------------------------------------------------------------
# synthesize — task generators
# --------------------------------------------------------------------------


def _concept_context(concept):
    return (
        f"Concept: {concept['concept']}\n"
        f"Subject: {concept['subject']} | Grade Band: {concept['grade_band']}\n"
        f"Standard: {concept['standard']}\n"
        f"Teacher Goal: {concept['teacher_goal']}\n"
        f"Source Content:\n{concept['source_content']}"
    )


def gen_anchor(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    task_prompts = [
        f"Build a conceptual anchor for \"{concept['concept']}\" that a teacher can use to track student understanding.",
        f"A teacher is introducing \"{concept['concept']}\" for the first time. Build the KORA conceptual anchor for this concept.",
        f"Generate a conceptual anchor for \"{concept['concept']}\" from the provided source content.",
        f"Using the source content and teacher goal below, build a conceptual anchor for \"{concept['concept']}\".",
        f"Build a KORA conceptual anchor for \"{concept['concept']}\". Focus on what a student must understand, not just be able to recite.",
        f"Create a conceptual anchor that captures what deep understanding of \"{concept['concept']}\" looks like.",
        f"Build the KORA conceptual anchor for \"{concept['concept']}\", making visible the distinctions between examples and non-examples.",
        f"A teacher has students struggling with \"{concept['concept']}\". Build the conceptual anchor KORA will use to diagnose where understanding breaks down.",
    ]
    prompt_text = rng.choice(task_prompts)
    prereqs = list(facts["prerequisites"])
    rng.shuffle(prereqs)
    misconception_labels = [m["label"] for m in facts["misconceptions"]]
    rng.shuffle(misconception_labels)
    examples = list(facts["examples"])
    rng.shuffle(examples)
    non_examples = list(facts["non_examples"])
    rng.shuffle(non_examples)
    transfer_contexts = list(facts["transfer_contexts"])
    rng.shuffle(transfer_contexts)
    user_text = f"{_concept_context(concept)}\n\nTask: {prompt_text}"
    assistant_obj = {
        "concept": concept["concept"],
        "anchor_statement": facts["anchor_statement"],
        "core_understanding": list(facts["core_understanding"]),
        "prerequisite_ideas": prereqs,
        "common_misconceptions": misconception_labels,
        "examples": examples,
        "non_examples": non_examples,
        "transfer_contexts": transfer_contexts,
    }
    return user_text, assistant_obj


def gen_graph(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    task_prompts = [
        f"Build an understanding graph for \"{concept['concept']}\" with labeled nodes and typed edges.",
        f"Generate a KORA understanding graph for \"{concept['concept']}\". Use the allowed node and edge types.",
        f"Build the conceptual graph that KORA will use to represent relationships in \"{concept['concept']}\".",
        f"Create an understanding graph for \"{concept['concept']}\" that maps prerequisite knowledge, misconceptions, examples, and evidence skills.",
        f"Generate a machine-readable understanding graph for \"{concept['concept']}\" capturing key conceptual relationships.",
        f"Build a KORA understanding graph for \"{concept['concept']}\" that would help a teacher see which student gaps to address first.",
        f"A teacher needs to identify prerequisite knowledge gaps for \"{concept['concept']}\". Build the KORA understanding graph.",
        f"Generate the understanding graph for \"{concept['concept']}\". Include at least one example node, one non-example node, and one misconception node.",
    ]
    prompt_text = rng.choice(task_prompts)
    nodes = [{"id": "c0", "label": concept["concept"], "type": "concept"}]
    edges = []
    prereqs = list(facts["prerequisites"])
    rng.shuffle(prereqs)
    for i, p in enumerate(prereqs):
        nid = f"pre{i}"
        nodes.append({"id": nid, "label": p, "type": "prerequisite"})
        edges.append({"from": nid, "to": "c0", "type": "requires"})
    misconceptions = list(facts["misconceptions"])
    rng.shuffle(misconceptions)
    for i, m in enumerate(misconceptions[:2]):
        nid = f"mis{i}"
        nodes.append({"id": nid, "label": m["label"], "type": "misconception"})
        edges.append({"from": nid, "to": "c0", "type": "commonly-confused-with"})
    examples = list(facts["examples"])
    rng.shuffle(examples)
    for i, ex in enumerate(examples[:2]):
        nid = f"ex{i}"
        nodes.append({"id": nid, "label": ex[:80], "type": "example"})
        edges.append({"from": nid, "to": "c0", "type": "example-of"})
    non_examples = list(facts["non_examples"])
    rng.shuffle(non_examples)
    nodes.append({"id": "ne0", "label": non_examples[0][:80], "type": "non-example"})
    edges.append({"from": "ne0", "to": "c0", "type": "non-example-of"})
    transfer_contexts = list(facts["transfer_contexts"])
    rng.shuffle(transfer_contexts)
    nodes.append({"id": "tc0", "label": transfer_contexts[0][:80], "type": "transfer-context"})
    edges.append({"from": "tc0", "to": "c0", "type": "transfers-to"})
    evskills = list(facts["evidence_skills"])
    rng.shuffle(evskills)
    nodes.append({"id": "es0", "label": evskills[0][:80], "type": "evidence-skill"})
    edges.append({"from": "es0", "to": "c0", "type": "evidence-for"})
    user_text = f"{_concept_context(concept)}\n\nTask: {prompt_text}"
    return user_text, {"nodes": nodes, "edges": edges}


_EVENT_TYPE_CONFIGS = [
    ("recognition", "accuracy", "easy",
     "Which of the following best describes {concept}?",
     "Correctly identify {concept} from a set of descriptions."),
    ("explanation", "causality", "medium",
     "Explain in your own words why {concept} works the way it does.",
     "Provide a causal explanation connecting {concept} to its effects."),
    ("application", "application", "medium",
     "Apply {concept} to the following scenario: {example}",
     "Demonstrate that {concept} applies to a concrete scenario."),
    ("discrimination", "accuracy", "medium",
     "Which IS an example of {concept} and which IS NOT? Justify: {example} vs. {non_example}",
     "Correctly classify an example and non-example of {concept}."),
    ("transfer", "transfer", "hard",
     "How does {concept} apply in this unfamiliar context: {transfer_context}?",
     "Apply {concept} to a new context not covered in the lesson."),
    ("generation", "model_quality", "hard",
     "Generate your own original example of {concept} different from any given in class.",
     "Produce a novel, accurate example of {concept}."),
    ("model-building", "model_quality", "hard",
     "Draw or describe a model that shows how {concept} works as a system.",
     "Build a coherent model of {concept} that captures its key relationships."),
    ("revision", "causality", "medium",
     "A classmate said: '{misconception}' What is wrong with this? Correct it.",
     "Identify the error in a misconception about {concept} and provide the accurate explanation."),
]


def gen_evidence_events(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    task_prompts = [
        f"Generate evidence-gathering events for \"{concept['concept']}\" that a teacher can use to make student understanding visible.",
        f"Build a set of KORA evidence events for \"{concept['concept']}\" spanning different cognitive demands.",
        f"Generate 4 to 5 KORA evidence events for \"{concept['concept']}\" that target distinct evidence dimensions.",
        f"A teacher is designing activities to assess student understanding of \"{concept['concept']}\". Generate KORA evidence events.",
        f"Build evidence events for \"{concept['concept']}\" that differentiate surface recall from deep understanding.",
        f"Generate KORA evidence events for \"{concept['concept']}\" covering recognition, explanation, application, and transfer.",
        f"Create evidence events for \"{concept['concept']}\" including at least one discrimination task and one transfer task.",
        f"Build evidence events for \"{concept['concept']}\" that target the key misconceptions a teacher should watch for.",
    ]
    prompt_text = rng.choice(task_prompts)
    configs = list(_EVENT_TYPE_CONFIGS)
    rng.shuffle(configs)
    selected = configs[:rng.randint(4, 5)]
    events = []
    for etype, target_dim, difficulty, prompt_tmpl, success_tmpl in selected:
        prompt = (prompt_tmpl
                  .replace("{concept}", concept["concept"])
                  .replace("{example}", rng.choice(facts["examples"]))
                  .replace("{non_example}", rng.choice(facts["non_examples"]))
                  .replace("{transfer_context}", rng.choice(facts["transfer_contexts"]))
                  .replace("{misconception}", rng.choice(facts["misconceptions"])["student_response"]))
        success_criterion = success_tmpl.replace("{concept}", concept["concept"])
        misconceptions_tested = [rng.choice(facts["misconceptions"])["label"]] if etype in ("discrimination", "revision") else []
        events.append({
            "type": etype,
            "prompt": prompt,
            "target_dimension": target_dim,
            "difficulty": difficulty,
            "success_criteria": [success_criterion],
            "misconceptions_tested": misconceptions_tested,
        })
    user_text = f"{_concept_context(concept)}\n\nTask: {prompt_text}"
    return user_text, {"events": events}


def gen_misconception_sim(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    misconception = rng.choice(facts["misconceptions"])
    surface_plausibility = rng.choice(["low", "medium", "high"])
    task_prompts = [
        f"Simulate a student misconception about \"{concept['concept']}\" and identify what makes it superficially plausible.",
        f"Generate a student response that embodies a common misconception about \"{concept['concept']}\".",
        f"Simulate how a student holding a misconception about \"{concept['concept']}\" would respond to a teacher's question.",
        f"A teacher wants to anticipate how students might misunderstand \"{concept['concept']}\". Simulate a misconception-based student response.",
        f"Generate a KORA misconception simulation for \"{concept['concept']}\" showing what a plausible-but-wrong student response looks like.",
        f"Simulate the most common misconception a student would hold about \"{concept['concept']}\" and explain why it is superficially convincing.",
        f"Build a misconception simulation for \"{concept['concept']}\" showing the specific error pattern a teacher should watch for.",
        f"Simulate a student response for \"{concept['concept']}\" that shows surface familiarity but contains a fundamental misunderstanding.",
    ]
    prompt_text = rng.choice(task_prompts)
    user_text = (
        f"{_concept_context(concept)}\n\n"
        f"Task: {prompt_text}\n\n"
        f"Focus on the misconception: \"{misconception['label']}\""
    )
    assistant_obj = {
        "concept": concept["concept"],
        "misconception_label": misconception["label"],
        "student_response": misconception["student_response"],
        "embodies": misconception["description"],
        "surface_plausibility": surface_plausibility,
    }
    return user_text, assistant_obj


def _build_student_response(concept, variant, facts, rng):
    """Build a simulated student response appropriate for the given answer-quality variant."""
    cname = concept["concept"]
    examples = facts["examples"]
    transfer_contexts = facts["transfer_contexts"]
    misconceptions = facts["misconceptions"]
    core = facts["core_understanding"]
    anchor = facts["anchor_statement"]

    if variant == "strong":
        return (
            f"{anchor} For example, {rng.choice(examples).lower()} "
            f"This shows that {rng.choice(core).lower()} "
            f"Even in contexts like {rng.choice(transfer_contexts).lower()}, the same logic applies."
        )
    elif variant == "partial":
        return (
            f"{cname} is basically about {rng.choice(core).lower()} "
            f"For instance, {rng.choice(examples).lower()} "
            f"I am not totally sure how it works in other situations though."
        )
    elif variant == "vague":
        return (
            f"{cname} is when something happens with resources or decisions. "
            f"It is kind of a trade-off, I think. My teacher mentioned it."
        )
    elif variant == "confidently_wrong":
        m = rng.choice(misconceptions)
        return (
            f"{m['student_response']} That is definitely what {cname} means. "
            f"I am pretty sure because that is what we learned."
        )
    elif variant == "misconception_based":
        m = rng.choice(misconceptions)
        return (
            f"{cname} is related to {rng.choice(core).lower()} but basically "
            f"{m['student_response']} I think that is most of it."
        )
    elif variant == "transfer_failure":
        return (
            f"{cname} means {rng.choice(core).lower()} "
            f"For example, {rng.choice(examples).lower()} "
            f"But I am not sure how that would work with {rng.choice(transfer_contexts).lower()} — "
            f"that seems totally different."
        )
    elif variant == "vocab_without_application":
        return (
            f"{cname} involves the idea that {rng.choice(core).lower()} "
            f"The key vocabulary here is really important to understand the concept."
        )
    elif variant == "application_without_vocab":
        return (
            f"When {rng.choice(examples).lower()}, you can see a clear pattern where "
            f"one thing is traded for another based on what is most valuable. "
            f"I can see this in real life too, like {rng.choice(transfer_contexts).lower()}, "
            f"but I am not sure what the technical term for this is."
        )
    return f"I think {cname} means something about choices and trade-offs."


def gen_evaluate(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    profile = VARIANT_PROFILES[variant]
    student_response = _build_student_response(concept, variant, facts, rng)
    probe_questions = [
        f"Explain what {concept['concept']} means in your own words and give an example.",
        f"How does {concept['concept']} apply in real life? Give a specific example.",
        f"What is {concept['concept']} and why does it matter?",
        f"Can you describe {concept['concept']} and tell me where you would expect to see it?",
    ]
    bad_claim = rng.choice(facts["misconceptions"])["student_response"]
    probe_questions.append(f"A classmate said: '{bad_claim}' Do you agree? Why or why not?")
    probe_question = rng.choice(probe_questions)
    misconceptions_out = []
    if profile["misconception_mode"] in ("present", "dominant"):
        m = rng.choice(facts["misconceptions"])
        confidence = 0.85 if profile["misconception_mode"] == "dominant" else 0.60
        misconceptions_out.append({
            "label": m["label"],
            "confidence": confidence,
            "evidence": f"Student stated: '{student_response[:80]}...'",
        })
    strengths = [t.replace("{concept}", concept["concept"]) for t in profile.get("strengths_templates", [])]
    missing_ideas = [t.replace("{concept}", concept["concept"]) for t in profile.get("missing_ideas_templates", [])]
    pushback = profile.get("pushback", "")
    if pushback:
        pushback = (pushback
                    .replace("{concept}", concept["concept"])
                    .replace("{transfer_context}", rng.choice(facts["transfer_contexts"]))
                    .replace("{concept_specific_pushback}", rng.choice(facts["misconceptions"])["label"]))
    probe_type = profile.get("next_probe_type", "explanation")
    probe_prompt_map = {
        "recognition": f"Which of these descriptions of {concept['concept']} is most accurate? Choose and explain.",
        "explanation": f"In your own words, explain why {concept['concept']} works the way it does. Focus on the mechanism.",
        "application": f"Apply {concept['concept']} to this situation: {rng.choice(facts['examples'])}. Walk me through your reasoning.",
        "discrimination": f"Compare: {rng.choice(facts['examples'])} vs. {rng.choice(facts['non_examples'])}. Which is an example of {concept['concept']} and which is not? Why?",
        "transfer": f"How would {concept['concept']} apply in this context: {rng.choice(facts['transfer_contexts'])}?",
    }
    next_best_probe = {
        "type": probe_type,
        "prompt": probe_prompt_map.get(probe_type, f"Tell me more about {concept['concept']}."),
    }
    advance_word = "advance" if profile["advance"] else "hold"
    teacher_summary = (
        f"Student shows '{variant.replace('_', ' ')}' pattern on {concept['concept']}. "
        f"Recommendation: {advance_word}. "
        f"Key gap: {missing_ideas[0] if missing_ideas else 'None identified'}."
    )
    user_text = (
        f"{_concept_context(concept)}\n\n"
        f"Probe used: \"{probe_question}\"\n\n"
        f"Student response:\n\"{student_response}\"\n\n"
        f"Task: Evaluate this student response. Return a KORA evaluation."
    )
    assistant_obj = {
        "advance": profile["advance"],
        "evidence": dict(profile["evidence"]),
        "misconceptions": misconceptions_out,
        "missing_ideas": missing_ideas,
        "strengths": strengths,
        "pushback": pushback,
        "next_best_probe": next_best_probe,
        "teacher_summary": teacher_summary,
    }
    return user_text, assistant_obj


def gen_next_probe(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    dims = list(EVIDENCE_DIMENSIONS)
    rng.shuffle(dims)
    weak_dim = dims[0]
    current_evidence = {}
    for d in EVIDENCE_DIMENSIONS:
        if d == weak_dim:
            current_evidence[d] = rng.choice(["Not Yet Shown", "Emerging"])
        else:
            current_evidence[d] = rng.choice(["Emerging", "Solid", "Strong"])
    task_prompts = [
        f"Based on the current evidence state, suggest the next best probe to move student understanding of \"{concept['concept']}\" forward.",
        f"A student's current evidence profile is shown below. What is the single most useful next probe for \"{concept['concept']}\"?",
        f"Given the evidence gaps shown, generate the next KORA probe for \"{concept['concept']}\".",
        f"The teacher wants to target the weakest dimension in this student's understanding of \"{concept['concept']}\". Suggest the next probe.",
        f"Generate the next best KORA probe for \"{concept['concept']}\" given the current evidence profile.",
        f"Based on what is not yet shown in this student's evidence profile for \"{concept['concept']}\", what should the teacher ask next?",
        f"Suggest a targeted follow-up probe to address the main understanding gap for \"{concept['concept']}\" visible in the evidence state below.",
        f"This student has partial understanding of \"{concept['concept']}\". What is the most diagnostic next probe to run?",
    ]
    prompt_text = rng.choice(task_prompts)
    dim_to_event_type = {
        "accuracy": "discrimination",
        "causality": "explanation",
        "application": "application",
        "transfer": "transfer",
        "model_quality": "model-building",
    }
    recommended_type = dim_to_event_type[weak_dim]
    probe_prompt_map = {
        "accuracy": f"Which of these statements about {concept['concept']} is accurate? Justify your choice.",
        "causality": f"Explain in your own words why {concept['concept']} works the way it does.",
        "application": f"Apply {concept['concept']} to this scenario: {rng.choice(facts['examples'])}",
        "transfer": f"How would {concept['concept']} apply in this context: {rng.choice(facts['transfer_contexts'])}?",
        "model_quality": f"Describe a model that shows how {concept['concept']} works as a system.",
    }
    rationale = (
        f"The student's evidence for '{weak_dim}' is currently '{current_evidence[weak_dim]}'. "
        f"A {recommended_type} task directly targets this dimension and will give the teacher "
        f"the highest-diagnostic signal about whether the student understands {concept['concept']} at this level."
    )
    evidence_lines = "\n".join(f"  {d}: {current_evidence[d]}" for d in EVIDENCE_DIMENSIONS)
    user_text = (
        f"{_concept_context(concept)}\n\n"
        f"Current student evidence profile:\n{evidence_lines}\n\n"
        f"Task: {prompt_text}"
    )
    assistant_obj = {
        "concept": concept["concept"],
        "current_evidence": current_evidence,
        "next_probe": {
            "type": recommended_type,
            "prompt": probe_prompt_map[weak_dim],
            "target_dimension": weak_dim,
            "rationale": rationale,
        },
    }
    return user_text, assistant_obj


def gen_diagnosis(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    profile = VARIANT_PROFILES[variant]
    student_response = _build_student_response(concept, variant, facts, rng)
    misconceptions_detected = []
    if profile["misconception_mode"] in ("present", "dominant"):
        m = rng.choice(facts["misconceptions"])
        confidence = 0.85 if profile["misconception_mode"] == "dominant" else 0.60
        misconceptions_detected.append({"label": m["label"], "confidence": confidence})
    evidence = dict(profile["evidence"])
    missing_ideas = [t.replace("{concept}", concept["concept"]) for t in profile.get("missing_ideas_templates", [])]
    strong_dims = [d for d, v in evidence.items() if v in ("Solid", "Strong")]
    weak_dims = [d for d, v in evidence.items() if v in ("Not Yet Shown", "Emerging")]
    narrative = (
        f"This student demonstrates a '{variant.replace('_', ' ')}' understanding pattern for "
        f"{concept['concept']}. "
    )
    if strong_dims:
        narrative += f"Evidence is strongest on {', '.join(strong_dims)}. "
    if weak_dims:
        narrative += f"Significant gaps remain in {', '.join(weak_dims)}. "
    if misconceptions_detected:
        narrative += f"A likely misconception is present: '{misconceptions_detected[0]['label']}'."
    pushback = profile.get("pushback", "")
    if pushback:
        recommended = (pushback
                       .replace("{concept}", concept["concept"])
                       .replace("{transfer_context}", rng.choice(facts["transfer_contexts"]))
                       .replace("{concept_specific_pushback}", rng.choice(facts["misconceptions"])["label"]))
    else:
        target = weak_dims[0] if weak_dims else "model_quality"
        recommended = f"Probe {concept['concept']} further by targeting the '{target}' dimension with a focused question."
    user_text = (
        f"{_concept_context(concept)}\n\n"
        f"Student response:\n\"{student_response}\"\n\n"
        f"Task: Generate a teacher-facing KORA diagnosis of this student's understanding of \"{concept['concept']}\"."
    )
    assistant_obj = {
        "concept": concept["concept"],
        "evidence": evidence,
        "misconceptions_detected": misconceptions_detected,
        "narrative_summary": narrative.strip(),
        "recommended_next_step": recommended,
    }
    return user_text, assistant_obj



def gen_notes_generation(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    cname = concept["concept"]
    task_prompts = [
        "Generate a KORA notes sheet for \"" + cname + "\" designed to maximize learner understanding, not just content coverage.",
        "Build structured notes for \"" + cname + "\" that a teacher can give students. Each section should build toward genuine understanding.",
        "A teacher has finished a lesson on \"" + cname + "\". Generate KORA-structured notes that help students consolidate deep understanding.",
        "Generate notes for \"" + cname + "\" that address common misconceptions and include self-check questions targeting key evidence dimensions.",
        "Build a KORA notes sheet for \"" + cname + "\" with sections that differentiate surface recall from conceptual understanding.",
        "Generate student-facing notes for \"" + cname + "\" that include a misconception alert, example analysis, and a transfer challenge.",
        "Create structured notes for \"" + cname + "\" that are more than fill-in-the-blank — each section builds a specific type of understanding.",
        "Build notes for \"" + cname + "\" that make the example vs. non-example distinction explicit and include vocabulary with concrete examples.",
    ]
    prompt_text = rng.choice(task_prompts)
    prereqs = list(facts["prerequisites"]); rng.shuffle(prereqs)
    misconceptions = list(facts["misconceptions"]); rng.shuffle(misconceptions)
    examples = list(facts["examples"]); rng.shuffle(examples)
    transfer_contexts = list(facts["transfer_contexts"]); rng.shuffle(transfer_contexts)
    core = list(facts["core_understanding"]); rng.shuffle(core)
    evidence_skills = list(facts["evidence_skills"]); rng.shuffle(evidence_skills)
    sections = [
        {"heading": "What is " + cname + "?", "type": "anchor",
         "content": facts["anchor_statement"],
         "understanding_focus": "Establish the core idea before any detail."},
        {"heading": "Before This Concept", "type": "prerequisite_check",
         "content": "Make sure you are comfortable with: " + "; ".join(prereqs) + ".",
         "understanding_focus": "Activate prerequisite knowledge so the new concept has somewhere to anchor."},
        {"heading": "The Core Idea", "type": "core_idea",
         "content": " ".join(core),
         "understanding_focus": "Build accurate declarative understanding of the concept."},
        {"heading": "Examples in Action", "type": "example_analysis",
         "content": "\n".join("- " + ex for ex in examples[:2]),
         "understanding_focus": "Ground the concept in concrete cases so it is not just a definition."},
        {"heading": "Common Mistake: " + misconceptions[0]["label"], "type": "misconception_alert",
         "content": misconceptions[0]["description"] + " Example of this error: " + misconceptions[0]["student_response"],
         "understanding_focus": "Pre-empt the most common misconception before it takes hold."},
        {"heading": "Apply It Further", "type": "transfer_challenge",
         "content": rng.choice(transfer_contexts),
         "understanding_focus": "Push beyond the classroom example to check for flexible, transferable understanding."},
    ]
    vocabulary_words = [{"term": cname, "definition": facts["anchor_statement"], "example": examples[0]}]
    if len(misconceptions) > 1:
        vocabulary_words.append({
            "term": misconceptions[1]["label"],
            "definition": misconceptions[1]["description"],
            "example": misconceptions[1]["student_response"],
        })
    dim_targets = ["accuracy", "causality", "application", "transfer", "model_quality"]
    rng.shuffle(dim_targets)
    self_check_questions = []
    for i, skill in enumerate(evidence_skills):
        q = skill
        for verb in ["Identify", "Explain", "Distinguish", "Apply", "Evaluate", "Trace", "State", "Connect"]:
            if q.startswith(verb):
                q = "Can you " + q[0].lower() + q[1:]
                break
        if not q.endswith("?"):
            q += "?"
        self_check_questions.append({
            "question": q,
            "target_dimension": dim_targets[i % len(dim_targets)],
            "what_strong_answer_includes": core[i % len(core)],
        })
    user_text = _concept_context(concept) + "\n\nTask: " + prompt_text
    assistant_obj = {
        "concept": cname,
        "title": "Notes: " + cname,
        "learning_objective": concept["teacher_goal"],
        "essential_question": "What does it actually mean to understand " + cname + " — not just recall it?",
        "sections": sections,
        "key_vocabulary": vocabulary_words,
        "common_pitfalls": [m["label"] for m in misconceptions],
        "self_check_questions": self_check_questions,
    }
    return user_text, assistant_obj


_POINTS_BY_LEVEL = {"Not Yet Shown": 10, "Emerging": 35, "Solid": 70, "Strong": 95}

_FEEDBACK_TEMPLATES = {
    "strong": [
        "Strong answer — you identified the mechanism precisely and gave a solid example.",
        "Excellent. You connected {concept} to its real-world effect accurately.",
        "Great work. You moved beyond the definition to explain the causal logic.",
    ],
    "partial": [
        "Good start — you have the core idea. Can you explain why it works that way, not just what it is?",
        "You are on the right track. Push further: what is the causal mechanism behind {concept}?",
        "Solid foundation. Now try applying it to an unfamiliar context.",
    ],
    "vague": [
        "You have shown some familiarity. Give me a specific example of {concept} in action.",
        "I can see you have heard of this. Can you describe exactly what happens with {concept}?",
        "Try to be more precise — what specifically is the trade-off or mechanism in {concept}?",
    ],
    "confidently_wrong": [
        "That is a confident answer, but there is an error here. Reconsider: what is the definition of {concept}?",
        "Check your reasoning — the answer contains a misconception about {concept}. Start from the definition.",
        "Not quite. The key distinction you are missing is what {concept} actually measures.",
    ],
    "misconception_based": [
        "You are close but a misconception is embedded in your answer. Look at your reasoning again.",
        "Partially correct — but there is a common error here about {concept}. What exactly is being traded off?",
        "Good attempt. Watch out for the misconception embedded in your response about {concept}.",
    ],
    "transfer_failure": [
        "You have got the classroom version right. Now apply that same logic to a new context.",
        "Correct for the example we covered. How would {concept} work in a situation you have not seen before?",
        "Great on the familiar case. The transfer challenge: apply {concept} somewhere new.",
    ],
    "vocab_without_application": [
        "You are using the right vocabulary. Now show me {concept} in action with a concrete example.",
        "The terminology is correct — prove you understand it by giving a specific real-world case.",
        "Good use of terms. What does {concept} actually look like when you encounter it?",
    ],
    "application_without_vocab": [
        "You clearly understand how this works. Can you name the technical term for what you just described?",
        "Excellent intuition. The formal name for what you are describing is {concept} — can you articulate why?",
        "You have described it correctly without the terminology. What is the academic term for this phenomenon?",
    ],
}


def gen_game_response_eval(concept, variant, rng):
    facts = CONCEPT_FACTS[concept["id"]]
    cname = concept["concept"]
    profile = VARIANT_PROFILES[variant]
    student_response = _build_student_response(concept, variant, facts, rng)
    probe_questions = [
        "In your own words, explain what " + cname + " means and give a real-life example.",
        "What is " + cname + "? Give an example different from what we covered in class.",
        "Explain why " + cname + " matters. What would happen if people ignored it?",
        "A friend does not understand " + cname + ". How would you explain it to them?",
        "Apply " + cname + " to this situation: " + rng.choice(facts["examples"]),
        "How does " + cname + " apply in this new context: " + rng.choice(facts["transfer_contexts"]) + "?",
    ]
    bad_claim = rng.choice(facts["misconceptions"])["student_response"]
    probe_questions.append("Respond to this claim: '" + bad_claim + "' — is it correct? Why or why not?")
    probe = rng.choice(probe_questions)
    level_order = ["Not Yet Shown", "Emerging", "Solid", "Strong"]
    dominant_evidence = max(profile["evidence"].values(), key=lambda v: level_order.index(v))
    points = max(5, min(100, _POINTS_BY_LEVEL[dominant_evidence] + rng.randint(-5, 5)))
    misconception_detected = profile["misconception_mode"] in ("present", "dominant")
    misconception_label = rng.choice(facts["misconceptions"])["label"] if misconception_detected else None
    feedback = rng.choice(_FEEDBACK_TEMPLATES[variant]).replace("{concept}", cname)
    user_text = (
        _concept_context(concept) + "\n\n"
        "Probe: \"" + probe + "\"\n\n"
        "Student response:\n\"" + student_response + "\"\n\n"
        "Task: Evaluate this student response for the game. Return a KORA game evaluation."
    )
    assistant_obj = {
        "concept": cname,
        "probe": probe,
        "student_response": student_response,
        "points": points,
        "understanding_level": dominant_evidence,
        "misconception_detected": misconception_detected,
        "misconception_label": misconception_label,
        "feedback": feedback,
        "advance": profile["advance"],
    }
    return user_text, assistant_obj


TASK_GENERATORS = {
    "anchor": gen_anchor,
    "graph": gen_graph,
    "evidence_events": gen_evidence_events,
    "misconception_sim": gen_misconception_sim,
    "evaluate": gen_evaluate,
    "next_probe": gen_next_probe,
    "diagnosis": gen_diagnosis,
    "notes_generation": gen_notes_generation,
    "game_response_eval": gen_game_response_eval,
}

NON_VARIANT_TASKS = ["anchor", "graph", "evidence_events", "misconception_sim", "next_probe", "notes_generation"]
VARIANT_TASKS = ["evaluate", "diagnosis", "game_response_eval"]
K_NON_VARIANT = 8
K_VARIANT = 3
EVAL_FRACTION_DENOM = 7


def _print_coverage(pool, train_keys, eval_keys):
    task_train: Counter = Counter()
    task_eval: Counter = Counter()
    variant_train: Counter = Counter()
    variant_eval: Counter = Counter()
    concept_train: Counter = Counter()
    concept_eval: Counter = Counter()
    for key, concept, task_type, variant, _ri in pool:
        if key in train_keys:
            task_train[task_type] += 1
            concept_train[concept["id"]] += 1
            if variant:
                variant_train[variant] += 1
        else:
            task_eval[task_type] += 1
            concept_eval[concept["id"]] += 1
            if variant:
                variant_eval[variant] += 1

    print("\n  Coverage by task type:")
    print(f"  {'Task':<25} {'Train':>6} {'Eval':>6}")
    for t in TASK_TYPES:
        print(f"  {t:<25} {task_train.get(t, 0):>6} {task_eval.get(t, 0):>6}")

    print("\n  Coverage by variant (evaluate/diagnosis only):")
    print(f"  {'Variant':<32} {'Train':>6} {'Eval':>6}")
    for v in ANSWER_VARIANTS:
        print(f"  {v:<32} {variant_train.get(v, 0):>6} {variant_eval.get(v, 0):>6}")

    print("\n  Coverage by concept:")
    print(f"  {'Concept':<32} {'Train':>6} {'Eval':>6}")
    all_ids = list(dict.fromkeys(k for k, *_ in pool for k in []))
    seen = set()
    ordered_ids = []
    for key, concept, *_ in pool:
        if concept["id"] not in seen:
            seen.add(concept["id"])
            ordered_ids.append(concept["id"])
    for cid in ordered_ids:
        print(f"  {cid:<32} {concept_train.get(cid, 0):>6} {concept_eval.get(cid, 0):>6}")


def cmd_synthesize(_args):
    if not SEED_CONCEPTS_PATH.exists():
        print("[KORA] seed_concepts.json not found. Run bootstrap first.")
        sys.exit(1)
    with open(SEED_CONCEPTS_PATH, "r", encoding="utf-8") as f:
        concepts = json.load(f)

    pool = []
    for concept in concepts:
        cid = concept["id"]
        for task_type in NON_VARIANT_TASKS:
            for repeat_index in range(K_NON_VARIANT):
                key = f"{cid}|{task_type}|NA|{repeat_index}"
                pool.append((key, concept, task_type, None, repeat_index))
        for task_type in VARIANT_TASKS:
            for variant in ANSWER_VARIANTS:
                for repeat_index in range(K_VARIANT):
                    key = f"{cid}|{task_type}|{variant}|{repeat_index}"
                    pool.append((key, concept, task_type, variant, repeat_index))

    train_rows = []
    eval_rows = []
    train_keys: set = set()
    eval_keys: set = set()

    for key, concept, task_type, variant, repeat_index in pool:
        idx = int(hashlib.sha256(key.encode()).hexdigest(), 16)
        is_eval = (idx % EVAL_FRACTION_DENOM == 0)
        rng = random.Random(key)
        user_text, assistant_obj = TASK_GENERATORS[task_type](concept, variant, rng)
        row = make_chat_example(user_text, assistant_obj)
        if is_eval:
            eval_rows.append(row)
            eval_keys.add(key)
        else:
            train_rows.append(row)
            train_keys.add(key)

    overlap = train_keys & eval_keys
    assert not overlap, f"BUG: {len(overlap)} keys appear in both train and eval sets."
    assert len(train_rows) >= 300, (
        f"Only {len(train_rows)} training examples (need >= 300). "
        f"Increase K_NON_VARIANT or K_VARIANT."
    )
    assert len(eval_rows) >= 50, (
        f"Only {len(eval_rows)} eval examples (need >= 50). "
        f"Decrease EVAL_FRACTION_DENOM."
    )

    write_jsonl(TRAIN_PATH, train_rows)
    write_jsonl(EVAL_PATH, eval_rows)

    print(f"\n[KORA] Synthesize complete.")
    print(f"  Training examples : {len(train_rows):>4}  -> {TRAIN_PATH}")
    print(f"  Eval examples     : {len(eval_rows):>4}  -> {EVAL_PATH}")
    print(f"  Total pool size   : {len(pool):>4}")
    print(f"  Key overlap       : {len(overlap)}")
    _print_coverage(pool, train_keys, eval_keys)


# --------------------------------------------------------------------------
# validate
# --------------------------------------------------------------------------


def _infer_task_type(obj):
    """Infer KORA task type from the key shape of the parsed assistant JSON."""
    keys = set(obj.keys())
    if "anchor_statement" in keys:
        return "anchor"
    if "nodes" in keys and "edges" in keys:
        return "graph"
    if "events" in keys:
        return "evidence_events"
    if "sections" in keys:
        return "notes_generation"
    if "points" in keys:
        return "game_response_eval"
    if "misconception_label" in keys:
        return "misconception_sim"
    if "advance" in keys:
        return "evaluate"
    if "next_probe" in keys and "current_evidence" in keys:
        return "next_probe"
    if "narrative_summary" in keys:
        return "diagnosis"
    return None


def _check_anchor_schema(obj):
    required = ["concept", "anchor_statement", "core_understanding", "prerequisite_ideas",
                "common_misconceptions", "examples", "non_examples", "transfer_contexts"]
    for f in required:
        if f not in obj:
            return f"Missing field: '{f}'"
    return None


def _check_graph_schema(obj):
    for f in ["nodes", "edges"]:
        if f not in obj:
            return f"Missing field: '{f}'"
    for node in obj["nodes"]:
        if not all(k in node for k in ("id", "label", "type")):
            return f"Node missing id/label/type: {node}"
        if node["type"] not in NODE_TYPES:
            return f"Node type '{node['type']}' not in NODE_TYPES"
    for edge in obj["edges"]:
        if not all(k in edge for k in ("from", "to", "type")):
            return f"Edge missing from/to/type: {edge}"
        if edge["type"] not in EDGE_TYPES:
            return f"Edge type '{edge['type']}' not in EDGE_TYPES"
    return None


def _check_evidence_events_schema(obj):
    if "events" not in obj:
        return "Missing field: 'events'"
    for ev in obj["events"]:
        for f in ["type", "prompt", "target_dimension", "difficulty", "success_criteria", "misconceptions_tested"]:
            if f not in ev:
                return f"Event missing field: '{f}'"
        if ev["type"] not in EVENT_TYPES:
            return f"Event type '{ev['type']}' not in EVENT_TYPES"
        if ev["target_dimension"] not in EVIDENCE_DIMENSIONS:
            return f"Event target_dimension '{ev['target_dimension']}' not in EVIDENCE_DIMENSIONS"
        if ev["difficulty"] not in ("easy", "medium", "hard"):
            return f"Event difficulty '{ev['difficulty']}' not in (easy, medium, hard)"
    return None


def _check_misconception_sim_schema(obj):
    required = ["concept", "misconception_label", "student_response", "embodies", "surface_plausibility"]
    for f in required:
        if f not in obj:
            return f"Missing field: '{f}'"
    if obj["surface_plausibility"] not in ("low", "medium", "high"):
        return f"surface_plausibility '{obj['surface_plausibility']}' not in (low, medium, high)"
    return None


def _check_evaluate_schema(obj):
    required = ["advance", "evidence", "misconceptions", "missing_ideas", "strengths", "pushback",
                "next_best_probe", "teacher_summary"]
    for f in required:
        if f not in obj:
            return f"Missing field: '{f}'"
    if not isinstance(obj["advance"], bool):
        return "'advance' must be a bool"
    for dim in EVIDENCE_DIMENSIONS:
        if dim not in obj["evidence"]:
            return f"Missing evidence dimension: '{dim}'"
        if obj["evidence"][dim] not in EVIDENCE_LEVELS:
            return f"Evidence level '{obj['evidence'][dim]}' for '{dim}' not in EVIDENCE_LEVELS"
    for m in obj["misconceptions"]:
        for f in ["label", "confidence", "evidence"]:
            if f not in m:
                return f"Misconception entry missing field: '{f}'"
    probe = obj.get("next_best_probe", {})
    if "type" not in probe or "prompt" not in probe:
        return "next_best_probe missing 'type' or 'prompt'"
    return None


def _check_next_probe_schema(obj):
    for f in ["concept", "current_evidence", "next_probe"]:
        if f not in obj:
            return f"Missing field: '{f}'"
    for dim in EVIDENCE_DIMENSIONS:
        if dim not in obj["current_evidence"]:
            return f"Missing current_evidence dimension: '{dim}'"
        if obj["current_evidence"][dim] not in EVIDENCE_LEVELS:
            return f"current_evidence level '{obj['current_evidence'][dim]}' not in EVIDENCE_LEVELS"
    probe = obj.get("next_probe", {})
    for f in ["type", "prompt", "target_dimension", "rationale"]:
        if f not in probe:
            return f"next_probe missing field: '{f}'"
    return None


def _check_diagnosis_schema(obj):
    for f in ["concept", "evidence", "misconceptions_detected", "narrative_summary", "recommended_next_step"]:
        if f not in obj:
            return f"Missing field: '{f}'"
    for dim in EVIDENCE_DIMENSIONS:
        if dim not in obj["evidence"]:
            return f"Missing evidence dimension: '{dim}'"
        if obj["evidence"][dim] not in EVIDENCE_LEVELS:
            return f"Evidence level '{obj['evidence'][dim]}' for '{dim}' not in EVIDENCE_LEVELS"
    for m in obj["misconceptions_detected"]:
        for f in ["label", "confidence"]:
            if f not in m:
                return f"misconceptions_detected entry missing field: '{f}'"
    return None


def _check_notes_generation_schema(obj):
    for f in ["concept", "title", "learning_objective", "essential_question",
              "sections", "key_vocabulary", "common_pitfalls", "self_check_questions"]:
        if f not in obj:
            return f"Missing field: '{f}'"
    valid_section_types = {"anchor", "prerequisite_check", "core_idea", "example_analysis",
                           "misconception_alert", "transfer_challenge"}
    for sec in obj["sections"]:
        for sf in ["heading", "type", "content", "understanding_focus"]:
            if sf not in sec:
                return f"Section missing field: '{sf}'"
        if sec["type"] not in valid_section_types:
            return f"Section type '{sec['type']}' not in allowed section types"
    for vocab in obj["key_vocabulary"]:
        for vf in ["term", "definition", "example"]:
            if vf not in vocab:
                return f"Vocabulary entry missing field: '{vf}'"
    for q in obj["self_check_questions"]:
        for qf in ["question", "target_dimension", "what_strong_answer_includes"]:
            if qf not in q:
                return f"Self-check question missing field: '{qf}'"
        if q["target_dimension"] not in EVIDENCE_DIMENSIONS:
            return f"Self-check target_dimension '{q['target_dimension']}' not in EVIDENCE_DIMENSIONS"
    return None


def _check_game_response_eval_schema(obj):
    for f in ["concept", "probe", "student_response", "points", "understanding_level",
              "misconception_detected", "misconception_label", "feedback", "advance"]:
        if f not in obj:
            return f"Missing field: '{f}'"
    if not isinstance(obj["points"], int) or not (0 <= obj["points"] <= 100):
        return f"'points' must be an int in [0, 100], got {obj['points']!r}"
    if obj["understanding_level"] not in EVIDENCE_LEVELS:
        return f"understanding_level '{obj['understanding_level']}' not in EVIDENCE_LEVELS"
    if not isinstance(obj["misconception_detected"], bool):
        return "'misconception_detected' must be a bool"
    if not isinstance(obj["advance"], bool):
        return "'advance' must be a bool"
    return None


SCHEMA_CHECKERS = {
    "anchor": _check_anchor_schema,
    "graph": _check_graph_schema,
    "evidence_events": _check_evidence_events_schema,
    "misconception_sim": _check_misconception_sim_schema,
    "evaluate": _check_evaluate_schema,
    "next_probe": _check_next_probe_schema,
    "diagnosis": _check_diagnosis_schema,
    "notes_generation": _check_notes_generation_schema,
    "game_response_eval": _check_game_response_eval_schema,
}


def validate_row(row):
    """Return an error string if the row is invalid, or None if it passes all checks."""
    if not isinstance(row, dict) or "messages" not in row:
        return "Row must be a dict with a 'messages' key"
    msgs = row["messages"]
    if not isinstance(msgs, list) or len(msgs) != 3:
        return f"'messages' must be a 3-item list (got {type(msgs).__name__} len={len(msgs) if isinstance(msgs, list) else '?'})"
    roles = [m.get("role") for m in msgs]
    if roles != ["system", "user", "assistant"]:
        return f"Expected roles [system, user, assistant], got {roles}"
    for msg in msgs:
        if "content" not in msg:
            return "Message missing 'content'"
    assistant_content = msgs[2]["content"]
    try:
        obj = json.loads(assistant_content)
    except json.JSONDecodeError as exc:
        return f"Assistant content is not valid JSON: {exc}"
    task_type = _infer_task_type(obj)
    if task_type is None:
        return f"Cannot infer task type from JSON keys: {sorted(obj.keys())}"
    checker = SCHEMA_CHECKERS.get(task_type)
    if checker:
        err = checker(obj)
        if err:
            return f"Schema error ({task_type}): {err}"
    return None


def _validate_file(path):
    rows = load_jsonl(path)
    failures = []
    for i, row in enumerate(rows):
        err = validate_row(row)
        if err:
            failures.append((i, err))
    return len(rows), failures


def cmd_validate(_args):
    any_file = False
    for path, label in [(TRAIN_PATH, "kora_train.jsonl"), (EVAL_PATH, "kora_eval.jsonl")]:
        if not path.exists():
            print(f"[KORA] {label}: FILE NOT FOUND — run `synthesize` first.")
            continue
        any_file = True
        total, failures = _validate_file(path)
        passed = total - len(failures)
        pass_rate = passed / total * 100 if total else 0
        status = "PASS" if not failures else "FAIL"
        print(f"\n[KORA] {label}: {status}")
        print(f"  Total rows : {total}")
        print(f"  Passed     : {passed}")
        print(f"  Failed     : {len(failures)}")
        print(f"  Pass rate  : {pass_rate:.1f}%")
        if failures:
            print(f"  Failures (first 10):")
            for row_idx, err in failures[:10]:
                print(f"    Row {row_idx}: {err}")
    if not any_file:
        sys.exit(1)


# --------------------------------------------------------------------------
# train
# --------------------------------------------------------------------------

PREFERRED_TARGET_MODULES = ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]

DEFAULT_BASE_MODEL = "Qwen/Qwen2.5-1.5B-Instruct"
DEFAULT_OUTPUT_DIR = str(DEFAULT_ADAPTER_DIR)
DEFAULT_EPOCHS = 3
DEFAULT_LEARNING_RATE = 2e-4
DEFAULT_BATCH_SIZE = 2
DEFAULT_GRAD_ACCUM = 8
DEFAULT_MAX_SEQ_LENGTH = 2048


def resolve_target_modules(model):
    """
    Prefer the standard attention/MLP projection names for LoRA targeting.
    Falls back to auto-detecting all nn.Linear layers (excluding lm_head) if
    none of the preferred names are present in this model's architecture.
    """
    import torch
    present = {name.split(".")[-1] for name, mod in model.named_modules()
               if isinstance(mod, torch.nn.Linear)}
    matched = [m for m in PREFERRED_TARGET_MODULES if m in present]
    if matched:
        return matched
    auto = sorted({
        name.split(".")[-1] for name, mod in model.named_modules()
        if isinstance(mod, torch.nn.Linear) and "lm_head" not in name
    })
    if not auto:
        raise RuntimeError("No nn.Linear modules found to target with LoRA.")
    print(f"[KORA] Preferred target modules not found; auto-detected: {auto}")
    return auto


def cmd_train(_args):
    try:
        import torch
    except ImportError:
        print(
            "\n[KORA] torch is not installed.\n"
            "  Install requirements.txt on a GPU machine first: pip install -r requirements.txt\n"
        )
        sys.exit(0)
    if not torch.cuda.is_available():
        print(
            "\n[KORA] Training requires a CUDA GPU.\n"
            "  This machine has no CUDA GPU available.\n"
            "  Run `python train_kora.py train` on a GPU machine:\n"
            "    - Google Colab (free T4 / Pro A100)\n"
            "    - RunPod, Lambda Labs, or Modal\n"
            "  Railway is for hosting the website/inference API, not for training.\n"
            "  See README.md for full setup instructions.\n"
        )
        sys.exit(0)

    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from datasets import load_dataset
    from trl import SFTConfig, SFTTrainer

    BASE_MODEL = os.environ.get("BASE_MODEL", DEFAULT_BASE_MODEL)
    OUTPUT_DIR = os.environ.get("OUTPUT_DIR", DEFAULT_OUTPUT_DIR)
    EPOCHS = int(os.environ.get("EPOCHS", DEFAULT_EPOCHS))
    LEARNING_RATE = float(os.environ.get("LEARNING_RATE", DEFAULT_LEARNING_RATE))
    BATCH_SIZE = int(os.environ.get("BATCH_SIZE", DEFAULT_BATCH_SIZE))
    GRAD_ACCUM = int(os.environ.get("GRAD_ACCUM", DEFAULT_GRAD_ACCUM))
    MAX_SEQ_LENGTH = int(os.environ.get("MAX_SEQ_LENGTH", DEFAULT_MAX_SEQ_LENGTH))

    eff_config = {
        "BASE_MODEL": BASE_MODEL, "OUTPUT_DIR": OUTPUT_DIR, "EPOCHS": EPOCHS,
        "LEARNING_RATE": LEARNING_RATE, "BATCH_SIZE": BATCH_SIZE,
        "GRAD_ACCUM": GRAD_ACCUM, "MAX_SEQ_LENGTH": MAX_SEQ_LENGTH,
    }
    print("\n[KORA] Training configuration:")
    for k, v in eff_config.items():
        print(f"  {k:<20} = {v}")

    if not TRAIN_PATH.exists():
        print("[KORA] Training data not found. Run `python train_kora.py synthesize` first.")
        sys.exit(1)

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
    )
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    target_modules = resolve_target_modules(model)
    print(f"[KORA] LoRA target modules: {target_modules}")

    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=target_modules,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    dataset = load_dataset("json", data_files={"train": str(TRAIN_PATH)}, split="train")

    def format_example(example):
        return {
            "text": tokenizer.apply_chat_template(
                example["messages"],
                tokenize=False,
                add_generation_prompt=False,
            )
        }

    dataset = dataset.map(format_example)

    sft_config = SFTConfig(
        output_dir=OUTPUT_DIR,
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUM,
        learning_rate=LEARNING_RATE,
        max_seq_length=MAX_SEQ_LENGTH,
        logging_steps=10,
        save_strategy="epoch",
        fp16=True,
        report_to="none",
        dataset_text_field="text",
    )

    trainer = SFTTrainer(
        model=model,
        args=sft_config,
        train_dataset=dataset,
        tokenizer=tokenizer,
    )

    print("\n[KORA] Starting training...")
    resume_ckpt = os.environ.get("KORA_RESUME") or None
    trainer.train(resume_from_checkpoint=resume_ckpt)

    output_path = Path(OUTPUT_DIR)
    output_path.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"\n[KORA] Adapter saved to {OUTPUT_DIR}")

    with open(output_path / "training_config.json", "w") as f:
        json.dump(eff_config, f, indent=2)

    with open(output_path / "MODEL_CARD.md", "w") as f:
        f.write(f"""# KORA LoRA Adapter — Draft Model Card

> **Draft — not evaluated for production use.**

## Model Details
- **Base model**: {BASE_MODEL}
- **Adapter type**: LoRA (QLoRA 4-bit training)
- **LoRA rank**: 16 | alpha: 32 | dropout: 0.05
- **Target modules**: {", ".join(target_modules)}

## Training Data
- Synthetic KORA training examples (template-based, no external LLM calls)
- Generated by `python train_kora.py synthesize`

## Hyperparameters
| Param | Value |
|---|---|
| Epochs | {EPOCHS} |
| Learning rate | {LEARNING_RATE} |
| Batch size (device) | {BATCH_SIZE} |
| Gradient accumulation | {GRAD_ACCUM} |
| Effective batch size | {BATCH_SIZE * GRAD_ACCUM} |
| Max seq length | {MAX_SEQ_LENGTH} |

## Intended Use
KORA is Sinon Learning's pedagogical understanding engine. It returns structured JSON
that makes student understanding visible to teachers. It is **not a tutor** and does
**not replace the teacher**.

## Limitations
This is a first-iteration adapter trained on synthetic data. It has not been evaluated
on real classroom data. Use with appropriate caution in production settings.
""")

    print("\n[KORA] Running post-training evaluation on held-out set...")
    eval_results = _run_eval(model, tokenizer, MAX_SEQ_LENGTH)
    with open(output_path / "eval_results.json", "w") as f:
        json.dump(eval_results, f, indent=2)
    _print_eval_report(eval_results)


# --------------------------------------------------------------------------
# eval
# --------------------------------------------------------------------------

RANK = {"Not Yet Shown": 0, "Emerging": 1, "Solid": 2, "Strong": 3}


def evidence_label_score(gold, pred):
    """Compute ordinal-distance metrics between gold and predicted evidence dicts."""
    exact_matches = within_one = total_abs_distance = enum_valid = compared = 0
    for d in EVIDENCE_DIMENSIONS:
        if d not in gold or d not in pred or pred[d] not in RANK:
            continue
        enum_valid += 1
        compared += 1
        g, p = RANK[gold[d]], RANK[pred[d]]
        if g == p:
            exact_matches += 1
        if abs(g - p) <= 1:
            within_one += 1
        total_abs_distance += abs(g - p)
    return {
        "exact_match_rate": exact_matches / compared if compared else None,
        "mean_abs_ordinal_distance": total_abs_distance / compared if compared else None,
        "within_one_rate": within_one / compared if compared else None,
        "enum_validity_rate": enum_valid / len(EVIDENCE_DIMENSIONS),
        "compared_dims": compared,
    }


def _run_eval(model, tokenizer, max_seq_length):
    import torch
    if not EVAL_PATH.exists():
        return {"error": "Eval file not found; run synthesize first."}

    eval_rows = load_jsonl(EVAL_PATH)
    valid_json_count = schema_pass_count = 0
    ordinal_scores = []
    sample_outputs = []
    failures = []

    model.eval()
    for i, row in enumerate(eval_rows):
        msgs = row["messages"]
        input_text = tokenizer.apply_chat_template(
            msgs[:2], tokenize=False, add_generation_prompt=True,
        )
        inputs = tokenizer(
            input_text, return_tensors="pt", truncation=True, max_length=max_seq_length
        ).to(model.device)
        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_new_tokens=512,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id,
            )
        generated_ids = output_ids[0][inputs["input_ids"].shape[1]:]
        generated_text = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()

        pred_obj = None
        try:
            pred_obj = json.loads(generated_text)
            valid_json_count += 1
        except json.JSONDecodeError:
            failures.append({"row": i, "reason": "Invalid JSON", "output": generated_text[:200]})
            continue

        task_type = _infer_task_type(pred_obj)
        schema_err = SCHEMA_CHECKERS[task_type](pred_obj) if task_type and task_type in SCHEMA_CHECKERS else "unknown task type"
        if schema_err is None:
            schema_pass_count += 1
        else:
            failures.append({"row": i, "reason": f"Schema: {schema_err}", "output": generated_text[:200]})

        gold_obj = json.loads(msgs[2]["content"])
        if "evidence" in gold_obj and pred_obj and "evidence" in pred_obj:
            ordinal_scores.append(evidence_label_score(gold_obj["evidence"], pred_obj["evidence"]))

        if i < 5:
            sample_outputs.append({
                "row": i,
                "gold": msgs[2]["content"][:200],
                "pred": generated_text[:200],
            })

    n = len(eval_rows)
    results = {
        "total_eval_examples": n,
        "valid_json_rate": valid_json_count / n if n else 0,
        "schema_pass_rate": schema_pass_count / n if n else 0,
        "sample_outputs": sample_outputs,
        "failures": failures[:10],
    }
    if ordinal_scores:
        results["ordinal_metrics"] = {
            "exact_match_rate": sum(s["exact_match_rate"] or 0 for s in ordinal_scores) / len(ordinal_scores),
            "mean_abs_ordinal_distance": sum(s["mean_abs_ordinal_distance"] or 0 for s in ordinal_scores) / len(ordinal_scores),
            "within_one_rate": sum(s["within_one_rate"] or 0 for s in ordinal_scores) / len(ordinal_scores),
            "enum_validity_rate": sum(s["enum_validity_rate"] for s in ordinal_scores) / len(ordinal_scores),
        }
    return results


def _print_eval_report(results):
    print("\n[KORA] Evaluation Report:")
    print(f"  Total examples      : {results['total_eval_examples']}")
    print(f"  Valid JSON rate     : {results['valid_json_rate']:.1%}")
    print(f"  Schema pass rate    : {results['schema_pass_rate']:.1%}")
    if "ordinal_metrics" in results:
        m = results["ordinal_metrics"]
        print(f"  Exact match rate    : {m['exact_match_rate']:.1%}")
        print(f"  Mean ordinal dist   : {m['mean_abs_ordinal_distance']:.3f}  (0=perfect, 3=max)")
        print(f"  Within-one rate     : {m['within_one_rate']:.1%}  (practically meaningful)")
        print(f"  Enum validity rate  : {m['enum_validity_rate']:.1%}")
    if results.get("failures"):
        print(f"\n  Failures (first {min(10, len(results['failures']))}):")
        for failure in results["failures"][:10]:
            print(f"    Row {failure['row']}: {failure['reason']}")
    if results.get("sample_outputs"):
        print(f"\n  Sample outputs (first {len(results['sample_outputs'])}):")
        for s in results["sample_outputs"]:
            print(f"    Row {s['row']} gold: {s['gold'][:100]}")
            print(f"    Row {s['row']} pred: {s['pred'][:100]}")


def cmd_eval(_args):
    try:
        import torch
    except ImportError:
        print(
            "\n[KORA] torch is not installed.\n"
            "  Install requirements.txt on a GPU machine first: pip install -r requirements.txt\n"
        )
        sys.exit(0)
    if not torch.cuda.is_available():
        print(
            "\n[KORA] Eval requires a CUDA GPU to load the adapter.\n"
            "  Run on a GPU machine. See README.md.\n"
        )
        sys.exit(0)

    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import PeftModel

    BASE_MODEL = os.environ.get("BASE_MODEL", DEFAULT_BASE_MODEL)
    OUTPUT_DIR = os.environ.get("OUTPUT_DIR", DEFAULT_OUTPUT_DIR)
    MAX_SEQ_LENGTH = int(os.environ.get("MAX_SEQ_LENGTH", DEFAULT_MAX_SEQ_LENGTH))

    if not Path(OUTPUT_DIR).exists():
        print(f"[KORA] Adapter not found at {OUTPUT_DIR}. Run `python train_kora.py train` first.")
        sys.exit(1)

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
    )
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    model = PeftModel.from_pretrained(base_model, OUTPUT_DIR)
    model.eval()
    print(f"[KORA] Loaded adapter from {OUTPUT_DIR}")

    results = _run_eval(model, tokenizer, MAX_SEQ_LENGTH)
    _print_eval_report(results)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def build_arg_parser():
    parser = argparse.ArgumentParser(
        prog="train_kora.py",
        description="KORA model training pipeline.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("bootstrap", help="Write the seed concepts to data/seed_concepts.json.")
    subparsers.add_parser("synthesize", help="Generate synthetic KORA training/eval data.")
    subparsers.add_parser("validate", help="Validate the generated JSONL training/eval data.")
    subparsers.add_parser("train", help="Fine-tune a base model with LoRA/QLoRA on the KORA data.")
    subparsers.add_parser("eval", help="Evaluate a trained KORA LoRA adapter on the held-out set.")

    return parser


def main():
    parser = build_arg_parser()
    args = parser.parse_args()

    if args.command == "bootstrap":
        cmd_bootstrap(args)
    elif args.command == "synthesize":
        cmd_synthesize(args)
    elif args.command == "validate":
        cmd_validate(args)
    elif args.command == "train":
        cmd_train(args)
    elif args.command == "eval":
        cmd_eval(args)
    else:
        parser.error(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
