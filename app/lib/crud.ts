import type { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/password";
import { HttpError, handle, json, noContent, parseId, readBody, requireAdmin } from "@/app/lib/http";
import { getResource, type Resource } from "@/app/lib/resources";

type IdContext = { params: Promise<{ id: string }> };

// Prisma delegates share the same CRUD surface; the resource config picks which one
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function delegate(resource: Resource): any {
    return prisma[resource.model];
}

// Validates and change the typing to render a JSON body with the resource fields
// partial = PATCH semantics (only provided keys are checked)
export function toData(resource: Resource, body: Record<string, unknown>, partial: boolean) {
    const data: Record<string, unknown> = {};
    for (const field of resource.fields) {
        if (field.readOnly) continue;
        const provided = field.key in body;
        if (partial && !provided) continue;
        let value = body[field.key];
        if (typeof value === "string") value = value.trim();
        const empty = value === undefined || value === null || value === "";

        if (field.type === "password") {
            if (!empty) data.password_hash = hashPassword(String(value));
            continue;
        }
        if (empty) {
            if (field.required) throw new HttpError(400, `Missing required field: ${field.key}`);
            // On create, leave DB defaults alone; on update, an explicit empty value clears the column
            if (provided) data[field.key] = null;
            continue;
        }
        switch (field.type) {
            case "int": {
                const n = Number(value);
                if (!Number.isInteger(n)) throw new HttpError(400, `${field.key} must be an integer`);
                data[field.key] = n;
                break;
            }
            case "datetime": {
                const d = new Date(String(value));
                if (Number.isNaN(d.getTime())) throw new HttpError(400, `${field.key} must be a date`);
                data[field.key] = d;
                break;
            }
            case "select":
                if (!field.options!.includes(String(value)))
                    throw new HttpError(400, `${field.key} must be one of: ${field.options!.join(", ")}`);
                data[field.key] = String(value);
                break;
            default:
                data[field.key] = String(value);
        }
    }
    return data;
}

export function buildWhere(resource: Resource, params: URLSearchParams) {
    const where: Record<string, unknown> = {};
    const q = params.get("q")?.trim();
    if (q) {
        where.OR = resource.searchKeys.map((key) => ({ [key]: { contains: q, mode: "insensitive" } }));
    }
    // Exact-match filters on any known column, e.g. ?company_id=1&contract_type=CDI
    for (const field of resource.fields) {
        const value = params.get(field.key);
        if (value === null || value === "" || field.type === "password") continue;
        if (field.type === "int") {
            if (!/^\d+$/.test(value)) throw new HttpError(400, `${field.key} must be an integer`);
            where[field.key] = Number(value);
        } else if (field.type !== "datetime") {
            where[field.key] = value;
        }
    }
    return where;
}

export function pagination(params: URLSearchParams) {
    const page = Math.max(1, Number.parseInt(params.get("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(params.get("limit") ?? "10") || 10));
    return { page, limit, skip: (page - 1) * limit };
}

export async function paginate(
    resource: Resource,
    params: URLSearchParams,
    extraWhere: Record<string, unknown> = {},
) {
    const { page, limit, skip } = pagination(params);
    const where = { ...buildWhere(resource, params), ...extraWhere };
    const [data, total] = await Promise.all([
        delegate(resource).findMany({ where, orderBy: resource.orderBy, include: resource.include, skip, take: limit }),
        delegate(resource).count({ where }),
    ]);
    return { data, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

// GET /api/<slug>  and  POST /api/<slug>
export function collectionHandlers(slug: string) {
    const resource = getResource(slug);
    return {
        GET: handle(async (request: NextRequest) => {
            if (!resource.publicRead) await requireAdmin();
            return json(await paginate(resource, request.nextUrl.searchParams));
        }),
        POST: handle(async (request: NextRequest) => {
            await requireAdmin();
            const data = toData(resource, await readBody(request), false);
            const created = await delegate(resource).create({ data, include: resource.include });
            return json(created, 201);
        }),
    };
}

// GET / PUT / PATCH / DELETE /api/<slug>/:id
export function itemHandlers(slug: string) {
    const resource = getResource(slug);
    const where = async (ctx: IdContext) => ({ [resource.idKey]: parseId((await ctx.params).id, resource.bigintId) });
    const update = (partial: boolean) =>
        handle(async (request: NextRequest, ctx: IdContext) => {
            await requireAdmin();
            const data = toData(resource, await readBody(request), partial);
            const updated = await delegate(resource).update({ where: await where(ctx), data, include: resource.include });
            return json(updated);
        });
    return {
        GET: handle(async (_request: NextRequest, ctx: IdContext) => {
            if (!resource.publicRead) await requireAdmin();
            const record = await delegate(resource).findUnique({ where: await where(ctx), include: resource.include });
            if (!record) throw new HttpError(404, "Not found");
            return json(record);
        }),
        PUT: update(false),
        PATCH: update(true),
        DELETE: handle(async (_request: NextRequest, ctx: IdContext) => {
            await requireAdmin();
            await delegate(resource).delete({ where: await where(ctx) });
            return noContent();
        }),
    };
}
