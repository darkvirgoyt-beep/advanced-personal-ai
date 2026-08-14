import { chmod, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");

async function script(name: string): Promise<string> {
  return readFile(path.join(projectRoot, "scripts", name), "utf8");
}

async function createLauncherFixture(): Promise<{ root: string; bin: string; commandLog: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "nova-ai-launcher-"));
  const bin = path.join(root, "bin");
  const commandLog = path.join(root, "commands.log");
  await cp(path.join(projectRoot, "scripts"), path.join(root, "scripts"), { recursive: true });
  await cp(path.join(projectRoot, "config"), path.join(root, "config"), { recursive: true });
  await mkdir(bin);

  const fakeNode = "#!/usr/bin/env sh\nif [ \"$1\" = \"-p\" ]; then echo 22; fi\n";
  const fakeCommand = `#!/usr/bin/env sh\necho \"$0 $@\" >> \"${commandLog}\"\nexit 0\n`;
  const fakeOpenSsl = "#!/usr/bin/env sh\nif [ \"$1\" = \"rand\" ]; then echo termux-test-secret; fi\n";
  await Promise.all([
    writeFile(path.join(bin, "node"), fakeNode),
    writeFile(path.join(bin, "npm"), fakeCommand),
    writeFile(path.join(bin, "corepack"), fakeCommand),
    writeFile(path.join(bin, "pnpm"), fakeCommand),
    writeFile(path.join(bin, "pkg"), fakeCommand),
    writeFile(path.join(bin, "openssl"), fakeOpenSsl),
  ]);
  await Promise.all(["node", "npm", "corepack", "pnpm", "pkg", "openssl"].map(name => chmod(path.join(bin, name), 0o755)));
  return { root, bin, commandLog };
}

async function runBash(root: string, bin: string, command: string, input = ""): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-lc", command], {
      cwd: root,
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", data => { output += data.toString(); });
    child.stderr.on("data", data => { output += data.toString(); });
    child.on("error", reject);
    child.on("close", code => resolve({ code, output }));
    child.stdin.end(input);
  });
}

describe("portable Nova AI launchers", () => {
  it("bootstraps Linux/macOS configuration, then runs install, migration, build, and start in a controlled environment", async () => {
    const fixture = await createLauncherFixture();
    try {
      const firstRun = await runBash(fixture.root, fixture.bin, "bash scripts/start-local.sh");
      expect(firstRun.code).toBe(1);
      expect(firstRun.output).toContain("Created .env");
      expect(await readFile(path.join(fixture.root, ".env"), "utf8")).toContain("DATABASE_URL=mysql://nova_user:CHANGE_ME");

      await writeFile(path.join(fixture.root, ".env"), "DATABASE_URL=mysql://nova:password@db:3306/nova\nJWT_SECRET=test-secret\n");
      const configuredRun = await runBash(fixture.root, fixture.bin, "bash scripts/start-local.sh");
      expect(configuredRun.code).toBe(0);
      const calls = await readFile(fixture.commandLog, "utf8");
      expect(calls).toContain("pnpm install --frozen-lockfile");
      expect(calls).toContain("pnpm db:push");
      expect(calls).toContain("pnpm build");
      expect(calls).toContain("pnpm start");
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  it("runs the Termux first-run flow in a controlled package environment and generates only local configuration", async () => {
    const fixture = await createLauncherFixture();
    try {
      const result = await runBash(fixture.root, fixture.bin, "bash scripts/start-termux.sh", "mysql://nova:password@db:3306/nova\n");
      expect(result.code).toBe(0);
      const environment = await readFile(path.join(fixture.root, ".env"), "utf8");
      expect(environment).toContain("DATABASE_URL=mysql://nova:password@db:3306/nova");
      expect(environment).toContain("JWT_SECRET=termux-test-secret");
      expect(environment).toContain("STORAGE_MODE=local");
      const calls = await readFile(fixture.commandLog, "utf8");
      expect(calls).toContain("pnpm db:push");
      expect(calls).toContain("pnpm start");
    } finally {
      await rm(fixture.root, { recursive: true, force: true });
    }
  });

  it("documents Windows PowerShell prerequisites and matching configuration, migration, build, and start commands", async () => {
    const content = await script("start-windows.ps1");
    expect(content).toContain("Get-Command node");
    expect(content).toContain("Node.js 22 or newer");
    expect(content).toContain("config\\self-host.env.template");
    expect(content).toContain("pnpm db:push");
    expect(content).toContain("pnpm build");
    expect(content).toContain("pnpm start");
  });
});
