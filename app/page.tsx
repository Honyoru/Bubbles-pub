import Header from '@/app/ui/(header_func)/header'
import Main from '@/app/ui/main'
import { getSessionUser } from '@/app/lib/session'

export default async function Home({ searchParams }: PageProps<"/">) {
  const { q } = await searchParams
  const user = await getSessionUser()

  return (
      <div className = "flex flex-1 flex-col">
          <Header q = {typeof q === "string" ? q : ""}/>
          <Main q = {typeof q === "string" ? q : ""} user = {user}/>
      </div>
  )
}
