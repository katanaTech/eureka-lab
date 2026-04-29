#!/usr/bin/env bash
# generate-mobile-crops.sh
#
# Generates 768x1024 mobile-cropped variants from desktop background SVGs.
# For SVGs: adjusts the viewBox to a portrait crop centred on the image.
#
# Output: apps/web/public/assets/game/mobile/
# Idempotent: safe to re-run; overwrites existing outputs.
#
# Requires: sed (POSIX). No ImageMagick needed for SVG crops.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASSET_DIR="$SCRIPT_DIR/../apps/web/public/assets/game"
MOBILE_DIR="$ASSET_DIR/mobile"

mkdir -p "$MOBILE_DIR"

# ── World map crop ──────────────────────────────────────────────────────────
# Original: 1920x1080, viewBox="0 0 1920 1080"
# Mobile crop: centre 768-wide band, full height scaled to 1024
# Centre-X of 1920 = 960, half-width = 576 → viewBox starts at 384
# Scale height: keep all 1080 visible
WORLD_SRC="$ASSET_DIR/world-map.svg"
if [ -f "$WORLD_SRC" ]; then
  sed \
    -e 's/width="1920"/width="768"/' \
    -e 's/height="1080"/height="1024"/' \
    -e 's/viewBox="0 0 1920 1080"/viewBox="384 0 1152 1080"/' \
    "$WORLD_SRC" > "$MOBILE_DIR/world-map.svg"
  echo "Generated: mobile/world-map.svg (768x1024 centre crop)"
fi

# ── Island crops ────────────────────────────────────────────────────────────
# Original: 600x400, viewBox="0 0 600 400"
# Mobile: 768x1024 → crop to centre portion with more vertical space
# Keep full island, pad vertically: viewBox="50 -100 500 667"
for slug in whispers echoes glitches wraiths; do
  # Map slug to island number
  case "$slug" in
    whispers) num=1 ;;
    echoes)   num=2 ;;
    glitches) num=3 ;;
    wraiths)  num=4 ;;
  esac

  SRC="$ASSET_DIR/island-${num}.svg"
  if [ -f "$SRC" ]; then
    sed \
      -e 's/width="600"/width="768"/' \
      -e 's/height="400"/height="1024"/' \
      -e 's/viewBox="0 0 600 400"/viewBox="50 -100 500 667"/' \
      "$SRC" > "$MOBILE_DIR/island-${slug}.svg"
    echo "Generated: mobile/island-${slug}.svg (768x1024 portrait crop)"
  fi
done

echo ""
echo "Done — mobile crops in $MOBILE_DIR"
ls -la "$MOBILE_DIR"
