'use client'

import { useEffect, useState } from "react";
import Announce from "@/app/ui/(announce)/announce";
import Pagination from "@/app/ui/pagination";
import { formToObject, api, type Ad, type Paginated, type User } from "@/app/lib/client";
import { CONTRACT_TYPES, REMOTE_STATUSES } from "@/app/lib/resources";

const PAGE_SIZE = 9;

export default function Post ({ user }: { user: User }) {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<Paginated<Ad> | null>(null);
    const [error, setError] = useState("");
    const [openId, setOpenId] = useState<number | null>(null);
    const [version, setVersion] = useState(0);

    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState("");
    const [pending, setPending] = useState(false);
    const reload = () => setVersion((v) => v + 1);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (q) params.set("q", q);
        let cancelled = false;
        api<Paginated<Ad>>(`/api/ads/mine?${params}`)
            .then((data) => { if (!cancelled) { setResult(data); setError(""); } })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [q, page, version]);

    function toggleForm () {
        setShowForm((current) => !current);
        setFormError("");
    }

    async function createAnnounce (event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setFormError("");
        try {
            await api("/api/ads", { method: "POST", body: formToObject(event.currentTarget) });
            setShowForm(false);
            setPage(1);      // the newest ad is on page 1 (ordered by created_at desc)
            reload();        // refetch the list so the new ad appears
        } catch (err) {
            setFormError((err as Error).message);
        } finally {
            setPending(false);
        }
    }

    // Appelé par Announce après une modification ou une suppression
    function onChanged (action: "updated" | "deleted") {
        // Si on a supprimé la dernière annonce de la page, on recule d'une page
        if (action === "deleted" && result && result.data.length === 1 && page > 1) setPage(page - 1);
        else reload();
    }

    return (
        <>
        <div className = "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h1 className = "text-2xl font-extrabold tracking-tight text-indigo-950">My job offers</h1>
                <p className = "text-sm text-slate-500">
                    {result ? `${result.total} offer${result.total === 1 ? "" : "s"} posted by your company` : "Loading offers…"}
                </p>
            </div>
            <input
                type = "search"
                value = {q}
                onChange = {(e) => { setQ(e.target.value); setPage(1); setOpenId(null); }}
                placeholder = "Search my offers…"
                className = "input sm:max-w-xs"
            />
            <button type = "button" className = "btn-primary" onClick = {toggleForm}>
                {showForm ? "Cancel" : "Create an ad"}
            </button>
        </div>

        {showForm && (
            <form onSubmit = {createAnnounce} className = "panel mb-6 grid gap-4 p-6">
                <div className = "grid gap-4 sm:grid-cols-2">
                    <div className = "sm:col-span-2">
                        <label className = "label" htmlFor = "title">Title</label>
                        <input id = "title" name = "title" required className = "input"/>
                    </div>
                    <div className = "sm:col-span-2">
                        <label className = "label" htmlFor = "description">Description</label>
                        <textarea id = "description" name = "description" rows = {4} required className = "input resize-y"/>
                    </div>
                    {/* Only an admin must choose the company; a recruiter's company is found by the server */}
                    {user.role === "admin" && (
                        <div>
                            <label className = "label" htmlFor = "company_id">Company ID</label>
                            <input id = "company_id" name = "company_id" type = "number" required className = "input"/>
                        </div>
                    )}
                    <div>
                        <label className = "label" htmlFor = "location">City</label>
                        <input id = "location" name = "location" className = "input"/>
                    </div>
                    <div>
                        <label className = "label" htmlFor = "contract_type">Contract</label>
                        <select id = "contract_type" name = "contract_type" className = "input">
                            <option value = "">—</option>
                            {CONTRACT_TYPES.map((c) => <option key = {c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className = "label" htmlFor = "remote_status">Remote</label>
                        <select id = "remote_status" name = "remote_status" className = "input">
                            <option value = "">—</option>
                            {REMOTE_STATUSES.map((r) => <option key = {r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className = "label" htmlFor = "category">Category</label>
                        <input id = "category" name = "category" className = "input"/>
                    </div>
                    <div>
                        <label className = "label" htmlFor = "salary">Salary</label>
                        <input id = "salary" name = "salary" className = "input"/>
                    </div>
                    <div>
                        <label className = "label" htmlFor = "working_time">Working time</label>
                        <input id = "working_time" name = "working_time" className = "input"/>
                    </div>
                </div>
                {formError && <p className = "alert-error">{formError}</p>}
                <button type = "submit" className = "btn-primary py-2.5" disabled = {pending}>
                    {pending ? "Saving…" : "Publish ad"}
                </button>
            </form>
        )}

        {error && <p className = "alert-error">{error}</p>}
        {/*Skeleton*/}
        {!result && !error && (
            <div className = "grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key = {i} className = "panel h-72 animate-pulse bg-indigo-50/50"/>
                ))}
            </div>
        )}

        {result && result.data.length === 0 && (
            <div className = "panel p-10 text-center text-slate-500">You haven&apos;t posted any offer yet.</div>
        )}

        {result && result.data.length > 0 && (
            <div className = "grid grid-flow-dense gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.data.map((ad) => (
                    <Announce
                        key = {ad.advertisement_id}
                        ad = {ad}
                        user = {user}
                        readOnly
                        open = {openId === ad.advertisement_id}
                        onToggle = {(isOpen) => setOpenId(isOpen ? ad.advertisement_id : null)}
                        onChanged = {onChanged}
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