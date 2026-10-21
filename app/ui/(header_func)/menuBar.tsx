import { bubbles } from '@/app/ui/fonts'
import Link from 'next/link'
import ButtonBar from '@/app/ui/(header_func)/buttonBar'
import { getSessionUser } from '@/app/lib/session'

export default async function MenuBar ({ active = "/" }: { active?: string }){
    const user = await getSessionUser()
    const items = [{ name: "Jobs", href: "/" }, {name: "Evenements",href:"/boardEvent"}]
    if (user?.role === "admin") items.push({ name: "Admin", href: "/admin" })
    if (user?.role === "recruiter") items.push({ name: "Jobs posting", href: "/post" })
    if (user?.role === "meeter") items.push({ name: "New event", href: "/evenements" })
    if (user?.role === "recruiter") items.push({ name: "Applications", href: "/applications" })

    return (
        <nav className = "sticky top-0 z-50 border-b border-indigo-100/80 bg-white/75 backdrop-blur-md">
            <div className = "mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <Link href = "/" className = {`${bubbles.className} text-2xl text-indigo-600`}>
                    BUBBLES
                </Link>
                <div className = "flex items-center gap-1">
                    {items.map((item) => (
                        <ButtonBar key={item.href} name={item.name} href={item.href} active={item.href === active} />
                    ))}
                </div>
                {user ? (
                    <Link
                        href = "/account"
                        className = "flex items-center gap-2 rounded-full border border-indigo-100 bg-white py-1 pr-3 pl-1 text-sm font-semibold text-indigo-950 shadow-sm transition hover:border-indigo-200 hover:shadow"
                    >
                        <span className = "grid size-7 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-fuchsia-400 text-xs text-white uppercase">
                            {user.first_name[0]}
                        </span>
                        <span className = "hidden sm:inline">{user.first_name}</span>
                    </Link>
                ) : (
                    <div className = "flex items-center gap-2">
                        <Link href = "/login" className = "btn-ghost">Sign in</Link>
                        <Link href = "/account" className = "btn-primary hidden sm:inline-flex">Sign up</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
