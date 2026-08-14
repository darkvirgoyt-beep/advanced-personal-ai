# Source Integration Notes

The supplied repository, `darkvirgoyt-beep/advanced-personal-ai`, was reviewed as the functional reference for the Nova AI rebuild. Its existing implementation was not copied wholesale because the managed project uses a separate Manus OAuth and tRPC/Express foundation. Instead, the following **product behaviors were deliberately adapted** into the new codebase.

| Source area reviewed | Adaptation in Nova AI | Current implementation |
|---|---|---|
| `client/src/pages/ChatPage.tsx` | A focused, single-workspace chat flow with visible model activity and an uninterrupted prompt composer. | `client/src/pages/ChatPage.tsx` implements the full-screen streamed workspace and calls the protected server endpoint. |
| `client/src/components/ConversationOrganizer.tsx` | Conversation-oriented navigation: a new conversation control and an easily scannable historical list. Folders were intentionally omitted because the current scope requires secure persistent history rather than folder management. | `client/src/pages/ChatPage.tsx` renders the responsive **Memory Array** sidebar from `chat.conversations`. |
| `server/routers.ts` | A typed separation between conversational data and AI interaction configuration. | `server/routers.ts`, `server/chatConfig.ts`, `server/chatProvider.ts`, and `server/chatStreamRoutes.ts` separate scoped reads, prompt construction, provider routing, and streamed writes. |

No source credential, secret, or user data was copied. The rebuilt application retains the useful chat and history interaction patterns while applying Manus OAuth, user ownership checks, and the cyberpunk visual system requested for Nova AI.
