'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, formToObject, type User, type Paginated } from "@/app/lib/client";

// List of all fields for the form 
const FIELDS = [
    { name: "first_name", label: "First name", type: "text", autoComplete: "given-name", required: true },
    { name: "name", label: "Last name", type: "text", autoComplete: "family-name", required: true },
    { name: "pseudo", label: "Pseudo", type: "text", autoComplete: "nickname", required: false },
    { name: "email", label: "Email", type: "email", autoComplete: "email", required: true },
    { name: "cellphone_number", label: "Phone", type: "tel", autoComplete: "tel", required: true },
    { name: "location", label: "City", type: "text", autoComplete: "address-level2", required: true },
] as const;

const SIGNUP_ROLES = [
    { value: "candidate", label: "Candidate", hint: "I look for a job" },
    { value: "recruiter", label: "Recruiter", hint: "I post job offers" },
    { value: "meeter", label: "Meeter", hint: "I organise events" },
] as const;

type SignupRole = (typeof SIGNUP_ROLES)[number]["value"];
type CompanyMode = "existing" | "new";
type CompanyOption = { id_company: number; name: string };


// Define an application
type Application = {
    application_id: number;
    applied_at: string;
    message: string | null;
    advertisements: { title: string; company: { name: string } };
};

// Creta the form for the account
export default function AccountForm ({ user }: { user: User | null }) {
    // Setup 
    const router = useRouter();
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [pending, setPending] = useState(false);
    const [applications, setApplications] = useState<Application[]>([]);

    // --- Sign-up only state ---
    const [role, setRole] = useState<SignupRole>("candidate"); // candidate = default role
    const [companyMode, setCompanyMode] = useState<CompanyMode>("existing");
    const [companies, setCompanies] = useState<CompanyOption[]>([]);


    // Fill the form if connected
    useEffect(() => {
        if (!user) return;
        api<{ applications: Application[] }>("/api/account").then((data) => setApplications(data.applications)).catch(() => {});
    }, [user]);

    // Load existing companies only when a visitor picks "recruiter"
    useEffect(() => {
        if (user || role !== "recruiter" || companies.length > 0) return;
        api<Paginated<CompanyOption>>("/api/companies?limit=100")
            .then((data) => {
                setCompanies(data.data);
                // No company in DB yet -> go straight to the creation form
                if (data.data.length === 0) setCompanyMode("new");
            })
            .catch(() => setCompanyMode("new"));
    }, [user, role, companies.length]);


    async function submit (event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setPending(true);
        setError("");
        setSaved(false);
        try {
            const body = formToObject(event.currentTarget);
            // if connected modify the user
            if (user) {
                await api("/api/account", { method: "PATCH", body });
                setSaved(true);
                router.refresh();
            } else {
            // if not, register it and connect him
                const { redirect } = await api<{ redirect: string }>("/api/account", { method: "POST", body });
                router.push(redirect);
                router.refresh();
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setPending(false);
        }
    }
    // Delete the session
    async function signOut () {
        await api("/api/session", { method: "DELETE" });
        router.push("/");
        router.refresh();
    }
    // Delete account
    async function deleteAccount(){
        if (!confirm("Delete your account? Related records may be deleted too.")) return;
        await api("/api/account", {method: "DELETE"});
        router.push("/");
        router.refresh();
    }

    function CompanyPicker () {
        const [query, setQuery] = useState("");
        const [results, setResults] = useState<CompanyOption[]>([]);
        const [selected, setSelected] = useState<CompanyOption | null>(null);
        const [loading, setLoading] = useState(false);
    
        useEffect(() => {
            if (selected) return;
            let cancelled = false;
            const timer = setTimeout(() => {
                setLoading(true);
                const params = new URLSearchParams({ limit: "8" });
                if (query.trim()) params.set("q", query.trim());
                api<Paginated<CompanyOption>>(`/api/companies?${params}`)
                    .then((data) => { if (!cancelled) setResults(data.data); })
                    .catch(() => { if (!cancelled) setResults([]); })
                    .finally(() => { if (!cancelled) setLoading(false); });
            }, 300);
            return () => { cancelled = true; clearTimeout(timer); };
        }, [query, selected]);
    
        if (selected) {
            return (
                <div>
                    <span className = "label">Company</span>
                    <input type = "hidden" name = "company_id" value = {selected.id_company}/>
                    <div className = "flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-sm">
                        <span className = "font-semibold text-indigo-950">{selected.name}</span>
                        <button type = "button" className = "btn-ghost px-3 py-1 text-xs" onClick = {() => { setSelected(null); setQuery(""); }}>
                            Change
                        </button>
                    </div>
                </div>
            );
        }
    
        return (
            <div>
                <label className = "label" htmlFor = "company_search">Search your company</label>
                <input
                    id = "company_search"
                    type = "search"
                    value = {query}
                    onChange = {(e) => setQuery(e.target.value)}
                    placeholder = "Start typing a company name…"
                    autoComplete = "off"
                    className = "input"
                />
                <ul className = "mt-2 grid gap-1">
                    {results.map((c) => (
                        <li key = {c.id_company}>
                            <button
                                type = "button"
                                onClick = {() => setSelected(c)}
                                className = "w-full rounded-xl border border-indigo-100 bg-white px-3.5 py-2 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                {c.name}
                            </button>
                        </li>
                    ))}
                </ul>
                {!loading && results.length === 0 && (
                    <p className = "mt-2 text-xs text-slate-500">No company found. Use &ldquo;Create a company&rdquo; above.</p>
                )}
            </div>
        );
    }

    // Create the page account
    return (
        <div className = "grid gap-8">
            <form onSubmit = {submit} className = "panel grid gap-5 p-8">
                <div className = "flex items-start justify-between gap-4">
                    <div>
                        <h1 className = "text-2xl font-extrabold tracking-tight text-indigo-950">
                            {user ? "My account" : "Create your account"}
                        </h1>
                        <p className = "text-sm text-slate-500">
                            {user ? "These details are sent with every application." : "Save your details once, then apply in one click."}
                        </p>
                    </div>
                    {user && <button type = "button" onClick = {signOut} className = "btn-ghost shrink-0">Sign out</button>}
                    {user && user.role !== "admin" && <button type = "button" onClick = {deleteAccount} className = "btn-danger px-4 py-2 text-sm shrink-0">Delete account</button>}
                </div>

                {!user && (
                    <fieldset className = "grid gap-2">
                        <legend className = "label">I am a…</legend>
                        <div className = "grid gap-2 sm:grid-cols-3">
                            {SIGNUP_ROLES.map((r) => (
                                <label
                                    key = {r.value}
                                    className = {`cursor-pointer rounded-2xl border p-3 text-sm transition ${
                                        role === r.value
                                            ? "border-indigo-600 bg-indigo-50 text-indigo-950"
                                            : "border-indigo-100 bg-white text-slate-600 hover:border-indigo-200"
                                    }`}
                                >
                                    {/* name="role" => sent in the body through formToObject */}
                                    <input
                                        type = "radio"
                                        name = "role"
                                        value = {r.value}
                                        checked = {role === r.value}
                                        onChange = {() => setRole(r.value)}
                                        className = "sr-only"
                                    />
                                    <span className = "block font-bold">{r.label}</span>
                                    <span className = "block text-xs text-slate-500">{r.hint}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                )}

                <div className = "grid gap-4 sm:grid-cols-2">
                    { /* create the field with the list FIELDS */}
                    {FIELDS.map((field) => (
                        <div key = {field.name}>
                            <label className = "label" htmlFor = {field.name}>{field.label}</label>
                            <input
                                id = {field.name}
                                className = "input"
                                defaultValue = {user?.[field.name] ?? ""}
                                {...field}
                            />
                        </div>
                    ))}
                    <div className = "sm:col-span-2">
                        <label className = "label" htmlFor = "password">{user ? "New password (leave empty to keep it)" : "Password"}</label>
                        <input id = "password" name = "password" type = "password" autoComplete = "new-password" minLength = {6} required = {!user} className = "input"/>
                    </div>
                </div>

                {!user && role === "recruiter" && (
                    <section className = "grid gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
                        <h2 className = "text-base font-extrabold text-indigo-950">Your company</h2>
 
                        <div className = "flex flex-wrap gap-2">
                            {(["existing", "new"] as const).map((mode) => (
                                <label
                                    key = {mode}
                                    className = {`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                                        companyMode === mode
                                            ? "border-indigo-600 bg-indigo-600 text-white"
                                            : "border-indigo-100 bg-white text-slate-600 hover:border-indigo-200"
                                    }`}
                                >
                                    <input
                                        type = "radio"
                                        name = "company_mode"
                                        value = {mode}
                                        checked = {companyMode === mode}
                                        onChange = {() => setCompanyMode(mode)}
                                        className = "sr-only"
                                    />
                                    {mode === "existing" ? "Pick an existing company" : "Create a company"}
                                </label>
                            ))}
                        </div>
 
                        {companyMode === "existing" ? (
                            <CompanyPicker/>
                        ) : (
                            <div className = "grid gap-4">
                                <div>
                                    <label className = "label" htmlFor = "company_name">Company name</label>
                                    <input id = "company_name" name = "company_name" type = "text" required className = "input"/>
                                </div>
                                <div>
                                    <label className = "label" htmlFor = "company_description">Description (optional)</label>
                                    <textarea id = "company_description" name = "company_description" rows = {3} className = "input resize-y"/>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {error && <p className = "alert-error">{error}</p>}
                {saved && <p className = "alert-success">Your profile was updated.</p>}
                <button type = "submit" className = "btn-primary py-2.5" disabled = {pending}>
                    {pending ? "Saving…" : user ? "Save changes" : "Create account"}
                </button>
                {!user && (
                    <p className = "text-center text-sm text-slate-500">
                        Already registered? <Link href = "/login" className = "font-semibold text-indigo-600 hover:underline">Sign in</Link>
                    </p>
                )}
            </form>
                {/* Show your appliances if you are a candidate */}
            {user && user.role == "candidate" &&  (
                <section className = "panel p-8">
                    <h2 className = "mb-4 text-lg font-extrabold text-indigo-950">My applications</h2>
                    {applications.length === 0 ? (
                        <p className = "text-sm text-slate-500">You haven&apos;t applied yet. <Link href = "/" className = "font-semibold text-indigo-600 hover:underline">Browse offers</Link></p>
                    ) : (
                        <ul className = "grid gap-3">
                            {applications.map((a) => (
                                <li key = {a.application_id} className = "rounded-2xl border border-indigo-100 p-4">
                                    <p className = "font-bold text-indigo-950">{a.advertisements.title}</p>
                                    <p className = "text-xs text-slate-500">{a.advertisements.company.name} &middot; {new Date(a.applied_at).toLocaleDateString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </div>
    )
}
