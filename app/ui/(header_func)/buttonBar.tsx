import Link from "next/link";

export default function ButtonBar({ name = "No name", href = "/", active = false }) {
    return (
        <Link
            href = {href}
            className = {`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-indigo-50/60 hover:text-indigo-700"
            }`}
        >
            {name}
        </Link>
    );
}
