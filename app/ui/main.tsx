import Board from "./board";
import Footer from "./footer";
import type { User } from "@/app/lib/client";

export default function Main ({ q = "", user = null }: { q?: string, user?: User | null }) {
    return (
        <>
        <main id = "jobs" className = "mx-auto w-full max-w-6xl flex-1 scroll-mt-20 px-4 pb-20 sm:px-6">
            <Board q = {q} user = {user}/>
        </main>
        <Footer/>
        </>
    )
}
