# Strategic Courier Management System (SCMS)

Production-oriented monorepo baseline for the SCMS PRD v1.2.

## What is implemented

- Monorepo architecture with separate management UI, courier PWA shell, dispatch logic packages, and worker process.
- Fully configurable dispatch logic that reads runtime config (no hardcoded routing values in engine decisions).
- Operation modes (`integrated`, `standalone`, `simulation`) supported in core domain types and dispatch context.
- Design system tokens in McKinsey-style information hierarchy with Just Eat color accents.
- Type-safe validation for orders/couriers/config updates using Zod.
- Deterministic scoring package with unit tests.
- Integration retry queue package with backoff and dead-letter handling.
- Runtime APIs for dispatch decisions, config versioning/rollback, simulation runs, operation mode switching, support queue, and AI advisor responses.

## Repository layout

`apps/management` - Internal management platform (Next.js)
`apps/courier` - Courier-first mobile PWA shell (Next.js)
`packages/shared` - Shared domain models, schemas, constants
`packages/scoring` - Pure configurable scoring engine
`packages/dispatch` - Dispatch decision engine and orchestration
`packages/integration` - 10bis outbound queue + resilience logic
`workers/dispatch-worker` - Long-running worker process
`infra/supabase` - SQL schema and RLS policy baseline

## Quick start

1. Install dependencies:
   - `npm install`
2. Build:
   - `npm run build`
3. Run apps:
   - Management: `npm run dev:management`
   - Courier: `npm run dev:courier`
   - Worker: `npm run dev:worker`

## Notes

- This baseline focuses on production architecture and core flows for Phase 1.
- Includes Phase 2/3 scaffolding for simulation, advisor flows, config history/rollback, and support escalation APIs.
- For full live operation, wire production credentials and external services listed in `UAT_REPORT.md`.
- Security-critical constraints from PRD are reflected in schema and SQL (append-only audit log, role-scoped access).
