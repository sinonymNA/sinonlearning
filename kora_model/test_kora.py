#!/usr/bin/env python3
"""
test_kora.py — Interactive local test script for the trained KORA LoRA adapter.

Usage:
    python test_kora.py

Prompts you for a KORA task type and concept/content, then prints the
structured JSON the adapter returns. Requires a GPU and a trained adapter
at outputs/kora-lora (or the path set via OUTPUT_DIR env var).

This script reuses model-loading and eval helpers from train_kora.py so
there is no duplication of logic between training and inference.
"""

import json
import os
import sys

# Guard: must have a GPU to load the adapter
try:
    import torch
except ImportError:
    print("[KORA] torch is not installed. Install requirements.txt first.")
    sys.exit(1)

if not torch.cuda.is_available():
    print(
        "\n[KORA] test_kora.py requires a CUDA GPU to load the LoRA adapter.\n"
        "  Run on a GPU machine (Colab, RunPod, Lambda, Modal).\n"
        "  See README.md for setup instructions.\n"
    )
    sys.exit(0)

from pathlib import Path

# Pull shared constants and helpers from train_kora.py
from train_kora import (
    SYSTEM_PROMPT,
    TASK_TYPES,
    EVIDENCE_DIMENSIONS,
    DEFAULT_BASE_MODEL,
    DEFAULT_ADAPTER_DIR,
    _infer_task_type,
    SCHEMA_CHECKERS,
)

from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel


def load_kora_model(base_model_id, adapter_dir):
    print(f"[KORA] Loading base model: {base_model_id}")
    tokenizer = AutoTokenizer.from_pretrained(base_model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
    )
    base = AutoModelForCausalLM.from_pretrained(
        base_model_id,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
    )
    print(f"[KORA] Loading LoRA adapter: {adapter_dir}")
    model = PeftModel.from_pretrained(base, str(adapter_dir))
    model.eval()
    print("[KORA] Model ready.\n")
    return model, tokenizer


