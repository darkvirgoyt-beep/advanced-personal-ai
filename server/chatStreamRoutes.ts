import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { buildChatContext, type ChatTurn } from "./chatConfig";
import { streamNovaCompletion } from "./chatProvider";
import * as db from "./db";
import { sdk } from "./_core/sdk";

const MAX_MESSAGE_LENGTH = 12_000;

function firstLine(value: string) {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, 72) || "New conversation";
}

function sendEvent(res: Response, event: string, payload: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function isValidConversationId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(value);
}

export function registerChatStreamingRoutes(app: Express) {
  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    let finished = false;
    let clientClosed = false;
    res.on("close", () => {
      if (!finished) clientClosed = true;
    });

    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        res.status(401).json({ error: "Sign in with Manus to use Nova AI." });
        return;
      }

      const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
      if (!content || content.length > MAX_MESSAGE_LENGTH) {
        res.status(400).json({ error: `Send a message between 1 and ${MAX_MESSAGE_LENGTH} characters.` });
        return;
      }

      const requestedConversationId = req.body?.conversationId;
      const conversationId = isValidConversationId(requestedConversationId)
        ? requestedConversationId
        : nanoid(18);

      let conversation = await db.getConversationForUser(user.id, conversationId);
      if (!conversation) {
        if (isValidConversationId(requestedConversationId)) {
          res.status(404).json({ error: "Conversation not found." });
          return;
        }
        conversation = await db.createConversation(user.id, conversationId, firstLine(content));
      }

      await db.createChatMessage(conversationId, nanoid(18), "user", content);
      await db.updateConversationActivity(user.id, conversationId, conversation.title === "New conversation" ? firstLine(content) : undefined);

      const persisted = await db.listConversationMessages(user.id, conversationId);
      if (!persisted) {
        res.status(404).json({ error: "Conversation not found." });
        return;
      }
      const history: ChatTurn[] = persisted.messages.map(message => ({
        role: message.role,
        content: message.content,
      }));
      // Ensure the configured system prompt is evaluated before streaming begins.
      buildChatContext(history);

      res.status(200);
      res.setHeader("content-type", "text/event-stream; charset=utf-8");
      res.setHeader("cache-control", "no-cache, no-transform");
      res.setHeader("connection", "keep-alive");
      res.flushHeaders();
      sendEvent(res, "conversation", { conversationId });

      const result = await streamNovaCompletion(history, token => {
        if (!clientClosed) sendEvent(res, "token", { token });
      });

      if (!clientClosed) {
        await db.createChatMessage(conversationId, nanoid(18), "assistant", result.content);
        await db.updateConversationActivity(user.id, conversationId);
        sendEvent(res, "complete", { conversationId, provider: result.provider });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete the response.";
      if (res.headersSent) sendEvent(res, "error", { error: message });
      else res.status(500).json({ error: message });
    } finally {
      finished = true;
      if (res.headersSent) res.end();
    }
  });
}
