'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import EventBubble from "./eventBubble";
import Pagination from "./pagination";
import { api, type Evenement, type Paginated, type User } from "@/app/lib/client";

const PAGE_SIZE = 9;

export default function BoardEvent({ q, user }: { q: string; user: User | null }) {
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<Paginated<Evenement> | null>(null);
    const [error, setError] = useState("");
    const [openId, setOpenId] = useState<number | null>(null);
    const [version, setVersion] = useState(0);
    const reload = () => setVersion((v) => v + 1);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (q) params.set("q", q);
        let cancelled = false;
        api<Paginated<Evenement>>(`/api/events?${params}`)
            .then((data) => { if (!cancelled) { setResult(data); setError(""); } })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [q, page, version]);

    // Called by an event bubble after its organizer edits or deletes it
    function onChanged (action: "updated" | "deleted") {
        // Deleting the last event of a page goes back one page
        if (action === "deleted" && result && result.data.length === 1 && page > 1) setPage(page - 1);
        else reload();
    }

    return (
        <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-indigo-950">
                        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Upcoming events"}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {result ? `${result.total} event${result.total === 1 ? "" : "s"}` : "Loading events…"}
                        {q && <> &middot; <Link href="/boardEvent#events" className="font-semibold text-indigo-600 hover:underline">clear search</Link></>}
                    </p>
                </div>
            {user?.role === "meeter" && <Link href="/evenements" className="btn-primary">Create an event</Link>}
            </div>

            {error && <p className="alert-error">{error}</p>}

            {!result && !error && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="panel h-48 animate-pulse bg-indigo-50/50" />
                    ))}
                </div>
            )}

            {result && result.data.length === 0 && (
                <div className="panel p-10 text-center text-slate-500">No event matches your search yet.</div>
            )}

            {result && result.data.length > 0 && (
                <div className="grid grid-flow-dense gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {result.data.map((ev) => (
                        <EventBubble
                            key={ev.event_id}
                            event={ev}
                            user={user}
                            open={openId === ev.event_id}
                            onToggle={(isOpen) => setOpenId(isOpen ? ev.event_id : null)}
                            onChanged={onChanged}
                        />
                    ))}
                </div>
            )}

            {result && (
                <Pagination page={result.page} totalPages={result.totalPages} onChange={(p) => { setPage(p); setOpenId(null); }} />
            )}
        </>
    );
}
