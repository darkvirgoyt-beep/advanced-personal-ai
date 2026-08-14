import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const conversationIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,40}$/);

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  chat: router({
    conversations: protectedProcedure.query(({ ctx }) => db.listConversationsForUser(ctx.user.id)),
    messages: protectedProcedure.input(z.object({ conversationId: conversationIdSchema })).query(async ({ ctx, input }) => {
      const result = await db.listConversationMessages(ctx.user.id, input.conversationId);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found." });
      return result;
    }),
  }),
});

export type AppRouter = typeof appRouter;
