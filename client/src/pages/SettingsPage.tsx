import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  User, Save, Loader2, Trash2, Plus, KeyRound, ShieldCheck, LockKeyhole, BrainCircuit,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
  "whisper-large-v3",
];

export default function SettingsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [vaultValue, setVaultValue] = useState("");
  const [newApiKey, setNewApiKey] = useState("");

  // All hooks before early return
  const settingsQuery = trpc.settings.get.useQuery(undefined, { enabled: !!user });
  const updateSettingsMutation = trpc.settings.update.useMutation();
  const vaultQuery = trpc.vault.list.useQuery(undefined, { enabled: !!user });
  const vaultAddMutation = trpc.vault.add.useMutation();
  const vaultDeleteMutation = trpc.vault.delete.useMutation();
  const groqSaveMutation = trpc.groq.save.useMutation();
  const groqClearMutation = trpc.groq.clear.useMutation();
  const customModelsQuery = trpc.models.list.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (settingsQuery.data) {
      if (settingsQuery.data.model) setModel(settingsQuery.data.model);
      if (settingsQuery.data.systemPrompt) setSystemPrompt(settingsQuery.data.systemPrompt);
      if (typeof settingsQuery.data.memoryEnabled === "boolean") setMemoryEnabled(settingsQuery.data.memoryEnabled);
    }
  }, [settingsQuery.data]);

  if (loading || !isAuthenticated) return null;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateSettingsMutation.mutateAsync({ model, systemPrompt, memoryEnabled });
      toast.success("Settings saved");
    } catch { toast.error("Failed to save"); }
    setIsSaving(false);
  };

  const handleAddVaultSecret = async () => {
    if (!vaultName.trim() || !vaultValue.trim()) { toast.error("Name and value required"); return; }
    try {
      await vaultAddMutation.mutateAsync({ name: vaultName.trim(), value: vaultValue.trim() });
      setVaultName(""); setVaultValue("");
      utils.vault.list.invalidate();
      toast.success("Secret stored");
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const handleDeleteVaultSecret = async (id: number) => {
    try {
      await vaultDeleteMutation.mutateAsync({ id });
      utils.vault.list.invalidate();
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const handleSaveApiKey = async () => {
    const key = newApiKey.trim();
    if (!key.startsWith("gsk_")) { toast.error("Key must start with gsk_"); return; }
    try {
      await groqSaveMutation.mutateAsync({ apiKey: key });
      setNewApiKey("");
      utils.groq.check.invalidate();
      toast.success("API key updated");
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const handleClearApiKey = async () => {
    if (!window.confirm("Remove the saved Groq API key? Nova will return to the API-key gate, but your chats and workspace data will stay saved.")) return;
    try {
      await groqClearMutation.mutateAsync();
      setNewApiKey("");
      await utils.groq.check.invalidate();
      toast.success("Groq API key removed. Add a new gsk_ key to chat again.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove API key");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar">
          <SidebarHeader className="h-14 px-4 flex items-center gap-2 border-b border-border/50">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent" />
            <Settings className="w-4 h-4 text-primary" />
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
          <header className="h-14 border-b border-border/50 flex items-center px-4">
            <h2 className="font-semibold text-sm">Settings</h2>
          </header>

          <ScrollArea className="flex-1 p-4">
            <div className="max-w-2xl mx-auto">
              <Tabs defaultValue="model">
                <TabsList className="mb-4">
                  <TabsTrigger value="model">Model</TabsTrigger>
                  <TabsTrigger value="apikey">API Key</TabsTrigger>
                  <TabsTrigger value="vault">Vault</TabsTrigger>
                  <TabsTrigger value="privacy">Privacy</TabsTrigger>
                </TabsList>

                <TabsContent value="model" className="space-y-4">
                  <Card className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>AI Model</Label>
                      <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        {MODELS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        {customModelsQuery.data?.models.some(customModel => customModel.isActive === "true" && customModel.hasApiKey) && (
                          <optgroup label="Configured providers">
                            {customModelsQuery.data.models
                              .filter(customModel => customModel.isActive === "true" && customModel.hasApiKey)
                              .map(customModel => (
                                <option key={customModel.id} value={`custom:${customModel.id}`}>
                                  {customModel.name} · {customModel.modelName}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {model.startsWith("custom:") && !customModelsQuery.data?.models.some(customModel => `custom:${customModel.id}` === model) && (
                          <option value={model}>Unavailable saved custom model</option>
                        )}
                      </select>
                    </div>
                    <p className="text-xs text-muted-foreground">Groq models use your active gsk_ key. Kie AI and other configured providers appear here after they have an active model and API key.</p>
                    <div className="space-y-2">
                      <Label>System Prompt (optional)</Label>
                      <Textarea
                        value={systemPrompt}
                        onChange={e => setSystemPrompt(e.target.value)}
                        placeholder="Customize Nova's behavior..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <Button onClick={handleSaveSettings} disabled={isSaving} size="sm">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Settings
                    </Button>
                  </Card>
                </TabsContent>

                <TabsContent value="apikey" className="space-y-4">
                  <Card className="p-4 space-y-3">
                    <Label>Replace Groq API Key</Label>
                    <Input
                      type="password"
                      placeholder="gsk_..."
                      value={newApiKey}
                      onChange={e => setNewApiKey(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={handleSaveApiKey} disabled={groqSaveMutation.isPending}>
                        {groqSaveMutation.isPending ? "Saving…" : "Save New Key"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearApiKey} disabled={groqClearMutation.isPending} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {groqClearMutation.isPending ? "Removing…" : "Remove Saved Key"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Saving a new key replaces the active one. Removing it keeps your saved chats and workspace data, but returns Nova to the Groq key gate.</p>
                  </Card>
                </TabsContent>

                <TabsContent value="vault" className="space-y-4">
                  <Card className="p-4 space-y-3">
                    <h3 className="text-sm font-medium">Secret Vault</h3>
                    <div className="flex gap-2">
                      <Input placeholder="Secret name" value={vaultName} onChange={e => setVaultName(e.target.value)} className="flex-1" />
                      <Input type="password" placeholder="Value" value={vaultValue} onChange={e => setVaultValue(e.target.value)} className="flex-1" />
                      <Button size="sm" onClick={handleAddVaultSecret}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {vaultQuery.data?.secrets.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No secrets stored</p>
                    ) : (
                      <div className="space-y-2">
                        {vaultQuery.data?.secrets.map(s => (
                          <div key={s.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <KeyRound className="w-3 h-3 text-primary" />
                              <span className="text-xs">{s.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteVaultSecret(s.id)} className="text-destructive h-6 w-6 p-0">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">Secrets are injected into the AI context only. Never visible in chat.</p>
                  </Card>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-4">
                  <Card className="p-5 space-y-5">
                    <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-primary" /><div><h3 className="text-sm font-medium">Private workspace controls</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">These controls apply to your current NovaAI workspace. They do not move provider keys, vault values, or chat data into the public chat interface.</p></div></div>
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 p-4"><div className="pr-4"><div className="flex items-center gap-2 text-sm font-medium"><BrainCircuit className="h-4 w-4 text-primary" /> Use saved chat memory</div><p className="mt-1 text-xs leading-5 text-muted-foreground">When enabled, Nova may include recent messages from the open conversation for continuity. When disabled, new replies use only your latest message and selected context.</p></div><Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} aria-label="Use saved chat memory" /></div>
                    <Button onClick={handleSaveSettings} disabled={isSaving} size="sm">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save privacy settings</Button>
                  </Card>
                  <Card className="p-5"><div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 text-emerald-500" /><div><h3 className="text-sm font-medium">What stays private</h3><ul className="mt-2 space-y-2 text-xs leading-5 text-muted-foreground"><li>Vault values are stored separately and are never rendered into chat history or exports.</li><li>Provider API keys are saved server-side and never returned in settings, model, or documentation responses.</li><li>Conversation exports contain only the selected conversation’s text messages; they exclude vault entries, provider credentials, file bytes, GitHub tokens, and other workspace records.</li><li>Chat, folders, GitHub context, and exports remain scoped to this browser workspace or signed-in account.</li></ul></div></div></Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}
