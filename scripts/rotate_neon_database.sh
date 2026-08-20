#!/usr/bin/env bash

set -Eeuo pipefail

NEON_API_BASE="https://console.neon.tech/api/v2"
VERCEL_API_BASE="https://api.vercel.com"
VERCEL_CLI_VERSION="${VERCEL_CLI_VERSION:-58.4.4}"
ROTATION_PROJECT_PREFIX="${ROTATION_PROJECT_PREFIX:-bloomify-prod-rotation-}"
VERCEL_NEON_REGION="${VERCEL_NEON_REGION:-iad1}"
NEON_DATABASE_NAME="${NEON_DATABASE_NAME:-neondb}"
NEON_ROLE_NAME="${NEON_ROLE_NAME:-neondb_owner}"
ROTATION_HEALTHCHECK_URL="${ROTATION_HEALTHCHECK_URL:-https://bloomify-pi.vercel.app/api/products/filters?lang=en}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_PROJECT_NAME="${ROTATION_PROJECT_PREFIX}$(date -u +%Y-%m)"
TARGET_ENV_PREFIX="ROTATION_$(date -u +%Y_%m)_"

TEMP_DIR="$(mktemp -d)"
SOURCE_DIRECT_URL=""
SOURCE_POOLED_URL=""
TARGET_PROJECT_ID=""
PROJECT_PAUSED=0
DATABASE_URL_SWITCHED=0
TARGET_DEPLOYED=0
CREATED_VERCEL_LINK=0

log() {
  printf '[neon-rotation] %s\n' "$*"
}

die() {
  printf '[neon-rotation] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command is missing: $1"
}

require_variable() {
  if [[ -z "${!1:-}" ]]; then
    die "Required environment variable is missing: $1"
  fi
}

neon_get() {
  curl --silent --show-error --fail-with-body \
    --retry 3 --retry-connrefused \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${NEON_API_KEY}" \
    "$1"
}

neon_connection_uri() {
  local project_id="$1"
  local pooled="$2"

  curl --silent --show-error --fail-with-body \
    --retry 3 --retry-connrefused \
    --get "${NEON_API_BASE}/projects/${project_id}/connection_uri" \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${NEON_API_KEY}" \
    --data-urlencode "database_name=${NEON_DATABASE_NAME}" \
    --data-urlencode "role_name=${NEON_ROLE_NAME}" \
    --data-urlencode "pooled=${pooled}" \
    | jq -er '.uri'
}

vercel_project_url() {
  printf '%s/v1/projects/%s/%s?teamId=%s' \
    "$VERCEL_API_BASE" "$VERCEL_PROJECT_ID" "$1" "$VERCEL_ORG_ID"
}

pause_project() {
  log "Pausing the Vercel production deployment for a consistent database copy"
  curl --silent --show-error --fail-with-body \
    --request POST \
    --header "Authorization: Bearer ${VERCEL_TOKEN}" \
    "$(vercel_project_url pause)" >/dev/null
  PROJECT_PAUSED=1
}

unpause_project() {
  if [[ "$PROJECT_PAUSED" -eq 0 ]]; then
    return
  fi

  log "Resuming the Vercel production deployment"
  curl --silent --show-error --fail-with-body \
    --request POST \
    --header "Authorization: Bearer ${VERCEL_TOKEN}" \
    "$(vercel_project_url unpause)" >/dev/null
  PROJECT_PAUSED=0
}

ensure_vercel_link() {
  local link_file="${REPO_ROOT}/.vercel/project.json"

  if [[ -f "$link_file" ]]; then
    local linked_project_id
    linked_project_id="$(jq -er '.projectId' "$link_file")"
    [[ "$linked_project_id" == "$VERCEL_PROJECT_ID" ]] || \
      die "Existing .vercel/project.json points to another Vercel project"
    return
  fi

  mkdir -p "${REPO_ROOT}/.vercel"
  jq -n \
    --arg org_id "$VERCEL_ORG_ID" \
    --arg project_id "$VERCEL_PROJECT_ID" \
    '{orgId: $org_id, projectId: $project_id}' >"$link_file"
  CREATED_VERCEL_LINK=1
}

