'use client'

import { useState } from "react";
import { bubbles } from "@/app/ui/fonts";
import ApplyForm from "./applyForm";
import EditForm from "./editForm";
import { api, type Ad, type User } from "@/app/lib/client";

type Mode = "details" | "apply" | "edit";

const DAY = 24 * 3600 * 1000;

export default function Announce ({ ad, user, open, onToggle, readOnly = false, onChanged }: {
    ad: Ad,
    user: User | null,
    open: boolean,
    onToggle: (open: boolean) => void,
    readOnly?: boolean,
    onChanged?: (action: "updated" | "deleted") => void,
}) {
    const [mode, setMode] = useState<Mode>("details");
    const [detail, setDetail] = useState<Ad | null>(null);
    const [error, setError] = useState("");
    const [now] = useState(Date.now);
    const isNew = now - new Date(ad.created_at).getTime() < 3 * DAY;

    // THe recruiter only see his annouces and can edit / delete them
    const isOwner = user?.role === "recruiter" && ad.company.person_id === user.person_id;

    async function show (next: Mode) {
        if (open && mode === next) return onToggle(false);
        setMode(next);
        setError("");
        onToggle(true);
        // Learn more always fetches the full ad from the API
        if (next === "details") {
            try {
                setDetail(await api<Ad>(`/api/ads/${ad.advertisement_id}`));
            } catch (err) {
                setError((err as Error).message);
            }
        }
    }

    async function remove () {
        if (!confirm(`Delete "${ad.title}"? Related applications may be affected.`)) return;
        try {
            await api(`/api/ads/mine/${ad.advertisement_id}`, { method: "DELETE" });
            onToggle(false);
            onChanged?.("deleted");
        } catch (err) {
            setError((err as Error).message);
        }
    }

    return (
        <article className = {`group flex flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm shadow-indigo-100/50 transition duration-200 ${
            open ? "ring-2 ring-indigo-200 sm:col-span-2 lg:col-span-3" : "hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100"
        }`}>
            <div className = {`relative grid place-items-center overflow-hidden bg-linear-to-br from-indigo-100 via-violet-50 to-fuchsia-100 ${open ? "h-24" : "h-32"}`}>
                <div className = "bubble size-16 -top-4 left-[10%]"/>
                <div className = "bubble size-8 bottom-3 right-[15%] [animation-delay:-1s]"/>
                <span className = {`${bubbles.className} px-6 text-center text-3xl leading-none text-indigo-500/80`}>{ad.company.name}</span>
                {isNew && (
                    <span className = "absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur">
                        New
                    </span>
                )}
                {ad.contract_type && (
                    <span className = "absolute top-3 right-3 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        {ad.contract_type}
                    </span>
                )}
            </div>
            <div className = "flex flex-1 flex-col gap-2 p-5">
                <div className ="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className = "font-semibold text-indigo-600">{ad.company.name}</span>
                    {ad.location && <><span className = "text-slate-300">&middot;</span><span>{ad.location}</span></>}
                    <span className = "text-slate-300">&middot;</span>
                    <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className = {`text-lg font-bold text-indigo-950 ${open ? "" : "truncate"}`}>
                    {ad.title}
                </h3>
                {!open && (
                    <p className = "line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                        {ad.description}
                    </p>
                )}

                {error && <p className = "alert-error">{error}</p>}

                {open && mode === "details" && (
                    <div className = "mt-2">
                        {!detail && !error && <p className = "text-sm text-slate-400">Loading…</p>}
                        {detail && <Details ad = {detail}/>}
                    </div>
                )}
                {open && mode === "apply" && (
                    <ApplyForm ad = {ad} user = {user}/>
                )}
                {open && mode === "edit" && isOwner && (
                    <EditForm
                        ad = {ad}
                        onSaved = {() => { onToggle(false); onChanged?.("updated"); }}
                    />
                )}

                <div className = "mt-3 flex flex-wrap gap-2">
                    <button className = {open && mode === "details" ? "btn-ghost" : "btn-primary"} onClick = {() => show("details")}>
                        {open && mode === "details" ? "Show less" : "Learn more"}
                    </button>
                    {!readOnly && (
                        <button className = {open && mode === "apply" ? "btn-ghost" : "btn-primary bg-fuchsia-500 hover:bg-fuchsia-600"} onClick = {() => show("apply")}>
                            {open && mode === "apply" ? "Cancel" : "Apply"}
                            {!(open && mode === "apply") && <span aria-hidden className = "transition-transform group-hover:translate-x-0.5">&rarr;</span>}
                        </button>
                    )}
                    {isOwner && (
                        <>
                        <button className = {open && mode === "edit" ? "btn-ghost" : "btn-primary bg-emerald-500 hover:bg-emerald-600"} onClick = {() => show("edit")}>
                            {open && mode === "edit" ? "Cancel" : "Edit"}
                        </button>
                        <button className = "btn-danger" onClick = {remove}>Delete</button>
                        </>
                    )}
                </div>
            </div>
        </article>
    )
}

function Details ({ ad }: { ad: Ad }) {
    const facts = [
        ["Place", ad.location],
        ["Contract", ad.contract_type],
        ["Wages", ad.salary],
        ["Working time", ad.working_time],
        ["Remote", ad.remote_status],
        ["Category", ad.category],
    ].filter(([, value]) => value);

    return (
        <div className = "grid gap-6 md:grid-cols-[2fr_1fr]">
            <div>
                <p className = "text-sm leading-relaxed whitespace-pre-line text-slate-700">{ad.description}</p>
                {ad.company.description && (
                    <div className = "mt-4 rounded-2xl bg-indigo-50/60 p-4">
                        <p className = "label">About {ad.company.name}</p>
                        <p className = "text-sm text-slate-600">{ad.company.description}</p>
                    </div>
                )}
            </div>
            <dl className = "grid content-start gap-3 rounded-2xl border border-indigo-100 p-4">
                {facts.map(([label, value]) => (
                    <div key = {label}>
                        <dt className = "label mb-0.5">{label}</dt>
                        <dd className = "text-sm font-semibold text-indigo-950">{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    )
}