import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings,
  Send, Sparkles, Loader2, Trash2, Paperclip, X, Image, FileText, FileCode, LogIn,
  Cpu, Wrench, Github, FolderGit2, ChevronDown, Code2, BrainCircuit, Zap, Braces, Wand2, GraduationCap, Gamepad2, Search, ListChecks,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildChatModelOptions, DEFAULT_CHAT_MODEL, getConfiguredProviderGuidance, type ConfiguredChatModel } from "@/lib/chatModelOptions";
import { resolveComposerSecretAction } from "@/lib/privateSecretIntent";

type Message = { role: "user" | "assistant"; content: string };

type PendingFile = {
  name: string;
  type: string;
  size: number;
  url: string;
};

type GitHubRepository = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  language: string | null;
};

type ActiveProjectSelection = { id: number; name: string; path?: string };

function getActiveProjectSelection(): ActiveProjectSelection | null {
  try {
    const parsed = JSON.parse(localStorage.getItem("nova-active-development-project") || "null");
    return typeof parsed?.id === "number" && typeof parsed?.name === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function repositorySelectionKey(userId?: number): string {
  return `nova-selected-github-repositories:${userId || "workspace"}`;
}

function getSavedRepositorySelection(userId?: number): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(repositorySelectionKey(userId)) || "[]");
    return Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Cpu, label: "Models", path: "/models" },
  { icon: Wrench, label: "Tools", path: "/tools" },
  { icon: Code2, label: "Workspace", path: "/workspace" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const AI_MODES = [
  { value: "fast", label: "Fast", icon: Zap, description: "Quick answers" },
  { value: "reasoning", label: "Reason", icon: BrainCircuit, description: "Complex work" },
  { value: "coding", label: "Code", icon: Braces, description: "Build & debug" },
  { value: "creative", label: "Create", icon: Wand2, description: "Writing & ideas" },
  { value: "learning", label: "Learn", icon: GraduationCap, description: "Tutor mode" },
  { value: "gaming", label: "Gaming", icon: Gamepad2, description: "Play & design" },
  { value: "research", label: "Research", icon: Search, description: "Evidence-aware" },
  { value: "productivity", label: "Focus", icon: ListChecks, description: "Plans & action" },
] as const;
type AiModeValue = (typeof AI_MODES)[number]["value"];

export default function ChatPage() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId] = useState(() => localStorage.getItem("nova-session") || nanoid(16));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedRepoFullNames, setSelectedRepoFullNames] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState(DEFAULT_CHAT_MODEL);
  const [activeProject, setActiveProject] = useState<ActiveProjectSelection | null>(() => getActiveProjectSelection());
  const [aiMode, setAiMode] = useState("fast");
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [secretName, setSecretName] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [secretRequest, setSecretRequest] = useState("");

  // All hooks before any early return
  const historyQuery = trpc.chat.history.useQuery({ sessionId }, { enabled: !loading });
  const clearMutation = trpc.chat.clear.useMutation();
  const sendMutation = trpc.chat.send.useMutation();
  const githubReposQuery = trpc.git.listGitHubRepos.useQuery(undefined, { enabled: !loading, staleTime: 5 * 60 * 1000 });
  const settingsQuery = trpc.settings.get.useQuery(undefined, { enabled: !loading });
  const updateSettingsMutation = trpc.settings.update.useMutation();
  const customModelsQuery = trpc.models.list.useQuery(undefined, { enabled: !loading });
  const groqCheckQuery = trpc.groq.check.useQuery(undefined, { enabled: !loading });
  const saveSecretMutation = trpc.vault.add.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => { localStorage.setItem("nova-session", sessionId); }, [sessionId]);
  useEffect(() => {
    if (!loading) setSelectedRepoFullNames(getSavedRepositorySelection(user?.id));
  }, [loading, user?.id]);
  useEffect(() => {
    if (!loading) localStorage.setItem(repositorySelectionKey(user?.id), JSON.stringify(selectedRepoFullNames));
  }, [loading, selectedRepoFullNames, user?.id]);
  useEffect(() => {
    if (historyQuery.data?.messages) {
      setMessages(historyQuery.data.messages as Message[]);
    }
  }, [historyQuery.data]);
  useEffect(() => {
    if (!githubReposQuery.data) return;
    const available = new Set(githubReposQuery.data.repos.map(repo => repo.fullName));
    setSelectedRepoFullNames(current => current.filter(fullName => available.has(fullName)));
  }, [githubReposQuery.data]);
  useEffect(() => {
    if (settingsQuery.data?.model) setActiveModel(settingsQuery.data.model);
  }, [settingsQuery.data?.model]);
  useEffect(() => {
    if (settingsQuery.data?.aiMode) setAiMode(settingsQuery.data.aiMode);
    if (typeof settingsQuery.data?.memoryEnabled === "boolean") setMemoryEnabled(settingsQuery.data.memoryEnabled);
  }, [settingsQuery.data?.aiMode, settingsQuery.data?.memoryEnabled]);

  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  if (loading) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload/file", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          setPendingFiles(prev => [...prev, { name: file.name, type: file.type, size: file.size, url: data.url }]);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } catch { toast.error("Upload failed"); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRepository = (fullName: string) => {
    setSelectedRepoFullNames(current => current.includes(fullName)
      ? current.filter(item => item !== fullName)
      : [...current, fullName]);
  };

  const availableRepositories = (githubReposQuery.data?.repos || []) as GitHubRepository[];
  const selectedRepositories = availableRepositories.filter(repo => selectedRepoFullNames.includes(repo.fullName));
  const chatModelOptions = buildChatModelOptions({
    hasGroqKey: groqCheckQuery.data?.has || false,
    models: (customModelsQuery.data?.models || []) as ConfiguredChatModel[],
    activeModel,
  });
  const activeModelOption = chatModelOptions.find(option => option.value === activeModel);
  const configuredModels = (customModelsQuery.data?.models || []) as ConfiguredChatModel[];
  const configuredProviderGuidance = getConfiguredProviderGuidance(configuredModels);

  const changeActiveModel = async (nextModel: string) => {
    const previousModel = activeModel;
    setActiveModel(nextModel);
    try {
      await updateSettingsMutation.mutateAsync({ model: nextModel });
      await utils.settings.get.invalidate();
      toast.success("Chat model selected");
    } catch (err: any) {
      setActiveModel(previousModel);
      toast.error(err.message || "Could not change the chat model");
    }
  };

  const updateOperatingPreference = async (updates: { aiMode?: AiModeValue; memoryEnabled?: boolean }) => {
    const previousMode = aiMode;
    const previousMemory = memoryEnabled;
    if (updates.aiMode) setAiMode(updates.aiMode);
    if (updates.memoryEnabled !== undefined) setMemoryEnabled(updates.memoryEnabled);
    try {
      await updateSettingsMutation.mutateAsync(updates);
      await utils.settings.get.invalidate();
      toast.success(updates.aiMode ? "AI operating mode updated" : `Memory ${updates.memoryEnabled ? "enabled" : "paused"}`);
    } catch (error: any) {
      setAiMode(previousMode);
      setMemoryEnabled(previousMemory);
      toast.error(error.message || "Could not update AI preferences");
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && pendingFiles.length === 0) || isLoading) return;
    const secretAction = resolveComposerSecretAction(trimmed, pendingFiles.length > 0);
    if (secretAction.kind === "open-private-vault") {
      setSecretRequest(secretAction.request);
      setSecretName("");
      setSecretValue("");
      setInput("");
      setSecretDialogOpen(true);
      return;
    }
    setInput("");
    setIsLoading(true);
    const fileNames = pendingFiles.map(f => f.name).join(", ");
    const userMsg = pendingFiles.length > 0 ? `${trimmed ? trimmed + "\n\n" : ""}[Attached: ${fileNames}]` : trimmed;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    try {
      const attachmentInfo = pendingFiles.map(f => ({ fileName: f.name, fileType: f.type, url: f.url }));
      const result = await sendMutation.mutateAsync({
        message: trimmed || `[See attached files]`,
        sessionId,
        attachmentInfo,
        selectedRepoFullNames,
        activeProjectId: activeProject?.id,
        activeProjectPath: activeProject?.path,
      });
      setMessages(prev => [...prev, { role: "assistant", content: result.message }]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get response");
      setMessages(prev => prev.slice(0, -1));
    }
    setPendingFiles([]);
    setIsLoading(false);
  };

  const handleClear = async () => {
    try {
      await clearMutation.mutateAsync({ sessionId });
      setMessages([]);
      toast.success("Chat cleared");
    } catch { toast.error("Failed to clear"); }
  };

  const openPrivateSecretDialog = () => {
    setSecretRequest("");
    setSecretName("");
    setSecretValue("");
    setSecretDialogOpen(true);
  };

  const savePrivateSecret = async () => {
    const name = secretName.trim();
    if (!name || !secretValue) {
      toast.error("Add a secret name and value");
      return;
    }
    try {
      await saveSecretMutation.mutateAsync({ name, value: secretValue });
      setSecretDialogOpen(false);
      setSecretName("");
      setSecretValue("");
      setSecretRequest("");
      toast.success("Saved privately to the vault — it was not added to chat history");
    } catch (error: any) {
      toast.error(error.message || "Could not save private secret");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar">
          <SidebarHeader className="h-14 px-4 flex items-center gap-2 border-b border-border/50">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent" />
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Nova AI</span>
          </SidebarHeader>
          <SidebarContent className="px-2 py-2">
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={window.location.pathname === item.path}>
                    <button onClick={() => navigate(item.path)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <div className="p-3 border-t border-border/50">
            <div className="rounded-md px-3 py-2 text-xs text-muted-foreground">
              {user?.loginMethod === "google" ? (
                <><div className="flex items-center gap-2 text-foreground"><Shield className="w-3.5 h-3.5 text-primary" /> Google connected</div><p className="mt-1 truncate">{user.email || user.name}</p></>
              ) : (
                <><div className="flex items-center gap-2 text-foreground"><Shield className="w-3.5 h-3.5 text-primary" /> Private workspace</div><p className="mt-1">Saved on this device</p><button onClick={() => { window.location.href = "/api/auth/google/authorize"; }} className="mt-2 flex items-center gap-1 text-primary hover:underline"><LogIn className="w-3 h-3" /> Sync with Google</button></>
              )}
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b border-border/50 flex items-center justify-between px-4">
            <h2 className="font-semibold text-sm">AI Assistant</h2>
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          </header>

          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Ask Nova anything. Your personal unrestricted assistant.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/50"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/50 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pending files */}
          {pendingFiles.length > 0 && (
            <div className="border-t border-border/50 px-4 py-2">
              <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-accent/50 rounded-lg px-2.5 py-1.5 text-xs">
                    {f.type.startsWith("image/") ? <Image className="w-3 h-3 text-primary" /> : f.type.includes("json") || f.type.includes("code") ? <FileCode className="w-3 h-3 text-primary" /> : <FileText className="w-3 h-3 text-primary" />}
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => removePendingFile(i)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border/50 p-4">
            <div className="max-w-3xl mx-auto mb-2 rounded-lg border border-cyan-500/25 bg-cyan-500/5 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-cyan-500" /><div><p className="text-xs font-medium">AI operating mode</p><p className="text-[11px] text-muted-foreground">Shape how Nova approaches your next requests.</p></div></div>
                <Button variant="outline" size="sm" onClick={() => updateOperatingPreference({ memoryEnabled: !memoryEnabled })} disabled={updateSettingsMutation.isPending} className="h-7 text-xs">{memoryEnabled ? "Memory on" : "Memory paused"}</Button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1 sm:grid-cols-8">{AI_MODES.map(mode => { const Icon = mode.icon; const active = aiMode === mode.value; return <button key={mode.value} onClick={() => updateOperatingPreference({ aiMode: mode.value })} disabled={updateSettingsMutation.isPending} className={`rounded-md border px-1 py-1.5 text-center transition ${active ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100" : "border-border/60 text-muted-foreground hover:bg-accent"}`} title={mode.description}><Icon className="mx-auto h-3.5 w-3.5" /><span className="mt-1 block text-[10px]">{mode.label}</span></button>; })}</div>
            </div>
            <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
              <div className="min-w-0 flex items-center gap-2">
                <Shield className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0"><p className="text-xs font-medium">Private vault</p><p className="truncate text-[11px] text-muted-foreground">Save a token, password, or key privately. It never appears in chat history.</p></div>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 border-emerald-500/30" onClick={openPrivateSecretDialog}><Shield className="mr-1 h-3.5 w-3.5" /> Add secret</Button>
            </div>
            <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between gap-3 rounded-lg border border-indigo-500/25 bg-indigo-500/5 px-3 py-2">
              <div className="min-w-0 flex items-center gap-2">
                <Code2 className="h-4 w-4 shrink-0 text-indigo-500" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">Development project context</p>
                  <p className="truncate text-[11px] text-muted-foreground">{activeProject ? `${activeProject.name}${activeProject.path ? ` · ${activeProject.path}` : ""}` : "No active project selected"}</p>
                </div>
              </div>
              {activeProject ? <Button variant="outline" size="sm" className="shrink-0" onClick={() => { localStorage.removeItem("nova-active-development-project"); setActiveProject(null); }}><X className="mr-1 h-3.5 w-3.5" /> Clear</Button> : <Button variant="outline" size="sm" className="shrink-0" onClick={() => navigate("/workspace")}><Code2 className="mr-1 h-3.5 w-3.5" /> Choose project</Button>}
            </div>
            <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <div className="min-w-0 flex items-center gap-2">
                <Cpu className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">Chat model</p>
                  <p className="truncate text-[11px] text-muted-foreground">Choose the model Nova uses for your next message.</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Rates are provider-published estimates per 1M input/output tokens; actual usage and latency can vary.</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{configuredProviderGuidance}</p>
                </div>
              </div>
              <div className="min-w-0 flex flex-1 flex-col items-stretch gap-1 sm:flex-none sm:items-end">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate("/models?setup=nemotron")}>
                  <Cpu className="mr-1.5 h-3.5 w-3.5" /> Add Nemotron or another model
                </Button>
                <select
                  aria-label="Active chat model"
                  value={activeModel}
                  onChange={event => changeActiveModel(event.target.value)}
                  disabled={updateSettingsMutation.isPending || chatModelOptions.length === 0}
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 sm:w-[25rem]"
                >
                  {chatModelOptions.filter(option => option.group === "groq").length > 0 && (
                    <optgroup label="Groq">
                      {chatModelOptions.filter(option => option.group === "groq").map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </optgroup>
                  )}
                  {chatModelOptions.filter(option => option.group === "configured").length > 0 && (
                    <optgroup label="Configured providers">
                      {chatModelOptions.filter(option => option.group === "configured").map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </optgroup>
                  )}
                  {chatModelOptions.filter(option => option.group === "unavailable").map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {activeModelOption && (
                  <div className="mt-1 flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground sm:max-w-[25rem]">
                    <span>{activeModelOption.latency}</span>
                    <span aria-hidden="true">•</span>
                    <span title={activeModelOption.priceDetail}>{activeModelOption.price}</span>
                    {activeModelOption.estimate && <span className="rounded bg-muted px-1 py-0.5">estimated</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2">
              <div className="min-w-0 flex items-center gap-2">
                <Github className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs font-medium">Repository working context</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {githubReposQuery.isLoading
                      ? "Loading connected repositories…"
                      : selectedRepositories.length > 0
                        ? selectedRepositories.map(repo => repo.fullName).join(", ")
                        : githubReposQuery.data?.connected
                          ? "No repository selected for this chat"
                          : "Connect GitHub to give Nova repository context"}
                  </p>
                </div>
              </div>
              {githubReposQuery.data?.connected ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <FolderGit2 className="mr-1.5 h-3.5 w-3.5" />
                      {selectedRepositories.length ? `${selectedRepositories.length} selected` : "Select repos"}
                      <ChevronDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-2">
                    <div className="flex items-center justify-between gap-3 px-2 py-1.5">
                      <div>
                        <p className="text-sm font-medium">Select repositories</p>
                        <p className="text-xs text-muted-foreground">Choose one or multiple repositories for the next replies.</p>
                      </div>
                      {selectedRepoFullNames.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedRepoFullNames([])}>Clear</Button>
                      )}
                    </div>
                    <ScrollArea className="mt-1 max-h-64">
                      <div className="space-y-1 p-1">
                        {availableRepositories.map(repo => {
                          const checked = selectedRepoFullNames.includes(repo.fullName);
                          return (
                            <div key={repo.id} className="flex items-start gap-2 rounded-md px-2 py-2 hover:bg-accent/60">
                              <Checkbox id={`github-repo-${repo.id}`} checked={checked} onCheckedChange={() => toggleRepository(repo.fullName)} />
                              <label htmlFor={`github-repo-${repo.id}`} className="min-w-0 flex-1 cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-sm font-medium">{repo.fullName}</span>
                                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{repo.private ? "Private" : "Public"}</span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {repo.description || `${repo.defaultBranch}${repo.language ? ` · ${repo.language}` : ""}`}
                                </p>
                              </label>
                            </div>
                          );
                        })}
                        {availableRepositories.length === 0 && !githubReposQuery.isLoading && (
                          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No repositories are available from this GitHub connection.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => navigate("/git")}>
                  <Github className="mr-1.5 h-3.5 w-3.5" /> Connect GitHub
                </Button>
              )}
            </div>
            {githubReposQuery.isError && (
              <p className="max-w-3xl mx-auto mb-2 text-xs text-destructive">Repositories could not be loaded. Reconnect GitHub from the Git page and try again.</p>
            )}
            <div className="max-w-3xl mx-auto flex gap-2">
              <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.txt,.json,.js,.ts,.tsx,.jsx,.py,.cs,.cpp,.c,.h,.rs,.go,.java,.html,.css,.md" />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="self-end h-[44px]">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask Nova anything... (attach files with the clip icon)"
                className="min-h-[44px] max-h-[200px] resize-none"
                rows={1}
              />
              <Button onClick={handleSend} disabled={isLoading} size="icon" className="self-end h-[44px]">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </main>
      </div>
      <Dialog open={secretDialogOpen} onOpenChange={setSecretDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-500" /> Private secret vault</DialogTitle>
            <DialogDescription>{secretRequest ? "Nova opened this private form from your request. Your value will not be sent as a chat message." : "Save a sensitive value privately. Nova can use it server-side when needed, but it is never shown in your chat."}</DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5 text-sm font-medium">Secret label<Input value={secretName} onChange={event => setSecretName(event.target.value)} placeholder="Example: OpenRouter API key" autoFocus /></label>
          <label className="grid gap-1.5 text-sm font-medium">Secret value<Input type="password" value={secretValue} onChange={event => setSecretValue(event.target.value)} placeholder="Paste the private value" autoComplete="off" /></label>
          <p className="text-xs text-muted-foreground">The value is submitted directly to your private vault. Do not paste secrets into the regular message field.</p>
          <DialogFooter><Button variant="outline" onClick={() => setSecretDialogOpen(false)}>Cancel</Button><Button onClick={savePrivateSecret} disabled={saveSecretMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500">{saveSecretMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save privately</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