update_vercel_database_url() {
  local database_url="$1"

  printf '%s' "$database_url" \
    | npx --yes "vercel@${VERCEL_CLI_VERSION}" env update DATABASE_URL production \
      --yes \
      --sensitive \
      --token "$VERCEL_TOKEN" \
      --cwd "$REPO_ROOT" >/dev/null
}

deploy_production() {
  npx --yes "vercel@${VERCEL_CLI_VERSION}" deploy \
    --prod \
    --yes \
    --token "$VERCEL_TOKEN" \
    --cwd "$REPO_ROOT"
}

create_marketplace_neon_project() {
  npx --yes "vercel@${VERCEL_CLI_VERSION}" integration add neon \
    --name "$TARGET_PROJECT_NAME" \
    --plan free_v3 \
    --metadata "region=${VERCEL_NEON_REGION}" \
    --metadata auth=false \
    --installation-id "$VERCEL_NEON_INSTALLATION_ID" \
    --prefix "$TARGET_ENV_PREFIX" \
    --environment production \
    --no-claim \
    --no-env-pull \
    --token "$VERCEL_TOKEN" \
    --scope "$VERCEL_ORG_ID" \
    --cwd "$REPO_ROOT" >/dev/null
}

find_neon_project_id() {
  local project_name="$1"
  local projects_json

  projects_json="$(neon_get "${NEON_API_BASE}/projects?limit=100&org_id=${NEON_ORG_ID}")"
  jq -r --arg project_name "$project_name" \
    '[.projects[] | select(.name == $project_name)] | first | .id // empty' \
    <<<"$projects_json"
}

wait_for_neon_project_id() {
  local project_name="$1"
  local attempt
  local project_id

  for attempt in $(seq 1 30); do
    project_id="$(find_neon_project_id "$project_name")"
    if [[ -n "$project_id" ]]; then
      printf '%s' "$project_id"
      return
    fi
    sleep 10
  done

  die "Marketplace Neon project did not appear within five minutes"
}

project_has_completion_marker() {
  local project_id="$1"
  local postgres_version="$2"
  local database_url

  database_url="$(neon_connection_uri "$project_id" false)"
  DATABASE_URL="$database_url" docker run --rm \
    --env DATABASE_URL \
    "postgres:${postgres_version}" \
    sh -c '
      if [ "$(psql "$DATABASE_URL" --tuples-only --no-align --command "SELECT to_regclass('\''public.bloomify_rotation_state'\'') IS NOT NULL;")" != "t" ]; then
        exit 1
      fi
      [ "$(psql "$DATABASE_URL" --tuples-only --no-align --command "SELECT EXISTS (SELECT 1 FROM public.bloomify_rotation_state WHERE completed_at IS NOT NULL);")" = "t" ]
    ' >/dev/null 2>&1
}

find_completed_source_project_id() {
  local current_target_id="$1"
  local project_id
  local postgres_version

  while IFS=$'\t' read -r project_id postgres_version; do
    [[ -n "$project_id" ]] || continue
    [[ "$project_id" != "$current_target_id" ]] || continue
    if project_has_completion_marker "$project_id" "$postgres_version"; then
      printf '%s' "$project_id"
      return
    fi
  done < <(
    neon_get "${NEON_API_BASE}/projects?limit=100&org_id=${NEON_ORG_ID}" \
      | jq -r --arg prefix "$ROTATION_PROJECT_PREFIX" \
        '[.projects[] | select(.name | startswith($prefix))] | sort_by(.created_at) | reverse[] | [.id, .pg_version] | @tsv'
  )

  printf '%s' "$NEON_ACTIVE_PROJECT_ID"
}

prepare_completion_marker() {
  local database_url="$1"
  local postgres_version="$2"

  DATABASE_URL="$database_url" docker run --rm \
    --env DATABASE_URL \
    "postgres:${postgres_version}" \
    sh -c 'psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --command "
      CREATE TABLE IF NOT EXISTS public.bloomify_rotation_state (
        singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
        project_id text NOT NULL,
        completed_at timestamptz NOT NULL
      );
      DELETE FROM public.bloomify_rotation_state;
    "' >/dev/null
}

