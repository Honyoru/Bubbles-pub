import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { paginate, toData } from "@/app/lib/crud";
import { HttpError, handle, json, parseId, readBody, requireAdmin } from "@/app/lib/http";
import { getResource } from "@/app/lib/resources";
import { getSessionUser } from "@/app/lib/session";

type Ctx = { params: Promise<{ id: string }> };

const people = getResource("people");
const applications = getResource("applications");

// GET /api/ads/:id/applications — applicants for an ad, with their message (admin)
export const GET = handle(async (request: NextRequest, ctx: Ctx) => {
    await requireAdmin();   
    const advertisement_id = parseId((await ctx.params).id) as number;
    const ad = await prisma.advertisements.findUnique({ where: { advertisement_id } });
    if (!ad) throw new HttpError(404, "Advertisement not found");
    return json(await paginate(applications, request.nextUrl.searchParams, { advertisement_id }));
});

// POST /api/ads/:id/applications — apply to an ad
// Signed-in users only send a message; visitors also send their contact details
export const POST = handle(async (request: NextRequest, ctx: Ctx) => {
    const advertisement_id = parseId((await ctx.params).id) as number;
    const ad = await prisma.advertisements.findUnique({
        where: { advertisement_id },
        include: { company: { select: { person_id: true } } },
    });
    if (!ad) throw new HttpError(404, "Advertisement not found");

    const body = await readBody(request);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) throw new HttpError(400, "Missing required field: message");

    let personId: number;
    const user = await getSessionUser();
    if (user) {
        personId = user.person_id;
    } else {
        const contact = toData(people, { ...body, role: "candidate", status: "candidate", password: "" }, false);
        const existing = await prisma.people.findUnique({ where: { email: String(contact.email) } });
        if (existing?.password_hash) throw new HttpError(409, "An account exists for this email, please sign in to apply");
        personId = existing
            ? existing.person_id
            : (await prisma.people.create({ data: contact as never })).person_id;
    }

    const resume_url = typeof body.resume_url === "string" && body.resume_url.trim() ? body.resume_url.trim() : null;

    // The application and the message sent to the ad owner are saved together
    const application = await prisma.$transaction(async (tx) => {
        const created = await tx.applications.create({
            data: { person_id: personId, advertisement_id, message, resume_url },
        });
        await tx.messages.create({
            data: {
                sender_id: personId,
                receiver_id: ad.company.person_id,
                application_id: created.application_id,
                content: message,
            },
        });
        return created;
    });

    return json(application, 201);
});
