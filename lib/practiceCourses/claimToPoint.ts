// "Claim to Point" — a serialized mystery ("The Ferryhollow Files," a
// working title, freely swappable) that teaches SAQ mechanics one sentence
// at a time. Each module's story beat mirrors a real SAQ evidence type, then
// bridges into real, historically-accurate AP World History Unit 1 content
// from Module 4 onward. See lib/marginsPracticeCourses.ts for the shared
// type system this content is authored against — lesson pages are a
// sequence of typed content blocks (paragraph, chat exchange, evidence
// exhibit, anatomy diagram, timeline, schematic chart, comparison chart,
// contrast card), not plain paragraph strings.

import type { PracticeModule } from "../marginsPracticeCourses";

export const CLAIM_TO_POINT_COURSE_ID = "claim-to-point";

export const CLAIM_TO_POINT_MODULES: PracticeModule[] = [
  // ── Module 1 — "Okay But Who Do You Think Did It" ──────────────────────
  {
    id: "the-vanishing",
    order: 0,
    title: "Okay But Who Do You Think Did It",
    tagline: "Marisol's gone. Everyone's got a theory. Nobody's got proof yet.",
    register: "story",
    pages: [
      {
        id: "vanish-p1",
        kind: "lesson",
        title: "Monday morning, and Marisol's not here",
        body: [
          {
            type: "image",
            src: "/margins/claim-to-point/bonfire-gathering.webp",
            alt: "A group of teenagers gathered around a bonfire at a rocky point at night, with a marina and lit houses in the background.",
            caption: "Friday night. Ferryhollow Point.",
          },
          {
            type: "paragraph",
            text: "Here's what everyone actually agrees on: Friday night, there was a bonfire out at Ferryhollow Point — the rocky little peninsula past the marina where everyone ends up eventually. Marisol was there. Devon was there. Priya was there, and so was Jonah.",
          },
          {
            type: "image",
            src: "/margins/claim-to-point/bonfire-confrontation.webp",
            alt: "Two teenage girls facing off and arguing in front of the bonfire while everyone else around them looks at their phones.",
            caption: "Somewhere around 11pm, it got loud.",
          },
          {
            type: "paragraph",
            text: "Marisol and Priya got into it — a real screaming match, the kind that makes everyone else suddenly very interested in their phones. Nobody heard the whole thing. And then Marisol just... wasn't at the bonfire anymore. Nobody thought much of it Friday night. People leave parties.",
          },
          {
            type: "paragraph",
            text: "Except she didn't show up to first period Monday. Or second. By lunch, her mom had called the school.",
          },
          {
            type: "image",
            src: "/margins/claim-to-point/hallway-gossip.webp",
            alt: "Students clustered in a high school hallway between classes, whispering and looking concerned.",
            caption: "By lunch, half the school had a theory.",
          },
          {
            type: "paragraph",
            text: "By the end of the day, half of Ferryhollow High had a theory, and none of them had actually talked to each other about it.",
          },
          {
            type: "paragraph",
            text: "You're going to be the one who actually investigates this properly — piecing together claims, evidence, and reasoning until you've got something you could actually defend. Consider this your first case file.",
          },
        ],
      },
      {
        id: "vanish-p2",
        kind: "lesson",
        title: "Everyone's already got a theory (that's the problem)",
        body: [
          {
            type: "paragraph",
            text: "Everyone's already got a theory — and that's exactly the problem. Here's the group chat from Sunday night:",
          },
          {
            type: "chatExchange",
            messages: [
              {
                sender: "devon",
                text: "ok not to be dramatic but I think something actually happened to her.",
                timestamp: "Sun 9:14pm",
              },
              {
                sender: "priya",
                text: "Devon is being SO weird about this and I don't know why.",
                timestamp: "Sun 9:22pm",
              },
              {
                sender: "jonah",
                text: "I mean... people vanish for their own reasons sometimes. I'm not saying anything. I'm just saying.",
                timestamp: "Sun 9:47pm",
              },
            ],
          },
          {
            type: "paragraph",
            text: 'Notice something? All three of those are just vibes. "Something happened." "Devon is being weird." "People vanish for their own reasons." Not one of them actually commits to anything. They\'re all just gesturing in a direction without ever landing anywhere.',
          },
          {
            type: "paragraph",
            text: "That's the very first skill you need before any of this investigation goes anywhere: the difference between an actual claim and a vibe.",
          },
        ],
      },
      {
        id: "vanish-p3",
        kind: "lesson",
        title: "A claim takes a side. A vibe doesn't.",
        body: [
          {
            type: "paragraph",
            text: "A claim is a sentence that could be WRONG. That's the test. If there's no way anyone could ever prove your sentence false, it's not a claim — it's just noise that sounds like an opinion.",
          },
          {
            type: "paragraph",
            text: '"Something happened to her" can never be wrong. It\'s compatible with literally every possible explanation, which means it doesn\'t actually say anything. But "I think Priya knows more than she\'s telling people" — that COULD be wrong. It commits to something. It takes a side. That\'s a claim.',
          },
          {
            type: "paragraph",
            text: "Here's the part that trips people up: a claim doesn't need proof yet to count as a claim. It just needs to actually say something specific enough that it could be false. Proof is a separate step — you'll get to that next. Right now, the only question is: did you actually commit to a side, or are you just hovering above the conversation being vague on purpose so you can't be wrong?",
          },
        ],
      },
      {
        id: "vanish-p4",
        kind: "lesson",
        title: "One more test before you write yours",
        body: [
          {
            type: "callout",
            text: "Quick gut check Scout runs on every claim: could you swap out the subject and the sentence would still basically work? \"Something's off\" works for literally any mystery ever told. \"Priya's been avoiding eye contact with Devon since Saturday\" only works for THIS one — it names a specific person, a specific behavior, a specific timeframe. That specificity is what makes it a real claim instead of atmosphere.",
          },
          {
            type: "paragraph",
            text: "One more thing before you write your own: people have been doing exactly this about actual history forever, not just group chats. Historians still argue — genuinely argue, in real published books — about why certain rulers died suddenly, or why certain empires collapsed when they did. Different historians take different sides. That's not gossip, that's the actual discipline. You're about to practice the exact same first move they use.",
          },
        ],
      },
      {
        id: "vanish-check",
        kind: "check",
        title: "Pick a side",
        intro:
          "Finish the sentence. Don't worry about proof yet — Scout's only checking one thing: did you actually commit to a real claim, or are you still just vibing?",
        skill: { dimension: "mechanics", id: "claim" },
        prompts: [
          {
            id: "vanish-claim-devon",
            prompt:
              'Finish this: "I think Devon ___." Make it a real claim about Devon and Friday night — something that could actually be wrong, not a vibe.',
          },
          {
            id: "vanish-claim-priya",
            prompt:
              'Finish this: "I think Priya ___." Make it a real claim about Priya and the fight — something specific enough that it could be false.',
          },
          {
            id: "vanish-claim-open",
            prompt:
              'Finish this: "I think what actually happened to Marisol is ___." Take an actual side. No hedging, no "something happened" — commit to something specific.',
          },
        ],
      },
    ],
  },

  // ── Module 2 — "Her Alibi Doesn't Add Up" ───────────────────────────────
  {
    id: "the-alibi",
    order: 1,
    title: "Her Alibi Doesn't Add Up",
    tagline: "Devon says she was home all night. A text timestamp says otherwise.",
    register: "story",
    pages: [
      {
        id: "alibi-p1",
        kind: "lesson",
        title: "Devon's story, word for word",
        body: [
          {
            type: "paragraph",
            text: '"I left the bonfire around 10:30 and went straight home. I was asleep by 11. I didn\'t see anything after the fight started, I was already gone." That\'s what Devon told three different people this week, word for word each time — which is either because it\'s true, or because it\'s memorized.',
          },
          {
            type: "paragraph",
            text: "Except: Priya's older cousin works the counter at the 24-hour diner downtown — a solid fifteen-minute drive from Ferryhollow Point, in the opposite direction from Devon's house. And she swears Devon's phone number is the one that popped up on the diner's order pickup screen at 11:04pm Friday night. Downtown. Not home. Not asleep.",
          },
          {
            type: "evidenceExhibit",
            label: "EXHIBIT — DINER PICKUP LOG",
            content: "Order pickup screen, Friday 11:04 PM: phone number matches Devon's.",
            annotation: "11:04PM — not home.",
          },
        ],
      },
      {
        id: "alibi-p2",
        kind: "lesson",
        title: "A claim needs backup — ONE real piece of it",
        body: [
          {
            type: "callout",
            text: "Last module you learned to spot a real claim. Now: a claim by itself is still just an accusation. \"Devon's lying\" is a real claim — it could be false — but it's floating with nothing under it. The next move is attaching ONE specific, concrete piece of evidence that actually supports it.",
          },
          {
            type: "callout",
            text: "\"Devon's being shady\" — vague. Could describe literally anyone having an off week. \"Devon's phone number was logged at a downtown diner at 11:04pm, the same night she says she was home asleep by 11\" — that's not shady, that's a timestamp, a location, and a name. It's checkable. Nobody can argue with a fact that specific; they can only argue with a vibe.",
          },
        ],
      },
      {
        id: "alibi-p3",
        kind: "lesson",
        title: "The upgrade, side by side",
        body: [
          { type: "paragraph", text: "Here's the whole move in one place:" },
          {
            type: "contrastCard",
            weak: "I think Devon's hiding something.",
            strong:
              "I think Devon's hiding something, because her number was logged at a downtown diner at 11:04pm, not at home like she claims.",
            weakNote: "A claim, but no evidence attached — an accusation floating in midair.",
            strongNote: "Same claim, one specific detail — now it's something you could actually defend.",
          },
          {
            type: "paragraph",
            text: "Your job next: take a vague version of this exact claim and rebuild it with the one specific detail from the story that actually proves it.",
          },
        ],
      },
      {
        id: "alibi-check",
        kind: "check",
        title: "Attach the receipt",
        intro:
          "Rewrite the vague claim below into claim + ONE specific detail pulled straight from the story. \"She's shady\" doesn't count — Scout wants a name, a time, a place, something checkable.",
        skill: { dimension: "mechanics", id: "evidence" },
        prompts: [
          {
            id: "alibi-evidence-devon",
            prompt:
              'Someone in the group chat just wrote: "Devon\'s definitely lying about something." Rewrite that into a real claim + ONE specific piece of evidence from the story that actually backs it up.',
          },
          {
            id: "alibi-evidence-timestamp",
            prompt:
              "Explain, in one sentence, exactly why the diner timestamp matters — what specific detail about it contradicts Devon's story? Name the actual detail, not just \"it doesn't match.\"",
          },
        ],
      },
      {
        id: "alibi-echo-intro",
        kind: "lesson",
        title: "Same move, but it's just... history now",
        body: [
          {
            type: "paragraph",
            text: "Same exact skill — claim, plus one specific detail that actually backs it up — except this time it's aimed at something real that actually happened, a couple hundred years ago, not a diner receipt.",
          },
          {
            type: "callout",
            text: "In 1791, King Louis XVI of France tried to secretly flee Paris in disguise with his family, hoping to reach royalist troops near the eastern border and escape the Revolution entirely. His \"alibi,\" more or less, was that this was all a normal, unremarkable trip. It fell apart in the town of Varennes when a local postmaster recognized the king's face — because it was printed on the paper currency everyone in France carried around in their pocket. Same shape as Devon's alibi: a cover story, and one specific, checkable detail that blew it apart.",
          },
          {
            type: "timeline",
            events: [
              {
                date: "1791",
                label: "Flight from Paris",
                detail: "The royal family flees in disguise, hoping to reach royalist troops near the eastern border.",
              },
              {
                date: "Varennes",
                label: "The cover story collapses",
                detail: "A local postmaster recognizes the king's face — printed on the currency in his own pocket.",
              },
            ],
          },
        ],
      },
      {
        id: "alibi-echo-check",
        kind: "check",
        title: "The king's alibi didn't hold up either",
        intro:
          "Same move as Devon's diner receipt — claim + one specific, checkable detail. This time it's real history: Louis XVI's failed flight to Varennes in 1791.",
        skill: { dimension: "ap", id: "use_of_evidence" },
        prompts: [
          {
            id: "alibi-echo-varennes",
            prompt:
              "Identify ONE specific piece of evidence that reveals how Louis XVI's 1791 escape attempt was exposed as something other than an ordinary trip.",
          },
          {
            id: "alibi-echo-currency",
            prompt:
              "Give ONE specific detail explaining why the king's face being printed on French currency mattered to how he was recognized at Varennes.",
          },
        ],
      },
    ],
  },

  // ── Module 3 — "Priya Was Lying This Whole Time" ────────────────────────
  {
    id: "the-betrayal",
    order: 2,
    title: "Priya Was Lying This Whole Time",
    tagline: "The betrayal. Priya's alibi collapses, and she had a real motive.",
    register: "story",
    pages: [
      {
        id: "betrayal-p1",
        kind: "lesson",
        title: "It wasn't Devon. It was Priya.",
        body: [
          {
            type: "paragraph",
            text: "Turns out Devon's diner trip was nothing — she panic-drove to get fries after the fight because she was too upset to go straight home, then lied about the timing because she didn't want to admit how shaken up she was. Dead end. Sorry.",
          },
          {
            type: "callout",
            text: "But here's what came out this week: Priya told everyone the fight was \"about nothing, just a dumb misunderstanding.\" Except Jonah finally admitted — reluctantly, and only after being asked directly twice — that the fight was actually about Marisol finding out Priya had been talking to Marisol's ex behind her back for weeks. That's not nothing. That's a real motive Priya has been actively hiding since Friday.",
          },
        ],
      },
      {
        id: "betrayal-p2",
        kind: "lesson",
        title: "The missing piece: reasoning",
        body: [
          {
            type: "paragraph",
            text: "You've now got two moves down: a real claim, and a claim backed by one specific piece of evidence. Here's the piece almost everyone skips, and it's the single biggest point-loser on a real SAQ: reasoning — the sentence that actually explains WHY your evidence proves your claim, instead of just restating the evidence in different words.",
          },
          {
            type: "callout",
            text: "Watch the trap: \"Priya lied about the fight, because she told everyone it was about nothing when it was actually about her talking to Marisol's ex.\" That sentence is 100% just... the evidence again, worded slightly differently. It never actually explains WHY that evidence matters — it just repeats it.",
          },
        ],
      },
      {
        id: "betrayal-p3",
        kind: "lesson",
        title: "Restating vs. explaining — the actual difference",
        body: [
          {
            type: "paragraph",
            text: "Reasoning has to add something the evidence alone didn't already say. Here's what a real one actually looks like:",
          },
          {
            type: "anatomyDiagram",
            claim: "Priya has been hiding her real motive since Friday.",
            evidence:
              'Priya told the group the fight was "about nothing," but Jonah confirmed it was actually about Priya secretly talking to Marisol\'s ex.',
            reasoning:
              'Someone telling the truth about an argument being "nothing" wouldn\'t have a hidden reason to keep the real subject secret for four days — the fact that Priya buried the actual topic that long means she knew it made her look bad.',
            highlight: "reasoning",
          },
          {
            type: "paragraph",
            text: "That sentence does something new: it explains the LOGIC connecting the evidence to the claim, instead of just repeating the evidence. Today, you're not writing a claim or finding evidence — those are already done for you, on purpose. You're only writing the reasoning sentence. Isolating it like this is the whole point: it's the hardest of the three moves, so you're going to drill it completely alone before ever combining it with the other two again.",
          },
        ],
      },
      {
        id: "betrayal-p4",
        kind: "lesson",
        title: "One heads-up before you write",
        body: [
          {
            type: "callout",
            text: "One more thing before you jump in: right after you submit, Scout's going to ask you a quick question BEFORE showing you any feedback — just \"what do you think is the weakest part of what you just wrote?\" You can skip it if you want, but genuinely take a second with it if you can. Catching your own weak spot before someone else points it out is basically the whole skill, one level up.",
          },
        ],
      },
      {
        id: "betrayal-check",
        kind: "check",
        title: "Write only the reasoning",
        intro:
          "Claim and evidence are already written below for each one. Your only job: write the ONE sentence connecting them — explain WHY that evidence actually proves the claim. Don't just restate the evidence.",
        skill: { dimension: "mechanics", id: "reasoning" },
        selfDiagnosis: true,
        prompts: [
          {
            id: "betrayal-reasoning-motive",
            givenContextAnatomy: {
              claim: "Priya has been hiding her real motive since Friday.",
              evidence:
                'Priya told the group the fight was "about nothing," but Jonah confirmed it was actually about Priya secretly talking to Marisol\'s ex for weeks.',
            },
            prompt:
              "Write ONLY the reasoning sentence: why does that evidence actually prove Priya has been hiding her real motive? Don't just restate the evidence — explain the logic connecting it to the claim.",
          },
          {
            id: "betrayal-reasoning-jonah",
            givenContextAnatomy: {
              claim: "Jonah only admitted the truth because he was cornered, not because he wanted to come clean.",
              evidence:
                "Jonah had already denied knowing the real reason for the fight twice, and only told the truth on the third direct question.",
            },
            prompt:
              "Write ONLY the reasoning sentence: why does that evidence support the claim that Jonah was cornered into it, rather than volunteering the truth? Explain the logic, don't just repeat the evidence.",
          },
        ],
      },
      {
        id: "betrayal-echo-intro",
        kind: "lesson",
        title: "History's had betrayals like this too",
        body: [
          {
            type: "paragraph",
            text: "This time, no training wheels — full claim, evidence, AND reasoning, all in one, aimed at something real: a trusted ally with a hidden motive.",
          },
          {
            type: "paragraph",
            text: "In 44 BCE, Brutus — a Roman senator Julius Caesar personally trusted and had spared after a civil war — joined a group of senators who assassinated Caesar in the Senate. Publicly, the conspirators claimed they acted to save the Roman Republic from a would-be king. Privately, many of them, Brutus included, had their own resentments and ambitions tied up in Caesar's growing personal power. Same shape as Priya: a trusted insider, a motive that wasn't the one being said out loud.",
          },
          {
            type: "timeline",
            events: [
              {
                date: "Before 44 BCE",
                label: "Caesar spares Brutus",
                detail: "After a civil war, Caesar personally pardons Brutus and keeps him close as a trusted senator.",
              },
              {
                date: "44 BCE",
                label: "The Ides of March",
                detail:
                  "Brutus joins a group of senators who assassinate Caesar in the Senate, publicly citing the Republic — privately, with his own resentments in play.",
              },
            ],
          },
        ],
      },
      {
        id: "betrayal-echo-check",
        kind: "check",
        title: "The trusted ally with a hidden motive",
        intro: "No given context this time — full claim, evidence, and reasoning, on your own, aimed at Brutus and Caesar.",
        skill: { dimension: "ap", id: "causation" },
        prompts: [
          {
            id: "betrayal-echo-brutus",
            prompt:
              "Explain ONE reason Brutus's personal position under Caesar's growing power helps explain why he joined the assassination plot, beyond the public justification of \"saving the Republic.\"",
          },
        ],
      },
    ],
  },

  // ── Module 4 — "Wait, This Is Just... History" (bridge) ─────────────────
  {
    id: "the-bridge",
    order: 3,
    title: "Wait, This Is Just... History",
    tagline: "Same three moves. Real history. Same voice.",
    register: "transitional",
    pages: [
      {
        id: "bridge-p1",
        kind: "lesson",
        title: "Meanwhile, back in Ferryhollow",
        body: [
          {
            type: "paragraph",
            text: "Marisol's older sibling flew back into town this week — first time in over a year — and has been asking everyone, very directly, what actually happened Friday night. That's added a whole different kind of pressure to all of this. It's not just group-chat curiosity anymore; there's someone who actually needs a real answer.",
          },
          {
            type: "paragraph",
            text: "Which is a good moment to notice something: you've now got all three moves — claim, evidence, reasoning — and you've been using them on a mystery this whole time because a mystery is genuinely just easier to care about than a textbook. But here's the thing Scout wants you to sit with for a second: the moves themselves were never actually about Marisol. They're the exact same moves historians use, on real, documentable events that actually happened.",
          },
        ],
      },
      {
        id: "bridge-p2",
        kind: "lesson",
        title: "Okay but between us, Mansa Musa was NOT being subtle",
        body: [
          {
            type: "paragraph",
            text: "So here's a real one, and it deserves the same energy as the Ferryhollow gossip: in 1324, Mansa Musa — the ruler of the Mali Empire, in West Africa — set out on a pilgrimage to Mecca. He didn't travel light. Estimates vary, but he brought a caravan that may have included thousands of soldiers, attendants, and enslaved people, along with an enormous quantity of gold.",
          },
          {
            type: "evidenceExhibit",
            label: "SOURCE — CONTEMPORARY ARAB HISTORIANS",
            content:
              "Multiple historians writing at the time documented Mansa Musa's caravan passing through Cairo — stunned by the sheer volume of gold he gave away.",
            annotation: "Not a rumor. Written down as it happened.",
          },
          {
            type: "paragraph",
            text: "When he passed through Cairo, he gave away — reportedly just gave away — so much gold that he single-handedly crashed the local gold market. Prices took roughly a decade to fully recover.",
          },
          {
            type: "schematicChart",
            chartKind: "bar",
            caption:
              "Illustrative only — exact figures aren't precisely documented, but the crash-and-slow-recovery shape is.",
            points: [
              { label: "Before", value: 100 },
              { label: "1324", value: 35 },
              { label: "+3yr", value: 55 },
              { label: "+6yr", value: 78 },
              { label: "~decade", value: 98 },
            ],
            illustrative: true,
          },
          {
            type: "timeline",
            events: [
              {
                date: "1324",
                label: "Departs Mali",
                detail: "Sets out on hajj to Mecca with an enormous caravan and quantity of gold.",
              },
              {
                date: "1324",
                label: "Passes through Cairo",
                detail: "Gives away so much gold that the local gold market crashes.",
              },
              {
                date: "~1334",
                label: "Market recovers",
                detail: "Gold prices take roughly a decade to fully recover, per contemporary accounts.",
              },
            ],
          },
          {
            type: "paragraph",
            text: "Notice the shape: someone with something to prove (or something they didn't even realize they were revealing), acting in a way that gave away way more than they probably meant to. Sound familiar? That's the exact same shape as Priya's secret finally coming out.",
          },
        ],
      },
      {
        id: "bridge-p3",
        kind: "lesson",
        title: "Same three moves, real content, same voice",
        body: [
          {
            type: "paragraph",
            text: "Here's the actual prompt you're about to answer: \"How did Mansa Musa's pilgrimage reveal Mali's wealth and political power?\" Break it down exactly like you've been doing all along:",
          },
          {
            type: "anatomyDiagram",
            claim: "Mansa Musa's pilgrimage revealed just how wealthy and powerful Mali really was.",
            evidence:
              "He gave away enough gold passing through Cairo in 1324 to crash the local gold market for roughly a decade.",
            reasoning:
              "A ruler doesn't casually destabilize a foreign economy by accident — only an empire with genuinely massive gold reserves could give away that much without even seeming to notice.",
          },
          {
            type: "paragraph",
            text: "This is the real thing now — full claim, evidence, reasoning, all three, on genuine AP World content. Scout's grading this one exactly the way a real AP reader would. Same gossip energy, real stakes.",
          },
        ],
      },
      {
        id: "bridge-check",
        kind: "check",
        title: "Mansa Musa wasn't being subtle",
        intro:
          "Full claim, evidence, and reasoning — real history, same three moves you've been using this whole time.",
        skill: { dimension: "ap", id: "argumentation" },
        prompts: [
          {
            id: "bridge-mansa-musa",
            prompt: "How did Mansa Musa's 1324 pilgrimage to Mecca reveal Mali's wealth and political power?",
          },
        ],
      },
    ],
  },

  // ── Module 5 — "Not Everyone's Telling the Full Story" ──────────────────
  {
    id: "conflicting-accounts",
    order: 4,
    title: "Not Everyone's Telling the Full Story",
    tagline: "Jonah's been protecting someone. His story only half lines up with Devon's.",
    register: "ap",
    pages: [
      {
        id: "accounts-p1",
        kind: "lesson",
        title: "Jonah's version doesn't fully match Devon's",
        body: [
          {
            type: "callout",
            text: "Devon says she heard Marisol mention \"needing space for a while\" earlier that night, before the fight even started. Jonah says he never heard that — and he was standing closer to Marisol than Devon was most of the night. Either one of them misremembered a chaotic night, or one of them is protecting someone by leaving something out. Hard to say yet.",
          },
          {
            type: "paragraph",
            text: "And then there's Wren — someone who wasn't even at the bonfire, but who'd been texting Marisol on and off that whole week. Nobody's talked to Wren directly; everything anyone knows about those texts comes secondhand, through a screenshot someone forwarded around:",
          },
          {
            type: "chatExchange",
            messages: [
              { sender: "marisol", text: "ugh I don't even want to go tonight honestly", timestamp: "Fri 6:58pm" },
              { sender: "wren", text: "then don't? you don't owe anyone a bonfire", timestamp: "Fri 7:03pm" },
              { sender: "marisol", text: "it's complicated. I'll explain later I promise", timestamp: "Fri 7:05pm" },
            ],
          },
          {
            type: "paragraph",
            text: "That's it. That's the whole thread anyone's seen. You've never heard from Wren yourself — you're stuck weighing an account from someone you can't actually question.",
          },
        ],
      },
      {
        id: "accounts-p2",
        kind: "lesson",
        title: "Two different jobs a question can ask you to do",
        body: [
          {
            type: "paragraph",
            text: "Real SAQ prompts — the ones you'll actually see on the exam — don't all ask for the same thing, and mixing them up is one of the most common ways students lose easy points. Some parts are IDENTIFY or DESCRIBE: they just want accurate, specific information. No reasoning chain required — name the thing correctly and you've got the point.",
          },
          {
            type: "callout",
            text: "Other parts are EXPLAIN or ANALYZE: they want the full reasoning chain — not just a fact, but WHY or HOW it connects to something else. Watch the verbs: \"Identify ONE effect...\" just wants a specific effect, named correctly. \"Explain ONE reason...\" wants the actual mechanism — the how or why, not just a fact sitting there.",
          },
        ],
      },
      {
        id: "accounts-p3",
        kind: "lesson",
        title: "Giving reasoning where none was asked (and the reverse)",
        body: [
          {
            type: "paragraph",
            text: "Here's the actual trap: writing a full reasoning chain for an IDENTIFY part wastes your time without earning extra credit — the point is already earned the moment you name the right specific thing. And writing just a bare fact for an EXPLAIN part loses you the point entirely, even if the fact you named is completely accurate — naming isn't explaining.",
          },
          {
            type: "paragraph",
            text: "You're about to get two separate real SAQ-style parts, graded one at a time — first an identify/describe part, then an explain part — so you can feel the different demand of each, instead of blurring them together.",
          },
        ],
      },
      {
        id: "accounts-p4",
        kind: "lesson",
        title: "Two real Unit 1 topics, rotated",
        body: [
          {
            type: "paragraph",
            text: "First part: the Song Dynasty's civil service examination system — how a bureaucracy actually gets built and staffed. Second part: a comparison between two other major Unit 1 state-building stories, so you're not stuck on one topic the whole module.",
          },
          {
            type: "paragraph",
            text: "Same self-diagnosis heads-up as before: before Scout shows you feedback, you'll get a beat to name your own weakest spot first. Take it if you can.",
          },
        ],
      },
      {
        id: "accounts-identify-check",
        kind: "check",
        title: "First: an identify/describe part",
        intro: "Just accurate, specific information — no reasoning chain required. Name the right thing correctly.",
        skill: { dimension: "ap", id: "use_of_evidence" },
        selfDiagnosis: true,
        prompts: [
          {
            id: "accounts-song-identify",
            stimulus:
              "Historians describe the Song Dynasty (960–1279 CE) as governing through a large, merit-based bureaucracy staffed largely through a competitive civil service examination system based on Confucian texts.",
            stimulusVisual: { kind: "document", label: "SOURCE — ON THE SONG BUREAUCRACY" },
            prompt:
              "Identify ONE specific way the Song Dynasty's civil service examination system strengthened centralized bureaucratic control.",
          },
        ],
      },
      {
        id: "accounts-explain-check",
        kind: "check",
        title: "Now: an explain part",
        intro: "This one wants the full reasoning chain — the actual how or why, not just a fact.",
        skill: { dimension: "ap", id: "comparison" },
        selfDiagnosis: true,
        prompts: [
          {
            id: "accounts-mali-dar-al-islam",
            stimulus:
              "Both the Mali Empire and the wider Dar al-Islam world relied heavily on trans-Saharan and Indian Ocean trade networks to connect distant regions culturally and economically between roughly 1200 and 1450 CE.",
            stimulusVisual: { kind: "document", label: "SOURCE — TRADE NETWORKS, C. 1200–1450" },
            prompt:
              "Explain ONE way the Mali Empire's control of trans-Saharan trade routes shaped its political power differently than trade connections shaped authority elsewhere in the Dar al-Islam world.",
          },
        ],
      },
    ],
  },

  // ── Module 6 — "Give Me Your Verdict" ───────────────────────────────────
  {
    id: "the-verdict",
    order: 5,
    title: "Give Me Your Verdict",
    tagline: "The real thing. Untimed, unlimited revisions, no training wheels.",
    register: "ap",
    pages: [
      {
        id: "verdict-p1",
        kind: "lesson",
        title: "No clean ending — and that's the point",
        body: [
          {
            type: "paragraph",
            text: "Here's the honest truth about Marisol: this never resolves into one clean, provable answer. Devon's story checked out. Priya was hiding something real, but it doesn't actually prove she did anything to Marisol beyond keeping a secret. Jonah and Devon still don't fully agree. Wren's texts add a little more, but you never got to ask Wren anything directly.",
          },
          {
            type: "paragraph",
            text: "Before you move on, take a second — no writing required, just think it through — and land on your own verdict: what do YOU think actually happened, and which piece of evidence matters most to you? This is the last time the story shows up as content. From here on, it's pure warm-up before the real thing.",
          },
        ],
      },
      {
        id: "verdict-p2",
        kind: "lesson",
        title: "The real deal: no training wheels",
        body: [
          {
            type: "paragraph",
            text: "What's coming next is a genuine, full 3-part AP World SAQ — the actual format, the actual rigor, graded on the real rubric. No given context, no stimulus training wheels, no isolated single-move drills. All three parts, back to back, exactly like the real exam.",
          },
          {
            type: "paragraph",
            text: "Untimed, and you can revise as many times as you need to clear it — this is the one place in the whole course where there's no rush. Take the time to actually think through each part before you write.",
          },
        ],
      },
      {
        id: "verdict-p3",
        kind: "lesson",
        title: "One more self-diagnosis, then you're through",
        body: [
          {
            type: "paragraph",
            text: "Same as before: right after you submit, Scout will ask what you think the weakest part of your response is before showing any feedback. This is the last self-diagnosis check in the course — a genuinely good habit to walk away with, exam day and beyond.",
          },
        ],
      },
      {
        id: "verdict-full-saq",
        kind: "full_saq_check",
        title: "Give Me Your Verdict",
        intro: "Three parts, one point each, real rubric. Answer all three — a specific guess beats a blank every time.",
        selfDiagnosis: true,
        prompts: [
          {
            id: "verdict-mali-aztec-comparison",
            stimulus:
              "Use your knowledge of world history to answer all parts of the question below. This one compares state-building strategies in West Africa and Mesoamerica, c. 1200–1450 CE.",
            stimulusVisual: {
              kind: "comparisonChart",
              leftLabel: "Mali Empire",
              rightLabel: "Aztec/Mexica Empire",
              rows: [
                { dimension: "Region", left: "West Africa", right: "Mesoamerica" },
                { dimension: "Time period", left: "c. 1200–1450 CE", right: "c. 1200–1450 CE" },
                { dimension: "Theme", left: "State-building & imperial authority", right: "State-building & imperial authority" },
              ],
            },
            parts: [
              {
                label: "A",
                skill: "use_of_evidence",
                prompt:
                  "Identify ONE specific method the Mali Empire used to legitimize and centralize royal authority.",
              },
              {
                label: "B",
                skill: "causation",
                prompt:
                  "Explain ONE reason the Aztec/Mexica Empire relied on tribute systems from conquered peoples to sustain its imperial economy.",
              },
              {
                label: "C",
                skill: "comparison",
                prompt:
                  "Explain ONE similarity or difference in how the Mali Empire and the Aztec/Mexica Empire maintained control over the peoples they incorporated or conquered.",
              },
            ],
          },
        ],
      },
    ],
  },

  // ── Module 7 (optional) — Timed Capstone ─────────────────────────────────
  {
    id: "capstone",
    order: 6,
    title: "One More, For Real This Time",
    tagline: "Optional. A real clock. Your one shot — the only place a clock appears in this whole course.",
    register: "ap",
    optional: true,
    pages: [
      {
        id: "capstone-p1",
        kind: "lesson",
        title: "Completely optional — here's why it's worth it anyway",
        body: [
          {
            type: "paragraph",
            text: "You already finished the course — that verdict really was the last required stop. This is a bonus round, entirely optional: a second full SAQ, a different pairing of topics, under a real clock.",
          },
          {
            type: "paragraph",
            text: "One attempt, no retries — the closest thing in this whole course to real exam pressure. The timer's here to build the feel of it, not to punish you: if it runs out, nothing locks and nothing auto-submits. Finish whenever you're ready, no penalty either way. Take it if you want the closest possible rep to the real thing.",
          },
        ],
      },
      {
        id: "capstone-full-saq",
        kind: "full_saq_check",
        title: "The Timed Capstone",
        intro: "One attempt. Real clock. Three parts, one point each — go.",
        singleAttempt: true,
        prompts: [
          {
            id: "capstone-song-dar-al-islam",
            stimulus:
              "Use your knowledge of world history to answer all parts of the question below. This one compares state-building in East Asia and the Dar al-Islam world, c. 900–1300 CE.",
            stimulusVisual: {
              kind: "comparisonChart",
              leftLabel: "Song China",
              rightLabel: "Dar al-Islam",
              rows: [
                { dimension: "Region", left: "East Asia", right: "Middle East, North Africa, parts of West/South Asia" },
                { dimension: "Time period", left: "c. 900–1300 CE", right: "c. 900–1300 CE" },
                { dimension: "Theme", left: "State-building & political authority", right: "State-building & political authority" },
              ],
            },
            parts: [
              {
                label: "A",
                skill: "use_of_evidence",
                prompt: "Identify ONE specific policy the Song Dynasty used to recruit officials into its bureaucracy.",
              },
              {
                label: "B",
                skill: "causation",
                prompt:
                  "Explain ONE reason trade networks across the Dar al-Islam world helped spread Islam beyond the Arabian Peninsula.",
              },
              {
                label: "C",
                skill: "comparison",
                prompt:
                  "Explain ONE difference in how political authority was organized in Song China compared to the broader Dar al-Islam world in this period.",
              },
            ],
          },
        ],
      },
    ],
  },
];
