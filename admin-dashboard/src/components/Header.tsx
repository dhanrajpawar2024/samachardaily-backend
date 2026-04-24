import { Menu, Bell, ExternalLink } from 'lucide-react';

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700
                       px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          SamacharDaily Admin
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <a href="http://localhost:4000" target="_blank" rel="noopener noreferrer"
          className="btn-ghost text-xs">
          <ExternalLink size={14} /> View Site
        </a>
        <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <Bell size={18} />
        </button>
        <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          A
        </div>
      </div>
    </header>
  );
}

