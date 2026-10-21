'use client'

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CONTACT_FIELDS } from "@/app/ui/(announce)/applyForm";
import { api, formToObject, type Evenement, type User } from "@/app/lib/client";

export default function EventApplyForm ({ event, user }: { event: Evenement, user: User | null }) {
    const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
    const [error, setError] = useState("");

    async function submit (e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus("sending");
        setError("");
        try {
            await api(`/api/events/${event.event_id}/participants`, { method: "POST", body: formToObject(e.currentTarget) });
            setStatus("sent");
        } catch (err) {
            setError((err as Error).message);
            setStatus("idle");
        }
    }

    if (status === "sent") {
        return (
            <p className = "alert-success mt-2">
                You are registered for <strong>{event.title}</strong> on {new Date(event.event_date).toLocaleDateString()}. See you there!
            </p>
        )
    }

    return (
        <form onSubmit = {submit} className = "mt-2 grid gap-4">
            {user ? (
                <p className = "rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-sm text-slate-600">
                    Registering as <strong className = "text-indigo-950">{user.first_name} {user.name}</strong> ({user.email})
                </p>
            ) : (
                <>
                <p className = "text-sm text-slate-500">
                    <Link href = "/login" className = "font-semibold text-indigo-600 hover:underline">Sign in</Link> to register without filling in your details.
                </p>
                <div className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CONTACT_FIELDS.map((field) => (
                        <div key = {field.name}>
                            <label className = "label" htmlFor = {`${field.name}-event-${event.event_id}`}>{field.label}</label>
                            <input id = {`${field.name}-event-${event.event_id}`} className = "input" required {...field}/>
                        </div>
                    ))}
                </div>
                </>
            )}
            {error && <p className = "alert-error">{error}</p>}
            <button type = "submit" className = "btn-primary self-start" disabled = {status === "sending"}>
                {status === "sending" ? "Registering…" : "Confirm registration"}
            </button>
        </form>
    )
}