export const NOVA_API_ENDPOINTS = [
  { method: "POST", path: "/api/trpc/chat.send", description: "Send a workspace-scoped chat request with optional project and repository context." },
  { method: "GET", path: "/api/trpc/chat.conversations", description: "Search private conversation titles and saved message content." },
  { method: "POST", path: "/api/trpc/projects.create", description: "Create a private developer project for the current workspace." },
] as const;

export const NOVA_API_PLAYGROUND_EXAMPLE = `const result = await client.chat.send.mutate({
  message: "Review this pull request",
  sessionId: "your-session-id",
  selectedRepoFullNames: ["owner/repository"],
});`;

export const NOVA_ASSISTANT_CONCEPTS = [
  { title: "Assistant profile", text: "Combine an operating mode, provider model, instructions, and approved context into a reusable working style." },
  { title: "Workflow draft", text: "Chain steps such as research, planning, review, and delivery while keeping private inputs outside chat history." },
  { title: "Human approval", text: "Keep external side effects behind an explicit review point before a workflow sends, publishes, or changes data." },
] as const;
