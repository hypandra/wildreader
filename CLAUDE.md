# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Wild Reader is a reading literacy game for 3-4 year olds following science of reading research. Features 11 game types spanning letter recognition through early decoding, with AI-generated image rewards using Gemini via OpenRouter.

## Commands

```bash
bun install                    # Install dependencies
bun dev                        # Start Next.js dev server (port 3000)
bun run build                  # Production build
bun run lint                   # ESLint check
bun run pre-generate-audio     # Pre-generate TTS audio files
bun supabase db push           # Apply migrations to Supabase
```

## Architecture

### Data Flow for Games

1. **Game page** (`app/game/[slug]/page.tsx`) loads data on mount via `lib/db/*.ts` functions
2. Data is cached in **game-data.ts** module (`setGameData`, `setPeopleData`) - this in-memory cache is required before question generation
3. **Question generators** in `lib/games.ts` use cached data + weighted selection from `lib/mastery.ts`
4. Each game component in `components/games/` handles its own UI and answer validation
5. Mastery updates flow back through `lib/db/mastery.ts` to Supabase

### Session & Streak Management

The `useGameSession` hook (`lib/hooks/useGameSession.ts`) manages streak tracking and reward triggers:
- Tracks current streak and total stars per child session
- Triggers reward dialog when streak reaches target (default: 3)
- Session state persisted via `ChildContext` → `lib/db/sessions.ts`
- Per-game difficulty stored in `sessionState.difficultyByGame`

### Mastery System

The mastery algorithm in `lib/mastery.ts` weights item selection inversely to correct rate:
- Items with 0 attempts get weight 10 (high priority)
- Items with high correct rate get weight ~1 (low priority)
- This ensures struggling items appear more frequently

### Authentication

Uses **BetterAuth** with PostgreSQL. Tables are prefixed with `wr_`:
- `lib/auth.ts` - Server config with `modelName` for table prefixes
- `lib/auth-client.ts` - Client hooks (`useSession`, `signIn`, `signOut`)
- SSL via `prod-ca-2021.crt` in project root

### Child Profiles

Multi-child support via `ChildContext` (`lib/contexts/ChildContext.tsx`). Active child stored in localStorage, used for all data queries.

### Image Generation & Storage

- API route: `app/api/generate-image/route.ts`
- Uses OpenRouter → Gemini 2.5 Flash Image
- Images stored on BunnyCDN via `lib/bunnycdn.ts`
- Falls back to base64 in database if BunnyCDN not configured

### Audio System

- `lib/audio/` - TTS generation and caching via Google Gemini
- `lib/audio.ts` - Web Speech API utilities (browser TTS)
- `components/AudioButton.tsx` - Reusable playback component
- Audio files cached to BunnyCDN for consistent pronunciation

## Game Types

All games defined in `lib/games.ts` with corresponding components in `components/games/`:

| Slug | Component | Data Source |
|------|-----------|-------------|
| letter-match | LetterMatchGame | Letters |
| letter-hunt | LetterHuntGame | Letters |
| letter-to-picture | LetterToPictureGame | Letters + Vocabulary |
| picture-to-letter | PictureToLetterGame | Letters + Vocabulary |
| starts-with | StartsWithGame | Vocabulary |
| ends-with | EndsWithGame | Vocabulary |
| word-match | WordMatchGame | Vocabulary |
| picture-match | PictureMatchGame | Vocabulary |
| face-match | FaceMatchGame | People |
| name-to-face | NameToFaceGame | People |
| todays-sound | TodaysSoundGame | Vocabulary (filtered by day) |

The "Today's Sound" game rotates through letters A-Z (days 1-26) and digraphs TH/SH/CH/PH (days 27-31).

## Code Style

- TypeScript + React with Next.js App Router
- 2-space indentation, double quotes, no semicolons
- Components: `PascalCase` filenames
- Routes: kebab-case directories
- Tailwind CSS with custom design tokens in `tailwind.config.ts`

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Session encryption
- `OPENROUTER_API_KEY` - AI image generation

Optional for CDN storage:
- `BUNNY_STORAGE_ZONE` / `BUNNY_STORAGE_PASSWORD` / `BUNNY_CDN_HOSTNAME`

## Next.js 16 Params Pattern

Dynamic route params are Promises in Next.js 16 - you must await them before use:

```typescript
export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Now slug is available
}
```
