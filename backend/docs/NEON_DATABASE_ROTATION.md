# Neon Database Rotation

Bloomify rotates its production Neon project on the 17th of each month before
the current Free-plan compute allowance is typically exhausted. The workflow is
implemented in `.github/workflows/neon-database-rotation.yml` and runs at
02:00 UTC.

## What the workflow does

1. Finds the newest rotation project with a completed database marker, falling
   back to `NEON_ACTIVE_PROJECT_ID` for the initial migration.
2. Creates or reuses a target project for the current UTC month through the
   Vercel Marketplace Neon integration.
3. Confirms that both databases are reachable.
4. Pauses the Vercel project so orders cannot be written during the copy.
5. Copies PostgreSQL schema and data with version-compatible `pg_dump` and
   `pg_restore` containers.
6. Compares the number of public tables, updates Vercel's production
   `DATABASE_URL`, and creates a production deployment.
7. Resumes Vercel, checks a database-backed production endpoint, and writes a
   completed marker into the target database.

If a step fails after the switch, the script restores the previous
`DATABASE_URL`, rolls Vercel back to the previous production deployment, and
resumes the project. It deliberately keeps old Neon projects as recoverable
rollback points.

The database marker is the source-of-truth pointer. A repeated run in the same
month reuses and safely overwrites that month's target from the previous
completed source. A target becomes eligible as next month's source only after
deployment and the production health check succeed.

## Required GitHub configuration

Add these repository secrets:

| Secret | Purpose |
| --- | --- |
| `NEON_API_KEY` | Organization Neon API key used to read projects and connection URIs |
| `VERCEL_TOKEN` | Vercel token allowed to edit env vars, pause, and deploy the project |

Add these repository variables:

| Variable | Required | Value |
| --- | --- | --- |
| `NEON_ACTIVE_PROJECT_ID` | yes | Current production Neon project ID used as the initial fallback |
| `VERCEL_ORG_ID` | yes | `orgId` from `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | yes | `projectId` from `.vercel/project.json` |
| `VERCEL_NEON_INSTALLATION_ID` | yes | Marketplace Neon installation ID (`icfg_*`) |
| `VERCEL_NEON_REGION` | no | Marketplace region; defaults to `iad1` |
| `NEON_ORG_ID` | yes | Neon organization ID used to discover provisioned projects |
| `NEON_DATABASE_NAME` | no | Defaults to `neondb` |
| `NEON_ROLE_NAME` | no | Defaults to `neondb_owner` |
| `ROTATION_PROJECT_PREFIX` | no | Defaults to `bloomify-prod-rotation-` |
| `ROTATION_HEALTHCHECK_URL` | no | Defaults to the production product-filters endpoint |

Do not put connection strings or API tokens in repository variables or source
files. The script retrieves connection strings from Neon and passes them to
Vercel without printing them.

## First run

Run **Neon Database Rotation** manually from GitHub Actions after configuring
the secrets and variables. Watch the job through the production health check.
The scheduled job will then run on the 17th of each month.

The source database must still be reachable. If Neon has already suspended it
for exhausted compute quota, wait for the allowance reset or temporarily move
the project to a paid plan before the first data-preserving rotation.

## Rollback and retention

The workflow never deletes old Neon projects. After at least one billing cycle
and a verified backup, remove stale projects manually in Neon. Keep the most
recent previous project for an immediate rollback.

To stop automatic rotation, disable the workflow in GitHub Actions. To roll
back manually, set Vercel's production `DATABASE_URL` to the pooled connection
string of the previous project and create a new production deployment.
