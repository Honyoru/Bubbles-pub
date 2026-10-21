import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { HttpError, handle, json, readBody, requireUser } from "@/app/lib/http";
import { toData } from "@/app/lib/crud";
import { getResource } from "@/app/lib/resources";

// POST /api/events/mine : a meeter creates an event and becomes its organizer
export const POST = handle(async (request: NextRequest) => {
    const user = await requireUser();
    if (user.role !== "meeter") throw new HttpError(403, "Meeters only");

    const body = await readBody(request);
    // organizer_id is forced: a meeter cannot create an event in someone else's name
    const data = toData(getResource("events"), { ...body, organizer_id: user.person_id }, false);
    const created = await prisma.events.create({ data: data as never });
    return json(created, 201);
});
