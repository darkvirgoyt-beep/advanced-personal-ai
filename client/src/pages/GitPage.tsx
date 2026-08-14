import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  User, Plus, Trash2, Download, Loader2, Github,
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getGitHubConnectionMessage } from "@/lib/githubConnection";

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function GitPage() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [pushing, setPushing] = useState(false);
  const [githubConnection, setGithubConnection] = useState<{ connected: boolean; login: string } | null>(null);
  const connectionMessage = getGitHubConnectionMessage(githubConnection);

  const gitQuery = trpc.git.list.useQuery(undefined, { enabled: !loading });
  const addMutation = trpc.git.add.useMutation();
  const deleteMutation = trpc.git.delete.useMutation();
  const pushMutation = trpc.git.push.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (loading) return;
    fetch("/api/github/status")
      .then(response => response.ok ? response.json() : null)
      .then(status => { if (status) setGithubConnection(status); })
      .catch(() => setGithubConnection(null));
  }, [loading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("github_connected") === "true") {
      toast.success("GitHub connected to this Nova AI workspace");
      window.history.replaceState({}, "", "/git");
      fetch("/api/github/status")
        .then(response => response.ok ? response.json() : null)
        .then(status => { if (status) setGithubConnection(status); })
        .catch(() => undefined);
      return;
    }

    const authError = params.get("error");
    const messages: Record<string, string> = {
      github_not_configured: "GitHub sign-in is not configured yet.",
      github_auth_expired: "GitHub sign-in expired. Please authorize again.",
      github_profile_failed: "GitHub could not provide account information. Please try again.",
      github_auth_failed: "GitHub authorization was not completed. Please try again.",
    };
    if (authError && messages[authError]) {
      toast.error(messages[authError]);
      window.history.replaceState({}, "", "/git");
    }
  }, []);

  if (loading) return null;

  const handleAdd = async () => {
    if (!repoName.trim() || !remoteUrl.trim()) { toast.error("Name and URL required"); return; }
    try {
      await addMutation.mutateAsync({ name: repoName.trim(), remoteUrl: remoteUrl.trim(), branch: branch.trim() || "main", username: username.trim() || undefined, token: token.trim() || undefined });
      setRepoName(""); setRemoteUrl(""); setBranch("main"); setUsername(""); setToken("");
      setShowForm(false);
      utils.git.list.invalidate();
      toast.success("Repository configured");
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      utils.git.list.invalidate();
      toast.success("Repository removed");
    } catch { toast.error("Failed"); }
  };

  const handlePush = async (repoId: number) => {
    setPushing(true);
    try {
      const result = await pushMutation.mutateAsync({ repoId });
      toast.success(`Push config ready: ${result.branch}`);
      // In a real scenario, we'd trigger a git push here
      // For now, show the authenticated URL info
      if (result.hasCredentials) {
        toast.info("Credentials configured — repo ready for push via terminal");
      } else {
        toast.warning("No credentials — push via terminal or add token in settings");
      }
    } catch (err: any) { toast.error(err.message || "Push failed"); }
    setPushing(false);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar">
          <SidebarHeader className="h-14 px-4 flex items-center gap-2 border-b border-border/50">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent" />
            <GitBranch className="w-4 h-4 text-primary" />
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
          <header className="h-14 border-b border-border/50 flex items-center justify-between px-4">
            <h2 className="font-semibold text-sm">Git Repositories</h2>
            <div className="flex gap-2">
              {githubConnection?.connected ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100"
                  onClick={async () => {
                    const response = await fetch("/api/github/disconnect", { method: "POST" });
                    if (!response.ok) return toast.error("Could not disconnect GitHub");
                    setGithubConnection({ connected: false, login: "" });
                    toast.success("GitHub disconnected from this workspace");
                  }}
                >
                  <Github className="w-4 h-4 mr-1" /> Connected: {githubConnection.login} · Disconnect
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100"
                  onClick={() => window.location.assign("/api/github/authorize")}
                >
                  <Github className="w-4 h-4 mr-1" /> Authorize GitHub
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { window.location.assign("/api/download/project-zip?download=1"); }}
              >
                <Download className="w-4 h-4 mr-1" /> Download ZIP
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
                <Plus className="w-4 h-4 mr-1" /> Add Repo
              </Button>
            </div>
          </header>

          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto">
              <Card className="p-4 mb-4 bg-muted/40">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{connectionMessage.title}</strong> {connectionMessage.detail}
                </p>
              </Card>

              {showForm && (
                <Card className="p-4 mb-4 space-y-3">
                  <Input placeholder="Repository name" value={repoName} onChange={e => setRepoName(e.target.value)} />
                  <Input placeholder="Remote URL (https://github.com/user/repo.git)" value={remoteUrl} onChange={e => setRemoteUrl(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Branch (default: main)" value={branch} onChange={e => setBranch(e.target.value)} />
                    <Input placeholder="Username (optional)" value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                  <Input type="password" placeholder="Personal Access Token (optional)" value={token} onChange={e => setToken(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAdd}>Add Repository</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </Card>
              )}

              {gitQuery.data?.repos.length === 0 ? (
                <div className="text-center py-16">
                  <GitBranch className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No repositories configured.</p>
                  <p className="text-xs text-muted-foreground mt-1">Add a GitHub repo to push files directly.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {gitQuery.data?.repos.map(repo => (
                    <Card key={repo.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <GitBranch className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{repo.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{repo.remoteUrl}</p>
                            <p className="text-xs text-muted-foreground mt-1">Branch: {repo.branch} {repo.token ? "• Credentials ✓" : "• No credentials"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handlePush(repo.id)} disabled={pushing}>
                            {pushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                            Push
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(repo.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}