mark_rotation_complete() {
  local database_url="$1"
  local postgres_version="$2"
  local project_id="$3"

  DATABASE_URL="$database_url" TARGET_PROJECT_ID="$project_id" docker run --rm \
    --env DATABASE_URL \
    --env TARGET_PROJECT_ID \
    "postgres:${postgres_version}" \
    sh -c 'psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --command "
      INSERT INTO public.bloomify_rotation_state (singleton, project_id, completed_at)
      VALUES (true, '\''$TARGET_PROJECT_ID'\'', now())
      ON CONFLICT (singleton) DO UPDATE
      SET project_id = EXCLUDED.project_id, completed_at = EXCLUDED.completed_at;
    "' >/dev/null
}

rollback() {
  local exit_code="$1"

  set +e
  if [[ "$DATABASE_URL_SWITCHED" -eq 1 && -n "$SOURCE_POOLED_URL" ]]; then
    log "Restoring the previous Vercel DATABASE_URL"
    update_vercel_database_url "$SOURCE_POOLED_URL"
  fi
  if [[ "$TARGET_DEPLOYED" -eq 1 ]]; then
    log "Rolling Vercel back to the previous production deployment"
    npx --yes "vercel@${VERCEL_CLI_VERSION}" rollback \
      --yes \
      --token "$VERCEL_TOKEN" \
      --cwd "$REPO_ROOT" >/dev/null
  fi
  unpause_project
  set -e

  return "$exit_code"
}

cleanup() {
  local exit_code=$?

  if [[ "$exit_code" -ne 0 ]]; then
    rollback "$exit_code" || true
  fi
  if [[ "$CREATED_VERCEL_LINK" -eq 1 ]]; then
    rm -f "${REPO_ROOT}/.vercel/project.json"
    rmdir "${REPO_ROOT}/.vercel" 2>/dev/null || true
  fi
  rm -rf "$TEMP_DIR"
  exit "$exit_code"
}

trap cleanup EXIT

wait_for_database() {
  local database_url="$1"
  local postgres_version="$2"
  local attempt

  for attempt in $(seq 1 30); do
    if DATABASE_URL="$database_url" docker run --rm \
      --env DATABASE_URL \
      "postgres:${postgres_version}" \
      sh -c 'pg_isready --dbname "$DATABASE_URL" --timeout=10' >/dev/null 2>&1; then
      return
    fi
    sleep 10
  done

  die "Database did not become ready within five minutes"
}

table_count() {
  local database_url="$1"
  local postgres_version="$2"

  DATABASE_URL="$database_url" docker run --rm \
    --env DATABASE_URL \
    "postgres:${postgres_version}" \
    sh -c 'psql "$DATABASE_URL" --tuples-only --no-align --command "SELECT count(*) FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_type = '\''BASE TABLE'\'';"' \
    | tr -d '[:space:]'
}

for variable in \
  NEON_API_KEY \
  NEON_ORG_ID \
  NEON_ACTIVE_PROJECT_ID \
  VERCEL_TOKEN \
  VERCEL_ORG_ID \
  VERCEL_PROJECT_ID \
  VERCEL_NEON_INSTALLATION_ID; do
  require_variable "$variable"
done

for command_name in curl docker jq npx; do
  require_command "$command_name"
done

ensure_vercel_link

log "Resolving the source Neon project"
TARGET_PROJECT_ID="$(find_neon_project_id "$TARGET_PROJECT_NAME")"
source_project_id="$(find_completed_source_project_id "$TARGET_PROJECT_ID")"

[[ "$source_project_id" != "$TARGET_PROJECT_ID" ]] || \
  die "Source and target Neon project IDs must differ"

source_project_json="$(neon_get "${NEON_API_BASE}/projects/${source_project_id}")"
source_pg_version="$(jq -er '.project.pg_version' <<<"$source_project_json")"
SOURCE_DIRECT_URL="$(neon_connection_uri "$source_project_id" false)"
SOURCE_POOLED_URL="$(neon_connection_uri "$source_project_id" true)"

