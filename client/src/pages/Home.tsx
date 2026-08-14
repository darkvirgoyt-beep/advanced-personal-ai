import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, Loader2, LogIn, MessageSquare, Shield, Sparkles, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const features = [
  { icon: MessageSquare, title: "AI Chat" },
  { icon: Shield, title: "Secret Vault" },
  { icon: Terminal, title: "Virtual PC" },
];

export default function Home() {
  const { loading } = useAuth();
  const [, navigate] = useLocation();
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const groqCheck = trpc.groq.check.useQuery(undefined, { enabled: !loading });
  const saveKeyMutation = trpc.groq.save.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!loading && groqCheck.data?.has) navigate("/chat");
  }, [groqCheck.data?.has, loading, navigate]);

  const handleSaveKey = async () => {
    const key = apiKey.trim();
    if (!key) return toast.error("Please enter your Groq API key");
    if (!key.startsWith("gsk_")) return toast.error("Key must start with gsk_");

    setIsSaving(true);
    try {
      await saveKeyMutation.mutateAsync({ apiKey: key });
      await utils.groq.check.invalidate();
      setApiKey("");
      toast.success("Groq API key saved securely");
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to save key");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || groqCheck.isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="w-96 h-64 rounded-2xl" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Nova AI</h1>
          <p className="text-muted-foreground mt-2">Enter your Groq API key to begin</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apikey">Groq API Key</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="apikey" type="password" placeholder="gsk_..." value={apiKey} onChange={e => setApiKey(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSaveKey()} className="pl-10" />
              </div>
            </div>
            <Button onClick={handleSaveKey} disabled={isSaving} className="w-full">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Activate Nova AI
            </Button>
            <p className="text-xs text-muted-foreground text-center">Your key is stored securely and never displayed in the UI.</p>
            <p className="text-xs text-muted-foreground text-center">Chats are saved privately on this browser and device.</p>
          </div>
        </Card>

        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={() => { window.location.href = "/api/auth/google/authorize"; }}>
            <LogIn className="w-4 h-4 mr-2" /> Sign in with Google to sync this workspace
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">Optional — you can continue without an account.</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          {features.map(feature => (
            <div key={feature.title} className="text-center">
              <feature.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">{feature.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
