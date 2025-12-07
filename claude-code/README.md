# Delobotomize Claude Code Configuration

This directory contains Claude Code configuration files, **agents**, **skills**, and hooks for the Delobotomize system.

## Overview

Delobotomize is a **forensic analysis tool** for recovering AI coding sessions that have failed. It analyzes code artifacts—like a crime scene investigator—to diagnose what went wrong.

## Directory Structure

```
claude-code/
├── agents/              # AI agent definitions (natural language)
│   ├── auditor.md       # Forensic code investigator
│   ├── analyst.md       # Evidence correlator & causal chains
│   ├── architect.md     # System design agent
│   ├── fixer.md         # Atomic fix application agent
│   └── iterator.md      # Pattern extraction & learning
├── skills/              # Modular capabilities for agents
│   ├── forensic-analysis.md        # Crime scene investigation protocol
│   ├── file-investigator.md        # Deep line-by-line file analysis
│   ├── llm-fingerprint-detection.md # 25+ LLM failure patterns
│   ├── code-quality-scan.md        # Orphaned code, unused deps
│   ├── project-structure-check.md  # PRD, constitutional, todos
│   ├── adversarial-validation.md   # 8-way multi-persona debate
│   └── file-ops.md                 # Safe file operations
├── commands/            # User-invokable commands
│   └── audit.md         # /audit command spec
├── hooks/               # Event hooks for monitoring
│   ├── session_start.py
│   ├── post_tool_use.py
│   ├── pre_request.py
│   └── post_response.py
└── README.md            # This file
```

## Agents

### Auditor Agent (`agents/auditor.md`)
The **Forensic Code Investigator**. Analyzes projects AFTER AI failure:
- Two-phase investigation (reconnaissance → file-by-file)
- Detects 25+ LLM failure fingerprints
- Infers root cause from code artifacts (no telemetry needed)
- Generates evidence-based diagnosis

### Analyst Agent (`agents/analyst.md`)
The **Evidence Correlator**. Transforms raw findings into actionable diagnosis:
- Cross-file correlation
- Causal chain construction
- Pattern recognition across files
- Priority scoring and issue clustering

### Fixer Agent (`agents/fixer.md`)
The **Atomic Fix Applicator**. Applies fixes with human approval:
- Human-in-the-loop for all changes
- Git checkpoint before each fix
- Automatic rollback on failure
- Test validation after each fix

### Iterator Agent (`agents/iterator.md`)
The **Learning Engine**. Extracts patterns for improvement:
- Identifies novel failure patterns
- Generates agent upgrade proposals
- Creates exportable learnings
- Maintains feedback loop

## Skills

### Forensic Analysis (`skills/forensic-analysis.md`)
Crime scene detective methodology:
- Evidence categories (hallucination, context collapse, etc.)
- File filtering (generated code only, skip node_modules)
- Investigation protocol (6 steps)

### LLM Fingerprint Detection (`skills/llm-fingerprint-detection.md`)
**25+ specific patterns** that indicate LLM failure:
- **Hallucination**: Phantom imports, fictional APIs, wrong signatures
- **Context Collapse**: Undefined vars, orphaned exports, circular deps
- **Model Mismatch**: Any-type explosion, generic names, copy-paste
- **Saturation**: Unused deps, dead code, stale comments
- **Setup Failure**: Missing PRD, no constitutional file

### Adversarial Validation (`skills/adversarial-validation.md`)
Multi-persona debate for stress-testing decisions:
- 8-way council (Skeptic, Pragmatist, Devil's Advocate, etc.)
- 3-round protocol with grounding
- Quick validation option for minor decisions

## Quick Start

### 1. Initialize Project
```bash
delobotomize init
```

### 2. Run Audit Only
```bash
delobotomize audit
```

### 3. Run Full Pipeline
```bash
delobotomize run
```

### 4. View Stack Status
```bash
delobotomize stack status
```

## Environment Variables

```bash
# Monitoring server URL
export DELOBOTOMIZE_SERVER_URL=http://localhost:4000

# Proxy server URL (optional)
export ANTHROPIC_API_BASE_URL=http://localhost:8082

# API key
export ANTHROPIC_API_KEY=your-key-here
```

## Root Cause Inference

The system infers failure causes from code artifacts:

| Evidence Pattern | Inferred Cause | Confidence |
|-----------------|----------------|------------|
| Undefined vars + orphaned exports | **Context Collapse** | 85% |
| Phantom imports + fictional APIs | **AI Hallucination** | 90% |
| Any-type explosion + generic names | **Model Quality Mismatch** | 65% |
| Unused deps + dead code | **Context Saturation** | 75% |
| Missing PRD + no constitutional | **Improper Project Setup** | 90% |

## Credits

- Hook architecture inspired by [multi-agent-workflow](https://github.com/apolopena/multi-agent-workflow) by Apolo Pena
- Forensic methodology developed through adversarial validation
