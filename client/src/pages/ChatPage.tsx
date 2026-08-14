import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings, LogOut,
  Send, User, Sparkles, Loader2, Trash2,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { nanoid } from "nanoid";

type Message = { role: "user" | "assistant"; content: string };

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function ChatPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId] = useState(() => localStorage.getItem("nova-session") || nanoid(16));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // All hooks before any early return
  const historyQuery = trpc.chat.history.useQuery({ sessionId }, { enabled: !!user });
  const clearMutation = trpc.chat.clear.useMutation();
  const sendMutation = trpc.chat.send.useMutation();

  useEffect(() => { localStorage.setItem("nova-session", sessionId); }, [sessionId]);
  useEffect(() => {
    if (historyQuery.data?.messages) {
      setMessages(historyQuery.data.messages as Message[]);
    }
  }, [historyQuery.data]);

  const scrollToBottom = useCallback(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
    if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  if (loading || !isAuthenticated) return null;

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    try {
      const result = await sendMutation.mutateAsync({ message: trimmed, sessionId });
      setMessages(prev => [...prev, { role: "assistant", content: result.message }]);
    } catch (err: any) {
      toast.error(err.message || "Failed to get response");
      setMessages(prev => prev.slice(0, -1));
    }
    setIsLoading(false);
  };

  const handleClear = async () => {
    try {
      await clearMutation.mutateAsync({ sessionId });
      setMessages([]);
      toast.success("Chat cleared");
    } catch { toast.error("Failed to clear"); }
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

          {/* Input */}
          <div className="border-t border-border/50 p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask Nova anything..."
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
    </SidebarProvider>
  );
}
