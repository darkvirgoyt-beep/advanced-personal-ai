import { describe, expect, it } from "vitest";
import { resolveWorkspacePreview } from "./workspacePreview";

describe("resolveWorkspacePreview", () => {
  it("uses unsaved editor content while index.html is open", () => {
    expect(resolveWorkspacePreview({ selectedPath: "index.html", editorContent: "<h1>Unsaved</h1>", savedIndexHtml: "<h1>Saved</h1>" }))
      .toBe("<h1>Unsaved</h1>");
  });

  it("keeps rendering the saved entry file while another file is selected", () => {
    expect(resolveWorkspacePreview({ selectedPath: "src/main.js", editorContent: "console.log('editing')", savedIndexHtml: "<h1>Project preview</h1>" }))
      .toBe("<h1>Project preview</h1>");
  });

  it("returns an empty state when the project has no usable entry file", () => {
    expect(resolveWorkspacePreview({ selectedPath: "README.md", editorContent: "# Notes", savedIndexHtml: "   " })).toBeNull();
  });
});
