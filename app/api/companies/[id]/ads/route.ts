import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { paginate } from "@/app/lib/crud";
import { HttpError, handle, json, parseId } from "@/app/lib/http";
import { getResource } from "@/app/lib/resources";

// GET /api/companies/:id/ads — all ads posted by a company
export const GET = handle(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const company_id = parseId((await ctx.params).id) as number;
    const company = await prisma.company.findUnique({ where: { id_company: company_id } });
    if (!company) throw new HttpError(404, "Company not found");
    return json(await paginate(getResource("ads"), request.nextUrl.searchParams, { company_id }));
});
