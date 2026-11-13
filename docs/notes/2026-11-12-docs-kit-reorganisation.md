# Proposal: reorganise `docs/` for docs-kit

_Written 2026-11-12. Status: **proposal, awaiting Sujit's approval.** Nothing has moved._

docs-kit 0.2.0 was set up on `docs/adopt-docs-kit` (commit `bcaed29`). Its layout check
(`npm run docs:check`) fails with 18 findings, because `docs/` predates the layout. This note
is the plan for fixing that, following docs-kit DESIGN §6.3. It is not done until the owner
approves the subjects, the names and the roles below.

## The findings

- **10 files at the docs root** that are not the front door or a govkit tracker.
- **8 subject folders with no `README.md`** (the map each folder needs).

## Subjects

Keep the eight folders that exist today, unrenamed, and add two:

| Subject | Holds | New? |
|---|---|---|
| `architecture` | System design, specs, decision analyses | |
| `audit` | The audit-log system | |
| `guides` | Setup, features, migrations, testing, onboarding, the user manual | |
| `notes` | Dated working notes and proposals, like this one | **new** (added with this note) |
| `operations` | Runbooks for infrastructure and third-party admin work | **new** |
| `reference` | Specs, data files, environment and project reference | |
| `security` | Authentication and access | |
| `status` | Historical point-in-time records (CLAUDE.md rule 9) | |
| `terms` | Terms of use | |
| `troubleshooting` | Fixes for known problems | |

Not renaming any folder is deliberate: `status/` is named in CLAUDE.md, and the historical
docs in `status/`, `terms/` and `reference/` link only to the two root trackers. With the
folders unchanged, no move rewrites a historical file, so CLAUDE.md rule 9 holds.

## Old → new

File names stay as they are; only the folder changes. `SUPABASE-PROJECTS.md` must keep its
name (hazard H1), and the others keep theirs so CLAUDE.md, scripts and habits stay valid.

| Old | New |
|---|---|
| `docs/ACCESS-AND-ROLES.md` | `docs/security/ACCESS-AND-ROLES.md` |
| `docs/ANALYSIS-railway-migration.md` | `docs/architecture/ANALYSIS-railway-migration.md` |
| `docs/ENVIRONMENT_QUICK_REFERENCE.md` | `docs/reference/ENVIRONMENT_QUICK_REFERENCE.md` |
| `docs/HSNEF-Member-Portal-User-Reference-Manual.html` | `docs/guides/HSNEF-Member-Portal-User-Reference-Manual.html` |
| `docs/ONBOARDING.md` | `docs/guides/ONBOARDING.md` |
| `docs/ROLES-GUIDE.md` | `docs/guides/ROLES-GUIDE.md` |
| `docs/RUNBOOK-cloudflare-member-domain.md` | `docs/operations/RUNBOOK-cloudflare-member-domain.md` |
| `docs/RUNBOOK-infra-consolidation.md` | `docs/operations/RUNBOOK-infra-consolidation.md` |
| `docs/RUNBOOK-stripe-webhook.md` | `docs/operations/RUNBOOK-stripe-webhook.md` (slice 3 makes it a how-to) |
| `docs/SUPABASE-PROJECTS.md` | `docs/reference/SUPABASE-PROJECTS.md` |

Every other tracked file under `docs/` stays where it is. `README.md`, `PROJECT-HUB.md` and
`PRIORITY-ROADMAP.md` stay at the root (govkit names the trackers).

## Protected paths

| Path | Reason |
|---|---|
| `docs/architecture/payments.md` | Cited as the spec in immutable migrations 20261112000003, …004 and …006. Already in `docs-kit.json`. |

## Roles

No how-tos exist yet, so `roles` stays empty until slice 3. The proposed readers:

| Role | Who |
|---|---|
| `developer` | Whoever works on the code (onboarding, setup, operations) |
| `admin` | The Admin role, including the temple's Stripe administrator |
| `office-manager` | Office Manager |
| `office-staff` | Office Staff |
| `member` | Members |

These are documentation readers, not the app's `UserRole`: `developer` has no app role, and
"public user" (in the testing guides) is left out until a how-to is written for one.

## Hazards

| # | Hazard | Handling |
|---|---|---|
| H1 | `utils/supabase-refs.test.ts:27` hard-codes `CANONICAL = 'docs/SUPABASE-PROJECTS.md'` and reads it. It also walks `docs/` and passes a doc that names the production ref only if the doc says production or contains the string `SUPABASE-PROJECTS.md`. | Update the constant in the same slice as the move. Keep the file name. |
| H2 | Migrations cite `docs/architecture/payments.md`. | Protected; it does not move. |
| H3 | CLAUDE.md names `docs/SUPABASE-PROJECTS.md`, `docs/status/**` and `docs/PROJECT-HUB.md`. | `move` rewrites links; check the dry run and fix any prose path it misses by hand. `status/` and the trackers do not move. |
| H4 | `docs/status/**` is historical and not to be edited. | No folder renames, so no move touches it. Confirm in each dry run. |
| H5 | `scripts/source-doc-map.json` names 6 doc paths. | Registered as a doc map; none of the 6 moves. |
| H6 | Paths named outside `docs/`: `.env.local.example`, `scripts/db-sql.mjs`, `scripts/list-access.mjs`, `supabase/auth-config.ts`, `README.md`, code comments citing `payments.md`. | `move` rewrites them; each slice runs the tests and the check. |
| H7 | `.gitignore:137` and `README.md:484` use `docs/reference/data/`. | That folder does not move. |
| H8 | The HTML manual is named nowhere. | Moves freely. |
| H9 | No generator writes into `docs/`, and no code builds a doc path in pieces. | None. |

## Slices (one pull request each, `--base dev`)

0. **Setup and this proposal** (`docs/adopt-docs-kit`): `docs-kit.json`, the `docs:check`
   script, the devDependency, this note, `notes` as a subject and its README.
1. **Maps:** a short `README.md` in each subject folder that lacks one (8, plus `operations`).
2. **Moves:** the 10 files above with `docs-kit move`, the H1 constant, the front door
   (`docs/README.md`) updated. The check passes here. **Close:** `docs-kit init --test
   lib/docs-layout.test.ts`, and a DEC entry in `docs/PROJECT-HUB.md`.
3. **First how-tos (optional):** `RUNBOOK-stripe-webhook.md` →
   `operations/howto/HOWTO-set-up-stripe-webhook.md` and `ONBOARDING.md` →
   `guides/howto/HOWTO-onboard-a-developer.md`, with `roles:` and `last_checked`, `roles` in
   `docs-kit.json`, and `docs-kit index`. CLAUDE.md and the front door call ONBOARDING the
   starting point, so its new name needs your yes on its own.

Each slice: `docs-kit move <old> <new> --dry-run`, then `move`, then `npm test`,
`npm run build` and `npm run docs:check`; stage everything `git status` lists.

## Decisions needed

1. The two new subjects, `notes` and `operations`.
2. The old → new table, keeping file names.
3. The roles list.
4. Whether to do slice 3, and whether ONBOARDING becomes a how-to.
