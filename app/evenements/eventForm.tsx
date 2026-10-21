'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import EventFields from "./eventFields";
import { api, formToObject } from "@/app/lib/client";

// Create an event: the logged-in meeter becomes its organizer
export default function EventForm () {
    const router = useRouter();
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    async function submit (event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
            await api("/api/events/mine", { method: "POST", body: formToObject(event.currentTarget) });
            router.push("/boardEvent#events");
        } catch (err) {
            setError((err as Error).message);
            setPending(false);
        }
    }

    return (
        <form onSubmit = {submit} className = "panel grid gap-5 p-8">
            <div>
                <h1 className = "text-2xl font-extrabold tracking-tight text-indigo-950">Create an event</h1>
                <p className = "text-sm text-slate-500">You will be its organizer: edit or delete it later from the events board.</p>
            </div>
            <EventFields/>
            {error && <p className = "alert-error">{error}</p>}
            <button type = "submit" className = "btn-primary py-2.5" disabled = {pending}>
                {pending ? "Saving…" : "Create event"}
            </button>
        </form>
    )
}
