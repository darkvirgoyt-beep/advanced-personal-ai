/** Identifies an explicit request to open Nova's private vault entry flow.
 * It intentionally requires both a sensitive-value term and an entry/storage
 * action, so ordinary technical questions about APIs are still sent to chat. */
export function requestsPrivateSecretEntry(message: string): boolean {
  const text = message.toLowerCase().replace(/\s+/g, " ").trim();
  const hasSensitiveValue = /\b(secret|api key|token|password|credential|private key|access key)\b/.test(text);
  const hasVaultIntent = /\b(secret box|private box|vault|paste|enter|store|save|add|provide|give)\b/.test(text);
  return hasSensitiveValue && hasVaultIntent;
}

export type ComposerSecretAction =
  | { kind: "open-private-vault"; request: string }
  | { kind: "send-chat"; content: string };

/** Values typed into the vault dialog are deliberately never accepted by this
 * helper. When it returns `open-private-vault`, ChatPage must not call
 * `chat.send`; it opens the private form instead. */
export function resolveComposerSecretAction(message: string, hasAttachments: boolean): ComposerSecretAction {
  if (!hasAttachments && requestsPrivateSecretEntry(message)) {
    return { kind: "open-private-vault", request: message };
  }
  return { kind: "send-chat", content: message };
}
