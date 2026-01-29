# Debugging Better Auth with Supabase: Lessons Learned

**Date:** December 2024
**Challenge:** Integrating Better Auth (authentication library) with Supabase PostgreSQL in a Next.js 14 App Router application

## The Problem

Attempting to set up Better Auth with Supabase's managed PostgreSQL database resulted in multiple cascading errors:
- Database connection failures
- SSL certificate issues
- HTTP 405 Method Not Allowed errors
- Database schema mismatches
- Row Level Security (RLS) policy conflicts

## The Golden Rule: Search First, Debug Second

**Lesson #1: Don't reinvent the wheel - search for existing solutions**

Early in the debugging process, we were attempting trial-and-error fixes. The breakthrough came when we shifted to:
1. Searching for similar issues in GitHub
2. Checking official documentation
3. Looking for community solutions on Discord/forums

This approach revealed that others had solved these exact problems, saving hours of experimentation.

## The Debugging Journey

### 1. Database Connection Issues

**Problem:** Multiple connection string formats failed with various SSL errors:
```
Error: The server does not support SSL connections
Error: self-signed certificate in certificate chain
Error: password authentication failed
```

**What We Tried:**
- Direct connection (IPv6 incompatibility)
- Session Pooler without SSL
- Various `sslmode` parameters in connection string
- Different port numbers (5432 vs 6543)

