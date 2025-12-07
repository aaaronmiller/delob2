# Delobotomize: Authoritative Project Truth

> **This is the canonical source of truth for the Delobotomize project.**  
> If context is lost, start here. All other documentation references this file.

---

## 1. Project Identity

**Delobotomize** is a forensic analysis tool for recovering AI coding sessions that have failed. It operates AFTER failure occurs—like a crime scene investigator examining code artifacts to diagnose what went wrong.

### Core Insight
> "We will never have telemetry data. The tool is deployed POST-FAILURE. The code itself is the only evidence."

### Not a Monitoring Tool
Delobotomize is NOT a real-time monitor. It's an autopsy tool. The proxy and hooks exist for optional telemetry capture, but the core value is code-based forensic analysis.

---

## 2. Architecture: Context-Injected Orchestration (CIO) Pattern

### The Pattern
A headless agentic architecture where:
- **Capability** (static): Predefined environment (`CLAUDE.md` + `.claude/` folder)
- **Intent** (dynamic): Runtime prompt via `claude -p "..."`

### Separation of Concerns

| Layer | Location | Purpose |
|-------|----------|---------|
| **Identity** | `CLAUDE.md` (project root) | Who the agent IS, boundaries, constraints |
| **Actions** | `.claude/commands/*.md` | WHAT the agent can DO, execution logic |
| **Skills** | `.claude/skills/*.md` | HOW to perform specific tasks |
| **Agents** | `.claude/agents/*.md` | Reference personas for sub-tasks |

### Execution Model
```bash
# Headless invocation with YOLO mode
claude -p "/orchestrate" --dangerously-skip-permissions --output-format stream-json
```

> **⚠️ SECURITY WARNING**: The `--dangerously-skip-permissions` flag allows the agent to edit files and execute commands without user confirmation. Only run this on projects you trust, or inside a sandboxed environment.

### Operational Split: CLI vs Agent
Delobotomize operates in two distinct modes:

| Mode | Tool | Purpose | Characteristics |
|------|------|---------|-----------------|
| **Scaffolding** | `delobotomize` | Setup & Basic Audit | Fast, deterministic, hardcoded logic. Use for init and monitoring. |
| **Intelligence** | `claude` | Deep Forensics | Slower, reasoning-based, uses Agent/Skill definitions. Use for deep investigation. |

The orchestrator "wakes up" inside the `.claude` context, adopts the persona from `CLAUDE.md`, and executes the command specified in the prompt.

---

## 3. Directory Structure

### Source Template (`claude-code/`)
```
claude-code/                    # Template copied to target projects
├── CLAUDE.md                   # Identity definition
├── README.md                   # Usage documentation
├── settings.json.template      # Runtime config template
├── agents/                     # Sub-agent personas
│   ├── auditor.md              # Forensic investigator
│   ├── analyst.md              # Evidence correlator
│   ├── architect.md            # System designer
│   ├── fixer.md                # Atomic fix applier
│   └── iterator.md             # Pattern extractor
├── commands/                   # Executable commands
│   ├── orchestrate.md          # Full pipeline
│   └── audit.md                # Single-phase audit
├── skills/                     # Modular capabilities
│   ├── forensic-analysis.md    # Investigation protocol
│   ├── file-investigator.md    # Line-by-line analysis
│   ├── llm-fingerprint-detection.md  # 25+ patterns
│   ├── code-quality-scan.md    # Code health checks
│   ├── project-structure-check.md    # Setup validation
│   ├── adversarial-validation.md     # Multi-persona debate
│   └── file-ops.md             # Safe file operations
└── hooks/                      # Event hooks (optional)
    ├── session_start.py
    ├── post_tool_use.py
    └── ...
```

### Runtime Deployment
When deployed to a target project:
```
target-project/
├── CLAUDE.md                   # Copied from template
└── .claude/                    # Created by delobotomize init
    ├── commands/
    ├── skills/
    ├── hooks/
    └── settings.json
```

### Output Directory
```
.delobotomize/
├── runs/
│   └── run-{timestamp}/
│       ├── audit/
│       ├── analysis/
│       ├── recovery/
│       ├── fix/
│       └── iterate/
├── proxy.log                   # If proxy enabled
└── delobotomize.db             # SQLite for metrics
```

---

## 4. Forensic Methodology

### Philosophy
> "The code never lies. Every undefined variable, every orphaned export, every hallucinated import tells a story."

### Two-Phase Investigation

**Phase 1: Reconnaissance**
- Survey project structure
- Identify framework/stack
- Define scope (include src/, exclude node_modules/)
- Check for PRD, constitutional files

**Phase 2: Deep Investigation**
- File-by-file analysis
- Apply LLM fingerprint detection
- Track cross-file references (imports/exports)
- Build evidence chain

### LLM Failure Fingerprints (25+ patterns)

| Category | Fingerprints | Confidence |
|----------|-------------|------------|
| **Hallucination** | Phantom imports, fictional APIs, wrong signatures | 90% |
| **Context Collapse** | Undefined vars, orphaned exports, circular deps | 85% |
| **Model Mismatch** | Any-type explosion, generic names, copy-paste | 65% |
| **Saturation** | Unused deps, dead code, stale comments | 75% |
| **Setup Failure** | Missing PRD, no constitutional, no tests | 90% |

