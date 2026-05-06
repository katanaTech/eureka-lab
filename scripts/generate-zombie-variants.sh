#!/usr/bin/env bash
# generate-zombie-variants.sh
#
# Generates 4 zone-specific zombie SVG variants from the base zombie.svg
# by swapping the green (#68d391 / #22543d) tint to zone-specific colours.
#
# Zone colour map (per sprint-p16.md):
#   Whispers = violet (#a78bfa / #4c1d95)
#   Echoes   = amber  (#fbbf24 / #92400e)
#   Glitches = cyan   (#22d3ee / #0891b2)
#   Wraiths  = crimson(#f87171 / #991b1b)
#
# Idempotent: safe to re-run.
# Requires: sed (available on all platforms via Git Bash / POSIX)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSET_DIR="$SCRIPT_DIR/../apps/web/public/assets/game"
BASE="$ASSET_DIR/zombie.svg"

if [ ! -f "$BASE" ]; then
  echo "ERROR: Base zombie not found at $BASE" >&2
  exit 1
fi

# Zone: primary-glow, dark-accent, filter-flood, zone-label
declare -A ZONES
ZONES=(
  ["whispers"]="#a78bfa #4c1d95 #a78bfa Whispers"
  ["echoes"]="#fbbf24 #92400e #fbbf24 Echoes"
  ["glitches"]="#22d3ee #0891b2 #22d3ee Glitches"
  ["wraiths"]="#f87171 #991b1b #f87171 Wraiths"
)

for zone in "${!ZONES[@]}"; do
  read -r primary dark flood label <<< "${ZONES[$zone]}"
  OUT="$ASSET_DIR/zombie-${zone}.svg"

  sed \
    -e "s/#68d391/${primary}/g" \
    -e "s/#22543d/${dark}/g" \
    -e "s/flood-color=\"#68d391\"/flood-color=\"${flood}\"/g" \
    "$BASE" > "$OUT"

  echo "Generated: zombie-${zone}.svg (${label} tint: ${primary})"
done

echo "Done — 4 zombie variants in $ASSET_DIR"