log "Checking that the source database is available"
wait_for_database "$SOURCE_DIRECT_URL" "$source_pg_version"

if [[ -z "$TARGET_PROJECT_ID" ]]; then
  log "Creating Vercel Marketplace Neon project ${TARGET_PROJECT_NAME}"
  create_marketplace_neon_project
  TARGET_PROJECT_ID="$(wait_for_neon_project_id "$TARGET_PROJECT_NAME")"
else
  log "Reusing Neon project ${TARGET_PROJECT_NAME} after a previous partial run"
fi

target_project_json="$(neon_get "${NEON_API_BASE}/projects/${TARGET_PROJECT_ID}")"
target_pg_version="$(jq -er '.project.pg_version' <<<"$target_project_json")"
(( target_pg_version >= source_pg_version )) || \
  die "Target PostgreSQL version must not be older than the source"

target_direct_url="$(neon_connection_uri "$TARGET_PROJECT_ID" false)"
target_pooled_url="$(neon_connection_uri "$TARGET_PROJECT_ID" true)"
wait_for_database "$target_direct_url" "$target_pg_version"

pause_project

log "Creating a consistent PostgreSQL dump"
SOURCE_DATABASE_URL="$SOURCE_DIRECT_URL" docker run --rm \
  --env SOURCE_DATABASE_URL \
  --volume "${TEMP_DIR}:/backup" \
  "postgres:${source_pg_version}" \
  sh -c 'pg_dump --format=custom --no-owner --no-acl --file=/backup/bloomify.dump "$SOURCE_DATABASE_URL"'

log "Restoring the dump into ${TARGET_PROJECT_NAME}"
TARGET_DATABASE_URL="$target_direct_url" docker run --rm \
  --env TARGET_DATABASE_URL \
  --volume "${TEMP_DIR}:/backup" \
  "postgres:${target_pg_version}" \
  sh -c 'pg_restore --dbname "$TARGET_DATABASE_URL" --no-owner --no-acl --clean --if-exists --exit-on-error /backup/bloomify.dump'

source_table_count="$(table_count "$SOURCE_DIRECT_URL" "$source_pg_version")"
target_table_count="$(table_count "$target_direct_url" "$target_pg_version")"
[[ "$source_table_count" == "$target_table_count" ]] || \
  die "Schema verification failed: source has ${source_table_count} tables, target has ${target_table_count}"

prepare_completion_marker "$target_direct_url" "$target_pg_version"

log "Switching Vercel DATABASE_URL to the new pooled connection"
update_vercel_database_url "$target_pooled_url"
DATABASE_URL_SWITCHED=1

log "Deploying the application with the new DATABASE_URL"
deployment_url="$(deploy_production)"
TARGET_DEPLOYED=1
log "Created production deployment: ${deployment_url}"

unpause_project

log "Waiting for the database-backed production endpoint"
health_ok=0
for attempt in $(seq 1 40); do
  if curl --silent --show-error --fail \
    --max-time 15 \
    "$ROTATION_HEALTHCHECK_URL" >/dev/null; then
    health_ok=1
    break
  fi
  sleep 15
done
[[ "$health_ok" -eq 1 ]] || die "Production health check failed after the database switch"

log "Recording the completed rotation in the target database"
mark_rotation_complete "$target_direct_url" "$target_pg_version" "$TARGET_PROJECT_ID"

DATABASE_URL_SWITCHED=0
TARGET_DEPLOYED=0
log "Rotation completed successfully: ${source_project_id} -> ${TARGET_PROJECT_ID}"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    printf '## Neon database rotation\n\n'
    printf -- '- Source project: `%s`\n' "$source_project_id"
    printf -- '- Target project: `%s`\n' "$TARGET_PROJECT_ID"
    printf -- '- Production endpoint: `%s`\n' "$ROTATION_HEALTHCHECK_URL"
    printf -- '- Result: successful\n'
  } >>"$GITHUB_STEP_SUMMARY"
fi
