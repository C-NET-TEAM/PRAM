import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { MetricCard } from '../components/analytics/MetricCard';
import { MOCK_ANALYTICS } from '../constants/dummyData';

const FILTERS = ['7 Days', '15 Days', '30 Days', '3 Months', '6 Months', '1 Year'];

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('30 Days');

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {t('analytics.title', 'Analytics')}
          </h2>
          <p className="text-muted-foreground">{t('analytics.desc', 'Track your performance and audience growth.')}</p>
        </div>
        
        <div className="flex bg-card p-1 rounded-xl border border-border shadow-sm overflow-x-auto max-w-full">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === filter 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-gray-50'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_ANALYTICS.overview.map((metric, idx) => (
          <MetricCard key={idx} {...metric} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-bold text-foreground">{t('analytics.growth', 'Performance Overview')}</h3>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_ANALYTICS.performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="reach" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
                  <Area type="monotone" dataKey="engagement" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorEngagement)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-foreground">{t('analytics.performance', 'Platform Distribution')}</h3>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_ANALYTICS.platformDistribution}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {MOCK_ANALYTICS.platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full mt-4 space-y-2">
              {MOCK_ANALYTICS.platformDistribution.map(platform => (
                <div key={platform.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }}></div>
                    <span className="text-muted-foreground">{platform.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{platform.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold text-foreground">Top Performing Posts</h3>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Post Content</th>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ANALYTICS.topPosts.map((post, idx) => (
                <tr key={post.id} className={`bg-card hover:bg-gray-50 transition-colors ${idx !== MOCK_ANALYTICS.topPosts.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-6 py-4 font-medium text-foreground max-w-md truncate">
                    {post.content}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold">{post.platform}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{post.date}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{post.engagement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
