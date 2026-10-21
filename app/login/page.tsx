import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Shell from "@/app/ui/shell";
import LoginForm from "./loginForm";
import { getSessionUser } from "@/app/lib/session";

export const metadata: Metadata = { title: "Sign in · Bubbles" };

export default async function LoginPage () {
    const user = await getSessionUser();
    if (user) redirect(user.role === "admin" ? "/admin" : "/");

    return (
        <Shell>
            <LoginForm/>
        </Shell>
    )
}
