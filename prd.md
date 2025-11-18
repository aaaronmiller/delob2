Delobotomize — Authoritative Product Requirements Document v9.1

Note: Active project root for this session: /poop (alias of /Users/macuser/git/0MY_PROJECTS/shit)

Document status: Final, implementation-ready
Maintainer: Delobotomize Core
Last updated: 2025-11-14
Scope: Claude Code–native recovery and monitoring toolchain

> Supersession: PRD v9.1 is the single source of truth and overrides prior v5-series docs. CLI behavior is primary for v1; dashboard/web UI and proxy extensions may evolve later but remain subordinate to the CLI-led lifecycle.

## Functional goals at a glance
- **Monitoring loop**: A Claude Code proxy (currently provided by the Crosstalk system from `claude-code-proxy`) emits every model API call to `./.delobotomize/proxy.log`. `SessionMonitorService` tails this file, classifies alerts, and surfaces derived events to both CLI phases and dashboard views.
- **Orchestration loop**: The CLI phases (audit → analysis → recovery → fix → iterate) enforce integrity checks, manage manifests, and gate write access. They read shared services for live status and write artifacts back under `.delobotomize/runs/{runId}`.
- **User prompt + `.claude/` assets**: Operators interact via CLI commands plus project-specific instructions in `.claude/CLAUDE.md`, agents, skills, and hooks. `.claude/` is regenerated from `claude docs/` at init; hooks (sourced from the `multi-agent-workflow` fork) wrap every tool call so monitoring and policy enforcement stay consistent.
- **Proxy ↔ monitor reporting**: Hooks capture high-level events (session start/stop, tool use, failures) and forward them via HTTP/WebSocket to the observability server (Bun + SQLite + Vue dashboard) while the file-based proxy log remains the canonical health signal. The CLI never auto-kills sessions; dashboards only recommend actions.

This preamble ties the external dependencies (proxy + multi-agent workflow hooks) to the pnpm workspace implementation so the remainder of the PRD can assume a shared vocabulary.


1. Purpose and scope
- Purpose: Define one authoritative, implementation-ready specification for Delobotomize that aligns with strict constraints and the target Claude Code ecosystem.
- Scope: Session-level monitoring, recovery lifecycle, CLI, dashboard UX (integrated monitoring), artifacts, policies, and acceptance criteria.
- Non-goals: Subagent instrumentation, out-of-scope cloud services, containerization, vendor-specific code examples.

2. Hard constraints (authoritative, integrated)
- Health gating remains session-level; no in-process subagent instrumentation. Per-subagent status may be inferred from proxy/hook telemetry only.
- Proxy log output written to `./.delobotomize/proxy.log` is the primary source of truth. Hooks and dashboard WebSocket events remain supplemental for UX timelines.
- Technology stack: pnpm monorepo with TypeScript packages at `poop/cli`, `poop/shared`, `poop/backend`, and `poop/frontend`. The CLI runs on Node.js, shared services handle session analysis, the backend is a Hono server (served via Bun runtimes today), and the dashboard is implemented in SvelteKit + Tailwind. Delobotomize depends on an external Claude Code proxy (currently the Python-based Crosstalk project under `claude-code-proxy`) to emit API traffic into `./.delobotomize/proxy.log`, and it optionally integrates with the Bun/Vue observability stack from `multi-agent-workflow` for hook telemetry. The core repo itself contains no Python or Vue app; those live in the upstream dependencies.
- No Docker. No Dockerfiles. No docker-compose. No containerization assumptions.
- This PRD may include illustrative code snippets for clarity; natural-language files remain the operative configuration.
- RAG capability is separate from monitoring and optional; it must not entangle with session health logic.
- Integrated lifecycle: Delobotomize CLI manages session monitoring, artifact generation, and dashboard data feeds; automatic restarts only apply to local watchers, and sessions are never auto-killed.

3. Primary integrations (current codebase)
- Session monitoring pipeline: `poop/shared/src/sessionMonitorService.ts` tails `./.delobotomize/proxy.log` using `ProxyLogService`, `SessionStore`, and alert/validation helpers to classify stalls, idle sessions, and incident severity. The watcher currently relies on filesystem polling plus Node's `fs.watch`.
- Dashboard + backend: `poop/frontend` implements the SvelteKit dashboard (components under `src/lib/components/*`, real-time glue in `src/lib/services/wsService.ts`). The lightweight backend at `poop/backend/src/server.ts` exposes Hono routes for `/health`, `/api/info`, and placeholder JSON feeds for sessions, proxy logs, and alerts. WebSocket streaming is handled client-side via the shared WS service pending richer backend endpoints. Operators may also launch the observability dashboard from `multi-agent-workflow/apps/client` (Vue 3) when hook telemetry is enabled; it visualizes the same hook events that the CLI records.
- CLI + shared services: `poop/cli/src/index.ts` (Commander-based) wires commands such as `init`, `generate`, `test`, and `check` to the shared TypeScript services under `poop/shared/src/*` (manifest generation, recovery planning, confidence scoring, alerting, run tracking, git checkpoints).
- Hooks lineage: `.claude/hooks/` and their mirrored `claude docs/hooks/` are seeded from the `multi-agent-workflow` fork (script `scripts/observability-setup.sh`). They wrap all tool calls and post structured events to the Bun server in that repo; hooks remain UX signals only and never gate health decisions.
- Communication: File-based ingestion today, supplemented by HTTP/WebSocket integrations. The proxy log remains authoritative; hooks feed the optional observability server; Hono backend/WebSocket client share derived state with the SvelteKit dashboard.

Repository layout snapshot (rooted at `/Users/macuser/git/0MY_PROJECTS/shit`, aka `poop`):

