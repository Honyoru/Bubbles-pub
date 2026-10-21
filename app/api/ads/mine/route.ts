import type { NextRequest } from "next/server";
import { HttpError, handle, json, requireUser } from "@/app/lib/http";
import { paginate } from "@/app/lib/crud";
import { getResource } from "@/app/lib/resources";

// GET /api/ads/mine : only the ads of the companies owned by the logged-in recruiter
export const GET = handle(async (request: NextRequest) => {
    const user = await requireUser();
    if (user.role !== "recruiter") throw new HttpError(403, "Recruiters only");
    return json(await paginate(
        getResource("ads"),
        request.nextUrl.searchParams,
        { company: { person_id: user.person_id } },
    ));
});