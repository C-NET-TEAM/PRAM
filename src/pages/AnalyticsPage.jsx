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
  const [analyticsData, setAnalyticsData] = useState(MOCK_ANALYTICS);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/analytics', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setAnalyticsData(prev => ({
            ...prev,
            overview: data.overview,
            platformDistribution: data.platformDistribution,
            topPosts: data.topPosts
          }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching analytics:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full min-w-0">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            {t('analytics.title', 'Analytics')}
          </h2>
          <p className="text-muted-foreground">{t('analytics.desc', 'Track your performance and audience growth.')}</p>
        </div>
        
        <div className="flex bg-card p-1 rounded-xl border border-border shadow-sm overflow-x-auto w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
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
        {analyticsData.overview.map((metric, idx) => (
          <MetricCard key={idx} {...metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <h3 className="text-lg font-bold text-foreground">{t('analytics.growth', 'Performance Overview')}</h3>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="reach" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorReach)" />
                    <Area type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorEng)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Distribution */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <h3 className="text-lg font-bold text-foreground">{t('analytics.performance', 'Platform Distribution')}</h3>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.platformDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#1877F2', '#E4405F', '#0A66C2', '#000000', '#25D366'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {analyticsData.platformDistribution.map(platform => (
                  <div key={platform.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{
                      backgroundColor: 
                        platform.name === 'Facebook' ? '#1877F2' : 
                        platform.name === 'Instagram' ? '#E4405F' : 
                        platform.name === 'LinkedIn' ? '#0A66C2' : 
                        platform.name === 'X' ? '#000000' : '#25D366'
                    }} />
                    <span className="text-sm font-medium text-foreground">{platform.name}</span>
                  </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Posts Table */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <h3 className="text-lg font-bold text-foreground">Top Performing Posts</h3>
        </CardHeader>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left min-w-[500px]">
            <thead className="text-xs text-muted-foreground uppercase bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Post Content</th>
                <th className="px-6 py-4 font-medium">Platform</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.topPosts.length > 0 ? analyticsData.topPosts.map((post, idx) => (
                <tr key={post.id} className={`bg-card hover:bg-gray-50 transition-colors ${idx !== analyticsData.topPosts.length - 1 ? 'border-b border-border' : ''}`}>
                  <td className="px-6 py-4 font-medium text-foreground max-w-md truncate">
                    {post.content}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold">{post.platform}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{post.date}</td>
                  <td className="px-6 py-4 text-right font-bold text-primary">{post.engagement}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-muted-foreground">
                    No top posts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
