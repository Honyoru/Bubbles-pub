import { bubbles } from '@/app/ui/fonts'
import MenuBar from '@/app/ui/(header_func)/menuBar'

type HeaderProps = {
    q?: string;
    active?: string;
    subtitle?: string;
    action?: string;
    placeholder?: string;
};

export default function Header ({
    q = "",
    active = "/",
    subtitle = "Find your next job in one bubbly place.",
    action = "/#jobs",
    placeholder = "Search jobs, places, categories…",
}: HeaderProps){
    return (
        <>
        <MenuBar active = {active}/>
        <header className = "relative overflow-hidden">
            <div className = "bubble size-28 top-10 left-[8%]" />
            <div className = "bubble size-48 top-14 left-[26%] [animation-delay:-6s]" />
            <div className = "bubble size-12 top-40 left-[20%] [animation-delay:-3s]" />
            <div className = "bubble size-20 top-8 right-[12%] [animation-delay:-5s]" />
            <div className = "bubble size-9 top-44 right-[24%] [animation-delay:-1.5s]" />
            <div className = "relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-4 pt-20 pb-16 text-center">
                <h1 className= {`${bubbles.className} text-7xl tracking-wide text-indigo-600 text-shadow-shadow-brand text-shadow-lg sm:text-8xl`}>
                    BUBBLES
                </h1>
                <p className = "max-w-md text-lg text-slate-600">
                    {subtitle}
                </p>
                <form action = {action} className = "mt-2 flex w-full max-w-md items-center gap-2 rounded-full border border-indigo-100 bg-white p-1.5 pl-5 shadow-lg shadow-indigo-100">
                    <input
                        type = "search"
                        name = "q"
                        key = {q}
                        defaultValue = {q}
                        aria-label = {placeholder}
                        placeholder = {placeholder}
                        className = "min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                    <button
                        type = "submit"
                        className = "rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        Search
                    </button>
                </form>
            </div>
        </header>
        </>
    )
}