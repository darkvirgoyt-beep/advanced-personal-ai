import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  User, Sparkles, Cpu, Wrench, Plus, Trash2, Loader2, ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Wrench, label: "Tools", path: "/tools" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function ToolsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [toolType, setToolType] = useState("system-instruction");
  const [endpoint, setEndpoint] = useState("");
  const [instruction, setInstruction] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // All hooks before early return
  const toolsQuery = trpc.tools.list.useQuery(undefined, { enabled: !!user });
  const saveMutation = trpc.tools.add.useMutation();
  const deleteMutation = trpc.tools.delete.useMutation();
  const utils = trpc.useUtils();

  if (loading || !isAuthenticated) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Tool name is required");
      return;
    }
    setIsSaving(true);
    try {
      await saveMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        toolType: toolType,
        endpoint: endpoint.trim() || undefined,
        systemInstruction: instruction.trim() || undefined,
      });
      await utils.tools.list.invalidate();
      setName("");
      setDescription("");
      setEndpoint("");
      setInstruction("");
      setShowAdd(false);
      toast.success("Tool added successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to add tool");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await utils.tools.list.invalidate();
      toast.success("Tool deleted");
    } catch { toast.error("Failed to delete"); }
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
              <Wrench className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Custom Tools</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4 mr-1" /> Add Tool
            </Button>
          </header>

          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {showAdd && (
                <Card className="p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label>Tool Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Code Reviewer, Security Scanner" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What this tool does" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Type</Label>
                    <select
                      value={toolType}
                      onChange={e => setToolType(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="system-instruction">System Instruction</option>
                      <option value="api-tool">API Tool</option>
                      <option value="code-analysis">Code Analysis</option>
                    </select>
                  </div>
                  {toolType === "api-tool" && (
                    <div className="space-y-1.5">
                      <Label>Endpoint URL</Label>
                      <Input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://api.example.com/tool" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>Instructions / Prompt</Label>
                    <Textarea value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="Detailed instructions for the AI to follow when using this tool..." className="min-h-[80px]" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm">
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Save Tool
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                  </div>
                </Card>
              )}

              <p className="text-sm text-muted-foreground">
                {toolsQuery.data?.tools?.length || 0} custom tool(s) configured
              </p>

              {(!toolsQuery.data?.tools || toolsQuery.data.tools.length === 0) && (
                <Card className="p-8 text-center">
                  <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No custom tools yet.</p>
                  <p className="text-muted-foreground text-xs mt-1">Add system instructions, API tools, or code analysis prompts.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
                    <Plus className="w-3 h-3 mr-1" /> Add Your First Tool
                  </Button>
                </Card>
              )}

              {toolsQuery.data?.tools?.map((tool: any) => (
                <Card key={tool.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{tool.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {tool.toolType === "system-instruction" ? "Instruction" : tool.toolType === "api-tool" ? "API Tool" : "Code Analysis"}
                        </Badge>
                      </div>
                      {tool.description && <p className="text-xs text-muted-foreground mb-1">{tool.description}</p>}
                      {tool.endpoint && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> {tool.endpoint}
                        </p>
                      )}
                      {tool.systemInstruction && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.systemInstruction}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tool.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}
