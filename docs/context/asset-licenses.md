# Asset Licenses — Phase 16 Fantasy UI

> **Owner:** DEVOPS + PM
> **Status:** PENDING RESOLUTION (pre-production gate)
> **Deadline:** Before P16-QA-006 (production flag enablement)

---

## Current Assets in Use

| Asset | Source | Path | Format |
|-------|--------|------|--------|
| Eureka Lab logo | Custom (SVG placeholder) | `/assets/game/logo.svg` | SVG |
| World map background | Custom (SVG placeholder) | `/assets/game/world-map.svg` | SVG |
| Island backgrounds (x4) | Custom (SVG placeholder) | `/assets/game/island-{1..4}.svg` | SVG |
| Base zombie sprite | Custom (SVG placeholder) | `/assets/game/zombie.svg` | SVG |
| Zone zombie variants (x4) | Generated from base | `/assets/game/zombie-{zone}.svg` | SVG |
| Hero sprites (x4) | Custom (SVG placeholder) | `/assets/game/hero-{class}.svg` | SVG |
| Mobile crops (x5) | Generated from desktop | `/assets/game/mobile/*.svg` | SVG |

## Lovable Asset Status

### Investigation Required

The original plan called for importing assets from a Lovable.dev project (ai-adventure-island).
Before using any Lovable-sourced assets in production, the following must be confirmed:

1. **Lovable.dev Terms of Service** — Confirm whether assets generated or designed within
   Lovable.dev are licensed for:
   - Commercial SaaS use (B2C subscription product)
   - B2B distribution (white-label for schools/tenants)
   - Modification and derivative works (colour tints, crops)

2. **AI-generated art clause** — If Lovable uses AI image generation, confirm the underlying
   model's license permits commercial use of outputs.

### Current Approach (Dev/Staging)

All assets currently in `apps/web/public/assets/game/` are **custom SVG placeholders** created
by the DEVOPS agent. These do NOT originate from Lovable.dev and have no license encumbrance.
They are suitable for:

- [x] Local development
- [x] Staging/preview deployments
- [x] Internal demos and QA testing
- [ ] **NOT cleared for public production or B2B client delivery** (pending art quality review)

### Resolution Paths

**Path A — Confirm Lovable license:**
- Review Lovable.dev TOS (specifically sections on IP ownership and commercial use)
- Document the relevant clause(s) below
- If permitted: swap placeholder SVGs with Lovable raster assets, run through optimisation pipeline
- Decision owner: PM

**Path B — Commission replacement art:**
- Scope: 13 base assets + 4 zombie tints + 5 mobile crops = ~22 deliverables
- Style brief: Dark fantasy / cinematic game UI, child-friendly (ages 8-16)
- Suggested platforms: Fiverr Pro, 99designs, direct illustrator commission
- Estimated timeline: 2-3 weeks from brief to final delivery
- Budget: TBD (PM to approve)
- Decision owner: PM with DEVOPS coordination

**Path C — Upgrade placeholder SVGs to production quality:**
- Current SVGs are functional but minimal
- Could be enhanced with more detail, gradients, and polish
- Lowest cost, fastest turnaround
- Risk: may not meet quality bar for B2B clients
- Decision owner: PM

## Pre-Production Gate

This decision **MUST** be resolved before:
- `P16-QA-006` — Production rollout via feature flag (5% -> 25% -> 100%)
- Any B2B client demo using real tenant data

Development, staging, and internal QA may proceed with current placeholder assets.

---

*Created: 2026-04-29 | DEVOPS agent*
*Resolution: PENDING*
