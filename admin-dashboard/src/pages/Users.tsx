import { Users as UsersIcon, Mail, Calendar } from 'lucide-react';

// Placeholder — connects to auth-service once user list API is exposed
const MOCK_USERS = [
  { id: '1', name: 'Rahul Sharma',   email: 'rahul@example.com', lang: 'hi', joined: '2026-01-10', bookmarks: 12 },
  { id: '2', name: 'Priya Reddy',    email: 'priya@example.com', lang: 'te', joined: '2026-02-05', bookmarks: 7  },
  { id: '3', name: 'Anita Patel',    email: 'anita@example.com', lang: 'gu', joined: '2026-02-20', bookmarks: 23 },
  { id: '4', name: 'Suresh Kumar',   email: 'suresh@example.com',lang: 'ta', joined: '2026-03-01', bookmarks: 5  },
  { id: '5', name: 'Deepa Nair',     email: 'deepa@example.com', lang: 'ml', joined: '2026-03-15', bookmarks: 18 },
  { id: '6', name: 'Arjun Singh',    email: 'arjun@example.com', lang: 'pa', joined: '2026-03-20', bookmarks: 3  },
];

const LANG_LABEL: Record<string, string> = {
  en:'English', hi:'Hindi', te:'Telugu', ta:'Tamil', kn:'Kannada',
  mr:'Marathi', bn:'Bengali', gu:'Gujarati', pa:'Punjabi', ml:'Malayalam'
};

export function Users() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Users</h2>
        <p className="text-sm text-slate-500 mt-0.5">{MOCK_USERS.length} registered users (sample data)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><UsersIcon size={22} /></div>
          <div><p className="text-sm text-slate-500">Total Users</p><p className="text-2xl font-bold">1,284</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600"><Calendar size={22} /></div>
          <div><p className="text-sm text-slate-500">New This Month</p><p className="text-2xl font-bold">147</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600"><Mail size={22} /></div>
          <div><p className="text-sm text-slate-500">Avg Bookmarks</p><p className="text-2xl font-bold">11.3</p></div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">Recent Users</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              {['Name', 'Email', 'Language', 'Joined', 'Bookmarks'].map(h => (
                <th key={h} className="table-cell text-left font-semibold text-slate-600 dark:text-slate-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {MOCK_USERS.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/40 rounded-full flex items-center justify-center
                                    text-brand-600 dark:text-brand-400 font-medium text-xs flex-shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{u.name}</span>
                  </div>
                </td>
                <td className="table-cell text-slate-500">{u.email}</td>
                <td className="table-cell">
                  <span className="badge bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                    {LANG_LABEL[u.lang] || u.lang}
                  </span>
                </td>
                <td className="table-cell text-slate-500">{u.joined}</td>
                <td className="table-cell font-medium text-slate-800 dark:text-slate-100">{u.bookmarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 Live user data will be fetched from
          <code className="mx-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">auth-service</code>
          once the admin user-list endpoint is added. Currently showing sample data.
        </p>
      </div>
    </div>
  );
}

