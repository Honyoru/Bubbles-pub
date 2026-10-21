import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

export const SESSION_COOKIE = "bubbles_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const SECRET = process.env.SESSION_SECRET ?? "bubbles-dev-secret-change-me";

export type SessionUser = {
    person_id: number;
    first_name: string;
    name: string;
    pseudo: string | null;
    email: string;
    location: string;
    cellphone_number: string;
    role: string;
    status: string;
};

export const publicUserSelect = {
    person_id: true,
    first_name: true,
    name: true,
    pseudo: true,
    email: true,
    location: true,
    cellphone_number: true,
    role: true,
    status: true,
} as const;

function sign(payload: string): string {
    return createHmac("sha256", SECRET).update(payload).digest("hex");
}

// Token: <person_id>.<expires_at>.<hmac>
export function createSessionToken(personId: number): string {
    const payload = `${personId}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
    return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): number | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [id, exp, sig] = parts;
    const expected = Buffer.from(sign(`${id}.${exp}`));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    if (Number(exp) < Date.now() / 1000) return null;
    return Number(id);
}

export const sessionCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
};

export async function setSession(personId: number) {
    (await cookies()).set(SESSION_COOKIE, createSessionToken(personId), sessionCookieOptions);
}

export async function clearSession() {
    (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
    const id = readToken((await cookies()).get(SESSION_COOKIE)?.value);
    if (id === null) return null;
    return prisma.people.findUnique({ where: { person_id: id }, select: publicUserSelect });
}
