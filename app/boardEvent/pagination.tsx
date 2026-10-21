'use client'

export default function Pagination ({ page, totalPages, onChange }: { page: number, totalPages: number, onChange: (page: number) => void }) {
    if (totalPages <= 1) return null;
    return (
        <nav className = "mt-8 flex items-center justify-center gap-3" aria-label = "Pagination">
            <button className = "btn-ghost" disabled = {page <= 1} onClick = {() => onChange(page - 1)}>&larr; Previous</button>
            <span className = "text-sm font-semibold text-slate-500">Page {page} / {totalPages}</span>
            <button className = "btn-ghost" disabled = {page >= totalPages} onClick = {() => onChange(page + 1)}>Next &rarr;</button>
        </nav>
    )
}
