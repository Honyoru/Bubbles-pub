'use client'

import { useEffect, useState } from "react";
import Pagination from "@/app/ui/pagination";
import { api, type Paginated } from "@/app/lib/client";

const PAGE_SIZE = 9;

// Shape of one application returned by /api/applications/received
type ReceivedApplication = {
    application_id: number;
    applied_at: string;
    message: string | null;
    resume_url: string | null;
    people: { person_id: number; first_name: string; name: string; email: string; cellphone_number: string; location: string };
    advertisements: { advertisement_id: number; title: string };
};

export default function ApplicationsList () {
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [result, setResult] = useState<Paginated<ReceivedApplication> | null>(null);
    const [error, setError] = useState("");

    // Refetch each time the page or the search changes
    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (q) params.set("q", q);
        // "cancelled" avoids using an old response if the user changed page/search
        let cancelled = false;
        api<Paginated<ReceivedApplication>>(`/api/applications/received?${params}`)
            .then((data) => { if (!cancelled) { setResult(data); setError(""); } })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [page, q]);

    return (
        <div className = "grid gap-6">
            <div className = "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className = "text-2xl font-extrabold tracking-tight text-indigo-950">Applications received</h1>
                    <p className = "text-sm text-slate-500">
                        {result ? `${result.total} application${result.total === 1 ? "" : "s"} for your offers` : "Loading applications…"}
                    </p>
                </div>
                <input
                    type = "search"
                    value = {q}
                    onChange = {(e) => { setQ(e.target.value); setPage(1); }}
                    placeholder = "Search in messages…"
                    className = "input sm:max-w-xs"
                />
            </div>

            {error && <p className = "alert-error">{error}</p>}

            {result && result.data.length === 0 && (
                <div className = "panel p-10 text-center text-slate-500">No application received yet.</div>
            )}

            {result && result.data.length > 0 && (
                <ul className = "grid gap-4">
                    {result.data.map((a) => (
                        <li key = {a.application_id} className = "panel grid gap-3 p-6">
                            <div className = "flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className = "font-bold text-indigo-950">{a.people.first_name} {a.people.name}</p>
                                    <p className = "text-xs text-slate-500">
                                        {a.people.email} &middot; {a.people.cellphone_number} &middot; {a.people.location}
                                    </p>
                                </div>
                                <div className = "text-right">
                                    <p className = "text-sm font-semibold text-indigo-600">{a.advertisements.title}</p>
                                    <p className = "text-xs text-slate-500">{new Date(a.applied_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <p className = "rounded-2xl bg-indigo-50/60 p-4 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                                {a.message ?? "No message."}
                            </p>
                            {a.resume_url && (
                                <a href = {a.resume_url} target = "_blank" rel = "noopener noreferrer" className = "text-sm font-semibold text-indigo-600 hover:underline">
                                    View resume &rarr;
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {result && <Pagination page = {result.page} totalPages = {result.totalPages} onChange = {setPage}/>}
        </div>
    )
}