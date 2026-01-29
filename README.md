# Wild Reader

A magical reading literacy game for 3-4 year olds following science of reading research. Multiple game types spanning letter recognition through early decoding. Reward system uses Gemini image generation to capture child-driven vocabulary.

## Features

- **8 Game Types**: Letter recognition, word families, and word recognition games
- **Mastery Tracking**: Per-item, per-game mastery tracking with weighted random selection
- **Reward System**: Streak-based rewards with AI image generation
- **Vocabulary Logging**: Capture and review child's natural vocabulary
- **Progressive Difficulty**: Games adapt based on performance
- **Child-Friendly Design**: Warm storybook aesthetic with playful animations

## Design System

Wild Reader uses a **"Storybook Wonder"** design language - warm, inviting, and magical:

### Color Palette
- **Sunshine** (`#F7C94B`) - Primary golden yellow for warmth and happiness
- **Coral** (`#FF8A65`) - Soft coral for encouragement and warmth
- **Sage** (`#7CB342`) - Green for success and growth
- **Sky** (`#70B5F9`) - Light blue for calm interactions
- **Lavender** (`#B39DDB`) - Purple for creativity and rewards
- **Cream** (`#FFF8E7`) - Warm background like storybook paper
- **Bark** (`#5D4037`) - Warm brown for readable text

### Typography
- **Display Font**: Fredoka - Rounded, friendly, playful headers
- **Body Font**: Nunito - Clean, soft, highly readable

### Animations
- Floating decorative elements (stars, clouds, nature)
- Gentle micro-interactions (wiggle, bounce, twinkle)
- Celebratory feedback (pop-in, celebrate, pulse-glow)
- Staggered entrance animations for visual delight

## Setup

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Up Supabase Database

1. Create a new project at [Supabase](https://supabase.com)
2. Run the database migration:
   ```bash
   bun supabase db push
   ```
3. Copy your project URL and keys to `.env.local`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string (session pooler)
- `BETTER_AUTH_SECRET` - Random secret for session encryption
- `OPENROUTER_API_KEY` - API key from [OpenRouter](https://openrouter.ai)

**Optional (BunnyCDN for image storage):**
- `BUNNY_STORAGE_ZONE` - Your BunnyCDN storage zone name
- `BUNNY_STORAGE_PASSWORD` - Storage zone password
- `BUNNY_CDN_HOSTNAME` - Your pull zone hostname (e.g., `yourzone.b-cdn.net`)

### 4. BunnyCDN Setup (Recommended)

Without BunnyCDN, images are stored as base64 in the database, which is inefficient. To enable permanent CDN-hosted images:

1. Sign up at [BunnyCDN](https://bunny.net)
2. Create a **Storage Zone**:
   - Go to Storage → Add Storage Zone
   - Choose region closest to users
   - Copy the **Storage Zone Name** and **Password**
3. Create a **Pull Zone** (CDN):
   - Go to CDN → Add Pull Zone
   - Link to your Storage Zone
   - Copy the **CDN Hostname**
4. Add credentials to `.env.local`

**Cost:** ~$0.01/GB storage + $0.01-0.03/GB bandwidth (very cheap!)

### 5. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Games

1. **Letter Match** - Match uppercase to lowercase letters
2. **Letter Hunt** - Find all instances of a target letter
3. **Letter to Picture** - Pick picture that starts with a letter
4. **Picture to Letter** - Pick letter that a picture starts with
5. **Starts With** - Find words that start the same
6. **Ends With** - Find words that end the same
7. **Word Match** - Match word to picture
8. **Picture Match** - Match picture to word

## Tech Stack

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL database with real-time capabilities
- **Better Auth** - Simple authentication library
- **shadcn/ui** - UI components (customized for storybook aesthetic)
- **Tailwind CSS** - Styling with custom design tokens
- **Bun** - Package manager and runtime
- **OpenRouter** - API gateway for AI models
- **Gemini 2.5 Flash Image** - AI image generation via OpenRouter
- **BunnyCDN** - Image storage and CDN (optional but recommended)

## Project Structure

```
wildreader/
├── app/
│   ├── api/generate-image/  # Image generation via OpenRouter → BunnyCDN
│   ├── game/[slug]/         # Dynamic game pages
│   ├── login/               # Login page
│   ├── signup/              # Sign up page
│   ├── select-child/        # Child profile selection
│   ├── settings/            # Settings & API keys
│   ├── vocabulary/          # Vocabulary rewards log
│   ├── globals.css          # Design system & animations
│   └── page.tsx             # Home page (game selection)
├── components/
│   ├── ui/                  # shadcn components (customized)
│   ├── GameCard.tsx         # Game selection cards
│   ├── GameHeader.tsx       # In-game header with streak
│   ├── RewardDialog.tsx     # Reward modal (protected)
│   └── StreakIndicator.tsx  # Visual streak progress
├── lib/
│   ├── auth.ts              # Better Auth server config
│   ├── auth-client.ts       # Better Auth client hooks
│   ├── bunnycdn.ts          # BunnyCDN upload/delete
│   ├── db/                  # Database queries
│   │   ├── children.ts      # Child profiles
│   │   ├── vocabulary.ts    # Vocabulary items
│   │   ├── letters.ts       # Letter items
│   │   ├── mastery.ts       # Mastery tracking
│   │   ├── sessions.ts      # Game sessions
│   │   ├── rewards.ts       # Reward instances
│   │   └── api-keys.ts      # User API keys
│   ├── contexts/
│   │   └── ChildContext.tsx # Active child state
│   ├── games.ts             # Game question generation
│   ├── game-data.ts         # In-memory data cache
│   ├── mastery.ts           # Mastery algorithms
│   └── utils.ts             # Utilities
├── supabase/
│   └── migrations/          # Database schema
├── tailwind.config.ts       # Custom design tokens
└── types/
    └── index.ts             # TypeScript types
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## Self-Hosting

See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for deployment instructions.

## License

MIT - see [LICENSE](LICENSE) for details.
