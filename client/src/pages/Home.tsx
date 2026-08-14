import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { novaNavigationTargets } from "@/lib/navigationTargets";
import { toast } from "sonner";
import {
  ArrowRight, AudioLines, Bot, BrainCircuit, Braces, Check, ChevronRight,
  Code2, Compass, FileSearch, FolderGit2, Github, Globe2, ImageIcon, KeyRound,
  Layers3, Loader2, LockKeyhole, Menu, MessageSquare, Mic2, Orbit, Play,
  Search, ShieldCheck, Sparkles, Sun, Moon, TerminalSquare, UserRound, Wand2, X, Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const capabilities = [
  { icon: BrainCircuit, title: "Adaptive intelligence", text: "Choose fast, reasoning, coding, creative, learning, research, gaming, and productivity workflows." },
  { icon: Layers3, title: "Your AI operating system", text: "Bring models, memories, vault items, conversations, tools, and projects into one focused environment." },
  { icon: Code2, title: "Build in the flow", text: "Move from an AI conversation to a project workspace with files, editor, terminal output, preview, and GitHub context." },
  { icon: ShieldCheck, title: "Private by design", text: "Keep provider keys server-side, use a private vault for sensitive values, and control what AI remembers." },
  { icon: FileSearch, title: "Multimodal work", text: "Attach files and images today, with a clear surface for vision, image creation, voice, and research workflows." },
  { icon: Compass, title: "Developer-ready", text: "Configure compatible models and tools, link repositories, and prepare integrations from one platform." },
];

const workspaces = [
  { icon: Zap, title: "Fast", desc: "Quick answers & iteration", tone: "text-amber-300 bg-amber-400/10 border-amber-300/20" },
  { icon: BrainCircuit, title: "Reason", desc: "Complex problem solving", tone: "text-violet-300 bg-violet-400/10 border-violet-300/20" },
  { icon: Braces, title: "Code", desc: "Build & debug systems", tone: "text-cyan-300 bg-cyan-400/10 border-cyan-300/20" },
  { icon: Wand2, title: "Create", desc: "Writing & concepts", tone: "text-pink-300 bg-pink-400/10 border-pink-300/20" },
];

const stages = [
  ["01", "Connect your model", "Use Groq, Kie AI, OpenRouter/Nemotron, or another compatible provider."],
  ["02", "Choose your operating mode", "Switch the model, context, memory preference, projects, files, and repositories for the work."],
  ["03", "Create with context", "Chat, analyze, research, write, build, and develop from a private workspace you control."],
];

export default function Home() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const groqCheck = trpc.groq.check.useQuery();
  const customModelsQuery = trpc.models.list.useQuery();
  const saveKeyMutation = trpc.groq.save.useMutation();
  const utils = trpc.useUtils();
  const hasConfiguredAlternative = customModelsQuery.data?.models.some(model => model.isActive === "true" && model.hasApiKey) || false;
  const isReady = groqCheck.data?.has || hasConfiguredAlternative;

  const handleSaveKey = async () => {
    const key = apiKey.trim();
    if (!key) return toast.error("Please enter your Groq API key");
    if (!key.startsWith("gsk_")) return toast.error("Groq keys begin with gsk_");
    setIsSaving(true);
    try {
      await saveKeyMutation.mutateAsync({ apiKey: key });
      await utils.groq.check.invalidate();
      setApiKey("");
      toast.success("Groq key stored securely — NovaAI is ready");
      navigate("/chat");
    } catch (error: any) {
      toast.error(error.message || "Could not save the API key");
    } finally {
      setIsSaving(false);
    }
  };

  const scrollToConnect = () => document.getElementById("connect")?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070b16] text-slate-100 selection:bg-violet-400/30">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-24 top-[-14rem] h-[38rem] w-[38rem] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute -right-32 top-72 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.15)_1px,transparent_1px)] [background-size:4rem_4rem] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#070b16]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 text-left" aria-label="NovaAI home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/25 bg-gradient-to-br from-violet-400/25 to-cyan-300/10 shadow-[0_0_30px_rgba(139,92,246,.25)]"><Orbit className="h-5 w-5 text-violet-200" /></span>
            <span className="font-semibold tracking-tight">Nova<span className="text-violet-300">AI</span></span>
          </button>
          <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#capabilities" className="transition hover:text-white">Capabilities</a>
            <a href="#developer" className="transition hover:text-white">Developers</a>
            <a href="#pricing" className="transition hover:text-white">Plans</a>
            <a href="#community" className="transition hover:text-white">Community</a>
            <button onClick={() => navigate("/about-virgoyt")} className="transition hover:text-white">VirgoYT</button>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 text-slate-300 hover:bg-white/5 hover:text-white" aria-label="Toggle theme">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(novaNavigationTargets.profile)} className="h-8 text-slate-300 hover:bg-white/5 hover:text-white"><UserRound className="mr-1.5 h-3.5 w-3.5" /> Profile</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/workspace")} className="text-slate-300 hover:bg-white/5 hover:text-white">Workspace</Button>
            <Button size="sm" onClick={() => isReady ? navigate("/chat") : scrollToConnect()} className="bg-violet-500 text-white shadow-[0_0_24px_rgba(139,92,246,.3)] hover:bg-violet-400">{isReady ? "Open NovaAI" : "Get started"}<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-300 md:hidden" onClick={() => setMenuOpen(current => !current)}>{menuOpen ? <X /> : <Menu />}</Button>
        </div>
        {menuOpen && <div className="border-t border-white/5 px-4 py-4 md:hidden"><div className="mx-auto grid max-w-7xl gap-2 text-sm text-slate-300"><a onClick={() => setMenuOpen(false)} href="#capabilities" className="rounded-lg px-3 py-2 hover:bg-white/5">Capabilities</a><a onClick={() => setMenuOpen(false)} href="#developer" className="rounded-lg px-3 py-2 hover:bg-white/5">Developers</a><a onClick={() => setMenuOpen(false)} href="#pricing" className="rounded-lg px-3 py-2 hover:bg-white/5">Plans</a><button onClick={() => { setMenuOpen(false); navigate("/about-virgoyt"); }} className="rounded-lg px-3 py-2 text-left hover:bg-white/5">About VirgoYT</button><div className="mt-1 flex gap-2"><Button variant="outline" size="sm" onClick={toggleTheme} className="flex-1 border-white/15 bg-transparent text-slate-200"><Sun className="mr-1.5 h-3.5 w-3.5" /> Theme</Button><Button variant="outline" size="sm" onClick={() => navigate(novaNavigationTargets.profile)} className="flex-1 border-white/15 bg-transparent text-slate-200"><UserRound className="mr-1.5 h-3.5 w-3.5" /> Profile</Button></div><Button onClick={() => { setMenuOpen(false); isReady ? navigate("/chat") : scrollToConnect(); }} className="mt-2 bg-violet-500 hover:bg-violet-400">{isReady ? "Open NovaAI" : "Get started"}</Button></div></div>}
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pt-32">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200"><Sparkles className="h-3.5 w-3.5" /> The AI operating system for ambitious work</div>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-.055em] text-white sm:text-6xl lg:text-7xl">One intelligent surface for everything you <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">want to create.</span></h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-400 sm:text-lg">NovaAI brings together multi-model intelligence, private context, creator tools, research, and a developer workspace—so your best work does not live across disconnected tabs.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" onClick={() => isReady ? navigate("/chat") : scrollToConnect()} className="h-12 bg-violet-500 px-5 text-sm shadow-[0_0_32px_rgba(139,92,246,.35)] hover:bg-violet-400">{isReady ? "Enter your workspace" : "Connect your intelligence"}<ArrowRight className="ml-2 h-4 w-4" /></Button><Button size="lg" variant="outline" onClick={() => navigate("/workspace")} className="h-12 border-white/15 bg-white/[.03] px-5 text-slate-100 hover:bg-white/[.08] hover:text-white"><Code2 className="mr-2 h-4 w-4" /> Explore developer workspace</Button></div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500"><span className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-emerald-300" /> Private workspace controls</span><span className="flex items-center gap-1.5"><Layers3 className="h-3.5 w-3.5 text-cyan-300" /> Bring your own provider</span><span className="flex items-center gap-1.5"><Github className="h-3.5 w-3.5 text-slate-300" /> GitHub-aware projects</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-400/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0d1428]/90 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" /></div><span className="text-[11px] font-medium tracking-[.14em] text-slate-500">NOVA CORE</span><span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">READY</span></div>
              <div className="p-4 sm:p-5"><div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/[.12] to-cyan-400/[.04] p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/20"><Orbit className="h-5 w-5 text-violet-200" /></span><div><p className="text-sm font-medium">Good to have you back.</p><p className="text-xs text-slate-400">What will we move forward today?</p></div></div></div><div className="mt-4 grid grid-cols-2 gap-2">{workspaces.map(item => <div key={item.title} className={`rounded-xl border p-3 ${item.tone}`}><item.icon className="h-4 w-4" /><p className="mt-4 text-sm font-medium text-slate-100">{item.title}</p><p className="mt-1 text-[11px] text-slate-400">{item.desc}</p></div>)}</div><div className="mt-4 flex items-center gap-3 rounded-xl border border-white/8 bg-black/15 px-3 py-2.5"><Search className="h-4 w-4 text-slate-500" /><span className="flex-1 text-xs text-slate-500">Ask, build, search, or create…</span><span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">⌘ K</span></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="relative z-10 border-y border-white/5 bg-[#0a1020]/60 py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">One integrated ecosystem</p><h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Designed for the way modern work actually happens.</h2><p className="mt-4 text-slate-400">NovaAI combines the contexts you need to think clearly with the tools you need to make progress.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{capabilities.map((feature, index) => <article key={feature.title} className="group rounded-2xl border border-white/8 bg-white/[.025] p-5 transition duration-200 hover:-translate-y-1 hover:border-violet-300/25 hover:bg-white/[.045]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-200"><feature.icon className="h-5 w-5" /></span><p className="mt-8 text-[11px] font-medium text-slate-600">0{index + 1}</p><h3 className="mt-1 text-lg font-medium text-slate-100">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p></article>)}</div></div></section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">How NovaAI works</p><h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-.04em] sm:text-4xl">From first thought to finished work.</h2><p className="mt-4 max-w-md text-sm leading-6 text-slate-400">Keep the model, context, files, tools, and project state close to the actual work—without losing control of privacy.</p><Button variant="outline" onClick={() => navigate("/chat")} className="mt-7 border-white/15 bg-white/[.03] text-slate-200 hover:bg-white/[.08] hover:text-white">Try the workspace <ChevronRight className="ml-1 h-4 w-4" /></Button></div><div className="space-y-3">{stages.map(([number, title, text]) => <div key={number} className="flex gap-4 rounded-2xl border border-white/8 bg-[#0d1428]/70 p-5"><span className="text-sm font-semibold text-violet-300">{number}</span><div><h3 className="font-medium">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-400">{text}</p></div></div>)}</div></div></section>

      <section id="developer" className="relative z-10 border-y border-white/5 bg-gradient-to-r from-cyan-950/20 via-[#0b1020] to-violet-950/20 py-20 sm:py-28"><div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Developer platform</p><h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Build with AI that understands your project.</h2><p className="mt-4 text-sm leading-6 text-slate-400">Use the project workspace to save source files, preview HTML, run bounded commands, connect validated GitHub repositories, and bring those details into AI context.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => navigate("/workspace")} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"><TerminalSquare className="mr-2 h-4 w-4" /> Open workspace</Button><Button variant="outline" onClick={() => navigate("/tools")} className="border-white/15 bg-white/[.03] text-slate-200 hover:bg-white/[.08] hover:text-white">Explore tools</Button></div></div><div className="rounded-3xl border border-cyan-300/15 bg-[#091326] p-4 shadow-xl shadow-cyan-950/20"><div className="rounded-2xl border border-white/8 bg-[#070d1b] p-4 font-mono text-xs leading-6 text-slate-400"><p><span className="text-violet-300">nova</span> <span className="text-slate-600">/</span> workspace</p><p className="mt-4 text-slate-200">project <span className="text-cyan-300">portfolio-site</span></p><p>context <span className="text-emerald-300">GitHub linked</span></p><p>mode <span className="text-amber-200">Coding assistant</span></p><p className="mt-4 text-slate-500">// edit → preview → ask Nova → ship</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" /></div></div></div></div></section>

      <section id="pricing" className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8"><div className="text-center"><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Simple by design</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">A platform that grows with your work.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">NovaAI supports bring-your-own AI provider keys so you stay in control of provider usage. Deployment and team plans can be configured around your own infrastructure.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{[["Personal", "Private AI workspace", ["Bring your own provider", "Private vault & memory controls", "Projects and connected context"]], ["Builder", "For active creative and dev work", ["Multi-model workflows", "Developer workspace", "GitHub-aware projects"]], ["Custom deployment", "For your infrastructure", ["Self-hosted source bundle", "Your domain & database", "Configurable integrations"]]].map(([name, subhead, points]) => <div key={String(name)} className="rounded-2xl border border-white/8 bg-white/[.025] p-6"><h3 className="text-lg font-medium">{name}</h3><p className="mt-1 text-sm text-slate-400">{subhead}</p><ul className="mt-6 space-y-3">{(points as string[]).map(point => <li key={point} className="flex gap-2 text-sm text-slate-300"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{point}</li>)}</ul><Button variant="outline" onClick={() => name === "Custom deployment" ? navigate("/workspace") : scrollToConnect()} className="mt-7 w-full border-white/15 bg-transparent text-slate-100 hover:bg-white/[.08] hover:text-white">{name === "Custom deployment" ? "Explore workspace" : "Get started"}</Button></div>)}</div></section>

      <section id="community" className="relative z-10 border-t border-white/5 bg-[#0a1020] py-20 sm:py-24"><div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-violet-300">Community & feedback</p><h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Built for people who make things.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">NovaAI is shaped around practical work for developers, creators, students, gamers, and professionals. Share feedback, suggest integrations, or learn about the project author.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => window.open("https://github.com/darkvirgoyt-beep/advanced-personal-ai/issues", "_blank", "noopener,noreferrer")} className="bg-violet-500 hover:bg-violet-400"><MessageSquare className="mr-2 h-4 w-4" /> Send feedback</Button><Button variant="outline" onClick={() => navigate("/about-virgoyt")} className="border-white/15 bg-transparent text-slate-100 hover:bg-white/[.08] hover:text-white"><UserRound className="mr-2 h-4 w-4" /> Created by VirgoYT</Button></div></div><div id="connect" className="rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-400/[.12] to-[#121a33] p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/15 text-violet-200"><KeyRound className="h-5 w-5" /></span><div><p className="font-medium">Connect your intelligence</p><p className="mt-1 text-sm leading-5 text-slate-400">{isReady ? "A provider is configured for this private workspace. Open NovaAI whenever you are ready." : "Start with a Groq key, or configure Kie AI, OpenRouter/Nemotron, or another model in Models."}</p></div></div>{isReady ? <Button onClick={() => navigate("/chat")} className="mt-6 w-full bg-violet-500 hover:bg-violet-400">Open NovaAI <ArrowRight className="ml-2 h-4 w-4" /></Button> : <div className="mt-6 space-y-3"><Label htmlFor="home-api-key" className="text-xs text-slate-300">Groq API key</Label><Input id="home-api-key" type="password" value={apiKey} onChange={event => setApiKey(event.target.value)} onKeyDown={event => event.key === "Enter" && handleSaveKey()} placeholder="gsk_..." className="border-white/10 bg-[#080d1a]" /><Button onClick={handleSaveKey} disabled={isSaving} className="w-full bg-violet-500 hover:bg-violet-400">{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />} Activate secure workspace</Button><Button variant="ghost" onClick={() => navigate("/models")} className="w-full text-xs text-violet-200 hover:bg-white/5 hover:text-violet-100">Use Kie AI, OpenRouter, or another provider</Button><p className="text-center text-[11px] leading-5 text-slate-500">Provider keys are saved privately and never displayed in chat.</p></div>}</div></div></section>

      <footer className="relative z-10 border-t border-white/5 px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>NovaAI by VirgoYT — private intelligence for work that moves.</p><div className="flex flex-wrap items-center gap-4"><button onClick={() => navigate("/about-virgoyt")} className="font-medium text-violet-200 hover:text-violet-100">About VirgoYT</button><button onClick={() => navigate("/settings")} className="hover:text-slate-300">Privacy & settings</button><button onClick={() => navigate("/models")} className="hover:text-slate-300">Models</button><button onClick={() => navigate("/workspace")} className="hover:text-slate-300">Workspace</button></div></div></footer>
    </main>
  );
}
