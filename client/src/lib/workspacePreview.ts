/** Resolve the live HTML preview from the open editor when relevant, otherwise
 * from the saved project entry file. The preview intentionally supports static
 * HTML only; dynamic dev servers are represented by bounded run output. */
export function resolveWorkspacePreview({
  selectedPath,
  editorContent,
  savedIndexHtml,
}: {
  selectedPath: string | null;
  editorContent: string;
  savedIndexHtml: string | undefined;
}): string | null {
  const candidate = selectedPath === "index.html" ? editorContent : savedIndexHtml;
  return candidate?.trim() ? candidate : null;
}
