import { Prisma } from "@prisma/client";
import { getSessionUser, type SessionUser } from "@/app/lib/session";

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

// Never leak credentials, and make BigInt ids JSON-safe
// setup two factor / google_id for later
const HIDDEN_KEYS = new Set(["password_hash", "two_factor_secret", "google_id"]);

export function json(data: unknown, status = 200) {
    const body = JSON.stringify(data, (key, value) => {
        if (HIDDEN_KEYS.has(key)) return undefined;
        if (typeof value === "bigint") return value.toString();
        return value;
    });
    return new Response(body, { status, headers: { "Content-Type": "application/json" } });
}

export function noContent() {
    return new Response(null, { status: 204 });
}

// Wraps a route handler: maps thrown HttpErrors and Prisma errors to proper status codes
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
    return async (...args: A): Promise<Response> => {
        try {
            return await fn(...args);
        } catch (err) {
            if (err instanceof HttpError) return json({ error: err.message }, err.status);
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") return json({ error: "Not found" }, 404);
                if (err.code === "P2002") return json({ error: "This record already exists" }, 409);
                if (err.code === "P2003") return json({ error: "A related record is missing or still in use" }, 409);
            }
            console.error(err);
            return json({ error: "Internal server error" }, 500);
        }
    };
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
    try {
        const body = await request.json();
        if (body && typeof body === "object" && !Array.isArray(body)) return body;
    } catch {}
    throw new HttpError(400, "Request body must be a JSON object");
}

export function parseId(raw: string, bigint = false): number | bigint {
    if (!/^\d+$/.test(raw)) throw new HttpError(404, "Not found");
    return bigint ? BigInt(raw) : Number(raw);
}

export async function requireUser(): Promise<SessionUser> {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Authentication required");
    return user;
}

export async function requireAdmin(): Promise<SessionUser> {
    const user = await requireUser();
    if (user.role !== "admin") throw new HttpError(403, "Admin only");
    return user;
}
