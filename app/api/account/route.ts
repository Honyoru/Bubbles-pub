import { prisma } from "@/app/lib/prisma";
import { toData } from "@/app/lib/crud";
import { HttpError, handle, json, readBody, requireUser, noContent } from "@/app/lib/http";
import { getResource, type Resource } from "@/app/lib/resources";
import { clearSession, getSessionUser, publicUserSelect, setSession } from "@/app/lib/session";

// Users manage their own profile, but never their role or status.
const people = getResource("people");
const account: Resource = { ...people, fields: people.fields.filter((f) => f.key !== "role" && f.key !== "status") };
const SIGNUP_ROLES = ["candidate", "recruiter", "meeter"];

function checkPassword(body: Record<string, unknown>, required: boolean) {
    const password = typeof body.password === "string" ? body.password : "";
    if (required && !password) throw new HttpError(400, "Missing required field: password");
    if (password && password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");
}

// GET /api/account — the signed-in user's profile and applications
export const GET = handle(async () => {
    const user = await requireUser();
    const applications = await prisma.applications.findMany({
        where: { person_id: user.person_id },
        orderBy: { applied_at: "desc" },
        include: { advertisements: { select: { title: true, company: { select: { name: true } } } } },
    });
    return json({ ...user, applications });
});

// POST /api/account — create an account and sign in
export const POST = handle(async (request: Request) => {
    if (await getSessionUser()) throw new HttpError(409, "Already signed in");
    const body = await readBody(request);
    checkPassword(body, true);
    const data = toData(account, body, false);

    const role = String(body.role ?? "candidate");
    if (!SIGNUP_ROLES.includes(role)) throw new HttpError(400, "Invalid role");

    let companyId: number | null = null;
    let newCompany: { name: string; description: string | null } | null = null;
    if (role === "recruiter") {
        if (body.company_mode === "new") {
            const name = String(body.company_name ?? "").trim();
            if (!name) throw new HttpError(400, "Company name is required");
            newCompany = { name, description: String(body.company_description ?? "").trim() || null };
        } else {
            const id = Number(body.company_id);
            if (!Number.isInteger(id)) throw new HttpError(400, "Please select a company");
            if (!(await prisma.company.findUnique({ where: { id_company: id } })))
                throw new HttpError(400, "This company does not exist");
            companyId = id;
        }
    }

    // People who applied without an account can claim their record by registering
    const existing = await prisma.people.findUnique({ where: { email: String(data.email) } });
    if (existing?.password_hash) throw new HttpError(409, "An account with this email already exists");

    const user = await prisma.$transaction(async (tx) => {
        const payload = { ...data, role, company_id: companyId };
        const person = existing
            ? await tx.people.update({ where: { person_id: existing.person_id }, data: payload, select: publicUserSelect })
            : await tx.people.create({ data: payload as never, select: publicUserSelect });

        if (newCompany) {
            // company.person_id is required, so the person must exist first
            const company = await tx.company.create({ data: { ...newCompany, person_id: person.person_id } });
            await tx.people.update({ where: { person_id: person.person_id }, data: { company_id: company.id_company } });
        }
        return person;
    });


    await setSession(user.person_id);
    return json({ user, redirect: "/" }, 201);
});

// PATCH /api/account — update the signed-in user's profile
export const PATCH = handle(async (request: Request) => {
    const user = await requireUser();
    const body = await readBody(request);
    checkPassword(body, false);
    const data = toData(account, body, true);
    const updated = await prisma.people.update({ where: { person_id: user.person_id }, data, select: publicUserSelect });
    return json(updated);
});

// DELETE /api/session — sign out
export const DELETE = handle(async () => {
    const user = await requireUser();
    if (user.role === "admin") 
        throw new HttpError(403, "Admin accounts cannot be deleted");
    await prisma.people.delete({ where: { person_id: user.person_id } });
    await clearSession();
    return noContent();
});