def generate_kora_response(model, tokenizer, user_text, max_new_tokens=512):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]
    input_text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = tokenizer(input_text, return_tensors="pt").to(model.device)
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=tokenizer.pad_token_id,
        )
    generated_ids = output_ids[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(generated_ids, skip_special_tokens=True).strip()


def build_user_message(task_type):
    """Interactively collect task-specific inputs from the user and build the user message."""
    print(f"\nTask: {task_type}")
    concept_name = input("Concept name (e.g. 'Opportunity Cost'): ").strip()
    subject = input("Subject (e.g. 'Economics'): ").strip()
    grade = input("Grade band (e.g. '9-10'): ").strip()
    source = input("Paste a short source content excerpt (press Enter when done):\n> ").strip()

    preamble = (
        f"Concept: {concept_name}\n"
        f"Subject: {subject} | Grade Band: {grade}\n"
        f"Source Content:\n{source}"
    )

    if task_type == "evaluate":
        probe = input("\nProbe used (the question asked of the student): ").strip()
        response = input("Student response: ").strip()
        user_text = (
            f"{preamble}\n\n"
            f"Probe used: \"{probe}\"\n\n"
            f"Student response:\n\"{response}\"\n\n"
            f"Task: Evaluate this student response. Return a KORA evaluation."
        )
    elif task_type == "diagnosis":
        response = input("\nStudent response: ").strip()
        user_text = (
            f"{preamble}\n\n"
            f"Student response:\n\"{response}\"\n\n"
            f"Task: Generate a teacher-facing KORA diagnosis of this student's understanding of \"{concept_name}\"."
        )
    elif task_type == "misconception_sim":
        misconception = input("\nMisconception to simulate (brief label or description): ").strip()
        user_text = (
            f"{preamble}\n\n"
            f"Task: Simulate a student response that embodies this misconception about \"{concept_name}\".\n"
            f"Focus on the misconception: \"{misconception}\""
        )
    elif task_type == "next_probe":
        print("\nCurrent evidence profile (press Enter to use 'Not Yet Shown' for all):")
        current_evidence = {}
        for dim in EVIDENCE_DIMENSIONS:
            val = input(f"  {dim} [Not Yet Shown / Emerging / Solid / Strong]: ").strip()
            current_evidence[dim] = val if val else "Not Yet Shown"
        evidence_lines = "\n".join(f"  {d}: {current_evidence[d]}" for d in EVIDENCE_DIMENSIONS)
        user_text = (
            f"{preamble}\n\n"
            f"Current student evidence profile:\n{evidence_lines}\n\n"
            f"Task: Suggest the next best probe to move student understanding of \"{concept_name}\" forward."
        )
    elif task_type == "game_response_eval":
        probe = input("\nProbe question for the game: ").strip()
        response = input("Student typed response: ").strip()
        user_text = (
            f"{preamble}\n\n"
            f"Probe: \"{probe}\"\n\n"
            f"Student response:\n\"{response}\"\n\n"
            f"Task: Evaluate this student response for the game. Return a KORA game evaluation."
        )
    else:
        user_text = (
            f"{preamble}\n\n"
            f"Task: {_task_instruction(task_type, concept_name)}"
        )
    return user_text


def _task_instruction(task_type, concept_name):
    instructions = {
        "anchor": f"Build a conceptual anchor for \"{concept_name}\" including core understanding, prerequisite ideas, common misconceptions, examples, non-examples, and transfer contexts.",
        "graph": f"Build an understanding graph for \"{concept_name}\" with labeled nodes and typed edges.",
        "evidence_events": f"Generate 4 to 5 evidence-gathering events for \"{concept_name}\" spanning different cognitive demands.",
        "notes_generation": f"Generate a KORA notes sheet for \"{concept_name}\" designed to maximize learner understanding, not just content coverage.",
    }
    return instructions.get(task_type, f"Run KORA task '{task_type}' for the concept \"{concept_name}\".")


def main():
    BASE_MODEL = os.environ.get("BASE_MODEL", DEFAULT_BASE_MODEL)
    OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", str(DEFAULT_ADAPTER_DIR)))

    if not OUTPUT_DIR.exists():
        print(f"[KORA] Adapter not found at {OUTPUT_DIR}.")
        print("  Run `python train_kora.py train` first to produce the adapter.")
        sys.exit(1)

    model, tokenizer = load_kora_model(BASE_MODEL, OUTPUT_DIR)

    print("Available KORA task types:")
    for i, t in enumerate(TASK_TYPES, 1):
        print(f"  {i}. {t}")

    while True:
        print()
        choice = input("Select task type (number or name, or 'q' to quit): ").strip()
        if choice.lower() in ("q", "quit", "exit"):
            break

        if choice.isdigit() and 1 <= int(choice) <= len(TASK_TYPES):
            task_type = TASK_TYPES[int(choice) - 1]
        elif choice in TASK_TYPES:
            task_type = choice
        else:
            print(f"Unknown choice: '{choice}'. Enter a number 1-{len(TASK_TYPES)} or the task name.")
            continue

        user_text = build_user_message(task_type)

        print("\n[KORA] Generating...")
        raw_output = generate_kora_response(model, tokenizer, user_text)

        print("\n" + "=" * 60)
        print("KORA output:")
        print("=" * 60)
        try:
            parsed = json.loads(raw_output)
            print(json.dumps(parsed, indent=2, ensure_ascii=False))
            # Quick schema check
            inferred = _infer_task_type(parsed)
            if inferred and inferred in SCHEMA_CHECKERS:
                err = SCHEMA_CHECKERS[inferred](parsed)
                if err:
                    print(f"\n[KORA] Schema warning: {err}")
                else:
                    print(f"\n[KORA] Schema: PASS ({inferred})")
        except json.JSONDecodeError:
            print("[KORA] Warning: output is not valid JSON. Raw text:")
            print(raw_output)
        print("=" * 60)


if __name__ == "__main__":
    main()
