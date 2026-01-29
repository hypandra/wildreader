# Authentication Setup Documentation

## Overview

Wild Reader uses **Better Auth** for authentication with a **Supabase PostgreSQL** database backend. This provides email/password authentication with support for multiple children per parent account.

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ authClient (browser)
         ↓
┌─────────────────┐
│  Better Auth    │
│   API Routes    │
│  /api/auth/*    │
└────────┬────────┘
         │
         │ pg Pool (server)
         ↓
┌─────────────────┐
│    Supabase     │
│   PostgreSQL    │
│  (Session Pool) │
└─────────────────┘
```

## Database Configuration

### Connection Details

- **Provider:** Supabase PostgreSQL
- **Connection Type:** Session Pooler (IPv4 compatible)
- **Port:** 5432
- **SSL:** Required with CA certificate

### Connection String Format

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### SSL Certificate

The Supabase CA certificate is stored at `/prod-ca-2021.crt` (project root). Download from:
- Supabase Dashboard → Settings → Database → SSL Certificate

## Better Auth Setup

### Core Configuration

**File:** `lib/auth.ts`

```typescript
import { betterAuth } from "better-auth"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), 'prod-ca-2021.crt')).toString(),
    rejectUnauthorized: true
  }
})

export const auth = betterAuth({
  database: pool as any,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
  ],
})
```

### API Route Handler

**File:** `app/api/auth/[...all]/route.ts`

Better Auth requires the `toNextJsHandler` wrapper for Next.js App Router:

```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const handlers = toNextJsHandler(auth)

export const GET = handlers.GET
export const POST = handlers.POST
```

### Client Configuration

**File:** `lib/auth-client.ts`

```typescript
import { createAuthClient } from "better-auth/react"

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin  // Dynamic port support
  }
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
})

export const { useSession, signIn, signOut, signUp } = authClient
```

## Database Schema

### Better Auth Tables

Better Auth creates and manages these tables:

#### `user` Table
| Column | Type | Required | Description |
|--------|------|----------|-------------|
| id | TEXT | Yes | Primary key |
| email | TEXT | Yes | User's email (unique) |
| emailVerified | BOOLEAN | Yes | Email verification status |
| name | TEXT | Yes | Display name |
| image | TEXT | No | Profile image URL |
| createdAt | TIMESTAMP | Yes | Account creation time |
| updatedAt | TIMESTAMP | Yes | Last update time |

#### `session` Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| expiresAt | TIMESTAMP | Session expiration |
| token | TEXT | Session token (unique) |
| userId | TEXT | Foreign key to user |
| ipAddress | TEXT | Client IP |
| userAgent | TEXT | Browser info |
| createdAt | TIMESTAMP | Session start |
| updatedAt | TIMESTAMP | Last activity |

#### `account` Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| accountId | TEXT | Provider account ID |
| providerId | TEXT | Auth provider (e.g., 'credential') |
| userId | TEXT | Foreign key to user |
| password | TEXT | Hashed password (for email/password) |
| accessToken | TEXT | OAuth access token |
| refreshToken | TEXT | OAuth refresh token |
| idToken | TEXT | OAuth ID token |
| accessTokenExpiresAt | TIMESTAMP | Token expiration |
| refreshTokenExpiresAt | TIMESTAMP | Refresh expiration |
| createdAt | TIMESTAMP | Account creation |
| updatedAt | TIMESTAMP | Last update |

#### `verification` Table
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT | Primary key |
| identifier | TEXT | Email or phone |
| value | TEXT | Verification code |
| expiresAt | TIMESTAMP | Code expiration |
| createdAt | TIMESTAMP | Created at |
| updatedAt | TIMESTAMP | Updated at |

**Important:** All column names use **camelCase** as required by Better Auth.

### Application Tables

Our application extends the schema with child profiles and learning data:

- `wr_child_profiles` - Multiple children per parent account
- `wr_vocabulary_items` - Child-specific vocabulary
- `wr_letters` - Child-specific letter progress
- `wr_mastery_data` - Learning progress per game
- `wr_game_sessions` - Current streak and game state
- `wr_rewards` - AI-generated images earned
- `wr_api_keys` - OpenRouter API keys

**Note:** Row Level Security (RLS) is currently **disabled** on these tables because Better Auth doesn't integrate with Supabase Auth's `auth.uid()` function. For production, implement authorization through:
1. Server-side API routes (recommended)
2. Custom RLS policies with Better Auth session validation
3. Service role key for server-side queries

## Authentication Flow

### Sign Up

1. User submits email, password, and child name via `/signup` page
2. Frontend calls `authClient.signUp.email({ email, password, name })`
3. Better Auth creates user in `user` table and account in `account` table
4. Application creates child profile in `wr_child_profiles` table
5. Trigger automatically initializes default vocabulary, letters, and session data
6. User redirected to `/select-child`

### Sign In

1. User submits email and password via `/login` page
2. Frontend calls `authClient.signIn.email({ email, password })`
3. Better Auth validates credentials and creates session
4. Application loads child profiles
5. User redirected to home or `/select-child` if multiple children

### Session Management

- Sessions last 7 days
- Sessions stored in database (not JWT)
- Session cookie automatically managed by Better Auth
- Use `authClient.useSession()` hook to access current user

## Environment Variables

### Required Variables

```env
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Better Auth
BETTER_AUTH_SECRET=your_random_secret_minimum_32_chars

# Database (use Session Pooler connection string)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Generating Secrets

```bash
# Generate a random secret for BETTER_AUTH_SECRET
openssl rand -base64 32
```

## Development vs Production

### Development
- Supports multiple localhost ports (3000-3003)
- Uses local file for SSL certificate
- RLS disabled for rapid iteration

### Production Considerations
- Use environment-specific trusted origins
- Enable RLS and implement proper authorization
- Consider using Supabase Service Role for server-side queries
- Store SSL certificate securely (not in repo for production deployments)
- Use production database with appropriate connection limits

## Common Operations

### Check Current User

```typescript
import { authClient } from '@/lib/auth-client'

function MyComponent() {
  const { data: session } = authClient.useSession()

  if (session?.user) {
    console.log('User:', session.user.email)
  }
}
```

### Sign Out

```typescript
await authClient.signOut()
router.push('/login')
```

### Protected Routes

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function ProtectedPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login')
    }
  }, [session, isPending, router])

  if (isPending) return <div>Loading...</div>
  if (!session?.user) return null

  return <div>Protected content</div>
}
```

## Troubleshooting

### "Failed to initialize database adapter"

**Cause:** Database connection issue, usually SSL-related.

**Solution:**
1. Verify SSL certificate exists at `/prod-ca-2021.crt`
2. Check DATABASE_URL is correct with port 5432
3. Ensure certificate is properly loaded in `lib/auth.ts`

### "405 Method Not Allowed"

**Cause:** Not using `toNextJsHandler` in API route.

**Solution:** Update `app/api/auth/[...all]/route.ts` to use:
```typescript
import { toNextJsHandler } from "better-auth/next-js"
const handlers = toNextJsHandler(auth)
```

### "Invalid origin"

**Cause:** Request origin not in `trustedOrigins`.

**Solution:** Add the origin to `trustedOrigins` in `lib/auth.ts` or use environment variables.

### "undefined column" errors

**Cause:** Database schema doesn't match Better Auth expectations.

**Solution:** Run migrations to ensure all columns use camelCase naming.

### "violates row-level security policy"

**Cause:** RLS enabled but policies don't work with Better Auth.

**Solution:** Temporarily disable RLS or implement custom authorization logic.

## Migrations

Migrations are stored in `supabase/migrations/`:

1. `20240101000000_initial_schema.sql` - Application tables (child profiles, vocabulary, etc.)
2. `20240101001000_better_auth_tables.sql` - Better Auth core tables
3. `20240101002000_fix_better_auth_columns.sql` - Column name fixes (camelCase)
4. `20240101003000_disable_rls_for_better_auth.sql` - RLS adjustments
5. `20240101004000_create_ipa_pronunciations.sql` - IPA pronunciations table
6. `20240101005000_rename_tables_wr_prefix.sql` - Rename app tables to wr_ prefix

### Applying Migrations

```bash
# Apply all pending migrations to remote database
supabase db push

# View migration status
supabase migration list
```

## Security Notes

1. **Passwords:** Hashed using Better Auth's default algorithm (bcrypt)
2. **Sessions:** Stored in database with automatic cleanup of expired sessions
3. **CORS:** Restricted to trusted origins
4. **RLS:** Currently disabled - **implement proper authorization before production**
5. **SSL:** Required for all database connections
6. **API Keys:** User's OpenRouter keys stored in database (consider encryption)

## Future Improvements

- [ ] Enable RLS with custom policies for Better Auth
- [ ] Add email verification flow
- [ ] Implement "forgot password" functionality
- [ ] Add OAuth providers (Google, GitHub, etc.)
- [ ] Encrypt API keys in database
- [ ] Add session management UI (view/revoke active sessions)
- [ ] Implement rate limiting on auth endpoints
- [ ] Add audit logging for authentication events

## References

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth Next.js Guide](https://www.better-auth.com/docs/integrations/nextjs)
- [Supabase PostgreSQL Docs](https://supabase.com/docs/guides/database)
- [Debugging Guide](./lessons/better-auth-supabase-debugging.md)
