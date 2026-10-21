import type { Metadata } from "next";
import Header from "@/app/ui/(header_func)/header";
import Footer from "@/app/ui/footer";
import BoardEvent from "./boardEvent";
import { getSessionUser } from "@/app/lib/session";

export const metadata: Metadata = { title: "Events · Bubbles" };

export default async function BoardEventPage({ searchParams }: PageProps<"/boardEvent">) {
    const { q } = await searchParams;
    const query = typeof q=== "string" ? q :"";
    const user = await getSessionUser();
    return (
        <div className = "flex flex-1 flex-col">
            <Header
            q = {query}
            active = "/boardEvent"
            subtitle = "Meet people at bubbly evnets near you."
            action = "boardEvent#events"
            placeholder = "Search events,cities..."
        />
        <main id = "events" className="mx-auto w-full max-w-6xl flex-1 scroll-mt-20 px-4 pb-20 sm:px-6">
            <BoardEvent q = {query} user = {user}/>
        </main>
        <Footer/>
    </div>
        
    );
}