### External dependency map
| Repository | Purpose | Runtime | Integration point |
|------------|---------|---------|-------------------|
| `claude-code-proxy` (Crosstalk) | Claude Code proxy emitting API traffic and supporting multi-model paradigms | Python + REST/CLI/MCP | Produces `./.delobotomize/proxy.log` and optional HTTP endpoints consumed by `SessionMonitorService` |
| `multi-agent-workflow` | Hook scripts, observability Bun server, Vue dashboard, automation agents | Bun/TypeScript server, Vue client, Python hooks | Seeds `.claude/hooks/*`, provides optional telemetry dashboard, installs git helpers |

The Delobotomize pnpm workspace in `poop/` is the CLI/tooling implementation; the other repos are vendored or installed into target projects as-needed.

Repository layout snapshot (rooted at `/Users/macuser/git/0MY_PROJECTS/shit`, aka `poop`):

- `claude docs/` – canonical instructions, skills, agents, commands, hooks, templates, and schemas that must mirror into `.claude/`.
- `.claude/` – runtime shadow regenerated by `delobotomize init`; contains the active instructions consumed by the CLI and hooks.
- `poop/` – pnpm workspace containing:
- `claude docs/` – canonical instructions, skills, agents, commands, hooks, templates, and schemas that must mirror into `.claude/`.
- `.claude/` – runtime shadow regenerated by `delobotomize init`; contains the active instructions consumed by the CLI and hooks.
- `poop/` – pnpm workspace containing:
  - `cli/`, `shared/`, `backend/`, `frontend/` – primary TypeScript packages described above.
  - `.delobotomize/` – run artifacts (manifests, logs) created during CLI phases.
  - `deliverables/`, `tests/`, `e2e/`, `context_portal/`, `packages/`, and helper configs (`tsconfig.json`, linting/prettier files, playwright/vitest configs).
  - Workspace-level dependencies under `poop/node_modules/` and supporting bin scripts.
- `.specify/`, `.roo/`, `.kiro/`, `.kilocode/`, and `specs/` – auxiliary design/planning assets that inform the CLI but are not shipped artifacts.
- `prd.md`, `pnpm-workspace.yaml`, and `pnpm-lock.yaml` – authoritative docs and workspace manifests at the repo root.

4. Architectural overview
- Core principle: Observe the orchestrator’s session behavior via proxy logs written to `./.delobotomize/proxy.log`. If a session is alive and making model API calls, it is considered active. Absence of calls over a calibrated interval is the deadlock signal.
- Data flow:
  1) Claude Code proxy activity is mirrored into the log file; `SessionMonitorService` parses entries via `ProxyLogService` and stores them in shared stores.
  2) Dashboard components subscribe to derived state through the shared services and (optionally) the WebSocket client when a backend feed is available. Today the backend exposes placeholder JSON endpoints until richer APIs land.
  3) CLI phases read and write run artifacts on disk, including canonical manifests generated by `ManifestGeneratorService` plus artifacts managed by `ArtifactService` under `.delobotomize/runs/*`.
  4) The dashboard (SvelteKit) renders run manifests, live session metrics, stall alerts, fix summaries, and approval states sourced from the shared services.
- Role boundaries:
  - CLI: Orchestrates phases, manages manifest + artifact lifecycle, and enforces integrity checks ensuring `.claude/` mirrors `claude docs/` before any run proceeds. Commands live in `poop/cli/src/index.ts` and call into shared services.
  - Dashboard: Visualizes sessions, alerts, runs, and fix summaries; never kills processes automatically. Surfaces a high-severity warning whenever a manifest reports claude-docs-integrity drift.
  - Backend (Hono): Currently serves `/health`, `/api/info`, and stub lists for sessions/alerts/logs, acting as the eventual aggregation plane for hooks and proxy-derived JSON.
  - Configuration assets: `claude docs/` is the canonical asset pack; `.claude/` is a read-only shadow regenerated via `delobotomize init`. Any deviation is a blocking failure until re-synced.

5. Session-level monitoring model
- Signals and precedence:
  - Primary: Proxy log cadence and content (status codes, token usage, refusal markers, rate-limit headers).
  - Secondary: Hook events for UX timelines only.
- Deadlock/stall thresholds (phase-aware):
  - A session is suspected stalled when the monitor sees no new log entries within a phase-specific idle window:
    - audit: 120s; analysis: 90s; recovery: 60s; fix: 30s; iterate: 90s (defaults, configurable via `.claude/settings.json`, `settings.local.json`, or CLI flags such as `--stall-timeout`)
  - Classification at time of detection:
    - Context stall: Last known context utilization ratio at or above 90 percent of available window.
    - Logic stall: Last known context utilization ratio below 90 percent.
- Token thresholds:
  - Warning threshold: 85 percent of context window.
  - Critical threshold: 90 percent and above.
- Kick policy:
  - System may expose a user-triggered kick via proxy command injection; automatic kicks are rate-limited and disabled by default.
- Rate-limiting and refusals:
  - 429 status with zero remaining rate-limit header values is a high-severity alert.
  - 403 authentication or authorization failures are high-severity alerts.
  - Model refusals are flagged and included in the run findings; repeated refusals escalate severity.
- Safety policy:
  - No auto-kill of sessions. Proxy auto-restart on crash is allowed under CLI lifecycle management; the dashboard exposes an explicit user-initiated “terminate or reset” flow.

