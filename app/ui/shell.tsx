import MenuBar from "@/app/ui/(header_func)/menuBar";
import Footer from "@/app/ui/footer";

// Page frame for inner pages (sign in, account, admin, post)
export default function Shell ({ active, wide = false, children }: { active?: string, wide?: boolean, children: React.ReactNode }) {
    return (
        <div className = "flex flex-1 flex-col">
            <MenuBar active = {active}/>
            <main className = {`mx-auto w-full flex-1 px-4 py-12 sm:px-6 ${wide ? "max-w-6xl" : "max-w-xl"}`}>
                {children}
            </main>
            <Footer/>
        </div>
    )
}
