import { bubbles } from "@/app/ui/fonts";

export default function Footer () {
    return (
        <footer className = "border-t border-indigo-100 bg-white/60">
            <div className = "mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
                <span className = {`${bubbles.className} text-xl text-indigo-600`}>BUBBLES</span>
                <span>&copy; {new Date().getFullYear()} Bubbles. All bubbles reserved.</span>
            </div>
        </footer>
    )
}
