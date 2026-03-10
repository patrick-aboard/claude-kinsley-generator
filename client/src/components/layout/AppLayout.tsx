import { NavLink, Outlet } from 'react-router-dom'
import { ClipboardListIcon, PackageIcon, ZapIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/service-orders', label: 'Service Orders', icon: ClipboardListIcon },
  { to: '/parts', label: 'Parts Inventory', icon: PackageIcon },
  { to: '/generators', label: 'Generator Directory', icon: ZapIcon },
]

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col">
        <div className="px-4 py-4 border-b border-sidebar-border">
          <span className="font-semibold text-sm tracking-wide text-sidebar-foreground">
            Kinsley
          </span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
