'use client'

import { useEffect, useState } from "react";
import Pagination from "@/app/ui/pagination";
import { api, formToObject, type Paginated } from "@/app/lib/client";
import { RESOURCES, type Field, type Resource } from "@/app/lib/resources";

type Row = Record<string, unknown>;

const PAGE_SIZE = 10;

// ISO date -> value for <input type="datetime-local">
function toLocalInput(value: unknown): string {
    if (!value) return "";
    const d = new Date(String(value));
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function display(field: Field, value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (field.type === "datetime") return new Date(String(value)).toLocaleString();
    return String(value);
}

export default function AdminPanel () {
    const [resource, setResource] = useState<Resource>(RESOURCES[0]); // keep every display for our DB
    const [page, setPage] = useState(1);
    const [q, setQ] = useState("");
    const [result, setResult] = useState<Paginated<Row> | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [editing, setEditing] = useState<Row | "new" | null>(null);

    // Bumped after each write to refetch the current page
    const [version, setVersion] = useState(0);
    const reload = () => setVersion((v) => v + 1);

    useEffect(() => {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (q) params.set("q", q);
        let cancelled = false;
        api<Paginated<Row>>(`/api/${resource.slug}?${params}`)
            .then((data) => { if (!cancelled) { setResult(data); setError(""); } })
            .catch((err) => { if (!cancelled) setError(err.message); });
        return () => { cancelled = true; };
    }, [resource, page, q, version]);

    // Reset everything when changing ressources
    function switchTo (next: Resource) {
        setResource(next);
        setPage(1);
        setQ("");
        setResult(null);
        setEditing(null);
        setNotice("");
    }
    // Add/modifie a record
    async function save (event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const body = formToObject(event.currentTarget);
        try {
            if (editing === "new") {
                await api(`/api/${resource.slug}`, { method: "POST", body });
                setNotice("Record created.");
            } else if (editing) {
                await api(`/api/${resource.slug}/${editing[resource.idKey]}`, { method: "PUT", body });
                setNotice("Record updated.");
            }
            setEditing(null);
            setError("");
            reload();
        } catch (err) {
            setError((err as Error).message);
        }
    }
    // remove a row
    async function remove (row: Row) {
        const id = row[resource.idKey];
        // Ask again to verify if the user is sure
        if (!confirm(`Delete ${resource.label.toLowerCase()} #${id}? Related records may be deleted too.`)) return;
        try {
            // Delete with the api
            await api(`/api/${resource.slug}/${id}`, { method: "DELETE" });
            setNotice(`Record #${id} deleted.`);
            if (result && result.data.length === 1 && page > 1) setPage(page - 1);
            else reload();
        } catch (err) {
            setError((err as Error).message);
        }
    }
    // keep the ressources matching 
    const columns = resource.fields.filter((f) => f.list);

    return (
        <div className = "grid gap-6">
            <div className = "flex flex-col gap-1">
                <h1 className = "text-3xl font-extrabold tracking-tight text-indigo-950">Administration</h1>
                <p className = "text-sm text-slate-500">Browse, create, edit and delete every record of the database.</p>
            </div>

            <div className = "flex flex-wrap gap-2">
                {/* Create button to navigate between the differents tables of the DB*/}
                {RESOURCES.map((r) => (
                    <button
                        key = {r.slug}
                        onClick = {() => switchTo(r)}
                        className = {`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                            r.slug === resource.slug
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-indigo-100 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700"
                        }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            <div className = "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Input to search in the data base */}
                <input
                    type = "search"
                    value = {q}
                    onChange = {(e) => { setQ(e.target.value); setPage(1); }}
                    placeholder = {`Search ${resource.label.toLowerCase()}…`}
                    className = "input sm:max-w-xs"
                />
                {/* Display the numbers of records */}
                <div className = "flex items-center gap-3">
                    {result && <span className = "text-sm text-slate-500">{result.total} record{result.total <= 1 ? "" : "s"}</span>}
                    <button className = "btn-primary" onClick = {() => { setEditing("new"); setNotice(""); }}>+ New record</button>
                </div>
            </div>

            {error && <p className = "alert-error">{error}</p>}
            {notice && <p className = "alert-success">{notice}</p>}

            {editing && (
                <RecordForm
                    key = {`${resource.slug}-${editing === "new" ? "new" : String(editing[resource.idKey])}`}
                    resource = {resource}
                    row = {editing === "new" ? null : editing}
                    onSubmit = {save}
                    onCancel = {() => setEditing(null)}
                />
            )}

            <div className = "panel overflow-x-auto">
                <table className = "w-full text-left text-sm">
                    <thead className = "border-b border-indigo-100 bg-indigo-50/50">
                    {/* Create the column of each table */}
                        <tr>
                            {columns.map((f) => <th key = {f.key} className = "px-4 py-3 text-xs font-bold tracking-wide whitespace-nowrap text-slate-500 uppercase">{f.label}</th>)}
                            <th className = "px-4 py-3"/>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Fill the data in the table */}
                        {result?.data.map((row) => (
                            <tr key = {String(row[resource.idKey])} className = "border-b border-indigo-50 last:border-0 hover:bg-indigo-50/30">
                                {columns.map((f) => (
                                    <td key = {f.key} className = "max-w-xs truncate px-4 py-3 text-slate-700">{display(f, row[f.key])}</td>
                                ))}
                                <td className = "px-4 py-3">
                                    <div className = "flex justify-end gap-2">
                                        <button className = "btn-ghost px-3 py-1.5 text-xs" onClick = {() => { setEditing(row); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                                        <button className = "btn-danger" onClick = {() => remove(row)}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {result && result.data.length === 0 && (
                            <tr><td colSpan = {columns.length + 1} className = "px-4 py-10 text-center text-slate-400">No records.</td></tr>
                        )}
                        {!result && !error && (
                            <tr><td colSpan = {columns.length + 1} className = "px-4 py-10 text-center text-slate-400">Loading…</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {result && <Pagination page = {result.page} totalPages = {result.totalPages} onChange = {setPage}/>}
        </div>
    )
}

function RecordForm ({ resource, row, onSubmit, onCancel }: {
    resource: Resource,
    row: Row | null,
    onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void,
    onCancel: () => void,
}) {
    const fields = resource.fields.filter((f) => !f.readOnly);
    return (
        <form onSubmit = {onSubmit} className = "panel grid gap-4 p-6">
            <h2 className = "text-lg font-extrabold text-indigo-950">
                {row ? `Edit ${resource.label.toLowerCase()} #${row[resource.idKey]}` : `New ${resource.label.toLowerCase()} record`}
            </h2>
            <div className = "grid gap-4 sm:grid-cols-2">
                {fields.map((field) => {
                    const id = `admin-${field.key}`;
                    const value = row?.[field.key];
                    const common = { id, name: field.key, className: "input", required: field.required && field.type !== "password" };
                    return (
                        <div key = {field.key} className = {field.type === "text" ? "sm:col-span-2" : ""}>
                            <label className = "label" htmlFor = {id}>
                                {field.label}{field.required && field.type !== "password" && <span className = "text-rose-500"> *</span>}
                            </label>
                            {field.type === "text" ? (
                                <textarea rows = {4} defaultValue = {String(value ?? "")} {...common}/>
                            ) : field.type === "select" ? (
                                <select defaultValue = {String(value ?? (field.required ? field.options![0] : ""))} {...common}>
                                    {!field.required && <option value = "">—</option>}
                                    {field.options!.map((o) => <option key = {o}>{o}</option>)}
                                </select>
                            ) : (
                                <input
                                    type = {field.type === "int" ? "number" : field.type === "datetime" ? "datetime-local" : field.type === "password" ? "password" : "text"}
                                    defaultValue = {field.type === "datetime" ? toLocalInput(value) : field.type === "password" ? "" : String(value ?? "")}
                                    placeholder = {field.type === "password" && row ? "Leave empty to keep" : undefined}
                                    {...common}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            <div className = "flex gap-2">
                <button type = "submit" className = "btn-primary">{row ? "Save" : "Create"}</button>
                <button type = "button" className = "btn-ghost" onClick = {onCancel}>Cancel</button>
            </div>
        </form>
    )
}