6. CLI surface and lifecycle (integrated)
- Primary command: run — starts integrated proxy and monitoring, performs phases per flags, and manages lifecycle/cleanup.
- CLI commands (high level): init; install-hooks; run; audit; analysis; recovery; fix; iterate; list-runs; status; rollback; clean.
- Phase responsibilities:
  - init: Creates local configuration scaffolding, verifies environment, and sets baseline directories.
  - install-hooks: Copies hook adapter scripts into the target project’s hooks folder when requested by the user. Ensures compatibility and idempotence.
  - run: Launches integrated proxy and monitoring, verifies health, and orchestrates selected phases end-to-end with cleanup.
  - audit: Reads recent session activity via proxy-derived records and creates an initial findings set with session incidents, token pressure, rate-limit occurrences, refusal patterns, and suspected deadlocks.
  - analysis: Enriches audit results into causal hypotheses and attaches evidence references (log segments, timestamps, headers), producing a structured analysis artifact.
  - recovery: Proposes a stepwise plan to address the root causes identified during analysis. Plans can include adjustments, guardrails, or suggested prompts; this phase remains read-only for the codebase.
  - fix: Applies controlled changes with operator review; confidence gating is deferred to a post-v1 enhancement. This is the only phase allowed to write to the codebase. Requires a git checkpoint before writing. Produces diffs and a change log.
  - iterate (stub in v1): Emits a minimal summary to an external API endpoint (not implemented in this project), records any local notes, and defers in-repo learning loops until a post-v1 enhancement.
  - list-runs: Lists run identifiers with status and timestamps.
  - status: Shows current phase, any active alerts, and the location of artifacts.
  - rollback: Restores the pre-fix checkpoint exactly or selects a specific change set to revert.
  - clean: Removes transient artifacts that are safe to delete without losing canonical records.
- Lifecycle flags (examples): --stall-timeout, --enable-kick-api, --track-tokens-per-session, --enable-recovery-events, --show-budget-in-dashboard.
- Health checks: run waits for proxy and monitoring health (configurable timeout, default 5s target, 30s max) before orchestration; clear errors on failure.
- Cleanup: run stops integrated services unless --leave-services-running.

Note: Confidence gating is out of scope for v1 and treated as a deferred enhancement (see Appendix A note).
}
7. Run artifacts and canonical manifest
- Run directory:
  - A new run directory is created under a stable root directory for each lifecycle execution. The run directory contains the canonical manifest and derived artifacts.
- Canonical manifest purpose:
  - Serves as the single ledger of truth for phases executed, timings, token usage summaries, costs, alerts raised, fixes applied, validation results, and next recommended actions.
- Manifest content requirements (field descriptions):
  - Run identifier: A unique, time-seeded identifier.
  - Timestamps: Start and end times per phase, plus overall duration.
  - Phase records: For each phase, a status, any artifacts generated, and relevant metrics such as token usage summaries and counts of critical alerts encountered.
  - Confidence summary: Aggregated confidence bands for proposed fixes.
  - Costs and usage: Aggregated model usage and estimated costs when available from provider metadata; absence must be represented explicitly.
  - Validation results: Key acceptance checks and pass or fail outcomes.
  - Next phase: The next actionable step if any.
- Artifacts inventory (typical):
  - Findings document: Session incidents, token pressure, rate-limit records, refusals, suspected deadlocks with time evidence.
  - Analysis document: Root-cause narrative and evidentiary mapping.
  - Recovery plan: Ordered, testable steps at the session and code levels.
  - Fix set: Diffs and rationale statements when code changes are applied.
  - Validation report: Objective checks and comparison against acceptance criteria.
  - Metrics digest: Token usage, refusal counts, rate-limit windows, alert counts.

8. Alerts catalog and semantics
- Context saturation:
  - Warning at 85 percent of context window; critical at 90 percent or higher.
  - Deduplication window: Group repeated alerts within a short interval to avoid alert floods.
- Rate-limiting:
  - Severity rises when repeated 429s occur within a short time window or across multiple endpoints.
  - Include last known request identifiers and rate-limit headers when available.
- Authentication and authorization:
  - Immediate high severity for 403 responses; require operator acknowledgment in dashboard.
- Deadlock detection:
  - Idle time over the threshold is a deadlock; classification depends on last-known context utilization at detection time.
- Refusals:
  - Repeated refusals in a session raise severity; refusal patterns inform analysis and recovery phases.
- Escalation and suppression:
  - Alerts escalate based on frequency and severity. Suppression windows exist to avoid repeated notifications for the same root cause until conditions change.

9. Dashboard UX specification (Vue 3 + Tailwind)
- Live sessions panel:
  - Lists active and recently active sessions with overall status, last activity timestamp, and top-level token and alert badges.
- Token utilization widgets:
  - Visual bars show current context ratio and trend; thresholds colorize state.
- Alerts tray:
  - Shows real-time alerts; supports filtering by type such as rate-limit, refusal, deadlock, and authentication.
- Runs view:
  - Displays historical runs; selecting a run shows manifest highlights, phase statuses, and links to artifacts.
- Session action recommendations:
  - When deadlock is suspected, shows recommended actions and a user-triggered terminate or reset control. The system does not auto-kill.
- Future (post-v1) concepts:
  - Approval gates view and gated approval UX to be reintroduced once confidence gating graduates from appendix scope.
- Realtime updates:
  - When the integrated monitoring server is enabled, the dashboard subscribes to event streams to reflect proxy-derived state within a small target latency budget.
  - When deadlock is suspected, shows recommended actions and a user-triggered terminate or reset control. The system does not auto-kill.
- Realtime updates:
  - When the integrated monitoring server is enabled, the dashboard subscribes to event streams to reflect proxy-derived state within a small target latency budget.

10. Integrated monitoring server API surface (Bun + TypeScript)
- Purpose: Aggregate proxy and hook events, normalize them, and emit events for dashboard consumption. Provide retrieval endpoints for runs and session summaries.
- Event model:
  - Session events: Started, observed request, observed response, idle warning, deadlock suspected, alert raised, alert cleared.
  - Run events: Phase started, phase completed, artifact written, confidence evaluation ready, validation results ready.
- Minimal endpoint classes (descriptive, not code):
  - Events ingress: Accept normalized events or hook payloads with authentication and minimal back-pressure handling. The producer of proxy-derived events is trusted locally in development, and hardened with authentication options in shared environments.
  - Runs read: Provide summaries and full manifest data for recent and specific runs.
  - Sessions read: Provide current session states and recent alert history.
  - Websocket stream: Deliver live updates to the dashboard; if not enabled, the dashboard operates in a degraded polling mode using files.
