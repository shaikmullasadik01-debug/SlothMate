# SlothMate AI — Slow and Steady

> **“Work less. Relax more. Let AI handle the boring stuff.”**  
> *Built for the Open-Source AI Challenge.*

---

## 1. Vision & Architecture

SlothMate AI is a privacy-first personal productivity agent inspired by the biology of the sloth: **conserve energy, move thoughtfully, and let automation eliminate repetitive cognitive friction.**

Unlike conventional cloud-tethered "AI wrapper" tools, SlothMate AI uses **open-weight models (Qwen 2.5 / Llama 3.2 via Ollama)** as the default engine running directly on the user's personal hardware. It does not send personal notes, sensitive documents, filenames, or images to proprietary hosted APIs.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SLOTHMATE AI CLIENT (PORT 3000)                 │
│                                                                        │
│  ┌──────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │ Morning Briefing     │  │ Smart File Tidy    │  │ To-Do Planner  │  │
│  └──────────────────────┘  └────────────────────┘  └────────────────┘  │
│  ┌──────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │ Fridge-to-List       │  │ Sloth Relax Mode   │  │ Sloth Score    │  │
│  └──────────────────────┘  └────────────────────┘  └────────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Local Loopback IPC
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   LOCAL BACKEND (NODE / EXPRESS)                       │
│  • Strict Path Traversal Boundary Guard                                │
│  • Cryptographic MD5 Content Hash Deduplication                        │
│  • Prompt Injection Control Token Stripping                            │
│  • Deterministic Offline Rule & Extraction Engine                      │
└────────────────────┬───────────────────────────────────┬───────────────┘
                     │                                   │
                     ▼                                   ▼
┌────────────────────────────────────────┐  ┌────────────────────────────┐
│      LOCAL OLLAMA RUNTIME (11434)      │  │    LOCAL PERSISTENCE       │
│  • qwen2.5:1.5b (Default, ~1.2GB RAM)  │  │  • Local SQLite Tables     │
│  • qwen2.5:0.5b (Ultra Low-Resource)   │  │  • Sandboxed Storage       │
│  • Zero Outbound Network Requests      │  │  • Local Audit Trail       │
└────────────────────────────────────────┘  └────────────────────────────┘
```

---

## 2. The 5 Core Capabilities

### A. Lazy Morning Briefing
- Ingests messy meeting notes, chat logs (Slack/Discord), and documents.
- Produces a concise **two-line executive summary**.
- Extracts action items with owners and direct source quotes.
- Extracts scheduled milestones and deadlines with evidence.
- **Strict Epistemic Separation:** Keeps **Verified Facts** strictly separated from **Model Interpretations (Hypotheses)**.
- Full "Review Source" quotation inspector for every extracted item.

### B. Smart File Tidy
- Operates inside an approved sandboxed directory (`slothmate_sandbox`).
- Identifies identical content duplicates using **cryptographic MD5 hashes** (regardless of file renaming).
- Detects confusing filenames (e.g., `final_report_v2_edit_FINAL(2).pdf`, generic `IMG_8492.JPG`, raw OS screenshots).
- Generates a proposed rename and categorizes into folders (`Reports`, `Financials`, `Screenshots`, `Notes`).
- **Deterministic Non-Destructive Guard:** Displays an interactive diff preview. Requires explicit user approval. Never automatically deletes or overwrites existing files; aborts on collision.

### C. Instant To-Do Assistant
- Converts raw unstructured notes into prioritized tasks.
- Assigns priority (`High`, `Medium`, `Low`) with transparent explanations based on external deadlines vs routine cleanup.
- **Anti-Overwhelm Daily Plan:** Caps today's primary focus to the **Top 3 Essential Tasks**.
- Full task lifecycle: complete with celebration, edit, delete, and **Thoughtful Postponement** (+1 day with calm sloth rationale).

### D. Fridge-to-List & Meal Planner
- Analyzes food photo batches or manual text entries.
- Identifies ingredients with **explicit confidence scoring and uncertainty tags** (e.g., *Uncertain: 65%*).
- Pairs pantry ingredients with low-effort 15-minute recipes (Garlic Mushroom Pasta, Mediterranean Bowl, Garden Stir Fry).
- Generates a minimal shopping list distinguishing items in the fridge from missing ingredients to buy.
- **Honest Capability Reporting:** Distinguishes between multimodal vision models (`llama3.2-vision:11b`, `llava:7b`) and text-specialized models (`qwen2.5:1.5b`), providing instant manual text fallback.

### E. Sloth Relax Mode
- Interactive visual **Sloth Pacing Breathing Circle** (4s Inhale → 4s Hold → 6s Exhale → 2s Pause).
- Harmonic Web Audio singing bowl chimes synthesized locally on cycle transitions (0 audio downloads).
- 2-minute micro-pause, 5-minute calm break, and 10-minute deep unwind modes.
- Generates soothing bedtime canopy stories and mindfulness reflections.
- Clear medical disclaimer: intended for focus recovery and mindful pauses, not medical or clinical psychiatric treatment.

---

## 3. Signature Feature: The Sloth Score & "Busywork Busted"

The Sloth Score estimates cognitive energy and time saved through completed automations:
- **File Tidy:** Benchmark 45s manual sorting/renaming per file vs measured local engine time (~1.2s).
- **Morning Briefing:** Benchmark ~12 min reading/formatting raw transcripts vs local engine parsing (~2.5s).
- **Task Prioritization:** Benchmark ~8 min synthesizing messy notes vs local model response (~1.1s).
- **Pantry & Shopping Plan:** Benchmark ~15 min checking fridge and planning vs local automated gap analysis (~1.8s).
- **Formula:** `Net Time Saved = Estimated Manual Minutes - (Actual Computation Seconds / 60)`.
- Displays real accumulated stats from database with a daily **Busywork Busted** tracker.

---

## 4. Setup & Launch Instructions

### Prerequisites
1. **Node.js**: v18+ installed.
2. **Ollama**: (Optional for full GPU/CPU open-weight inference; if not running, SlothMate AI automatically operates via its built-in offline deterministic engine).

### Launching Ollama with Recommended Open-Weight Model
```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Run recommended Qwen 2.5 model (1.2GB RAM footprint)
ollama run qwen2.5:1.5b

