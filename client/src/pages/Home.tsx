import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Shield, Terminal, BarChart3, GitBranch, Settings, Sparkles, Loader2, KeyRound } from "lucide-react";
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
  { icon: Settings, title: "Full Control", desc: "Configure models, prompts, and integrations" },
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
            <Button size="lg" onClick={() => window.location.href = "/api/oauth/start"} className="text-base px-8">
              Sign In with Manus
            </Button>
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
