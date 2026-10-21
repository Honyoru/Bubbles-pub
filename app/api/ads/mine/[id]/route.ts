import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { HttpError, handle, json, noContent, parseId, readBody, requireUser } from "@/app/lib/http";
import { toData } from "@/app/lib/crud";
import { getResource } from "@/app/lib/resources";

type IdContext = { params: Promise<{ id: string }> };

// Vérifie que l'utilisateur est recruteur ET propriétaire de l'annonce, puis la renvoie
async function getOwnedAd(ctx: IdContext) {
    const user = await requireUser();
    if (user.role !== "recruiter") throw new HttpError(403, "Recruiters only");

    const id = parseId((await ctx.params).id) as number;
    const ad = await prisma.advertisements.findUnique({
        where: { advertisement_id: id },
        include: { company: { select: { person_id: true } } },
    });
    if (!ad) throw new HttpError(404, "Not found");
    if (ad.company.person_id !== user.person_id) throw new HttpError(403, "This ad is not yours");
    return ad;
}

// PUT /api/ads/mine/:id : modifier une de ses annonces
export const PUT = handle(async (request: NextRequest, ctx: IdContext) => {
    const ad = await getOwnedAd(ctx);
    const resource = getResource("ads");
    const body = await readBody(request);
    // On force company_id : le recruteur ne peut pas déplacer l'annonce vers une autre entreprise
    const data = toData(resource, { ...body, company_id: ad.company_id }, false);
    const updated = await prisma.advertisements.update({
        where: { advertisement_id: ad.advertisement_id },
        data,
        include: resource.include,
    });
    return json(updated);
});

// DELETE /api/ads/mine/:id : supprimer une de ses annonces
export const DELETE = handle(async (_request: NextRequest, ctx: IdContext) => {
    const ad = await getOwnedAd(ctx);
    await prisma.advertisements.delete({ where: { advertisement_id: ad.advertisement_id } });
    return noContent();
});