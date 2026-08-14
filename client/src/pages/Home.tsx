import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings, Sparkles, Loader2, KeyRound, Cpu, Wrench, Upload, Github } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const features = [
  { icon: MessageSquare, title: "AI Chat", desc: "Unrestricted personal assistant powered by Groq" },
  { icon: Shield, title: "Secret Vault", desc: "Store tokens & keys — AI reads them, never displays them" },
  { icon: Terminal, title: "Virtual PC", desc: "Run shell commands in the browser terminal" },
  { icon: BarChart3, title: "Chart Gallery", desc: "Save and browse data visualizations" },
  { icon: GitBranch, title: "Git Push", desc: "Push files directly to your repositories" },
  { icon: Cpu, title: "Custom Models", desc: "Add any OpenAI-compatible API endpoint" },
  { icon: Wrench, title: "Custom Tools", desc: "Register AI tools and instructions" },
  { icon: Upload, title: "File Uploads", desc: "Send code, images, and documents" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const groqCheck = trpc.groq.check.useQuery(undefined, { enabled: !!user });
  const saveKeyMutation = trpc.groq.save.useMutation();
  const utils = trpc.useUtils();

  const handleSaveKey = async () => {
    const key = apiKey.trim();
    if (!key) { toast.error("Please enter your Groq API key"); return; }
    if (!key.startsWith("gsk_")) { toast.error("Key must start with gsk_"); return; }
    setIsSaving(true);
    try {
      await saveKeyMutation.mutateAsync({ apiKey: key });
      await utils.groq.check.invalidate();
      setApiKey("");
      toast.success("Groq API key saved securely");
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to save key");
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="w-96 h-64 rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight">Nova AI</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Your unrestricted personal assistant workspace.
              <br />
              Sign in to unlock the full experience.
            </p>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={() => window.location.href = "/api/oauth/start"} className="text-base px-8 w-full">
                Sign In with Manus
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 w-full bg-white text-gray-900 hover:bg-gray-100"
                onClick={() => window.location.href = "https://github.com/login/oauth/authorize?client_id=" + (import.meta.env.VITE_GITHUB_CLIENT_ID || "") + "&scope=repo,read:user"}
              >
                <Github className="w-5 h-5 mr-2" /> Sign In with GitHub
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 w-full"
                onClick={() => window.location.href = "/api/oauth/start"}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Sign In with Google
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Nova AI uses Manus OAuth for secure authentication. After signing in, add your Groq API key to activate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-12">
            {features.slice(0, 4).map(f => (
              <Card key={f.title} className="p-4 text-left bg-card/50 border-border/50">
                <f.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-medium">{f.title}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated — show key gate or redirect
  const hasKey = groqCheck.data?.has;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nova AI</h1>
          <p className="text-muted-foreground mt-2">
            {hasKey ? "Connected and ready" : "Enter your Groq API key to begin"}
          </p>
        </div>

        <Card className="p-6">
          {!hasKey ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apikey">Groq API Key</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="apikey"
                    type="password"
                    placeholder="gsk_..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSaveKey()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSaveKey} disabled={isSaving} className="w-full">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Activate Nova AI
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your key is stored securely and never displayed in the UI.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">Your assistant is active and ready.</p>
              <Button onClick={() => navigate("/chat")} className="w-full" size="lg">
                Open Chat
              </Button>
            </div>
          )}
        </Card>

        {!hasKey && (
          <div className="mt-6 grid grid-cols-3 gap-2">
            {features.slice(0, 3).map(f => (
              <div key={f.title} className="text-center">
                <f.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">{f.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
