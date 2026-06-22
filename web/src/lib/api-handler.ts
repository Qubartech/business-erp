import { requireAuth, requireRole } from "./auth-middleware";
import { ok, fail } from "./response";
import { HttpError } from "./errors";
import { z } from "zod";
import type { Role } from "@prisma/client";

export type HandlerContext<TBody = any, TQuery = any> = {
  user: any;
  params: any;
  body: TBody;
  query: TQuery;
};

export function apiHandler<T = any, TBody = any, TQuery = any>(
  handler: (req: Request, context: HandlerContext<TBody, TQuery>) => Promise<T>,
  options?: {
    requireAuth?: boolean;
    roles?: Role[];
    schema?: any;
    querySchema?: any;
    status?: number;
  }
) {
  return async (req: Request, segmentContext: any) => {
    try {
      let user = null;
      if (options?.requireAuth !== false) {
        user = await requireAuth(req);
        if (options?.roles) {
          requireRole(user, ...options.roles);
        }
      }

      // Await params if it's a promise in newer Next.js versions
      const rawParams = segmentContext?.params;
      const params = rawParams instanceof Promise ? await rawParams : (rawParams || {});

      let body = undefined as any;
      let query = undefined as any;

      if (options?.schema) {
        const json = await req.json();
        body = options.schema.parse(json);
      }

      if (options?.querySchema) {
        const { searchParams } = new URL(req.url);
        const queryObj = Object.fromEntries(searchParams.entries());
        
        // Convert page and pageSize to numbers if they exist
        if ("page" in queryObj) (queryObj as any).page = Number(queryObj.page);
        if ("pageSize" in queryObj) (queryObj as any).pageSize = Number(queryObj.pageSize);
        if ("year" in queryObj) (queryObj as any).year = Number(queryObj.year);
        
        query = options.querySchema.parse(queryObj);
      }

      const data = await handler(req, { user, params, body, query });
      return ok(data, "Success", options?.status ?? 200);
    } catch (e: any) {
      if (e instanceof HttpError) {
        return fail(e.status, e.message, e.errors);
      }
      if (e instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of e.issues) {
          const path = issue.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(issue.message);
        }
        return fail(400, "Validation failed", errors);
      }
      console.error("API error:", e);
      return fail(500, e.message || "Internal Server Error");
    }
  };
}
