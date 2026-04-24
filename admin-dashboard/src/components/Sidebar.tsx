import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Newspaper, Rss, BarChart2, Users, Newspaper as Logo } from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/articles',  icon: Newspaper,       label: 'Articles'   },
  { to: '/sources',   icon: Rss,             label: 'Sources'    },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics'  },
  { to: '/users',     icon: Users,           label: 'Users'      },
];

export function Sidebar({ open }: { open: boolean }) {
  return (
    <aside className={clsx(
      'flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 flex-shrink-0',
      open ? 'w-56' : 'w-16'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <Logo size={22} className="text-brand-400 flex-shrink-0" />
        {open && <span className="font-bold text-white text-sm truncate">SamacharDaily</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-500 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}>
            <Icon size={18} className="flex-shrink-0" />
            {open && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {open && (
        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
          Admin v1.0
        </div>
      )}
    </aside>
  );
}

