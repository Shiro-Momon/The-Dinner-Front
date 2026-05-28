import { NavSidebar } from "@/components/nav-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-50">{children}</main>
    </div>
  )
}