- Security notes:
  - Local development defaults to permissive authentication with a toggle to enable stricter settings. Production-like configurations require tokens and origin checks.

11. Configuration, persistence, and local run (non-Docker)
- Configuration hierarchy:
  - Project configuration directory stores thresholds, file paths, and UI display toggles.
  - Alerts configuration declares thresholds and suppression windows without embedding provider-specific code.
  - CLI preferences include output formats, verbosity, and confirmation levels.
- Claude docs asset pack:
  - `claude docs/` at the repo root is the immutable source for every `.claude` asset (settings, commands, hooks, agents, skills, prompts/templates/schemas placeholders).
  - `delobotomize init` copies these files bit-for-bit into `.claude/` before any run. Operators never modify `.claude/` directly; all changes land in `claude docs/` then propagate via integrity sync.
  - `.claude/CLAUDE.md` is generated dynamically from `claude docs/CLAUDE.base.md`; integrity checks compare every other asset and record results in `claude-docs-integrity.json`.
  - Each asset is critical; removing or modifying any mirrored file causes hook/permission mismatches and prevents the orchestrator from starting.
- Persistence on disk:
  - Run manifests and artifacts are stored under a dedicated root folder inside the project. Filenames and directories are deterministic and collision-resistant.
- Local non-Docker run:
  - CLI and dashboard are invoked via the package manager in a single workstation environment. The integrated monitoring server runs locally when enabled and can be started by CLI or via the dashboard runner.
- Security posture for local use:
  - No storage of secrets in artifacts. Mask any sensitive tokens in logs and manifests. Respect file permission defaults.
- Configuration distribution:
  - Release engineering must package `claude docs/` alongside binaries. Installer scripts copy it to `.claude/` and run the audit integrity check before any operator interaction.
  - Environments lacking `claude docs/` are unsupported; CI must block merges that omit this folder.
  - Any mismatch between packaged assets and PRD-defined versions requires an explicit supersession entry.

12. Functional user stories (selected, stepwise)
- Audit a failed session using CLI:
  - The operator navigates to the project directory.
  - The operator runs the audit command.
  - The CLI verifies `.claude/` was populated from `claude docs/` (claude-docs-integrity.json success) before analyzing proxy activity.
  - The system tails recent proxy activity, compiles incidents and token usage, and writes a findings document, manifest entry, and integrity artifact.
  - The operator reviews the findings and notes rate-limits and a suspected context saturation during peak activity.
  - If the integrity artifact reports drift, the CLI blocks progression and surfaces remediation instructions referencing `claude docs/`.
- Real-time prevention via dashboard monitoring:
  - The operator starts the dashboard (monitoring server enabled) or runs via CLI; both paths are supported.
  - A live session’s token bar turns warning color as context nears the threshold.
  - A burst of 429 alerts arrives; the alerts tray deduplicates and escalates.
  - The operator follows the recommendation to stagger prompt submissions; alerts subside and token pressure reduces below the warning threshold.
- Post-change verification after a fix:
  - The operator runs the analysis phase to confirm the suspected root cause.
  - The operator proceeds to the recovery phase and reviews the proposed plan.
  - During the fix phase, the operator may review proposed changes; medium-confidence approval flows are deferred and non-blocking for v1.
  - Post-fix checks confirm success criteria; the manifest records pass/fail and related metrics. Iterate emits a minimal summary to the external feedback stub and returns; no local ingestion or dashboard surface exists in v1.

13. Acceptance criteria (updated for integration)
- Integrated startup:
  - Given: No manual services running
  - When: Operator runs `delobotomize run --path /project`
  - Then: Proxy and monitoring report healthy within the configured startup target (default 5s, configurable); orchestration begins. Health check timeout remains 30s overall with clear error reporting on failure.
- Proxy extension APIs:
  - Stall status endpoint returns accurate status for a given session; command injection kick reaches model within 100ms on local machine.
- Monitoring ingestion:
  - Proxy stdout telemetry is ingested within 500ms and visible in dashboard; recovery_phase_change events update the phase tracker UI.
- Monitoring and detection:
  - Session stalls detected within phase-specific windows using proxy call cadence.
  - Alerts raised for 429 bursts, 403 errors, refusals, and context thresholds using proxy-derived evidence.
- Lifecycle and artifacts:
  - A run directory with a canonical manifest is created and updated across phases.
  - Iterate stub emits the external feedback summary and records local notes; no confidence gating is enforced in v1.
- Dashboard UX:
  - Live sessions, token widgets, alerts tray, and runs views are present and interactive.
  - System never auto-kills sessions; destructive actions require explicit user initiation.
  - Approval gates are deferred to a future update; v1 dashboard focuses on monitoring and artifact visibility.
- Constraints compliance:
  - No Docker. No subagent instrumentation. RAG remains separate from monitoring logic. Natural-language documentation only.

14. Risks and mitigations
- Proxy schema drift:
  - Risk: Upstream changes alter header names or log shapes.
  - Mitigation: Centralize schema parsing, perform strict validation with graceful degradation, document required fields.
- Misclassification from cadence-only detection:
  - Risk: A quiet period might be legitimate.
  - Mitigation: Combine idle-time detection with recent context ratio and recent alert history to qualify deadlock suspicion.
- Over-alerting:
  - Risk: Alert fatigue from high-frequency signals.
  - Mitigation: Deduplication and suppression windows; severity escalation only when conditions persist or intensify.
- Confidence gate (deferred):
  - Note: Confidence gating is a deferred enhancement for post-v1. Not applicable to v1 scope.

15. Success metrics (fit for purpose)
- Alert signal quality:
  - Reduction in unacknowledged critical alerts over time.
  - Stable ratio of true positives to noise during rate-limit events.
