import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { ArrowRight, Bot, BrainCircuit, Code2, Menu, MessageSquareText, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
const features = [
  { icon: BrainCircuit, code: "01", title: "Context that continues", text: "Every conversation stays inside your private workspace so Nova can follow the thread." },
  { icon: Zap, code: "02", title: "Adaptive intelligence", text: "A configurable model layer routes to secure, server-side AI providers without exposing keys." },
  { icon: ShieldCheck, code: "03", title: "Protected by design", text: "Manus OAuth gates access and user-owned history keeps your conversations scoped to you." },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { loading, isAuthenticated, logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const enterChat = () => isAuthenticated ? navigate("/chat") : startLogin();

  return (
    <main className="nova-screen overflow-hidden">
      <header className="relative z-20 border-b border-cyan-300/15 bg-[#04050d]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-7">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left" aria-label="Nova AI home"><span className="nova-mark"><Bot className="size-4" /></span><span className="font-mono text-sm font-bold tracking-[.2em] text-white">NOVA<span className="text-pink-300">//</span>AI</span></button>
          <nav className="hidden items-center gap-7 font-mono text-[11px] tracking-[.14em] text-cyan-100/65 md:flex"><a href="#capabilities" className="nova-nav-link">CAPABILITIES</a><a href="#protocol" className="nova-nav-link">PROTOCOL</a><a href="#access" className="nova-nav-link">ACCESS</a></nav>
          <div className="hidden items-center gap-3 md:flex">{isAuthenticated ? <><span className="max-w-36 truncate font-mono text-[10px] text-cyan-100/50">{user?.name || "OPERATOR"}</span><Button variant="ghost" onClick={logout} className="h-9 text-xs text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-50">Sign out</Button></> : <Button variant="ghost" onClick={startLogin} className="h-9 text-xs text-cyan-100 hover:bg-cyan-300/10">Log in</Button>}<Button onClick={enterChat} className="nova-button h-9 px-4 text-xs">Start Chatting <ArrowRight className="ml-1.5 size-3.5" /></Button></div>
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(open => !open)} className="text-cyan-100 md:hidden">{menuOpen ? <X /> : <Menu />}</Button>
        </div>
        {menuOpen && <div className="border-t border-cyan-300/15 bg-[#060713] px-5 py-4 md:hidden"><nav className="grid gap-2 font-mono text-xs tracking-wider text-cyan-100/75"><a onClick={() => setMenuOpen(false)} href="#capabilities" className="rounded px-3 py-2 hover:bg-cyan-300/10">CAPABILITIES</a><a onClick={() => setMenuOpen(false)} href="#protocol" className="rounded px-3 py-2 hover:bg-cyan-300/10">PROTOCOL</a><a onClick={() => setMenuOpen(false)} href="#access" className="rounded px-3 py-2 hover:bg-cyan-300/10">ACCESS</a><Button onClick={() => { setMenuOpen(false); enterChat(); }} className="nova-button mt-2 w-full">Start Chatting</Button></nav></div>}
      </header>

      <section className="relative mx-auto grid min-h-[min(50rem,calc(100vh-4.5rem))] max-w-7xl items-center gap-14 px-5 py-20 sm:px-7 lg:grid-cols-[1.15fr_.85fr] lg:py-28">
        <div className="nova-ambient nova-ambient-pink" /><div className="nova-ambient nova-ambient-cyan" />
        <div className="relative z-10"><div className="nova-eyebrow"><span className="nova-status-dot" /> PRIVATE AI OPERATING LAYER</div><h1 className="mt-7 max-w-4xl text-5xl font-black uppercase leading-[.91] tracking-[-.065em] text-white sm:text-7xl lg:text-8xl"><span className="block">Your signal.</span><span className="nova-gradient-text nova-headline-shimmer block">Amplified.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">A high-focus interface for thinking, building, and creating—powered by private, persistent conversations and configurable AI intelligence.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Button onClick={enterChat} disabled={loading} className="nova-button h-12 px-6 text-sm"><MessageSquareText className="mr-2 size-4" />Start Chatting</Button><a href="#capabilities" className="nova-secondary-button h-12 px-6 text-sm">Inspect capability matrix <ArrowRight className="ml-2 size-4" /></a></div><div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] tracking-[.14em] text-cyan-100/50"><span className="flex items-center gap-2"><span className="nova-status-dot" />AUTHENTICATED WORKSPACE</span><span className="flex items-center gap-2"><Code2 className="size-3" />MULTI-TURN CONTEXT</span></div></div>
        <div className="relative z-10 mx-auto w-full max-w-md"><div className="hud-panel nova-hero-console"><div className="flex items-center justify-between border-b border-cyan-300/15 px-5 py-4"><div className="flex gap-1.5"><span className="size-2 rounded-full bg-pink-400 shadow-[0_0_10px_#fb4aa4]" /><span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#5eeeff]" /><span className="size-2 rounded-full bg-slate-600" /></div><span className="font-mono text-[10px] tracking-[.2em] text-cyan-100/60">NOVA_CORE / V1</span></div><div className="space-y-5 p-5"><div className="rounded border border-pink-300/20 bg-pink-400/[.06] p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded border border-pink-300/30 bg-pink-300/10 text-pink-200"><Sparkles className="size-4" /></span><div><p className="text-sm font-bold text-white">READY FOR INPUT</p><p className="mt-1 text-xs text-slate-400">Neural workspace synchronized.</p></div></div></div><div className="space-y-3 font-mono text-xs"><p className="text-cyan-100/75"><span className="text-pink-300">operator&gt;</span> map a launch plan</p><p className="border-l-2 border-cyan-300/60 pl-3 leading-6 text-slate-400">Nova AI will preserve the context of your conversation and help you move from first signal to next action.</p></div><div className="flex items-center gap-3 rounded border border-cyan-300/15 bg-black/30 px-3 py-3"><span className="size-2 rounded-full bg-cyan-300 animate-pulse" /><span className="font-mono text-[10px] tracking-[.16em] text-cyan-100/55">NEURAL LINK: STABLE</span></div></div></div></div>
      </section>

      <section id="capabilities" className="relative border-y border-cyan-300/15 bg-[#08091a]/80 py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-7"><div className="max-w-2xl"><p className="nova-kicker">CAPABILITY MATRIX</p><h2 className="mt-4 text-3xl font-bold tracking-[-.04em] text-white sm:text-5xl">Intelligence that keeps your work in motion.</h2></div><div className="mt-11 grid gap-4 md:grid-cols-3">{features.map(feature => <article key={feature.code} className="hud-panel nova-feature-card p-6"><div className="flex items-center justify-between"><feature.icon className="size-5 text-cyan-200" /><span className="font-mono text-xs text-pink-300">{feature.code}</span></div><h3 className="mt-10 text-xl font-bold text-white">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{feature.text}</p></article>)}</div></div></section>

      <section id="protocol" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-7 sm:py-28 lg:grid-cols-2"><div><p className="nova-kicker">OPERATOR PROTOCOL</p><h2 className="mt-4 text-3xl font-bold tracking-[-.04em] text-white sm:text-5xl">Built for the work behind the idea.</h2></div><div className="space-y-3">{[["01", "Authenticate", "Open your private workspace with Manus OAuth."],["02", "Transmit", "Send a prompt and Nova AI establishes a persistent conversation."],["03", "Continue", "Return to your history whenever you need to keep moving."]].map(([step, title, text]) => <div key={step} className="nova-protocol-row"><span className="font-mono text-xs text-pink-300">{step}</span><div><h3 className="font-bold text-white">{title}</h3><p className="mt-1 text-sm text-slate-400">{text}</p></div></div>)}</div></section>

      <section id="access" className="relative border-t border-cyan-300/15 px-5 py-20 text-center sm:px-7 sm:py-28"><div className="nova-ambient nova-ambient-cyan bottom-0" /><div className="hud-panel relative mx-auto max-w-3xl p-8 sm:p-12"><p className="nova-kicker">CHANNEL OPEN</p><h2 className="mt-4 text-3xl font-bold tracking-[-.04em] text-white sm:text-5xl">Bring your next idea into focus.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400">Start an authenticated Nova AI conversation and your private working context will be ready when you return.</p><Button onClick={enterChat} className="nova-button mt-8 h-12 px-6">Start Chatting <ArrowRight className="ml-2 size-4" /></Button></div></section>
    </main>
  );
}
