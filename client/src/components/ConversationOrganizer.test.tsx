// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConversationOrganizer } from "./ConversationOrganizer";

const baseProps = {
  conversations: [
    { sessionId: "legacy-chat", title: "Legacy project review", folderId: null },
    { sessionId: "research-chat", title: "Research notes", folderId: 7 },
  ],
  folders: [{ id: 7, name: "Research" }],
  isLoading: false,
  activeSessionId: "legacy-chat",
  search: "",
  folderDraft: "",
  folderFilter: "all" as const,
  onSearchChange: vi.fn(),
  onFolderDraftChange: vi.fn(),
  onFolderFilterChange: vi.fn(),
  onStartNewConversation: vi.fn(),
  onCreateFolder: vi.fn(),
  onOpenConversation: vi.fn(),
  onMoveConversation: vi.fn(),
};

afterEach(cleanup);

describe("ConversationOrganizer", () => {
  it("renders legacy conversations, forwards search input, and opens a selected conversation", () => {
    render(<ConversationOrganizer {...baseProps} />);
    expect(screen.getByText("Legacy project review")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Search conversations"), { target: { value: "review" } });
    expect(baseProps.onSearchChange).toHaveBeenCalledWith("review");
    fireEvent.click(screen.getByText("Legacy project review"));
    expect(baseProps.onOpenConversation).toHaveBeenCalledWith("legacy-chat");
  });

  it("renders its empty state and forwards real folder assignment values", () => {
    const onMoveConversation = vi.fn();
    const { rerender } = render(<ConversationOrganizer {...baseProps} onMoveConversation={onMoveConversation} />);
    fireEvent.change(screen.getByLabelText("Move Legacy project review to a folder"), { target: { value: "7" } });
    expect(onMoveConversation).toHaveBeenCalledWith("legacy-chat", 7);
    rerender(<ConversationOrganizer {...baseProps} conversations={[]} />);
    expect(screen.getByText("Your saved conversations will appear here.")).toBeTruthy();
  });
});