# For low-resource devices (Raspberry Pi / 4GB laptops):
ollama run qwen2.5:0.5b

# For multimodal vision tasks:
ollama run llama3.2-vision:11b
```

### Launching SlothMate AI
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# App runs at: http://localhost:3000
```

---

## 5. Security & Privacy Guarantees

| Invariant | Implementation Mechanism | Verified Result |
| :--- | :--- | :--- |
| **Path Traversal Barrier** | Strict canonicalization against `SANDBOX_DIR`; rejection of `..` and absolute root escapes | **PASS** (100% blocked) |
| **Collision Non-Destruction** | Deterministic existence check prevents silent overwrite of destination files | **PASS** (Halts on collision) |
| **Duplicate Detection** | Cryptographic MD5 hash matching on file content buffers | **PASS** (Duplicates grouped) |
| **Zero Remote Telemetry** | No outbound analytics pings, tracking cookies, or cloud LLM calls | **PASS** (100% Local loopback) |
| **Untrusted Input Sanitization** | Control tokens (`<\|im_start\|>`, `<\|im_end\|>`) stripped from user notes | **PASS** (Injection thwarted) |
| **Epistemic Separation** | Typed partitioning between verified facts and model interpretations | **PASS** (Distinct arrays) |

---

## 6. Demonstration Script for Judges (7 Steps)

1. **Step 1: Inspect the Dashboard & Sloth Score**  
   Notice the clean forest-green and warm cream visual language, sloth mascot, and transparent time-saved ledger.
2. **Step 2: Generate Lazy Morning Briefing**  
   Click `Morning Briefing` → Select `Sprint 42 Weekly Catch-Up & Compliance Audit` → Click `Distill Morning Briefing`. Note the 2-line executive summary, verified facts vs model interpretations, and click `Review Source Material` to see original note citations.
3. **Step 3: Extract & Plan Tasks**  
   Click `+ To-Do` next to an extracted action item or go to `To-Do Assistant`. See the **Top 3 Essential Focus** plan designed to prevent overwhelm. Complete a task to trigger confetti and celebrate!
4. **Step 4: Smart File Tidy**  
   Go to `Smart File Tidy` → Click `Scan Sandbox`. Notice the identical content duplicates (`final_report_v2_edit_FINAL(2).pdf` and `final_report_v2_edit_FINAL_copy.pdf`) flagged via MD5. Review proposed standardized names.
5. **Step 5: Approve Safe File Operations**  
   Select files and click `Apply Approved Operations`. Verify deterministic renaming with collision protection.
6. **Step 6: Test Offline Invariant**  
   Click the gear icon in the header → Check `Force Simulated Offline Mode` (or disconnect your network).
7. **Step 7: Run Automated In-App Test Suite**  
   Go to `Local Data & Tests` → Click `Run Automated Test Suite`. Review all 6 security, schema, and offline tests passing with verified millisecond timings.

---

## 7. Open-Source AI Philosophy

Why does open-source AI matter for personal productivity?  
Personal productivity tools process our most intimate daily data: unpublished thoughts, messy meeting transcripts, private finances, home inventory, and personal goals. Handing this data over to closed proprietary cloud providers creates vendor lock-in, recurring subscription costs, and privacy exposure.

By grounding SlothMate AI in **open-weight models (Qwen 2.5) running locally via Ollama**, we restore user sovereignty: **zero subscription fees, complete offline autonomy, zero data leakage, and a mindful pace of living.**
