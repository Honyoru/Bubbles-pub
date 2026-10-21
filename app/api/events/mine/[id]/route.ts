import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { HttpError, handle, json, noContent, parseId, readBody, requireUser } from "@/app/lib/http";
import { toData } from "@/app/lib/crud";
import { getResource } from "@/app/lib/resources";

type IdContext = { params: Promise<{ id: string }> };

// Checks the user is a meeter AND organizes the event, then returns it
async function getOwnedEvent(ctx: IdContext) {
    const user = await requireUser();
    if (user.role !== "meeter") throw new HttpError(403, "Meeters only");

    const id = parseId((await ctx.params).id) as number;
    const event = await prisma.events.findUnique({ where: { event_id: id } });
    if (!event) throw new HttpError(404, "Not found");
    if (event.organizer_id !== user.person_id) throw new HttpError(403, "This event is not yours");
    return event;
}

// PUT /api/events/mine/:id : edit one of your events
export const PUT = handle(async (request: NextRequest, ctx: IdContext) => {
    const event = await getOwnedEvent(ctx);
    const body = await readBody(request);
    // organizer_id is forced: a meeter cannot give the event to someone else
    const data = toData(getResource("events"), { ...body, organizer_id: event.organizer_id }, false);
    const updated = await prisma.events.update({ where: { event_id: event.event_id }, data });
    return json(updated);
});

// DELETE /api/events/mine/:id : delete one of your events (its registrations go with it)
export const DELETE = handle(async (_request: NextRequest, ctx: IdContext) => {
    const event = await getOwnedEvent(ctx);
    await prisma.events.delete({ where: { event_id: event.event_id } });
    return noContent();
});
