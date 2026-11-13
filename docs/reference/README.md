# Reference

Source material: the original specification, data files, and records of how things were
built. Much of it is historical; each doc's banner says so.

| Doc | What it is |
|---|---|
| [`SUPABASE-PROJECTS.md`](SUPABASE-PROJECTS.md) | **Current, canonical.** Which Supabase project is which. Read before touching a database. |
| [`ENVIRONMENT_QUICK_REFERENCE.md`](ENVIRONMENT_QUICK_REFERENCE.md) | Which value goes where, per environment. |
| [`hsnef-membership-portal-final-prompt-v3.md`](hsnef-membership-portal-final-prompt-v3.md) | The specification the project started from. Much of it has changed since. |
| [`test-data-filtering.md`](test-data-filtering.md) | Historical: how test-data filtering was built. |
| [`test-accounts-setup-complete.md`](test-accounts-setup-complete.md) | Historical: a completion record. |

## Data — `data/`

| File | What it is |
|---|---|
| [`member-details-to-be-captured.csv`](data/member-details-to-be-captured.csv) | The member fields the portal captures. |
| [`nakshatra-list.csv`](data/nakshatra-list.csv) | Nakshatras. |
| [`purohits.csv`](data/purohits.csv) | Purohits (priests). |
| [`services.csv`](data/services.csv) | Temple services. |

The member import templates (`current-member-data-import-template*.csv`) also live in
`data/`, but git ignores them.