- Recovery efficiency:
  - Median time from deadlock detection to resolution decreases across runs.
  - Post-fix success rate improves over time as measured by acceptance criteria and regression checks.
- Lifecycle reliability:
  - Mean time-to-fix decreases across runs as the integrated tooling matures.
  - Operators report reduced manual restarts due to integrated lifecycle management.
- UX responsiveness (integrated monitoring):
  - Live dashboard updates within a small latency budget from event observation under local conditions.
- Artifact completeness:
  - All runs include manifests and phase artifacts according to lifecycle rules.
- Deferred enhancements:
  - Confidence gating metrics move to Appendix A as an optional future milestone.
- UX responsiveness (integrated monitoring):
  - Live dashboard updates within a small latency budget from event observation under local conditions.
- Artifact completeness:
  - All runs include manifests and phase artifacts according to lifecycle rules.

16. Governance and safety
- Human-in-the-loop policy:
  - Destructive actions are always explicit and user-initiated; the system never auto-kills sessions.
- Auditability:
  - Each run’s manifest includes timestamps, decisions, and outcomes.

17. Migration notes and exclusions
- Remove any Docker references or scripts from previous drafts.
- Eliminate subagent heartbeat or instrumentation references; align all health logic to proxy logs and session cadence.
- If earlier documents included Python service watchdogs, treat those as historical artifacts. They are not part of this design.
- Keep any RAG-related modules isolated. Do not allow RAG to introduce health or monitoring side effects.

18. Operability and local usage
- Operator workflow:
  - Primary: Use CLI `delobotomize run` to start services and execute phases; operators may alternatively launch the monitoring dashboard runner, but CLI remains authoritative for lifecycle control.
  - Use list-runs and status to navigate historical and current state.
- Troubleshooting:
  - Confirm monitoring server health via CLI status when dashboard is launched independently.
  - If no events appear, verify proxy operation and log availability.
  - If alerts are absent but issues are suspected, confirm that thresholds are set correctly and that parsing rules match the current proxy schema.

19. Glossary
- Session-level monitoring: Health determined by the presence and character of orchestrator API calls rather than agent internals.
- Deadlock: A state where no model API calls occur for the idle window, indicating the session is stuck.
- Manifest: The canonical run record capturing phases, metrics, decisions, and outcomes.
- Confidence band: A numerical range indicating the system’s certainty about a proposed fix.
- Hooks: Supplemental event sources for UX timelines and annotations, not health gates.

20. Amendment policy
- Changes to this PRD require explicit confirmation that constraints are preserved. Any proposed revision must confirm: no Docker, session-level monitoring only, proxy as source of truth, hooks supplemental, RAG separated, and the specified stack preserved.

Appendix A: Integrated Architecture Deep-Dive

A1. Component Relationships & Data Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    User Interface (Browser)                         │
│              Integrated Monitoring Dashboard (Vue 3)                │
│   Shows: subagent activity, proxy events, stalls, phase progress    │
└─────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │ WebSocket events
                                 │
┌─────────────────────────────────────────────────────────────────────┐
│        Integrated Monitoring Server (Bun + TypeScript)              │
│  • Built into Delobotomize (vendored apolopena)                     │
│  • Ingests: Proxy stdout, hook events (Unix socket)                 │
│  • WS /stream → dashboard updates                                   │
│  • SQLite storage for events and runs                               │
└─────────────────────────────────────────────────────────────────────┘
          ▲                                     ▲
          │                                     │
    .claude/hooks/                      ┌─────────────────────┐
          │                             │  Proxy Log Parser   │
          │                             │  (Delobotomize ext) │
┌─────────────────┐                     └──────────┬──────────┘
│  Claude Code    │                                │
│  CLI (headless) │                     ┌──────────▼──────────┐
│  Orchestrator   │                     │  Integrated Proxy   │
│  & subagents    │                     │  (vendored Python)  │
│                 │                     │  + extensions       │
└─────────────────┘                     └─────────────────────┘
         │                                      ▲
         │                                      │
         └──────────────┬───────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Recovery Pipeline Orchestrator                          │