**The Solution:**
After searching GitHub issues (particularly [Drizzle ORM #4527](https://github.com/drizzle-team/drizzle-orm/issues/4527)), we found the working pattern:

```typescript
import { Pool } from "pg"
import fs from "fs"
import path from "path"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), 'prod-ca-2021.crt')).toString(),
    rejectUnauthorized: true
  }
})
```

**Key Points:**
- Download the SSL certificate from Supabase Dashboard > Settings > Database
- Use the Session Pooler on port **5432** (not 6543)
- Connection string format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`
- Pass CA certificate content, not just `sslmode` in URL

**Lesson #2: Cloud database providers often use self-signed certificates requiring explicit CA configuration**

### 2. HTTP 405 Method Not Allowed

**Problem:** All POST requests to `/api/auth/sign-up/email` returned 405 errors.

**What We Tried:**
- Checking for conflicting routes
- Verifying HTTP method exports
- Reviewing Next.js API route configuration

**The Solution:**
Found in [Better Auth GitHub #3684](https://github.com/better-auth/better-auth/issues/3684) - Better Auth requires a specific wrapper for Next.js App Router:

```typescript
// ❌ Wrong - doesn't work with Next.js App Router
import { auth } from "@/lib/auth"
export const { GET, POST } = auth.handler

// ✅ Correct - use toNextJsHandler
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const handlers = toNextJsHandler(auth)
export const GET = handlers.GET
export const POST = handlers.POST
```

**Lesson #3: Library-specific integrations often require special adapters - check the framework integration docs**

### 3. Database Schema Mismatches

**Problem:** Database insertion failed with error code `42703` (undefined column).

**Root Cause:** Better Auth expects **camelCase** column names but our migration used **snake_case**:

```sql
-- ❌ Our initial schema (snake_case)
CREATE TABLE "user" (
  email_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ✅ What Better Auth expects (camelCase)
CREATE TABLE "user" (
  "emailVerified" BOOLEAN,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP,
  image TEXT  -- also missing this column
);
```

**The Fix:**
```sql
ALTER TABLE "user" RENAME COLUMN email_verified TO "emailVerified";
ALTER TABLE "user" RENAME COLUMN created_at TO "createdAt";
ALTER TABLE "user" RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE "user" ADD COLUMN image TEXT;
```

**Lesson #4: When integrating with a library, match its schema conventions exactly - don't assume you can adapt it**

**Lesson #5: Check the library's database documentation for the complete schema - the installation guide may not have all details**

Reference: [Better Auth Database Concepts](https://www.better-auth.com/docs/concepts/database)

### 4. Row Level Security Conflicts

**Problem:** User creation succeeded but child profile creation failed:
```
Error: new row violates row-level security policy for table "wr_child_profiles"
```

**Root Cause:** Our RLS policies expected Supabase Auth's `auth.uid()` function, but we're using Better Auth which has its own session management.

**Temporary Solution:**
```sql
-- Disable RLS on application tables
ALTER TABLE wr_child_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE wr_vocabulary_items DISABLE ROW LEVEL SECURITY;
-- etc.
```

**Note:** For production, you should:
1. Implement server-side API routes for all data access (recommended)
2. Create custom RLS policies that integrate with Better Auth sessions
3. Use service role key for server-side queries

**Lesson #6: Authentication libraries that don't integrate directly with your database's auth system will conflict with RLS - plan accordingly**

### 5. CORS / Trusted Origins

**Problem:** "Invalid origin" error during signup.

**Cause:** Development server port varies (3000, 3001, 3002, etc.) but `trustedOrigins` was hardcoded to specific ports.

**Solution:**
```typescript
export const auth = betterAuth({
  // ...
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
  ],
})
```

**Lesson #7: For development, configure multiple localhost ports; for production, use environment variables**

## Final Working Configuration

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Better Auth
BETTER_AUTH_SECRET=your_random_secret_here

# Database (Session Pooler)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### lib/auth.ts
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

### app/api/auth/[...all]/route.ts
```typescript
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

const handlers = toNextJsHandler(auth)

export const GET = handlers.GET
export const POST = handlers.POST
```

### lib/auth-client.ts
```typescript
import { createAuthClient } from "better-auth/react"

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
})
```

### Database Schema
Ensure all Better Auth tables use camelCase columns:
- `user`: id, email, emailVerified, name, image, createdAt, updatedAt
- `session`: id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId
- `account`: id, accountId, providerId, userId, accessToken, refreshToken, idToken, createdAt, updatedAt
- `verification`: id, identifier, value, expiresAt, createdAt, updatedAt

## Key Takeaways

### 1. Research-First Approach
When facing integration issues:
- Search GitHub issues for your specific error messages
- Check official documentation thoroughly
- Look for community solutions (Discord, forums, Stack Overflow)
- Don't spend more than 30 minutes on trial-and-error before searching

### 2. Managed Database SSL Configuration
Cloud PostgreSQL providers (Supabase, Neon, Railway, etc.) often require:
- Downloading their CA certificate
- Configuring `ssl.ca` in your connection pool
- Using the correct pooler port
- Sometimes setting `rejectUnauthorized: true` (more secure) or `false` (less secure)

### 3. Framework Integration Patterns
Modern auth libraries often need special adapters:
- Check for framework-specific exports (`toNextJsHandler`, `toExpressHandler`, etc.)
- Don't assume the generic handler will work with all frameworks
- Review the "Framework Integration" section of docs

### 4. Schema Precision Matters
When using an ORM or library with database requirements:
- Match the exact column names (including case)
- Include all required columns (check the complete schema docs)
- Don't modify the schema unless the library explicitly supports it
- Running the library's migration tool is usually safer than creating your own

### 5. Authentication & Authorization Separation
- Authentication (who you are) and Authorization (what you can do) are separate concerns
- Switching auth libraries means updating both:
  - Authentication: User accounts, sessions, tokens
  - Authorization: RLS policies, permission checks, API guards
- Plan for RLS conflicts when not using your database provider's auth system

### 6. Development Environment Flexibility
- Hardcoded localhost ports break easily
- Use dynamic origin detection for client-side code
- Support multiple ports in server-side trusted origins
- Transition to environment variables for production

### 7. Error Messages Are Breadcrumbs
Database errors often contain specific clues:
- `42703` = undefined column (schema mismatch)
- `405` = Method Not Allowed (routing/handler issue)
- `self-signed certificate` = SSL config needed
- `violates row-level security` = RLS policy conflict

Search for the error code + your stack to find solutions faster.

## Useful Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth Database Schema](https://www.better-auth.com/docs/concepts/database)
- [Supabase Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Better Auth GitHub Issues](https://github.com/better-auth/better-auth/issues)
- [Supabase SSL Enforcement Docs](https://supabase.com/docs/guides/platform/ssl-enforcement)

## Common Pitfalls to Avoid

❌ **Don't** try random connection string formats without understanding what each parameter does
✅ **Do** read the database provider's connection documentation first

❌ **Don't** assume snake_case and camelCase are interchangeable in database columns
✅ **Do** check the library's exact schema requirements

❌ **Don't** use `auth.handler` directly with Next.js App Router
✅ **Do** use framework-specific handlers like `toNextJsHandler()`

❌ **Don't** leave RLS disabled in production
✅ **Do** implement proper authorization (service-side API routes or custom RLS)

❌ **Don't** hardcode localhost ports
✅ **Do** support multiple ports in development, use env vars in production

## Conclusion

What seemed like a simple database connection turned into a multi-layered debugging session involving SSL certificates, schema conventions, framework integrations, and authentication systems. The key lesson: **search first, debug second**. Every issue we encountered had been solved by someone else - we just needed to find their solution.

When integrating third-party services and libraries, spend time understanding their requirements upfront rather than debugging afterwards. Read the complete documentation, check GitHub issues, and follow the exact patterns they recommend.

Most importantly: when you get stuck, step back and search. The answer is usually just a GitHub issue or Stack Overflow post away.
