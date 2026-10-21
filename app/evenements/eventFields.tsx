import type { Evenement } from "@/app/lib/client";

// Inputs shared by the create form and the edit form (pre-filled when an event is given)
export default function EventFields ({ event }: { event?: Evenement }) {
    const id = (name: string) => `${name}-${event?.event_id ?? "new"}`; // unique id per event
    return (
        <div className = "grid gap-4 sm:grid-cols-2">
            <div>
                <label className = "label" htmlFor = {id("title")}>Title</label>
                <input id = {id("title")} name = "title" required maxLength = {150} defaultValue = {event?.title} className = "input"/>
            </div>
            <div>
                <label className = "label" htmlFor = {id("location")}>City</label>
                <input id = {id("location")} name = "location" required maxLength = {150} autoComplete = "address-level2" defaultValue = {event?.location} className = "input"/>
            </div>
            <div className = "sm:col-span-2">
                <label className = "label" htmlFor = {id("date")}>Event date</label>
                {/* <input type="date"> wants "YYYY-MM-DD", the API sends a full ISO date */}
                <input id = {id("date")} name = "event_date" type = "date" required defaultValue = {event?.event_date.slice(0, 10)} className = "input"/>
            </div>
            <div className = "sm:col-span-2">
                <label className = "label" htmlFor = {id("description")}>Description</label>
                <textarea id = {id("description")} name = "description" required rows = {5} defaultValue = {event?.description} className = "input resize-y"/>
            </div>
        </div>
    )
}
