import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/ui/sign-out-button'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-10">
        <Link href="/dashboard" className="text-xl font-bold text-violet-600">
          Vibe Check
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
          <SignOutButton />
        </div>
      </nav>
      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
