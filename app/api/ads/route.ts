import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { HttpError, handle, json, readBody, requireUser } from "@/app/lib/http";
import { collectionHandlers, toData } from "@/app/lib/crud";
import { getResource } from "@/app/lib/resources";

const resource = getResource("ads");


// GET stays public: we reuse the generic handler
export const GET = collectionHandlers("ads").GET;

export const POST = handle(async (request: NextRequest) => {
    const user = await requireUser();                       // 401 if not logged in
    if (user.role !== "recruiter" && user.role !== "admin")
        throw new HttpError(403, "Recruiters only");        // 403 for candidates

    const body = await readBody(request);

    if (user.role === "recruiter") {
        // The company comes from the session, never from the client (otherwise a recruiter
        // could post an ad in someone else's company by editing the request)
        const company = await prisma.company.findFirst({ where: { person_id: user.person_id } });
        if (!company) throw new HttpError(400, "You don't have a company yet");
        body.company_id = company.id_company;
    }

    const data = toData(resource, body, false) as Prisma.advertisementsUncheckedCreateInput;            // validation + type conversion
    const created = await prisma.advertisements.create({ 
        data, 
        include: { company: { select: { id_company: true, name: true, description: true } } },
    });
    return json(created, 201);
});
