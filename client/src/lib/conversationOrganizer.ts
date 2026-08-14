export type ConversationFolderFilter = number | "all" | "unfiled";

export type OrganizableConversation = {
  sessionId: string;
  title: string;
  folderId: number | null;
};

export function filterOrganizableConversations<T extends OrganizableConversation>(conversations: T[], filter: ConversationFolderFilter): T[] {
  if (filter === "all") return conversations;
  if (filter === "unfiled") return conversations.filter(conversation => conversation.folderId === null);
  return conversations.filter(conversation => conversation.folderId === filter);
}

export function parseConversationFolderValue(value: string): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function shouldShowConversationEmptyState(isLoading: boolean, visibleConversationCount: number): boolean {
  return !isLoading && visibleConversationCount === 0;
}
