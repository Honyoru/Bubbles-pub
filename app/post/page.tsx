import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Shell from "@/app/ui/shell";
import Post from "./post";
import { getSessionUser } from "@/app/lib/session";

export const metadata: Metadata = { title: "Jobs posting · Bubbles" };

export default async function PostPage () {
    const user = await getSessionUser();
    if (!user) redirect("/login");
    if (user.role !== "recruiter") redirect("/");

    return (
        <Shell active = "/post" wide>
            <Post user = {user}/>
        </Shell>
    )
}