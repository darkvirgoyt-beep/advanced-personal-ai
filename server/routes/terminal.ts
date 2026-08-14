import { exec } from "child_process";
import { promisify } from "util";
import { Express } from "express";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import { storagePut } from "../storage";

const execAsync = promisify(exec);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

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

  // File upload endpoint - uploads to S3 storage
  app.post("/api/upload/file", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const file = req.file;
      const ext = path.extname(file.originalname) || "";
      const safeName = `${nanoid(8)}${ext}`;
      const { key, url } = await storagePut(
        `uploads/${safeName}`,
        file.buffer as Buffer,
        file.mimetype || "application/octet-stream"
      );

      res.json({
        success: true,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        storageKey: key,
        url: url,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Upload failed" });
    }
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
        "archiver": "^7.0.0",
        "multer": "^1.4.5-lts.1",
      },
    }, null, 2), "package.json");

    archive.append(`# Nova AI - Personal Assistant\n\nAI-powered personal workspace with Groq API, secret vault, terminal, git integration, and custom models.\n\n## Features\n- Groq API powered AI chat\n- Secret vault for tokens/API keys\n- Virtual PC terminal\n- Git push integration\n- Chart gallery\n- Custom models & tools\n- File/photo uploads\n\n## Setup\n1. pnpm install\n2. Set DATABASE_URL, JWT_SECRET, and your Groq API key in the app\n3. pnpm dev\n\n## Deploy\n1. Push to GitHub\n2. Deploy on Railway, Render, or any Node.js host\n3. Set environment variables\n`, "README.md");

    archive.append(`import { defineConfig } from "drizzle-kit";\nexport default defineConfig({\n  schema: "./drizzle/schema.ts",\n  out: "./drizzle/migrations",\n  dialect: "mysql",\n});\n`, "drizzle.config.ts");

    archive.append(`FROM node:22-alpine\nWORKDIR /app\nCOPY package.json pnpm-lock.yaml ./\nRUN corepack enable && pnpm install --frozen-lockfile\nCOPY . .\nRUN pnpm build\nENV NODE_ENV=production\nENV PORT=3000\nEXPOSE 3000\nCMD ["node", "dist/index.js"]\n`, "Dockerfile");

    archive.append(`version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - DATABASE_URL=mysql://user:pass@db:3306/nova\n      - JWT_SECRET=your-jwt-secret\n    depends_on:\n      - db\n  db:\n    image: mysql:8\n    environment:\n      MYSQL_ROOT_PASSWORD: root\n      MYSQL_DATABASE: nova\n    ports:\n      - "3306:3306"\n`, "docker-compose.yml");

    archive.append(`# Nova AI Configuration\n# Copy this to .env and fill in values\nDATABASE_URL=mysql://user:pass@host:3306/dbname\nJWT_SECRET=your-jwt-secret\n# Groq API key is set in the app UI\n`, ".env.example");

    archive.finalize();
  });

  // GitHub webhook handler for push notifications
  app.post("/api/github/webhook", (req, res) => {
    // Accept webhook payloads from GitHub
    res.json({ status: "ok" });
  });
}
