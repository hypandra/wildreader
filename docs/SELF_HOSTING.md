# Self-Hosting Wild Reader

This guide covers deploying Wild Reader on your own infrastructure.

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Supabase](https://supabase.com) account (free tier works)
- [OpenRouter](https://openrouter.ai) API key
- Optional: [BunnyCDN](https://bunny.net) account for image storage

## Quick Start

```bash
# Clone the repository
git clone https://github.com/hypandra/wildreader.git
cd wildreader

# Install dependencies
bun install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# Then run the development server
bun dev
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string (pooler mode) |
| `BETTER_AUTH_SECRET` | Random secret for session encryption. Generate with: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your app's URL (e.g., `https://wildreader.example.com`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Same as above (for client-side) |
| `OPENROUTER_API_KEY` | API key from [OpenRouter](https://openrouter.ai) for image generation |
| `OPENAI_API_KEY` | API key from [OpenAI](https://platform.openai.com) for TTS and speech-to-text |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for storage operations) |

### Optional (Image Storage)

Without BunnyCDN, AI-generated images are stored as base64 in the database. This works but is less efficient.

| Variable | Description |
|----------|-------------|
| `BUNNY_STORAGE_ZONE` | BunnyCDN storage zone name |
| `BUNNY_STORAGE_PASSWORD` | Storage zone password |
| `BUNNY_CDN_HOSTNAME` | Pull zone hostname (e.g., `yourzone.b-cdn.net`) |

## Database Setup

### 1. Create Supabase Project

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to provision

### 2. Get Connection Details

From your Supabase dashboard:

1. Go to **Settings > Database**
2. Copy the **Connection string** (Session pooler mode)
3. Replace `[YOUR-PASSWORD]` with your database password

### 3. Run Migrations

For fresh installs, run the combined schema in the Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase dashboard
2. Copy contents of `supabase/migrations/combined_schema.sql`
3. Run the migration

This creates all tables, indexes, functions, and triggers needed by the app.

### 4. Download SSL Certificate

Wild Reader uses SSL for database connections:

1. Download the Supabase CA certificate from your project settings
2. Save as `prod-ca-2021.crt` in the project root

For Vercel deployments, include the certificate file in your repository.

### 5. Create Storage Bucket (for Face Match)

If using the Face Match game with photos:

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named `people-photos`
3. Set it to **Private** (not public)
4. The app uses signed URLs for secure access

## Deployment Options

### Vercel (Recommended)

1. Push your code to GitHub (ensure `prod-ca-2021.crt` is included)
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```dockerfile
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Production
FROM oven/bun:1-slim
WORKDIR /app
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000
CMD ["bun", "server.js"]
```

### Traditional VPS

```bash
# Build
bun run build

# Start with PM2 or similar
pm2 start "bun start" --name wildreader
```

## BunnyCDN Setup (Optional)

BunnyCDN provides efficient storage for AI-generated reward images.

### 1. Create Storage Zone

1. Sign up at [bunny.net](https://bunny.net)
2. Go to **Storage > Add Storage Zone**
3. Choose region closest to your users
4. Copy **Storage Zone Name** and **Password**

### 2. Create Pull Zone (CDN)

1. Go to **CDN > Add Pull Zone**
2. Select **Storage Zone** as origin
3. Copy the **CDN Hostname**

### 3. Configure Environment

```env
BUNNY_STORAGE_ZONE=your-zone-name
BUNNY_STORAGE_PASSWORD=your-password
BUNNY_CDN_HOSTNAME=your-zone.b-cdn.net
```

Cost: ~$0.01/GB storage + $0.01-0.03/GB bandwidth

## OpenRouter Setup

Wild Reader uses OpenRouter to access Gemini for AI image generation.

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Add credits to your account
3. Create an API key
4. Add to `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-...
   ```

The app uses `google/gemini-2.5-flash-image` for image generation. Costs are minimal (~$0.001 per image).

## SSL Certificate

The Supabase connection requires the `prod-ca-2021.crt` file in the project root. Download it from your Supabase project settings and include it in your deployment.

## Troubleshooting

### Database connection errors

- Verify `DATABASE_URL` uses the pooler connection string
- Ensure SSL certificate is present and valid
- Check Supabase dashboard for connection limits

### Auth not working

- Verify `BETTER_AUTH_URL` matches your deployment URL exactly
- Add your domain to `trustedOrigins` in `lib/auth.ts`
- Check browser console for CORS errors

### Images not generating

- Verify `OPENROUTER_API_KEY` is valid
- Check OpenRouter dashboard for credits
- Review API response in browser network tab

### Build failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
bun install
bun build
```

## Security Notes

- Never commit `.env.local` or expose API keys
- Use strong, unique `BETTER_AUTH_SECRET` values
- Rotate API keys if compromised
- Consider rate limiting for production deployments

## Support

- Open an issue on GitHub for bugs
- Check existing issues for common problems
- Review the [README](../README.md) for feature documentation
