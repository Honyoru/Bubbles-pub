import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Shell from "@/app/ui/shell";
import ApplicationsList from "./applicationsList";
import { getSessionUser } from "@/app/lib/session";

export const metadata: Metadata = { title: "Applications · Bubbles" };

export default async function ApplicationsPage () {
    const user = await getSessionUser();
    // Not logged in -> login page; logged in but not a recruiter -> home page
    if (!user) redirect("/login");
    if (user.role !== "recruiter") redirect("/");

    return (
        <Shell active = "/applications" wide>
            <ApplicationsList/>
        </Shell>
    )
}