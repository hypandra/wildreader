# Contributing to Wild Reader

Thank you for your interest in contributing to Wild Reader! This project aims to help young children (ages 3-4) learn to read through engaging games based on science of reading research.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `bun install`
4. Copy `.env.example` to `.env.local` and configure your environment
5. Run the development server: `bun dev`

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) (package manager and runtime)
- [Supabase](https://supabase.com) account (for PostgreSQL database)
- [OpenRouter](https://openrouter.ai) API key (for AI image generation)

### Database Setup

1. Create a new Supabase project
2. Run the combined schema migration: `supabase/migrations/combined_schema.sql`
3. Add your database connection string to `.env.local`

See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for detailed setup instructions.

## Code Style

- **TypeScript** with strict mode
- **2-space indentation**, double quotes, no semicolons
- **Components**: PascalCase filenames (`GameCard.tsx`)
- **Routes**: kebab-case directories (`app/select-child/`)
- **Tailwind CSS** for styling with custom design tokens

Run `bun lint` before submitting to catch style issues.

## Project Structure

```
wildreader/
├── app/                 # Next.js App Router pages and API routes
├── components/          # React components
│   ├── games/          # Game-specific components
│   └── ui/             # shadcn/ui components
├── lib/                 # Business logic and utilities
│   ├── db/             # Database queries
│   ├── contexts/       # React contexts
│   └── hooks/          # Custom hooks
├── supabase/           # Database migrations
└── types/              # TypeScript types
```

## Making Changes

### Bug Fixes

1. Create a branch: `git checkout -b fix/description`
2. Make your changes
3. Test manually with `bun dev`
4. Run `bun lint && bun build`
5. Submit a pull request

### New Features

1. Open an issue first to discuss the feature
2. Create a branch: `git checkout -b feature/description`
3. Implement the feature
4. Add any necessary migrations to `supabase/migrations/`
5. Update documentation if needed
6. Submit a pull request

### Adding New Games

Wild Reader's game system is extensible. To add a new game:

1. Add the game type to `lib/games.ts`
2. Create the game component in `components/games/`
3. Add the game route in `app/game/[slug]/`
4. Add any required database migrations
5. Update the game type enum in the schema

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Reference any related issues
- Ensure `bun lint` and `bun build` pass
- Add screenshots for UI changes

## Reporting Issues

When reporting bugs, please include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

## Questions?

Open an issue for questions about contributing. We're happy to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
