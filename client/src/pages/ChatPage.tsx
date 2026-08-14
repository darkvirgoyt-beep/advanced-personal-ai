import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings,
  Send, Sparkles, Loader2, Trash2, Paperclip, X, Image, FileText, FileCode,
  Cpu, Wrench,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { nanoid } from "nanoid";

type Message = { role: "user" | "assistant"; content: string };

type PendingFile = {
  name: string;
  type: string;
  size: number;
  url: string;
};

const navItems = [
  { icon: MessageSquare, label: "Chat", path: "/chat" },
  { icon: Shield, label: "Vault", path: "/vault" },
  { icon: Cpu, label: "Models", path: "/models" },
  { icon: Wrench, label: "Tools", path: "/tools" },
  { icon: Terminal, label: "Terminal", path: "/terminal" },
  { icon: BarChart3, label: "Charts", path: "/charts" },
  { icon: GitBranch, label: "Git", path: "/git" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function ChatPage() {
  const { loading } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId] = useState(() => localStorage.getItem("nova-session") || nanoid(16));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // All hooks before any early return
  const historyQuery = trpc.chat.history.useQuery({ sessionId }, { enabled: !loading });
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

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && pendingFiles.length === 0) || isLoading) return;
    setInput("");
    setIsLoading(true);
    const fileNames = pendingFiles.map(f => f.name).join(", ");
    const userMsg = pendingFiles.length > 0 ? `${trimmed ? trimmed + "\n\n" : ""}[Attached: ${fileNames}]` : trimmed;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    try {
      const attachmentInfo = pendingFiles.map(f => ({ fileName: f.name, fileType: f.type, url: f.url }));
      const result = await sendMutation.mutateAsync({ message: trimmed || `[See attached files]`, sessionId, attachmentInfo });
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
              <div className="flex items-center gap-2 text-foreground"><Shield className="w-3.5 h-3.5 text-primary" /> Private workspace</div>
              <p className="mt-1">Saved on this device</p>
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
    </SidebarProvider>
  );
}
