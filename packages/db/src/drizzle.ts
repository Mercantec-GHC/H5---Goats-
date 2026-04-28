import { drizzle } from "drizzle-orm/neon-http";
import dotenv from "dotenv";
import path from "path";
import * as schema from "./schema";

dotenv.config({
  path: path.resolve(process.cwd(), "../../.env"),
});

export const db = drizzle(process.env.DATABASE_URL!, { schema });