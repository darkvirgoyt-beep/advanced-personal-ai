export const NOVA_AGENT_PROFILES = [
  { id: "developer", label: "Developer", mode: "coding", description: "Architecture, debugging, implementation, and tests." },
  { id: "research", label: "Research", mode: "research", description: "Evidence-aware analysis, comparisons, and open questions." },
  { id: "creator", label: "Creator", mode: "creative", description: "Content ideas, scripts, writing, and concepts." },
  { id: "gaming", label: "Gaming", mode: "gaming", description: "Game analysis, setup guidance, and game design." },
  { id: "system", label: "System", mode: "productivity", description: "Projects, files, plans, and practical next actions." },
] as const;

export type NovaAgentProfile = (typeof NOVA_AGENT_PROFILES)[number];
