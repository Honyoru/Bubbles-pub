import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Shell from "@/app/ui/shell";
import AdminPanel from "./adminPanel";
import { getSessionUser } from "@/app/lib/session";

export const metadata: Metadata = { title: "Administration · Bubbles" };

export default async function AdminPage () {
    const user = await getSessionUser();
    // Check if the user is admin
    if (!user) redirect("/login");
    if (user.role !== "admin") redirect("/");

    return (
        <Shell active = "/admin" wide>
            <AdminPanel/>
        </Shell>
    )
}
