import { NextResponse } from "next/server";

/**
 * Route handlers here call createAdminClient()/getStripe(), which throw
 * synchronously on a missing or misconfigured env var. Uncaught, that
 * reaches Next.js as an unhandled route error and comes back as a non-JSON
 * response — the client's res.json() then throws too, so a server
 * misconfiguration ends up looking like a generic network failure with no
 * indication of what actually broke.
 */
export function withApiErrorHandling<Args extends unknown[]>(
  handler: (req: Request, ...args: Args) => Promise<Response>
) {
  return async (req: Request, ...args: Args) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error("Unhandled API error:", error);
      return NextResponse.json(
        { error: "Something went wrong on our end. Please try again in a moment." },
        { status: 500 }
      );
    }
  };
}
