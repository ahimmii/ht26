import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const dataDir = path.join(process.cwd(), "data", "db");

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "halloween",
    password: "halloween",
    port: 5432,
    persistent: true,
    onLog: (message) => {
      const text = String(message).trim();
      if (text) console.log(`[postgres] ${text}`);
    },
    onError: (error) => {
      console.error("[postgres]", error);
    },
  });

  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("Initializing local PostgreSQL cluster…");
    await pg.initialise();
  }

  console.log("Starting local PostgreSQL on :5432…");
  await pg.start();

  try {
    await pg.createDatabase("halloween_tangier");
    console.log("Created database halloween_tangier");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) {
      throw error;
    }
  }

  await run("npx", ["prisma", "migrate", "deploy"]);
  await run("npm", ["run", "db:seed"]);

  console.log("Starting Next.js at http://localhost:3000");
  const next = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    env: process.env,
  });

  const shutdown = async () => {
    next.kill("SIGTERM");
    await pg.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());

  next.on("exit", async (code) => {
    await pg.stop();
    process.exit(code ?? 0);
  });
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