### Root Cause Inference Rules
```
IF undefined_vars > 5 OR orphaned_exports > 3:
  → "Context Collapse" (85%)

IF phantom_imports > 0 OR hallucinated_apis > 0:
  → "AI Hallucination" (90%)

IF any_types > 50 OR generic_names > 20:
  → "Model Quality Mismatch" (65%)

IF missing_prd AND missing_constitutional:
  → "Improper Project Setup" (90%)
```

---

## 5. Pipeline Phases

| Phase | Purpose | Output |
|-------|---------|--------|
| **Audit** | Survey project, collect evidence | `forensic-report.md`, `evidence-chain.json` |
| **Analysis** | Correlate findings, infer root cause | `ANALYSIS.md`, `WORKFILE.json`, `DIFFS.txt` |
| **Recovery** | Generate fix plan | `recovery-plan.md` |
| **Fix** | Apply approved fixes atomically | `fix-report.md`, `changes.patch` |
| **Iterate** | Extract patterns for improvement | `iterate-notes.md`, `proposals/` |

---

## 6. Key Technical Decisions

### Why TypeScript + Bun
- TypeScript for type safety
- Bun for fast builds and native SQLite support
- Single binary distribution goal

### Why Custom Proxy/Monitor
- Not vendoring external dependencies
- Custom-built for specific telemetry format
- Proxy logs in TSV format (tab-delimited)

### Why Markdown Agents
- Natural language is the interface
- Claude Code natively reads `.claude/` folder
- Skills are modular and composable

### File Filtering Logic
```
INCLUDE: src/, lib/, app/, components/, pages/, api/
EXCLUDE: node_modules/, venv/, dist/, build/, .git/, *.min.js
```

---

## 7. Adversarial Validation

### 8-Way Council
| Persona | Challenge Focus |
|---------|-----------------|
| Skeptic | "What evidence supports this?" |
| Optimist | "What opportunities are we missing?" |
| Pragmatist | "Can we actually build this?" |
| Security Analyst | "What could go wrong?" |
| UX Designer | "Is this intuitive?" |
| Devil's Advocate | "What's the strongest counter-argument?" |
| Domain Expert | "Does this match industry standards?" |
| End User | "Would I actually use this?" |

### 3-Round Protocol
1. **Initial Positions**: Independent assessment
2. **Challenges**: Cross-persona debate
3. **Resolution**: Synthesize consensus, document dissent

---

## 8. Environment Variables

```bash
# Core
ANTHROPIC_API_KEY=...          # API key
ANTHROPIC_BASE_URL=...         # OpenRouter: https://openrouter.ai/api/v1
ANTHROPIC_MODEL=...            # Model name

# Monitoring (optional)
DELOBOTOMIZE_SERVER_URL=http://localhost:4000
PROXY_PORT=8082
PROXY_LOG_PATH=.delobotomize/proxy.log
```

---

## 9. CLI Commands

```bash
delobotomize init              # Initialize project
delobotomize audit             # Run audit phase only
delobotomize run               # Run full 5-phase pipeline
delobotomize stack start       # Start proxy + monitor
delobotomize stack stop        # Stop services
delobotomize stack status      # Check service status
```

---

## 10. Bootstrap Instructions

To restore this project from scratch:

1. **Clone repository**
2. **Install dependencies**: `bun install`
3. **Build**: `bun run build`
4. **Read this file** for architectural understanding
5. **Check `claude-code/`** for agent definitions
6. **Deploy to Test Project**:
   ```bash
   cd test-datakiln
   # CRITICAL: Must run from project root for skills to load
   delobotomize run
   # OR for deep intelligence:
   claude -p "/orchestrate"
   ```

---

## 11. Troubleshooting

### Claude Code Not Finding Agents
```
Symptom: Agent skills not loading
Fix: Ensure .claude/ folder exists with correct structure
Check: ls -la .claude/skills/
```

### Audit Shows Only "Large Files"
```
Symptom: No forensic findings, only venv file size warnings
Cause: TypeScript phases use hardcoded logic, not agent definitions
Fix: Run via Claude Code headless: claude -p "/orchestrate"
```

### Fix Phase Blocked by Uncommitted Changes
```
Symptom: "Git repository has uncommitted changes"
Cause: Safety check - won't modify dirty repo
Fix: git add -A && git commit -m "checkpoint before delobotomize"
```

### OpenRouter Connection
```
Symptom: API errors with free models
Fix: 
  export ANTHROPIC_BASE_URL="https://openrouter.ai/api/v1"
  export ANTHROPIC_API_KEY="sk-or-..."
  export ANTHROPIC_MODEL="alibaba/qwen-2.5-72b-instruct:free"
```

### Context Overflow During Investigation
```
Symptom: Agent stops mid-analysis
Cause: Too many files in scope
Fix: Add large directories to .claudeignore
```

---

## 12. Known Limitations

- **No telemetry for past sessions**: Designed for code-based forensics
- **TypeScript phases don't invoke agents**: Phases use hardcoded logic; agents are for Claude Code headless execution
- **Gitignore blocks some files**: Cannot read files in .gitignore

---

## 12. Future Work

- [x] Port forensic patterns to TypeScript phases
- [x] Create GitHub issue template for pattern submissions
- [ ] Add more LLM fingerprint patterns
- [ ] Build dashboard visualization for forensic reports

---

*Last updated: 2025-12-07*  
*Version: 15.0*
