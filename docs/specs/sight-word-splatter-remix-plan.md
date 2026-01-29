# Sight Word Splatter Remix Plan (Per-Child + Shareable)

## Goals
- Make Sight Word Splatter remixable per child.
- Allow unlisted share links for recipes (and optionally content packs).
- Support kid-safe edits vs parent-controlled edits with clear permissions.

## Scope (MVP)
- Only Sight Word Splatter.
- Remix includes: content pack selection, difficulty rules, UI theming, audio lines.
- Per-child active recipe selection.

## Architecture Summary
- **Content packs** store remixable vocab subsets.
- **Game recipes** reference a content pack and include rules/UI/audio overrides.
- **Child settings** store which recipe is active for a given game.
- **Sharing** uses unlisted links (share_slug). Import creates a copy that the recipient owns.

## Data Model (Proposed)
- `wr_content_packs`: name, description, owner_child_id, visibility, share_slug
- `wr_content_items`: word/emoji/image/audio, tags, is_sight_word
- `wr_game_recipes`: game_type, content_pack_id, rules_json, ui_json, audio_json, visibility, share_slug, source_recipe_id
- `wr_child_game_settings`: child_id, game_type, active_recipe_id, difficulty_override

## Recipe Schema (Sight Word Splatter)
```ts
rules: {
  poolSizes?: Record<Difficulty, number>
  selection?: "weighted" | "random" | "sequential"
  allowRepeats?: boolean
}
ui: {
  background?: { gradientFrom: string; gradientTo: string }
  buttonColors?: string[]
  splatScale?: { min: number; max: number }
}
audio: {
  instruction?: string
  correctPrompt?: string
  wrongPrompt?: string
}
```

## Kid vs Parent Edit Permissions (Draft)
- **Kid-editable**: theme colors, splat sizes, button colors, instruction voice toggle.
- **Parent-editable**: content pack, pool size, selection strategy, audio text.
- **Toggle per child**: parent can enable/disable kid edit categories.

## Open Questions & Decisions

### 1) Content pack sharing: reference or copy?
- **Why it’s a question**: If a recipe links to a shared pack, changes to the pack affect all recipes using it.
- **Decision affects**: data integrity, user expectations, update propagation, moderation.
- **Options**:
  - **Reference** (recipe points to shared pack)
    - Pros: instant updates, less duplication
    - Cons: unexpected changes for recipients, harder to audit
  - **Copy on import** (pack duplicated for recipient)
    - Pros: stable experience, safe for kids
    - Cons: storage duplication, manual update flow
- **Lean**: Copy on import for safety; allow parent to “sync” from source later.

### 2) Unlisted share behavior: preview-only or playable?
- **Why**: Should unlisted links allow immediate play before importing?
- **Decision affects**: auth flow, caching, abuse risk.
- **Options**:
  - **Preview-only**: show recipe and allow import
  - **Playable**: allow guest demo with limited data
- **Lean**: Preview-only for MVP.

### 3) Kid edit permissions granularity
- **Why**: Kids should safely customize without breaking learning goals.
- **Decision affects**: UI complexity, safety surface.
- **Options**:
  - **Simple toggles** (UI edits vs Content edits)
  - **Fine-grained** (colors, audio, difficulty, pool sizes)
- **Lean**: Simple toggles in MVP.

### 4) Parent prompt language vs kid prompt language
- **Why**: Kids need short, playful prompts; parents need clear control and intent.
- **Decision affects**: UX copy, tooltips, onboarding.
- **Options**:
  - Separate “Parent Mode” and “Kid Mode” copy
  - Single UI with adaptive phrasing
- **Lean**: Parent Mode + Kid Mode toggle.

### 5) Audio overrides safety
- **Why**: Custom audio text might conflict with kid-safe constraints.
- **Decision affects**: moderation, guardrails, error handling.
- **Options**:
  - Restrict to templated phrases
  - Allow free text but apply guardrails
- **Lean**: Templated phrases for MVP; free text in Phase 2.

### 6) Mastery weighting impact on custom packs
- **Why**: Weighted selection assumes mastery stats exist; custom packs may not.
- **Decision affects**: gameplay quality, difficulty balance.
- **Options**:
  - Default to random if mastery missing
  - Initialize mastery for new items
- **Lean**: Default to random for new items, initialize mastery lazily.

## MVP Implementation Steps (No code yet)
1. Add DB tables + migrations for packs, recipes, child game settings.
2. Create pack/recipe CRUD endpoints.
3. Load active recipe in `GamePageClient` and pass to `SightWordSplatterGame`.
4. Update `pickSightWordPool` to accept overrides.
5. Add Remix UI (parent only) with preview/apply/reset.
6. Add unlisted share page for recipes.

## Next Decisions Needed
- Confirm pack sharing model (reference vs copy).
- Confirm permissions model for kid editing.
- Confirm whether share links can be played or just previewed.

