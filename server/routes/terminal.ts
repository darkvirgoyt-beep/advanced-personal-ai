import { exec } from "child_process";
import { promisify } from "util";
import { Express } from "express";

const execAsync = promisify(exec);

export function registerCustomRoutes(app: Express) {
  app.post("/api/terminal/execute", (req, res) => {
    const { command } = req.body;
    if (!command || typeof command !== "string") {
      res.status(400).json({ error: "Invalid command" });
      return;
    }

    // Safety: block dangerous commands
    const blocked = ["rm -rf /", "mkfs", "dd if=", "shutdown", "reboot", "halt"];
    const lower = command.toLowerCase();
    if (blocked.some(b => lower.includes(b))) {
      res.status(403).json({ error: "Command blocked for safety" });
      return;
    }

    execAsync(command, { timeout: 30000, maxBuffer: 1024 * 1024 })
      .then(({ stdout, stderr }) => {
        res.json({ stdout: stdout || "", stderr: stderr || "", exitCode: 0 });
      })
      .catch((err: any) => {
        res.json({
          stdout: err.stdout || "",
          stderr: err.stderr || "",
          exitCode: err.code || 1,
          killed: err.killed || false,
        });
      });
  });

  app.get("/api/download/project-zip", (req, res) => {
    const archiver = require("archiver");
    const archive = archiver("zip", { zlib: { level: 9 } });
    res.setHeader("Content-Disposition", "attachment; filename=nova-ai-project.zip");
    res.setHeader("Content-Type", "application/zip");
    archive.pipe(res);

    archive.append(JSON.stringify({
      name: "nova-ai-assistant",
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "NODE_ENV=development tsx watch server/_core/index.ts",
        build: "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
        start: "NODE_ENV=production node dist/index.js",
      },
      dependencies: {
        "@aws-sdk/client-s3": "^3.693.0",
        "@trpc/client": "^11.6.0",
        "@trpc/server": "^11.6.0",
        "drizzle-orm": "^0.44.5",
        "express": "^4.21.2",
        "mysql2": "^3.15.0",
        "zod": "^4.1.12",
      },
    }, null, 2), "package.json");

    archive.append(`# Nova AI - Personal Assistant\n\nAI-powered personal workspace.\n\n## Setup\n1. pnpm install\n2. Set DATABASE_URL, JWT_SECRET\n3. pnpm dev\n`, "README.md");

    archive.append(`import { defineConfig } from "drizzle-kit";\nexport default defineConfig({\n  schema: "./drizzle/schema.ts",\n  out: "./drizzle/migrations",\n  dialect: "mysql",\n});\n`, "drizzle.config.ts");

    archive.finalize();
  });
}
