'use client'

import { useState } from "react";
import { bubbles } from "@/app/ui/fonts";
import EventApplyForm from "./eventApplyForm";
import EventEditForm from "./eventEditForm";
import { api, type Evenement, type User } from "@/app/lib/client";

type Mode = "details" | "apply" | "edit";

const DAY = 24 * 3600 * 1000;

export default function EventBubble ({ event, user, open, onToggle, onChanged }: {
    event: Evenement,
    user: User | null,
    open: boolean,
    onToggle: (open: boolean) => void,
    onChanged?: (action: "updated" | "deleted") => void,
}) {
    const [mode, setMode] = useState<Mode>("details");
    const [detail, setDetail] = useState<Evenement | null>(null);
    const [error, setError] = useState("");
    const [now] = useState(Date.now);

    const date = new Date(event.event_date);
    // Events only store a day, so an event stays open until that day is over
    const isPast = date.getTime() + DAY < now;
    const isSoon = !isPast && date.getTime() - now < 7 * DAY;
    const closed = isPast || (event.end_register_at !== null && new Date(event.end_register_at).getTime() < now);
    const isOrganizer = user?.person_id === event.organizer_id;
    // Only the meeter who organizes the event can edit or delete it
    const canManage = user?.role === "meeter" && isOrganizer;

    async function show (next: Mode) {
        if (open && mode === next) return onToggle(false);
        setMode(next);
        setError("");
        onToggle(true);
        // Learn more always fetches the full event from the API
        if (next === "details") {
            try {
                setDetail(await api<Evenement>(`/api/events/${event.event_id}`));
            } catch (err) {
                setError((err as Error).message);
            }
        }
    }

    async function remove () {
        if (!confirm(`Delete "${event.title}"? Its registrations will be deleted too.`)) return;
        try {
            await api(`/api/events/mine/${event.event_id}`, { method: "DELETE" });
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
                <span className = {`${bubbles.className} px-6 text-center text-3xl leading-none text-indigo-500/80`}>
                  {event.title}  
                </span>
                {isSoon && (
                    <span className = "absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur">
                        Soon
                    </span>
                )}
                {isPast && (
                    <span className = "absolute top-3 left-3 rounded-full bg-slate-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        Past
                    </span>
                )}
                {isOrganizer && (
                    <span className = "absolute top-3 right-3 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        Your event
                    </span>
                )}
            </div>
            <div className = "flex flex-1 flex-col gap-2 p-5">
                <div className = "flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className = "font-semibold text-indigo-600">{event.location}</span>
                    <span className = "text-slate-300">&middot;</span>
                    <span>{date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
                <h3 className = {`text-lg font-bold text-indigo-950 ${open ? "" : "truncate"}`}>
                    {event.title}
                </h3>
                {!open && (
                    <p className = "line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">
                        {event.description}
                    </p>
                )}

                {error && <p className = "alert-error">{error}</p>}

                {open && mode === "details" && (
                    <div className = "mt-2">
                        {!detail && !error && <p className = "text-sm text-slate-400">Loading…</p>}
                        {detail && <Details event = {detail}/>}
                    </div>
                )}
                {open && mode === "apply" && (
                    <EventApplyForm event = {event} user = {user}/>
                )}
                {open && mode === "edit" && canManage && (
                    <EventEditForm
                        event = {event}
                        onSaved = {() => { onToggle(false); onChanged?.("updated"); }}
                    />
                )}

                <div className = "mt-3 flex flex-wrap gap-2">
                    <button className = {open && mode === "details" ? "btn-ghost" : "btn-primary"} onClick = {() => show("details")}>
                        {open && mode === "details" ? "Show less" : "Learn more"}
                    </button>
                    {canManage ? (
                        <>
                        <button className = {open && mode === "edit" ? "btn-ghost" : "btn-primary bg-emerald-500 hover:bg-emerald-600"} onClick = {() => show("edit")}>
                            {open && mode === "edit" ? "Cancel" : "Edit"}
                        </button>
                        <button className = "btn-danger" onClick = {remove}>Delete</button>
                        </>
                    ) : closed ? (
                        <span className = "self-center text-sm font-semibold text-slate-400">Registration closed</span>
                    ) : (
                        <button className = {open && mode === "apply" ? "btn-ghost" : "btn-primary bg-fuchsia-500 hover:bg-fuchsia-600"} onClick = {() => show("apply")}>
                            {open && mode === "apply" ? "Cancel" : "Register"}
                            {!(open && mode === "apply") && <span aria-hidden className = "transition-transform group-hover:translate-x-0.5">&rarr;</span>}
                        </button>
                    )}
                </div>
            </div>
        </article>
    )
}

function Details ({ event }: { event: Evenement }) {
    const day = (value: string) => new Date(value).toLocaleDateString(undefined, { dateStyle: "full" });
    const facts = [
        ["Place", event.location],
        ["Date", day(event.event_date)],
        ["Registration ends", event.end_register_at && day(event.end_register_at)],
    ].filter(([, value]) => value);

    return (
        <div className = "grid gap-6 md:grid-cols-[2fr_1fr]">
            <p className = "text-sm leading-relaxed whitespace-pre-line text-slate-700">{event.description}</p>
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