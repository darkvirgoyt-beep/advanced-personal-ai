import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { randomUUID } from "crypto";
import type { User } from "../../drizzle/schema";
import { getOrCreateAnonymousWorkspace } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const WORKSPACE_COOKIE = "nova_workspace";
const WORKSPACE_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365;

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const prefix = `${name}=`;
  return cookieHeader
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function isValidWorkspaceToken(token: string | undefined): token is string {
  return !!token && /^[a-zA-Z0-9_-]{16,64}$/.test(token);
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // An authenticated Manus account is optional for this private workspace.
    user = null;
  }

  if (!user) {
    const existingToken = readCookie(opts.req.headers.cookie, WORKSPACE_COOKIE);
    const workspaceToken = isValidWorkspaceToken(existingToken)
      ? existingToken
      : randomUUID().replace(/-/g, "");

    if (workspaceToken !== existingToken) {
      opts.res.cookie(WORKSPACE_COOKIE, workspaceToken, {
        ...getSessionCookieOptions(opts.req),
        maxAge: WORKSPACE_COOKIE_MAX_AGE,
      });
    }

    user = await getOrCreateAnonymousWorkspace(workspaceToken);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
