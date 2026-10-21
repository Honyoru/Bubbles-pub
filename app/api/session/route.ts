import { prisma } from "@/app/lib/prisma";
import { verifyPassword } from "@/app/lib/password";
import { HttpError, handle, json, noContent, readBody } from "@/app/lib/http";
import { clearSession, getSessionUser, publicUserSelect, setSession } from "@/app/lib/session";

// GET /api/session — the signed-in user, or 401
export const GET = handle(async () => {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Not signed in");
    return json(user);
});

// POST /api/session — sign in with email + password
export const POST = handle(async (request: Request) => {
    const body = await readBody(request);
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) throw new HttpError(400, "Email and password are required");

    const person = await prisma.people.findUnique({ where: { email } });
    if (!person || !verifyPassword(password, person.password_hash))
        throw new HttpError(401, "Invalid email or password");

    await setSession(person.person_id);
    const user = await prisma.people.findUnique({ where: { person_id: person.person_id }, select: publicUserSelect });
    return json({ user, redirect: person.role === "admin" ? "/admin" : "/" }, 201);
});

// DELETE /api/session — sign out
export const DELETE = handle(async () => {
    await clearSession();
    return noContent();
});
