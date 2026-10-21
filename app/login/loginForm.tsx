'use client'

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formToObject } from "@/app/lib/client";

export default function LoginForm () {
    const router = useRouter();
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    async function submit (event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setError("");
        try {
            const { redirect } = await api<{ redirect: string }>("/api/session", { method: "POST", body: formToObject(event.currentTarget) });
            // Admins land on the administration page, everyone else on the board
            router.push(redirect);
            router.refresh();
        } catch (err) {
            setError((err as Error).message);
            setPending(false);
        }
    }

    return (
        <form onSubmit = {submit} className = "panel grid gap-5 p-8">
            <div>
                <h1 className = "text-2xl font-extrabold tracking-tight text-indigo-950">Welcome back</h1>
                <p className = "text-sm text-slate-500">Sign in to apply in one click.</p>
            </div>
            <div>
                <label className = "label" htmlFor = "email">Email</label>
                <input id = "email" name = "email" type = "email" autoComplete = "email" required className = "input"/>
            </div>
            <div>
                <label className = "label" htmlFor = "password">Password</label>
                <input id = "password" name = "password" type = "password" autoComplete = "current-password" required className = "input"/>
            </div>
            {error && <p className = "alert-error">{error}</p>}
            <button type = "submit" className = "btn-primary py-2.5" disabled = {pending}>
                {pending ? "Signing in…" : "Sign in"}
            </button>
            <p className = "text-center text-sm text-slate-500">
                No account yet? <Link href = "/account" className = "font-semibold text-indigo-600 hover:underline">Create one</Link>
            </p>
        </form>
    )
}
