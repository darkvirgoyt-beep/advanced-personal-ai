import React from "react";
import { FolderPlus, History, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filterOrganizableConversations, parseConversationFolderValue, shouldShowConversationEmptyState, type ConversationFolderFilter, type OrganizableConversation } from "@/lib/conversationOrganizer";

type ConversationFolder = { id: number; name: string };

type ConversationOrganizerProps = {
  conversations: OrganizableConversation[];
  folders: ConversationFolder[];
  isLoading: boolean;
  activeSessionId: string;
  search: string;
  folderDraft: string;
  folderFilter: ConversationFolderFilter;
  isCreatingFolder?: boolean;
  isMovingConversation?: boolean;
  onSearchChange: (value: string) => void;
  onFolderDraftChange: (value: string) => void;
  onFolderFilterChange: (filter: ConversationFolderFilter) => void;
  onStartNewConversation: () => void;
  onCreateFolder: () => void;
  onOpenConversation: (sessionId: string) => void;
  onMoveConversation: (sessionId: string, folderId: number | null) => void;
};

export function ConversationOrganizer({
  conversations, folders, isLoading, activeSessionId, search, folderDraft, folderFilter, isCreatingFolder, isMovingConversation,
  onSearchChange, onFolderDraftChange, onFolderFilterChange, onStartNewConversation, onCreateFolder, onOpenConversation, onMoveConversation,
}: ConversationOrganizerProps) {
  const visibleConversations = filterOrganizableConversations(conversations, folderFilter);

  return <section className="mt-4 border-t border-border/50 pt-3" aria-label="Conversation organizer">
    <div className="mb-2 flex items-center justify-between px-2"><span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Conversations</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={onStartNewConversation} title="New conversation"><Plus className="h-3.5 w-3.5" /></Button></div>
    <div className="relative mb-2 px-1"><Search className="pointer-events-none absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" /><Input value={search} onChange={event => onSearchChange(event.target.value)} placeholder="Search conversations" className="h-8 pl-8 text-xs" /></div>
    <div className="mb-2 flex gap-1 px-1"><Input value={folderDraft} onChange={event => onFolderDraftChange(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && folderDraft.trim()) onCreateFolder(); }} placeholder="New folder" className="h-8 text-xs" /><Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onCreateFolder} disabled={!folderDraft.trim() || isCreatingFolder} title="Create folder"><FolderPlus className="h-3.5 w-3.5" /></Button></div>
    <div className="mb-2 flex flex-wrap gap-1 px-1"><button onClick={() => onFolderFilterChange("all")} className={`rounded px-2 py-1 text-[10px] ${folderFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>All</button><button onClick={() => onFolderFilterChange("unfiled")} className={`rounded px-2 py-1 text-[10px] ${folderFilter === "unfiled" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>Inbox</button>{folders.map(folder => <button key={folder.id} onClick={() => onFolderFilterChange(folder.id)} className={`max-w-24 truncate rounded px-2 py-1 text-[10px] ${folderFilter === folder.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>{folder.name}</button>)}</div>
    <div className="max-h-52 overflow-y-auto px-1"><div className="space-y-1 pb-1">{visibleConversations.map(conversation => <div key={conversation.sessionId} className={`group flex items-center gap-1 rounded-md px-1 py-0.5 ${conversation.sessionId === activeSessionId ? "bg-accent" : "hover:bg-accent/60"}`}><button onClick={() => onOpenConversation(conversation.sessionId)} className="min-w-0 flex flex-1 items-center gap-2 px-2 py-1.5 text-left"><History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className="truncate text-xs">{conversation.title}</span></button><select aria-label={`Move ${conversation.title} to a folder`} value={conversation.folderId || ""} onChange={event => onMoveConversation(conversation.sessionId, parseConversationFolderValue(event.target.value))} disabled={isMovingConversation} className="h-6 max-w-20 rounded border border-border bg-background px-1 text-[10px]"><option value="">Inbox</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></div>)}{shouldShowConversationEmptyState(isLoading, visibleConversations.length) && <p className="px-2 py-3 text-xs text-muted-foreground">Your saved conversations will appear here.</p>}</div></div>
  </section>;
}
