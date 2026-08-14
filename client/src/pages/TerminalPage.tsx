import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings, LogOut,
  User, Send, ChevronRight, Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

type TerminalLine = { type: "command" | "output" | "error"; content: string };
type WorkspaceProfile = "ubuntu" | "kali" | "developer" | "custom";

const profileDetails: Record<WorkspaceProfile, { label: string; banner: string }> = {
  ubuntu: { label: "Ubuntu workspace", banner: "Ubuntu-style shell workspace selected. Commands run on Nova’s managed Ubuntu host." },
  kali: { label: "Kali-style security workspace", banner: "Kali-style security workspace selected. This is a command-layout profile; Nova continues to run on its managed Ubuntu host." },
  developer: { label: "Developer workspace", banner: "Developer workspace selected. Use it for Node, Python, Git, and project tooling on the managed Ubuntu host." },
  custom: { label: "Custom workspace", banner: "Custom workspace selected. Your label is saved in this browser; commands still run on the managed Ubuntu host." },
};

export default function TerminalPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [command, setCommand] = useState("");
  const [profile, setProfile] = useState<WorkspaceProfile>(() => (localStorage.getItem("nova-terminal-profile") as WorkspaceProfile) || "ubuntu");
  const [customLabel, setCustomLabel] = useState(() => localStorage.getItem("nova-terminal-custom-label") || "My workspace");
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "output", content: "Nova Virtual PC Terminal v1.0\nConnected to managed Ubuntu Linux.\nChoose a workspace profile above; Type 'help' for available commands." },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, []);
  useEffect(() => { scrollToBottom(); }, [lines, isExecuting, scrollToBottom]);
  useEffect(() => { localStorage.setItem("nova-terminal-profile", profile); }, [profile]);
  useEffect(() => { localStorage.setItem("nova-terminal-custom-label", customLabel); }, [customLabel]);

  if (loading || !isAuthenticated) return null;

  const executeCommand = async () => {
    const trimmed = command.trim();
    if (!trimmed || isExecuting) return;

    setLines(prev => [...prev, { type: "command", content: `$ ${trimmed}` }]);
    setCommand("");
    setIsExecuting(true);

    if (trimmed === "help") {
      setLines(prev => [...prev, { type: "output", content: "Built-in commands:\n  help    - Show this help\n  clear   - Clear terminal\n  whoami  - Show current user\n  date    - Show current date\n  ls      - List working directory\n\nWorkspace profiles:\n  Ubuntu, Kali-style, Developer, and Custom labels are available above. All profiles use the same managed Ubuntu host.\n\nServer commands:\n  <cmd>   - Execute on server (e.g., ls -la, echo hello, node -v)" }]);
      setIsExecuting(false);
      return;
    }
    if (trimmed === "clear") { setLines([]); setIsExecuting(false); return; }
    if (trimmed === "whoami") { setLines(prev => [...prev, { type: "output", content: user?.name || "nova-user" }]); setIsExecuting(false); return; }
    if (trimmed === "date") { setLines(prev => [...prev, { type: "output", content: new Date().toString() }]); setIsExecuting(false); return; }
    if (trimmed === "ls") { setLines(prev => [...prev, { type: "output", content: "Use 'ls -la' or 'ls <path>' for directory listing on server" }]); setIsExecuting(false); return; }

    try {
      const res = await fetch("/api/terminal/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmed, profile }),
      });
      const data = await res.json();
      if (data.error) {
        setLines(prev => [...prev, { type: "error", content: data.error }]);
      } else {
        if (data.stdout) setLines(prev => [...prev, { type: "output", content: data.stdout }]);
        if (data.stderr) setLines(prev => [...prev, { type: "error", content: data.stderr }]);
        if (!data.stdout && !data.stderr) setLines(prev => [...prev, { type: "output", content: "(no output)" }]);
      }
    } catch (err) {
      setLines(prev => [...prev, { type: "error", content: "Connection error" }]);
    }
    setIsExecuting(false);
  };

  const selectProfile = (nextProfile: WorkspaceProfile) => {
    setProfile(nextProfile);
    const title = nextProfile === "custom" ? customLabel || "Custom workspace" : profileDetails[nextProfile].label;
    setLines(prev => [...prev, { type: "output", content: `[${title}] ${profileDetails[nextProfile].banner}` }]);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar">
          <SidebarHeader className="h-14 px-4 flex items-center gap-2 border-b border-border/50">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent" />
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Nova AI</span>
          </SidebarHeader>
          <SidebarContent className="px-2 py-2">
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={window.location.pathname === item.path}>
                    <button onClick={() => navigate(item.path)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <div className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  <User className="w-4 h-4 mr-2" />
                  {user?.name || "User"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top">
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="min-h-14 border-b border-border/50 flex flex-wrap items-center gap-3 px-4 py-2">
            <h2 className="font-semibold text-sm">Virtual PC Terminal</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="text-muted-foreground" htmlFor="workspace-profile">Workspace</label>
              <select id="workspace-profile" value={profile} onChange={e => selectProfile(e.target.value as WorkspaceProfile)} className="rounded-md border border-input bg-background px-2 py-1.5 text-xs">
                <option value="ubuntu">Ubuntu</option>
                <option value="kali">Kali-style security</option>
                <option value="developer">Developer</option>
                <option value="custom">Custom</option>
              </select>
              {profile === "custom" && (
                <Input value={customLabel} onChange={e => setCustomLabel(e.target.value)} placeholder="Workspace label" className="h-7 w-36 text-xs" maxLength={40} />
              )}
            </div>
          </header>

          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-[#0d1117] rounded-xl p-4 font-mono text-sm min-h-[400px]">
                <div className="mb-3 border-b border-white/10 pb-3 text-xs text-slate-400">
                  {profile === "custom" ? customLabel || "Custom workspace" : profileDetails[profile].label} · Managed Ubuntu host
                </div>
                {lines.map((line, i) => (
                  <div key={i} className={`terminal-line whitespace-pre-wrap ${
                    line.type === "command" ? "text-green-400" :
                    line.type === "error" ? "text-red-400" : "text-gray-300"
                  }`}>
                    {line.content}
                  </div>
                ))}
                {isExecuting && (
                  <div className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Executing...</span>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="border-t border-border/50 p-4">
            <div className="max-w-4xl mx-auto flex gap-2">
              <div className="flex-1 flex items-center bg-[#0d1117] rounded-lg px-3 font-mono text-sm">
                <ChevronRight className="w-4 h-4 text-green-400 mr-2 shrink-0" />
                <Input
                  ref={inputRef}
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") executeCommand(); }}
                  placeholder="Type a command..."
                  className="bg-transparent border-none text-gray-300 placeholder:text-gray-600 focus-visible:ring-0 h-10 px-0"
                  disabled={isExecuting}
                />
              </div>
              <Button onClick={executeCommand} disabled={isExecuting} size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
