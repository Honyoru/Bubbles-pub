'use client'

import { useState } from "react";
import { api, formToObject, type Ad } from "@/app/lib/client";
import { CONTRACT_TYPES, REMOTE_STATUSES } from "@/app/lib/resources";

export default function EditForm ({ ad, onSaved }: { ad: Ad, onSaved: () => void }) {
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    const id = (name: string) => `edit-${name}-${ad.advertisement_id}`; // id unique par annonce

    async function submit (event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
            await api(`/api/ads/mine/${ad.advertisement_id}`, { method: "PUT", body: formToObject(event.currentTarget) });
            onSaved();
        } catch (err) {
            setError((err as Error).message);
            setPending(false);
        }
    }

    return (
        <form onSubmit = {submit} className = "mt-2 grid gap-4 sm:grid-cols-2">
            <div>
                <label className = "label" htmlFor = {id("title")}>Title</label>
                <input id = {id("title")} name = "title" required defaultValue = {ad.title} className = "input"/>
            </div>
            <div>
                <label className = "label" htmlFor = {id("location")}>Location</label>
                <input id = {id("location")} name = "location" defaultValue = {ad.location ?? ""} className = "input"/>
            </div>
            <div className = "sm:col-span-2">
                <label className = "label" htmlFor = {id("description")}>Description</label>
                <textarea id = {id("description")} name = "description" required rows = {5} defaultValue = {ad.description} className = "input resize-y"/>
            </div>
            <div>
                <label className = "label" htmlFor = {id("contract")}>Contract</label>
                <select id = {id("contract")} name = "contract_type" defaultValue = {ad.contract_type ?? ""} className = "input">
                    <option value = "">—</option>
                    {CONTRACT_TYPES.map((c) => <option key = {c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className = "label" htmlFor = {id("remote")}>Remote</label>
                <select id = {id("remote")} name = "remote_status" defaultValue = {ad.remote_status ?? ""} className = "input">
                    <option value = "">—</option>
                    {REMOTE_STATUSES.map((r) => <option key = {r}>{r}</option>)}
                </select>
            </div>
            <div>
                <label className = "label" htmlFor = {id("category")}>Category</label>
                <input id = {id("category")} name = "category" defaultValue = {ad.category ?? ""} className = "input"/>
            </div>
            <div>
                <label className = "label" htmlFor = {id("salary")}>Salary</label>
                <input id = {id("salary")} name = "salary" defaultValue = {ad.salary ?? ""} className = "input"/>
            </div>
            <div className = "sm:col-span-2">
                <label className = "label" htmlFor = {id("time")}>Working time</label>
                <input id = {id("time")} name = "working_time" defaultValue = {ad.working_time ?? ""} className = "input"/>
            </div>
            {error && <p className = "alert-error sm:col-span-2">{error}</p>}
            <button type = "submit" className = "btn-primary self-start" disabled = {pending}>
                {pending ? "Saving…" : "Save changes"}
            </button>
        </form>
    )
}