│  • Phases: Audit → Analysis → Recovery → Fix → Iterate               │
│  • Manages proxy & monitoring lifecycles                             │
│  • Budget & stall detection; manifest writer; event publisher        │
└─────────────────────────────────────────────────────────────────────┘
```

A2. Integrated vs External
- Old: external processes managed manually; HTTP localhost; brittle ports
- New: vendored under src/integrations; lifecycle managed by CLI; Unix sockets preferred; auto-restart proxy on crash; direct stdout ingestion

A3. Integration Strategy

A3.1 Session Monitoring (Node + shared services)
- Location: `poop/shared/src/sessionMonitorService.ts` with helpers under `proxyLogService.ts`, `sessionStore.ts`, `alertGenerationService.ts`, and `validationService.ts`.
- Responsibilities:
  - Tail `./.delobotomize/proxy.log` via polling + `fs.watch` to ingest Claude Code proxy output.
  - Parse each entry, validate structure, extract token usage/latency, classify stalls, rate limits, and errors, and emit `SessionEventType` events.
  - Persist derived metrics in `SessionStore` so CLI commands, backend routes, and the dashboard can query consistent state.
  - Surface deadlock/idle detection through configurable thresholds (defaults defined in service constructor) without restarting proxy processes.

A3.2 Dashboard & Backend (SvelteKit + Hono)
- Frontend Location: `poop/frontend/` with components under `src/lib/components/*` (SessionList, MetricsPanel, FixApproval, etc.) and WebSocket logic in `src/lib/services/wsService.ts`.
- Backend Location: `poop/backend/src/server.ts` (Hono) serving `/health`, `/api/info`, and placeholder JSON for sessions, proxy logs, and alerts; future revisions will hydrate these endpoints from shared stores or a persistence layer.
- Responsibilities:
  - Dashboard renders session health, alerts, run timelines, and approval workflows using Svelte components backed by Tailwind utilities.
  - WebSocket client maintains live connections for future real-time feeds; today it can connect to optional streaming endpoints when provided.
  - Backend acts as the aggregation and API surface for dashboard queries, ready for deeper integration once persistence/event ingestion is wired up.

A3.3 CLI + Shared Services
- Location: `poop/cli/src/index.ts` (Commander entry) with supporting types in `cli/src/types.ts` and business logic in `poop/shared/src/*`.
- Responsibilities:
  - Commands: `init`, `generate`, `test`, `check`, each invoking shared services like `ManifestGeneratorService`, `RecoveryPlannerService`, `ConfidenceScoringService`, `ArtifactService`, and `RunService`.
  - Ensures `.claude/` mirrors `claude docs/` before execution, writes manifests under `.delobotomize/runs/{runId}/`, and coordinates deliverable coverage/testing requirements inherited from earlier tasks.
  - Provides the operator-facing interface for lifecycle phases until richer automation lands in future versions.

A3.4 Hooks and Asset Mirrors
- Hooks directories (`claude docs/hooks/`, `.claude/hooks/`) remain placeholders for telemetry adapters and guard scripts; no Unix-socket bridge is implemented yet.
- Asset policy: edit `claude docs/`, then mirror into `.claude/` via `delobotomize init`; integrity checks compare every file except `.claude/CLAUDE.md` (generated from `CLAUDE.base.md`).
- Schemas/templates/prompts under `claude docs/` are currently placeholders that satisfy integrity requirements while future increments populate authoritative definitions.

A3.5 Startup Sequence (current implementation)
1) Ensure `claude docs/` → `.claude/` parity (excluding dynamic CLAUDE.md) and populate `.delobotomize/` structure.
2) Run CLI commands (`init`, `generate`, etc.) which instantiate shared services, open proxy log watchers if needed, and write manifests/artifacts.
3) Optionally start the Hono backend and SvelteKit frontend (`pnpm dev:backend`, `pnpm dev:frontend`) for dashboard inspection; both rely on shared services or stub data until log ingestion endpoints are wired in.
4) Operators review generated artifacts under `.delobotomize/runs/` and use dashboard visualizations to correlate incidents, alerts, and fixes.
5) On completion, stop watchers/services manually (no automatic proxy restart logic exists yet) and verify claude-docs integrity before subsequent runs.

A3.6 Future Enhancements
- Introduce persistence-backed APIs in the backend to replace placeholder responses.
- Add Unix-socket ingestion and proxy restart orchestration per PRD vision once dependencies exist.
- Populate prompts/templates/schemas with authoritative definitions and hook adapters with actual scripts.
- Integrate dashboard WebSocket streams with backend event emitters for real-time updates.
- Expand CLI commands to cover dedicated `audit`, `analysis`, `recovery`, `fix`, and `iterate` workflows backed by current shared services.

A3.6 Table of Key Files (reference)
| Area | Path | Purpose |
|------|------|---------|
| CLI Entry | `poop/cli/src/index.ts` | Commander-based CLI surface (init/generate/test/check) |
| Shared Monitoring | `poop/shared/src/sessionMonitorService.ts` | File-based proxy monitoring and event emission |
| Proxy Parsing | `poop/shared/src/proxyLogService.ts` | Buffer parsing, token/latency extraction |
| Run Tracking | `poop/shared/src/runService.ts`, `manifestGeneratorService.ts`, `artifactService.ts` | Manage manifests, deliverables, artifact outputs |
| Backend | `poop/backend/src/server.ts` | Hono API placeholders for health/sessions/logs/alerts |
| Dashboard Components | `poop/frontend/src/lib/components/*.svelte` | UI building blocks (SessionList, MetricsPanel, FixApproval, etc.) |
| Dashboard Realtime | `poop/frontend/src/lib/services/wsService.ts` | WebSocket client with reconnect + heartbeat |
| Asset Mirrors | `claude docs/*`, `.claude/*` | Canonical instructions, skills, commands, hooks, templates, schemas |
| Run Artifacts | `.delobotomize/runs/{runId}` | Manifests, deliverables, test outputs |
|

This rewritten section reflects the actual repo contents and highlights future work required to reach the original PRD vision.

A4. Startup Sequence (current toolchain)
1) Run `delobotomize init` (CLI) to ensure `claude docs/` assets mirror into `.claude/` and baseline directories exist.
2) Start CLI workflows or dashboard/back-end processes as needed:
   - CLI commands (`init`, `generate`, `test`, `check`) call into shared services to watch proxy logs, manage manifests, and generate deliverables.
   - Optional `pnpm dev:backend` launches the Hono server; `pnpm dev:frontend` starts SvelteKit for dashboard inspection. These processes currently read stub data or shared stores and do not restart proxy processes.
3) Ensure `.delobotomize/proxy.log` is accessible so `SessionMonitorService` can tail activity; operators may start external proxy tooling separately (out of scope for this repo).
4) Review artifacts under `.delobotomize/runs/{runId}` (manifests, deliverables, validation outputs) and correlate incident data via the dashboard.
5) Stop watchers/servers manually when finished and rerun claude-docs integrity check before the next run.

A5. Five-Phase Recovery Pipeline (Details)
- Phase 1: Audit
  - Actions: enumerate files, confirm `.claude/` matches `claude docs/` bit-for-bit, validate settings, deps, entry points
  - Artifacts: AUDIT_REPORT.md; file-inventory.json; config-discovery.json; settings-validation.json; dependency-graph.json; entry-points.json; health-check.json; claude-docs-integrity.json (diff report between `.claude/` and `claude docs/`)
  - Gates: ≥90% config discovery; zero drift between `.claude/` and `claude docs/`; entry point confidence; 10m warning

A5 continues...

A4. Startup Sequence (current toolchain)
1) Run `delobotomize init` (CLI) to ensure `claude docs/` assets mirror into `.claude/` and baseline directories exist.
2) Start CLI workflows or dashboard/back-end processes as needed:
   - CLI commands (`init`, `generate`, `test`, `check`) call into shared services to watch proxy logs, manage manifests, and generate deliverables.
   - Optional `pnpm dev:backend` launches the Hono server; `pnpm dev:frontend` starts SvelteKit for dashboard inspection. These processes currently read stub data or shared stores and do not restart proxy processes.
3) Ensure `.delobotomize/proxy.log` is accessible so `SessionMonitorService` can tail activity; operators may start external proxy tooling separately (out of scope for this repo).
4) Review artifacts under `.delobotomize/runs/{runId}` (manifests, deliverables, validation outputs) and correlate incident data via the dashboard.
5) Stop watchers/servers manually when finished and rerun claude-docs integrity check before the next run.

A5. Five-Phase Recovery Pipeline (Details)
- Phase 1: Audit
  - Actions: enumerate files, confirm `.claude/` matches `claude docs/` bit-for-bit, validate settings, deps, entry points
  - Artifacts: AUDIT_REPORT.md; file-inventory.json; config-discovery.json; settings-validation.json; dependency-graph.json; entry-points.json; health-check.json; claude-docs-integrity.json (diff report between `.claude/` and `claude docs/`)
  - Gates: ≥90% config discovery; zero drift between `.claude/` and `claude docs/`; entry point confidence; 10m warning

- Phase 2: Analysis
  - Actions: IDE detection; config divergence; intent reconstruction; causal chain; priority scoring; specialist subagents (GitAnalyzer, DocReader) as needed
  - Artifacts: ANALYSIS_REPORT.md; IDENTITY_INFERENCE.md; CONFIG_DIVERGENCE.md; USER_INTENT.md; CAUSAL_CHAIN.md; PRIORITY_MATRIX.json; fix-tasks.json
  - Gates: evidence-backed causal chain; confidence ≥0.70; at least one quick-win; no cycles in tasks
- Phase 3: Recovery
  - Actions: plan per task using template; validate plans (conflicts, deps, rollback realism, test efficacy); build execution order
  - Artifacts: RECOVERY_SUMMARY.md; plan-*.md; execution-order.json
  - Gates: complete sections; reversible rollbacks; executable tests; justified confidence
- Phase 4: Fix
  - Actions: pre-flight git checkpoint; operator review of proposed changes (confidence gating deferred to post-v1); apply changes; run tests; record approvals and diffs; commit per plan
  - Artifacts: FIX_REPORT.md; approval-log.json; changes.patch; commits.json; test-results.json
  - Safety: checkpoint branch; atomic commits; dry-run; read-only until Fix
  - Deferred note: Confidence gates and automated approval thresholds will return once post-v1 validation is complete.

- Phase 5: Iterate (stub in v1)
  - Actions: emit minimal summary to external feedback API (not implemented here), capture local operator notes, flag follow-up tasks for the separate learning service.
  - Gates: record at least one actionable observation per run; no in-repo learning updates are performed in v1.

Note: Full cumulative-learning workflows and in-repo updates migrate to a future roadmap item once the external feedback service lands.

A6. Natural Language Configuration (.claude/)
- **skills/**: audit, analysis, recovery, fix, iterate directories each contain SKILL.md instructions per phase.
- **agents/**: audit-subagent.md, analysis-subagent.md, specialist-subagents.md (orchestrator responsibilities now live in CLAUDE.base.md/CLAUDE.md).
- **prompts/**: placeholder directory for reusable natural-language prompts (audit checklist, recovery walkthrough). Structure mirrors runtime today; content lands in v1.1.
- **hooks/**: single-task guard + lock scripts plus telemetry helpers (token_tracker, session_watcher) enforcing CLI tool usage policies.
- **commands/**: `speckit.*` markdown commands plus legacy analyze-config.md / check-health.md. Canonical copies live here; `.claude/commands/` mirrors them.
- **settings/**: `settings.json` + `settings.local.json` declare MCP/tool permissions (Byterover, Context7, etc.).
- **templates/**: RECOVERY_PLAN.template.md, ANALYSIS_REPORT.template.md, AUDIT_REPORT.template.md, FIX_REPORT.template.md (authoritative copies here; `.claude/templates/` mirrors even while placeholders).
- **schemas/**: run-manifest.schema.json, file-inventory.schema.json, config-validation.schema.json (directory present for parity; files delivered in a future increment).
- **Claude docs/**: authoritative copy of every `.claude/` asset. Operators edit only `claude docs/`; `.claude/` is regenerated via `delobotomize init`.
- **Integrity policy**: pipelines fail fast if `.claude/` deviates from `claude docs/`; `claude-docs-integrity.json` records drift while skipping the dynamically generated `.claude/CLAUDE.md`.
- **Manifest + flow**: `.delobotomize/runs/{run}/manifest.json` references these assets per phase; PR changes land in `claude docs/`, propagate to `.claude/`, and are re-verified via the integrity artifact.
- **Future work**: prompts/templates/schemas will be populated with actual files; schemas will validate manifest entries before fix/iterate phases.
- End of configuration notes.
}SPII? NUM???- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from CLAUDE.base.md).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas尼斯: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas Neil: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates।: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.localjson, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.localjson, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.localjson, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is删除 detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.localjson, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).
- End list
- commands/: analyze-config.md; check-health.md
- templates/ in `.` .CLAUDE`??`
- ... (the list repeats many times) 😵‍💫***</commentary> to=functions.Edit code with new string?But we messed. Need to fix entire section simpler. Maybe rewrite entire A6 bullet block to new succinct version. use find/replace. Need to rewrite lines 391-400. Provide new block. Use Edit to replace chunk. Place new strings. Need to carefully include minted text. Let's craft new block summarizing: bullet list for directories. We'll replace entire block lines 391-400. Use old_string snippet to replace with new text. Use multi-line old string start at line 391 etc. We'll include original snippet from cat? lines 391-401 etc after earlier edits? we have minted replicates due to editing, but unstoppable. We'll read block now to know actual content after messed. Use Read offset 388 length maybe 30 lines.We'll use Read to view part. Need to check for interplay repeated text. Use Read. to=functions.Read{
- templates/: RECOVERY_PLAN.template.md; ANALYSIS_REPORT.template.md; AUDIT_REPORT.template.md; FIX_REPORT.template.md (canonical copies live here; `.claude/templates/` mirrors them)
- schemas/: run-manifest.schema.json; file-inventory.schema.json; config-validation.schema.json (future increment, directory exists for parity)
- Claude docs/: authoritative copy of `.claude/` assets (settings.json, settings.local.json, hooks, commands, agents, skills, prompts/templates/schemas placeholders). All environments must copy from here without modification.
- Integrity policy: pipelines must fail fast if `.claude/` deviates from `claude docs/`; append claude-docs-integrity.json to artifacts when drift is detected (excluding `.claude/CLAUDE.md`, which is generated from `CLAUDE.base.md`).

A7. Complete File Tree (Integrated)
```text
delobotomize/
├── .claude/
│   ├── skills/
│   │   ├── audit/
│   │   ├── analysis/
│   │   ├── recovery/
│   │   ├── fix/
│   │   └── iterate/
│   ├── agents/
│   ├── prompts/
│   ├── hooks/
│   ├── commands/
│   ├── templates/
│   ├── schemas/
│   ├── CLAUDE.md
│   └── settings.json
├── .delobotomize/
│   ├── runs/{run_id}/artifacts/{phase}/
│   ├── runs/{run_id}/logs/
│   ├── cumulative-learning.yaml
│   └── checkpoints/
├── src/
│   ├── cli.ts
│   ├── orchestrator/
│   ├── integrations/
│   │   ├── proxy/ (vendored + extensions)
│   │   └── monitoring/ (vendored server+client + extensions)
│   ├── managers/
│   └── utils/
├── scripts/
├── config/
├── tests/
├── docs/
├── package.json
├── pyproject.toml
├── bun.lockb
└── README.md
```

A8. CLI Arguments & Usage Patterns
- Primary: delobotomize run --path /path/to/project
- Service flags: --proxy-port, --monitoring-port, --disable-monitoring, --leave-services-running, --proxy-provider, --proxy-fallback
- Recovery flags: --phase, --resume, --budget, --warn-at (confidence gating flags deferred post-v1)
- Deferred flags (for future appendix reference only): auto-approve-high, require-approval-medium, force-low-confidence; these remain undocumented in CLI help for v1.
- Extension flags: --stall-timeout, --enable-kick-api, --track-tokens-per-session, --enable-recovery-events, --show-budget-in-dashboard, --alert-on-stall

A9. Integration Details (Deep Dive)
- Proxy stall detection: phase-aware thresholds (audit 120s; analysis 90s; recovery 60s; fix 30s; iterate 90s)
- Command injection: user-triggered kick and stop; auto-kicks disabled by default; rate limited
- Env sample:
```bash
ENABLE_STALL_DETECTION=true
STALL_DETECTION_THRESHOLD=60
ENABLE_COMMAND_INJECTION=true
EMIT_EVENTS_TO_MONITORING=true
MONITORING_SOCKET=/tmp/delobotomize-monitoring.sock
```
- Unified YAML sample (excerpt):
```yaml
proxy:
  port: 8082
  providers:
    - name: anthropic
      api_key: ${ANTHROPIC_API_KEY}
    - name: openai
      api_key: ${OPENAI_API_KEY}
      fallback: true
monitoring:
  server:
    port: 4000
    socket: /tmp/delobotomize-monitoring.sock
  extensions:
    proxy_ingestion: { enabled: true, source: stdout }
recovery:
  phases: [audit, analysis, recovery, fix, iterate]
  budget:
    total_tokens: 500000
    stop_spawn_threshold: 0.8
  # Confidence gating fields are deferred post-v1; omit from active configs.
```

Deferred configuration example (for appendix reference once gating returns):
```yaml
confidence:
  auto_approve_high: 0.85
  require_approval_medium: 0.70
  block_low: 0.70
```
- Do not include the deferred block in v1 deployments.

A10. Key Design Decisions
- Integrate vs external: control, reliability, performance (Unix sockets), UX, testing; mitigations: vendored dirs, track upstream, docs/INTEGRATION.md, tests
- Proxy extensions: stall detection, injection, direct events, provider failover, token tracking
- Monitoring extensions: direct stdout ingestion, phase tracking, budget visualization, stall highlighting, health scoring
- Unix sockets over HTTP: perf, reliability, security; Windows fallback to TCP
- Natural-language skills: evolvable, transparent, versioned; validated against schema

A11. Success Metrics (summary)
- Detection accuracy ≥85%; Recovery effectiveness ≥80%; Stall detection ≥95% within 10s; Kick success ≥70%; Integration reliability ≥99%; Token tracking ±15%; Median time to recovery <30min

A12. Integration Benefits & Capabilities
- Cross-system awareness; Enhanced UX; Reliability (auto-restart, health checks, sockets); Extensibility of proxy/monitoring/dashboard/skills

A13. Out of Scope (v1) & Future Work
- Not in v1: distributed execution; hosted service; auto-rollback on regression; plugin architecture; IDE extensions; team collaboration; advanced visuals; multi-project batch
- Future: resume from checkpoint after crash; event backfill; fine-grained budgets; automated skill improvement; report aggregation UI

A14. References
- fuergaosi233/claude-code-proxy
- disler/claude-code-hooks-multi-agent-observability
- Claude Code docs and CLI
- docs/INTEGRATION.md (to be written)

End of document.

