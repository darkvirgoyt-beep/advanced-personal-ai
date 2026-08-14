import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Bot, ChevronRight, History, LogOut, Menu, MessageSquarePlus,
  Radio, ShieldCheck, Sparkles, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type StreamEvent = "conversation" | "token" | "complete" | "error";

function parseSseBlock(block: string): { event: StreamEvent; data: Record<string, unknown> } | undefined {
  const lines = block.split("\n");
  const event = lines.find(line => line.startsWith("event:"))?.slice(6).trim() as StreamEvent | undefined;
  const rawData = lines.find(line => line.startsWith("data:"))?.slice(5).trim();
  if (!event || !rawData) return undefined;
  try {
    return { event, data: JSON.parse(rawData) as Record<string, unknown> };
  } catch {
    return undefined;
  }
}

export default function ChatPage() {
  const [, navigate] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const activeInput = useMemo(
    () => activeConversationId ? { conversationId: activeConversationId } : undefined,
    [activeConversationId]
  );
  const conversationsQuery = trpc.chat.conversations.useQuery(undefined, { enabled: isAuthenticated });
  const messagesQuery = trpc.chat.messages.useQuery(activeInput!, { enabled: Boolean(activeInput) && isAuthenticated });
  const shouldSyncHistory = useRef(true);

  useEffect(() => {
    if (!messagesQuery.data || !shouldSyncHistory.current) return;
    setMessages(messagesQuery.data.messages.map(message => ({ role: message.role, content: message.content })));
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!isAuthenticated && !loading) navigate("/");
  }, [isAuthenticated, loading, navigate]);

  const startNewConversation = useCallback(() => {
    if (isStreaming) return;
    shouldSyncHistory.current = true;
    setActiveConversationId(undefined);
    setMessages([]);
    setMobileHistoryOpen(false);
  }, [isStreaming]);

  const chooseConversation = useCallback((conversationId: string) => {
    if (isStreaming) return;
    shouldSyncHistory.current = true;
    setActiveConversationId(conversationId);
    setMessages([]);
    setMobileHistoryOpen(false);
  }, [isStreaming]);

  const handleSend = useCallback(async (content: string) => {
    if (isStreaming) return;
    setIsStreaming(true);
    shouldSyncHistory.current = false;
    setMessages(current => [...current, { role: "user", content }, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, conversationId: activeConversationId }),
      });
      if (!response.ok || !response.body) {
        const detail = await response.text();
        throw new Error(detail || "Nova AI could not start a response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedConversationId = activeConversationId;

      const processEvent = (event: { event: StreamEvent; data: Record<string, unknown> }) => {
        if (event.event === "conversation" && typeof event.data.conversationId === "string") {
          streamedConversationId = event.data.conversationId;
          setActiveConversationId(streamedConversationId);
        }
        if (event.event === "token" && typeof event.data.token === "string") {
          setMessages(current => current.map((message, index) =>
            index === current.length - 1 && message.role === "assistant"
              ? { ...message, content: message.content + event.data.token }
              : message
          ));
        }
        if (event.event === "error") {
          throw new Error(typeof event.data.error === "string" ? event.data.error : "Nova AI could not complete the response.");
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
        let separator = buffer.indexOf("\n\n");
        while (separator >= 0) {
          const event = parseSseBlock(buffer.slice(0, separator));
          buffer = buffer.slice(separator + 2);
          if (event) processEvent(event);
          separator = buffer.indexOf("\n\n");
        }
        if (done) break;
      }

      if (streamedConversationId) {
        await utils.chat.conversations.invalidate();
        await utils.chat.messages.invalidate({ conversationId: streamedConversationId });
      }
    } catch (error) {
      setMessages(current => current.filter((message, index) => !(index === current.length - 1 && message.role === "assistant" && !message.content)));
      toast.error(error instanceof Error ? error.message : "Nova AI could not complete the response.");
    } finally {
      shouldSyncHistory.current = true;
      setIsStreaming(false);
    }
  }, [activeConversationId, isStreaming, utils.chat.conversations, utils.chat.messages]);

  if (loading) {
    return <main className="nova-screen grid min-h-screen place-items-center"><div className="nova-loader"><Radio className="size-5 animate-pulse" /> Synchronizing your workspace</div></main>;
  }

  if (!isAuthenticated) {
    return <main className="nova-screen grid min-h-screen place-items-center px-6 text-center"><div className="hud-panel max-w-md p-8"><ShieldCheck className="mx-auto size-9 text-cyan-200" /><h1 className="mt-5 text-2xl font-bold text-white">Secure channel required</h1><p className="mt-3 text-sm leading-6 text-slate-400">Sign in with Manus OAuth before opening your private Nova AI history.</p><Button onClick={startLogin} className="nova-button mt-6">Authenticate with Manus <ChevronRight className="ml-1 size-4" /></Button></div></main>;
  }

  const HistoryPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`nova-history ${mobile ? "nova-history-mobile" : ""}`} aria-label="Conversation history">
      <div className="flex items-center justify-between gap-3 border-b border-cyan-300/15 px-4 py-4">
        <div className="flex items-center gap-2"><span className="nova-status-dot" /><span className="font-mono text-[10px] font-bold tracking-[.18em] text-cyan-100">MEMORY ARRAY</span></div>
        {mobile && <Button variant="ghost" size="icon" onClick={() => setMobileHistoryOpen(false)} className="text-cyan-100 hover:bg-cyan-300/10"><X className="size-4" /></Button>}
      </div>
      <div className="p-3"><Button onClick={startNewConversation} className="nova-new-chat w-full"><MessageSquarePlus className="mr-2 size-4" />New signal</Button></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {conversationsQuery.isLoading && <p className="px-3 py-4 font-mono text-xs text-cyan-100/55">LOADING MEMORY…</p>}
        {conversationsQuery.data?.length === 0 && <div className="px-3 py-8 text-center"><History className="mx-auto size-5 text-cyan-300/45" /><p className="mt-3 text-xs leading-5 text-slate-500">New conversations will be encrypted to your workspace history.</p></div>}
        {conversationsQuery.data?.map(conversation => <button key={conversation.id} onClick={() => chooseConversation(conversation.id)} className={`nova-history-item ${conversation.id === activeConversationId ? "is-active" : ""}`}><span className="block truncate">{conversation.title}</span><span className="mt-1 block font-mono text-[9px] text-slate-600">{new Date(conversation.updatedAt).toLocaleDateString()}</span></button>)}
      </div>
      <div className="border-t border-cyan-300/15 px-4 py-4"><p className="truncate font-mono text-[10px] tracking-wider text-slate-500">{user?.name || user?.email || "AUTHORIZED OPERATOR"}</p><Button variant="ghost" onClick={() => { logout(); navigate("/"); }} className="mt-2 h-8 px-0 text-xs text-pink-200 hover:bg-transparent hover:text-pink-100"><LogOut className="mr-2 size-3.5" />End session</Button></div>
    </aside>
  );

  return <main className="nova-screen flex min-h-screen overflow-hidden">
    <div className="hidden md:flex">{HistoryPanel({})}</div>
    {mobileHistoryOpen && <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"><div className="h-full w-[min(21rem,88vw)]">{HistoryPanel({ mobile: true })}</div></div>}
    <section className="relative flex min-w-0 flex-1 flex-col">
      <header className="nova-chat-header"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => setMobileHistoryOpen(true)} className="md:hidden text-cyan-100 hover:bg-cyan-300/10"><Menu className="size-5" /></Button><button onClick={() => navigate("/")} className="flex items-center gap-2 text-left"><span className="nova-mark"><Bot className="size-4" /></span><span className="font-mono text-sm font-bold tracking-[.18em] text-white">NOVA<span className="text-pink-300">//</span>AI</span></button></div><div className="flex items-center gap-3"><span className="hidden font-mono text-[10px] tracking-[.14em] text-cyan-200/70 sm:inline">NEURAL LINK ACTIVE</span><span className="nova-status-dot" /></div></header>
      <div className="relative flex min-h-0 flex-1 flex-col p-3 sm:p-5 lg:p-7"><div className="nova-chat-frame flex min-h-0 flex-1 flex-col"><div className="flex items-center justify-between border-b border-cyan-300/15 px-4 py-3 sm:px-6"><div><p className="font-mono text-[10px] font-bold tracking-[.18em] text-pink-200">CONVERSATION CHANNEL</p><p className="mt-1 text-xs text-slate-500">Persistent context · private workspace</p></div><Sparkles className="size-4 text-cyan-200" /></div><AIChatBox messages={messages} onSendMessage={handleSend} isLoading={isStreaming} height="100%" className="nova-chatbox min-h-0 flex-1 border-0 bg-transparent shadow-none" placeholder="Transmit a message to Nova AI…" emptyStateMessage="Nova AI is online. What are we building today?" suggestedPrompts={["Map a focused plan for my next project", "Explain a hard concept step by step", "Help me debug this code safely"]} /></div></div>
    </section>
  </main>;
}
