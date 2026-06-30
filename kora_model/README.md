# KORA Model Training Pipeline

KORA is Sinon Learning's pedagogical understanding engine. Given lesson content and/or a student response, KORA returns structured JSON that makes student understanding visible to the teacher. It is **not a tutor**, it does **not replace the teacher**, and it does not give answers to students.

This folder contains the first runnable version of KORA: a self-contained Python pipeline that synthesizes structured training data, fine-tunes a small open-source LLM with LoRA/QLoRA, and evaluates the result.

## What this is

- A local ML training pipeline for the `kora-lora` adapter
- Produces a LoRA adapter that a future, separate inference API can load
- Runs entirely on your own compute (GPU machine) — no external LLM API calls

## What this is not

- Not the Sinon Learning website (no Next.js, no React, no Railway)
- Not a chatbot or student-facing tutor
- Not a production inference endpoint (that will be built separately)
- Not dependent on OpenAI, Gemini, Claude, or any paid API

---

## Folder layout

```
kora_model/
  README.md              # this file
  requirements.txt       # Python dependencies
  train_kora.py          # main pipeline (5 subcommands)
  test_kora.py           # interactive local test script
  data/
    seed_concepts.json   # written by `bootstrap` (committed)
    kora_train.jsonl     # written by `synthesize` (committed)
    kora_eval.jsonl      # written by `synthesize` (committed)
  outputs/
    .gitkeep
    kora-lora/           # written by `train` (gitignored)
```

---

## Run sequence

### 1. Set up the environment

```bash
cd kora_model
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

> **Note:** `bitsandbytes` is Linux/CUDA-only. On a CPU-only machine, the
> `bootstrap`, `synthesize`, and `validate` subcommands will still work —
> only `train` and `eval` require a GPU.

### 2. Bootstrap seed concepts

```bash
python train_kora.py bootstrap
```

Writes 6 hardcoded seed concepts (Opportunity Cost, Inflation, Supply and
Demand, Separation of Powers, Silk Roads, Photosynthesis) to
`data/seed_concepts.json`. Safe to re-run (idempotent overwrite).

### 3. Synthesize training data

```bash
python train_kora.py synthesize
```

Generates synthetic KORA training examples from the seed concepts using
template-based string interpolation — no external API calls. Writes:

- `data/kora_train.jsonl` — ≥300 training examples
- `data/kora_eval.jsonl`  — ≥50 held-out evaluation examples (no overlap)

The train/eval split is deterministic (SHA-256 hash of a stable per-example
key) and fully reproducible.

### 4. Validate the data

```bash
python train_kora.py validate
```

Checks every JSONL row: correct chat schema, valid-JSON assistant content,
required fields present, enum values in range. Prints a pass/fail report.
Expect 100% pass rate on freshly synthesized data.

### 5. Fine-tune (requires a GPU)

```bash
python train_kora.py train
```

Loads `BASE_MODEL` with 4-bit QLoRA, applies LoRA, and fine-tunes on the
synthesized training data using `trl.SFTTrainer`. On a CPU-only machine
this exits cleanly with a message pointing you to a GPU provider.

Also saves after training:
- `outputs/kora-lora/` — LoRA adapter weights
- `outputs/kora-lora/tokenizer*` — tokenizer files
- `outputs/kora-lora/training_config.json`
- `outputs/kora-lora/MODEL_CARD.md`
- `outputs/kora-lora/eval_results.json` — post-training eval metrics

### 6. Evaluate (requires a GPU)

```bash
python train_kora.py eval
```

Loads the base model plus the trained adapter and runs every held-out
example: valid-JSON rate, schema-pass rate, and ordinal-distance metrics
for evidence-dimension predictions.

### 7. Test interactively (requires a GPU)

```bash
python test_kora.py
```

Interactive prompt: choose a KORA task type, enter concept/content/student
response, and see the structured JSON the adapter returns.

---

## Where to actually train

Railway hosts the Sinon Learning website and (eventually) the inference
API, but **cannot run GPU training**. Run `train` on:

| Provider | Notes |
|---|---|
| Google Colab | Free T4; Colab Pro gives A100 access |
| RunPod | Rent by the hour; good for overnight runs |
| Lambda Labs | Competitive on-demand GPU pricing |
| Modal | Serverless GPU; good for short jobs |

Rough estimate: fine-tuning `Qwen2.5-1.5B-Instruct` on ~450 examples for
3 epochs takes 20–40 minutes on a T4.

---

## Environment variables for `train` / `eval`

| Variable | Default | Description |
|---|---|---|
| `BASE_MODEL` | `Qwen/Qwen2.5-1.5B-Instruct` | HuggingFace model ID |
| `OUTPUT_DIR` | `kora_model/outputs/kora-lora` | Where to save the adapter |
| `EPOCHS` | `3` | Training epochs |
| `LEARNING_RATE` | `2e-4` | LoRA learning rate |
| `BATCH_SIZE` | `2` | Per-device batch size |
| `GRAD_ACCUM` | `8` | Gradient accumulation steps |
| `MAX_SEQ_LENGTH` | `2048` | Max tokens per example |

Override any of these before running:

```bash
BASE_MODEL=meta-llama/Llama-3.2-1B-Instruct python train_kora.py train
```

---

## What comes after

The trained `kora-lora` adapter is the deliverable of this pipeline.

A future, separate inference API will:
1. Load the base model + `kora-lora` adapter
2. Expose endpoints the Sinon Learning website calls
3. Be hosted separately from the training code (e.g. on Railway or a
   dedicated GPU API service)

That inference API is not built here. This folder is purely training.

---

## No-GPU troubleshooting

```
[KORA] Training requires a CUDA GPU.
  This machine has no CUDA GPU available.
  ...
```

This is expected on a CPU-only machine (local dev, Railway, GitHub Actions).
Only `train` and `eval` require a GPU. `bootstrap`, `synthesize`, and
`validate` run fine anywhere.
