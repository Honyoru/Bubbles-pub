'use client'

import { useState } from "react";
import EventFields from "@/app/evenements/eventFields";
import { api, formToObject, type Evenement } from "@/app/lib/client";

// Edit form shown inside the event bubble, for the meeter who organizes it
export default function EventEditForm ({ event, onSaved }: { event: Evenement, onSaved: () => void }) {
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    async function submit (e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setPending(true);
        setError("");
        try {
            await api(`/api/events/mine/${event.event_id}`, { method: "PUT", body: formToObject(e.currentTarget) });
            onSaved();
        } catch (err) {
            setError((err as Error).message);
            setPending(false);
        }
    }

    return (
        <form onSubmit = {submit} className = "mt-2 grid gap-4">
            <EventFields event = {event}/>
            {error && <p className = "alert-error">{error}</p>}
            <button type = "submit" className = "btn-primary self-start" disabled = {pending}>
                {pending ? "Saving…" : "Save changes"}
            </button>
        </form>
    )
}
