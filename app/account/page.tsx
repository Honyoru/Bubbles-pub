import type { Metadata } from "next";
import Shell from "@/app/ui/shell";
import AccountForm from "./accountForm";
import { getSessionUser } from "@/app/lib/session";

export const metadata: Metadata = { title: "My account · Bubbles" };

// Create an account when signed out, edit it when signed in
export default async function AccountPage () {
    const user = await getSessionUser();
    return (
        <Shell active = "/account">
            <AccountForm user = {user}/>
        </Shell>
    )
}
