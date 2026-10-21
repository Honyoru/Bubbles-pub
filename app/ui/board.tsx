'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import Announce from "./(announce)/announce";
import Pagination from "./pagination";
import { api, type Ad, type Paginated, type User } from "@/app/lib/client";
import { CONTRACT_TYPES } from "@/app/lib/resources";

const PAGE_SIZE = 9;

export default function Board ({ q, user }: { q: string, user: User | null }) {
    const [contract, setContract] = useState("");
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<Paginated<Ad> | null>(null);
    const [error, setError] = useState("");
    const [openId, setOpenId] = useState<number | null>(null);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (q) params.set("q", q);
        if (contract) params.set("contract_type", contract);
        let cancelled = false;
        api<Paginated<Ad>>(`/api/ads?${params}`)
            .then((data) => { if (!cancelled) { setResult(data); setError(""); } })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [q, contract, page]);

    const filters = [{ label: "All", value: "" }, ...CONTRACT_TYPES.map((c) => ({ label: c, value: c }))];

    return (
        <>
        <div className = "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className = "text-2xl font-extrabold tracking-tight text-indigo-950">
                    {q ? <>Results for &ldquo;{q}&rdquo;</> : "Latest offers"}
                </h2>
                <p className = "text-sm text-slate-500">
                    {result ? `${result.total} offer${result.total === 1 ? "" : "s"} available` : "Loading offers…"}
                    {q && <> &middot; <Link href = "/#jobs" className = "font-semibold text-indigo-600 hover:underline">clear search</Link></>}
                </p>
            </div>
            <div className = "flex flex-wrap gap-2">
                {filters.map((filter) => (
                    <button
                        key = {filter.label}
                        onClick = {() => { setContract(filter.value); setPage(1); setOpenId(null); }}
                        className = {`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                            contract === filter.value
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-indigo-100 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        </div>

        {error && <p className = "alert-error">{error}</p>}

        {!result && !error && (
            <div className = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                    <div key = {i} className = "panel h-72 animate-pulse bg-indigo-50/50"/>
                ))}
            </div>
        )}

        {result && result.data.length === 0 && (
            <div className = "panel p-10 text-center text-slate-500">No offer matches your search yet. Try another filter!</div>
        )}

        {result && result.data.length > 0 && (
            <div className = "grid grid-flow-dense gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.data.map((ad) => (
                    <Announce
                        key = {ad.advertisement_id}
                        ad = {ad}
                        user = {user}
                        open = {openId === ad.advertisement_id}
                        onToggle = {(isOpen) => setOpenId(isOpen ? ad.advertisement_id : null)}
                        readOnly = {user?.role === "recruiter" ? true : false }
                    />
                ))}
            </div>
        )}

        {result && (
            <Pagination page = {result.page} totalPages = {result.totalPages} onChange = {(p) => { setPage(p); setOpenId(null); }}/>
        )}
        </>
    )
}
