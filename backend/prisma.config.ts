import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // The Prisma CLI requires a direct connection for migrations and pushing schemas.
    // It will use DIRECT_URL (port 5432) from your .env file here.
    url: process.env["DIRECT_URL"],
  },
});
