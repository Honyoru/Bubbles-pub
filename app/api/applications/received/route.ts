import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { HttpError, handle, json, requireUser } from "@/app/lib/http";
import { pagination } from "@/app/lib/crud";

// GET /api/applications/received
// Returns the applications sent to the ads of the logged-in recruiter's company
export const GET = handle(async (request: NextRequest) => {
    // Only a logged-in recruiter can use it
    const user = await requireUser();
    if (user.role !== "recruiter") throw new HttpError(403, "Recruiters only");

    const params = request.nextUrl.searchParams;
    const { page, limit, skip } = pagination(params);

    const where: Record<string, unknown> = {
        advertisements: { company: { person_id: user.person_id } },
    };

    // Optional search on the candidate's message
    const q = params.get("q")?.trim();
    if (q) where.message = { contains: q, mode: "insensitive" };

    // One query for the page + one for the total
    const [data, total] = await Promise.all([
        prisma.applications.findMany({
            where,
            orderBy: { applied_at: "desc" }, // newest first
            skip,
            take: limit,
            include: {
                people: {
                    select: { person_id: true, first_name: true, name: true, email: true, cellphone_number: true, location: true },
                },
                advertisements: { select: { advertisement_id: true, title: true } },
            },
        }),
        prisma.applications.count({ where }),
    ]);

    return json({ data, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
});