import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { toData } from "@/app/lib/crud";
import { HttpError, handle, json, parseId, readBody } from "@/app/lib/http";
import { getResource } from "@/app/lib/resources";
import { getSessionUser } from "@/app/lib/session";

type Ctx = { params: Promise<{ id: string }> };

const people = getResource("people");
const DAY = 24 * 3600 * 1000;

export const POST = handle(async (request: NextRequest, ctx: Ctx) => {
    const event_id = parseId((await ctx.params).id) as number;
    const event = await prisma.events.findUnique({ where: { event_id } });
    if (!event) throw new HttpError(404, "Event not found");

    const now = Date.now();
    if (event.event_date.getTime() + DAY < now) throw new HttpError(400, "This event is over");
    if (event.end_register_at && event.end_register_at.getTime() < now) throw new HttpError(400, "Registration is closed");
    let personId: number;
    const user = await getSessionUser();
    if (user) {
        personId = user.person_id;
    } else {
        const body = await readBody(request);
        const contact = toData(people, { ...body, role: "candidate", status: "candidate", password: "" }, false);
        const existing = await prisma.people.findUnique({ where: { email: String(contact.email) } });
        if (existing?.password_hash) throw new HttpError(409, "An account exists for this email, please sign in to register");
        personId = existing
            ? existing.person_id
            : (await prisma.people.create({ data: contact as never })).person_id;
    }

    const already = await prisma.event_participants.findUnique({
        where: { event_id_person_id: { event_id, person_id: personId } },
    });
    if (already) throw new HttpError(409, "You are already registered for this event");

    const participant = await prisma.event_participants.create({ data: { event_id, person_id: personId } });
    return json(participant, 201);
});

