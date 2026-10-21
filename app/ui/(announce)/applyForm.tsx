'use client'

import { useState } from "react";
import Link from "next/link";
import { api, formToObject, type Ad, type User } from "@/app/lib/client";

export const CONTACT_FIELDS = [
    { name: "first_name", label: "First name", type: "text", autoComplete: "given-name" },
    { name: "name", label: "Last name", type: "text", autoComplete: "family-name" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "cellphone_number", label: "Phone", type: "tel", autoComplete: "tel" },
    { name: "location", label: "City", type: "text", autoComplete: "address-level2" },
];

export default function ApplyForm ({ ad, user }: { ad: Ad, user: User | null }) {
    const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
    const [error, setError] = useState("");

    async function submit (event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus("sending");
        setError("");
        try {
            await api(`/api/ads/${ad.advertisement_id}/applications`, { method: "POST", body: formToObject(event.currentTarget) });
            setStatus("sent");
        } catch (err) {
            setError((err as Error).message);
            setStatus("idle");
        }
    }

    if (status === "sent") {
        return (
            <p className = "alert-success mt-2">
                Your application to <strong>{ad.title}</strong> was sent to {ad.company.name}. Good luck!
            </p>
        )
    }

    return (
        <form onSubmit = {submit} className = "mt-2 grid gap-4">
            {user ? (
                <p className = "rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-sm text-slate-600">
                    Applying as <strong className = "text-indigo-950">{user.first_name} {user.name}</strong> ({user.email}, {user.cellphone_number})
                </p>
            ) : (
                <>
                <p className = "text-sm text-slate-500">
                    <Link href = "/login" className = "font-semibold text-indigo-600 hover:underline">Sign in</Link> to apply without filling in your details.
                </p>
                <div className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {CONTACT_FIELDS.map((field) => (
                        <div key = {field.name}>
                            <label className = "label" htmlFor = {`${field.name}-${ad.advertisement_id}`}>{field.label}</label>
                            <input id = {`${field.name}-${ad.advertisement_id}`} className = "input" required {...field}/>
                        </div>
                    ))}
                </div>
                </>
            )}
            <div>
                <label className = "label" htmlFor = {`message-${ad.advertisement_id}`}>Message to {ad.company.name}</label>
                <textarea
                    id = {`message-${ad.advertisement_id}`}
                    name = "message"
                    required
                    rows = {4}
                    className = "input resize-y"
                    placeholder = "Tell them why you're a great fit…"
                />
            </div>
            <div>
                <label className = "label" htmlFor = {`resume-${ad.advertisement_id}`}>Resume link (optional)</label>
                <input id = {`resume-${ad.advertisement_id}`} name = "resume_url" type = "url" className = "input" placeholder = "https://…"/>
            </div>
            {error && <p className = "alert-error">{error}</p>}
            <button type = "submit" className = "btn-primary self-start" disabled = {status === "sending"}>
                {status === "sending" ? "Sending…" : "Send application"}
            </button>
        </form>
    )
}
