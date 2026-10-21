import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Shell from "@/app/ui/shell";
import EventForm from "./eventForm";
import { getSessionUser } from "@/app/lib/session";

export const metadata: Metadata = { title: "New event · Bubbles" };

// Only meeters can create events
export default async function EvenementPage () {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    if (user.role !== "meeter") redirect("/boardEvent");

    return (
        <Shell active = "/evenements">
            <EventForm/>
        </Shell>
    )
}
