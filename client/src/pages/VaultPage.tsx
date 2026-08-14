import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings, LogOut,
  User, Plus, Trash2, KeyRound,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
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

export default function VaultPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [showForm, setShowForm] = useState(false);

  const vaultQuery = trpc.vault.list.useQuery(undefined, { enabled: !!user });
  const addMutation = trpc.vault.add.useMutation();
  const deleteMutation = trpc.vault.delete.useMutation();
  const utils = trpc.useUtils();

  if (loading || !isAuthenticated) return null;

  const handleAdd = async () => {
    if (!name.trim() || !value.trim()) { toast.error("Name and value required"); return; }
    try {
      await addMutation.mutateAsync({ name: name.trim(), value: value.trim() });
      setName(""); setValue(""); setShowForm(false);
      utils.vault.list.invalidate();
      toast.success("Secret stored securely");
    } catch (err: any) { toast.error(err.message || "Failed"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      utils.vault.list.invalidate();
      toast.success("Secret deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <Sidebar className="border-r border-border/50 bg-sidebar">
          <SidebarHeader className="h-14 px-4 flex items-center gap-2 border-b border-border/50">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent" />
            <Shield className="w-4 h-4 text-primary" />
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
            <h2 className="font-semibold text-sm">Secret Vault</h2>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" /> Add Secret
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto">
              {showForm && (
                <Card className="p-4 mb-4 space-y-3">
                  <Input placeholder="Secret name (e.g., GITHUB_TOKEN)" value={name} onChange={e => setName(e.target.value)} />
                  <Input type="password" placeholder="Secret value (token, API key...)" value={value} onChange={e => setValue(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAdd}>Store Securely</Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secrets are injected into the AI context silently. They are never displayed in chat.
                  </p>
                </Card>
              )}

              {vaultQuery.data?.secrets.length === 0 ? (
                <div className="text-center py-16">
                  <KeyRound className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No secrets stored yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Add tokens and API keys that Nova can use for you.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vaultQuery.data?.secrets.map(s => (
                    <Card key={s.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <KeyRound className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">Stored {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
