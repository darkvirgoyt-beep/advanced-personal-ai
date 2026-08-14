# Nova AI local launcher for Windows PowerShell.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 22 or newer is required. Install it from https://nodejs.org/, reopen PowerShell, then rerun this script."
}

$NodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($NodeMajor -lt 22) {
  throw "Nova AI requires Node.js 22 or newer."
}

if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
  npm install --global corepack@latest
}
corepack enable

if (-not (Test-Path .env)) {
  Copy-Item config\self-host.env.template .env
  Write-Host "Created .env from config\self-host.env.template. Set DATABASE_URL and JWT_SECRET, then run this command again."
  exit 1
}

if (Select-String -Quiet -Path .env -Pattern "CHANGE_ME") {
  throw "Update the CHANGE_ME values in .env before starting Nova AI."
}

pnpm install --frozen-lockfile
pnpm db:push
pnpm build
pnpm start
