import { betterAuth } from "better-auth"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

// Create PostgreSQL pool with SSL configuration using Supabase CA certificate
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    ca: fs.readFileSync(path.join(process.cwd(), "prod-ca-2021.crt")).toString(),
    rejectUnauthorized: true,
  },
})

export const auth = betterAuth({
  database: pool as any,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    modelName: "wr_user",
  },
  session: {
    modelName: "wr_session",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
  account: {
    modelName: "wr_account",
  },
  verification: {
    modelName: "wr_verification",
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  ].filter(Boolean) as string[],
})
