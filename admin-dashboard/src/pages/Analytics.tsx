import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';

// Mock data — replace with real API calls once analytics endpoints are built
const ARTICLES_PER_DAY = [
  { day: 'Mon', en: 120, hi: 95,  te: 60 },
  { day: 'Tue', en: 145, hi: 110, te: 72 },
  { day: 'Wed', en: 130, hi: 88,  te: 55 },
  { day: 'Thu', en: 160, hi: 130, te: 80 },
  { day: 'Fri', en: 190, hi: 155, te: 95 },
  { day: 'Sat', en: 100, hi: 78,  te: 45 },
  { day: 'Sun', en: 90,  hi: 65,  te: 40 },
];

const LANGUAGE_DIST = [
  { name: 'English',   value: 34, color: '#f97316' },
  { name: 'Hindi',     value: 28, color: '#3b82f6' },
  { name: 'Telugu',    value: 15, color: '#10b981' },
  { name: 'Tamil',     value: 13, color: '#8b5cf6' },
  { name: 'Kannada',   value: 11, color: '#f59e0b' },
  { name: 'Marathi',   value: 11, color: '#ef4444' },
  { name: 'Others',    value: 33, color: '#6b7280' },
];

const VIEWS_TREND = [
  { time: '00:00', views: 230 }, { time: '04:00', views: 145 },
  { time: '08:00', views: 890 }, { time: '12:00', views: 1340 },
  { time: '16:00', views: 1120 },{ time: '20:00', views: 980 },
  { time: '23:59', views: 560 },
];

export function Analytics() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">Content & reader insights (last 7 days)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Articles Per Day */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Articles Ingested Per Day</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ARTICLES_PER_DAY} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="en" name="English" fill="#f97316" radius={[4,4,0,0]} />
              <Bar dataKey="hi" name="Hindi"   fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="te" name="Telugu"  fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Sources by Language</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={LANGUAGE_DIST} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={2}>
                  {LANGUAGE_DIST.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} sources`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {LANGUAGE_DIST.map(item => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 flex-1">{item.name}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Views Trend */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Article Views Today (hourly)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={VIEWS_TREND} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="views" stroke="#f97316" strokeWidth={2.5}
                dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} name="Views" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coming Soon note */}
      <div className="card bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700">
        <p className="text-sm text-brand-700 dark:text-brand-300">
          💡 <strong>Live analytics</strong> will be powered by real data once the
          <code className="mx-1 px-1.5 py-0.5 bg-brand-100 dark:bg-brand-800 rounded text-xs">analytics-service</code>
          is connected. Currently showing sample data.
        </p>
      </div>
    </div>
  );
}

