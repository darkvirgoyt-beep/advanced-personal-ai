import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings, LogOut,
  User, Sparkles, Cpu, Plus, Trash2, Loader2, ExternalLink, KeyRound,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Cpu, label: "Models", path: "/models" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function ModelsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openai-compatible");
  const [endpoint, setEndpoint] = useState("");
  const [modelName, setModelName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
  const [replacementKey, setReplacementKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // All hooks before early return
  const modelsQuery = trpc.models.list.useQuery(undefined, { enabled: !!user });
  const saveMutation = trpc.models.add.useMutation();
  const toggleMutation = trpc.models.toggle.useMutation();
  const deleteMutation = trpc.models.delete.useMutation();
  const updateKeyMutation = trpc.models.updateKey.useMutation();
  const clearKeyMutation = trpc.models.clearKey.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {}, []);

  if (loading || !isAuthenticated) return null;

  const handleSave = async () => {
    if (!name.trim() || !endpoint.trim()) {
      toast.error("Name and endpoint are required");
      return;
    }
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        name: name.trim(),
        provider: provider.trim() || "openai-compatible",
        endpoint: endpoint.trim(),
        modelName: modelName.trim() || name.trim(),
        apiKey: apiKey.trim() || undefined,
      });
      await utils.models.list.invalidate();
      setName("");
      setProvider("openai-compatible");
      setEndpoint("");
      setModelName("");
      setApiKey("");
      setShowAdd(false);
      toast.success("Model added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add model");
    }
    setIsSaving(false);
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleMutation.mutateAsync({ id });
      await utils.models.list.invalidate();
    } catch { toast.error("Failed to toggle model"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await utils.models.list.invalidate();
      toast.success("Model deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleUpdateKey = async (id: number) => {
    if (!replacementKey.trim()) { toast.error("Enter an API key first"); return; }
    try {
      await updateKeyMutation.mutateAsync({ id, apiKey: replacementKey.trim() });
      setReplacementKey("");
      setEditingKeyId(null);
      await utils.models.list.invalidate();
      toast.success("Custom model key updated");
    } catch (err: any) { toast.error(err.message || "Failed to update key"); }
  };

  const handleClearKey = async (id: number) => {
    if (!window.confirm("Remove this custom model API key? The endpoint configuration will remain.")) return;
    try {
      await clearKeyMutation.mutateAsync({ id });
      await utils.models.list.invalidate();
      toast.success("Custom model key removed");
    } catch (err: any) { toast.error(err.message || "Failed to remove key"); }
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

        <main className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border/50 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Custom Models</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4 mr-1" /> Add Model
            </Button>
          </header>

          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {showAdd && (
                <Card className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Model Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., GPT-4o, Claude 3.5, Gemini" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Provider label</Label>
                      <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="OpenAI, Ollama, Together" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Model ID</Label>
                      <Input value={modelName} onChange={e => setModelName(e.target.value)} placeholder="e.g., gpt-4o-mini" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>API Endpoint (OpenAI-compatible)</Label>
                    <Input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.openai.com/v1/chat/completions" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>API Key (optional)</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="pl-10" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm">
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Save Model
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {modelsQuery.data?.models?.length || 0} custom model(s) configured
                </p>
              </div>

              {(!modelsQuery.data?.models || modelsQuery.data.models.length === 0) && (
                <Card className="p-8 text-center">
                  <Cpu className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No custom models yet.</p>
                  <p className="text-muted-foreground text-xs mt-1">Add any OpenAI-compatible API endpoint to use alongside Groq.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Your First Model
                  </Button>
                </Card>
              )}

              {modelsQuery.data?.models?.map((model: any) => (
                <Card key={model.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{model.name}</p>
                      {model.isActive === "true" ? (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[300px]">{model.endpoint}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{model.provider || "openai-compatible"} · {model.modelName}</p>
                    {model.hasApiKey ? (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><KeyRound className="w-3 h-3" /> Key configured</p>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditingKeyId(model.id); setReplacementKey(""); }}>Replace key</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => handleClearKey(model.id)}>Remove key</Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => { setEditingKeyId(model.id); setReplacementKey(""); }}>Add API key</Button>
                    )}
                    {editingKeyId === model.id && (
                      <div className="flex gap-2 mt-2">
                        <Input type="password" value={replacementKey} onChange={e => setReplacementKey(e.target.value)} placeholder="Paste replacement API key" className="h-8 text-xs" />
                        <Button size="sm" className="h-8" onClick={() => handleUpdateKey(model.id)} disabled={updateKeyMutation.isPending}>Save</Button>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingKeyId(null)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={model.isActive === "true"}
                      onCheckedChange={() => handleToggle(model.id)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(model.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              <Card className="p-4 bg-accent/30 border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">How it works:</strong> Custom models are OpenAI-compatible chat completion endpoints. When active, they appear as options in the chat settings. The API key is stored securely and used only when sending requests to that endpoint.
                </p>
              </Card>
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}
