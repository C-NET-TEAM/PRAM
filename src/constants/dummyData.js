export const MOCK_CHANNELS = [
  { id: 'fb1', platform: 'Facebook', status: 'disconnected', icon: 'facebook' },
  { id: 'ig1', platform: 'Instagram', status: 'disconnected', icon: 'instagram' },
  { id: 'li1', platform: 'LinkedIn', status: 'disconnected', icon: 'linkedin' },
];

export const MOCK_ALERTS = [
  { id: 'a1', type: 'success', title: 'High Engagement Alert', message: 'Your recent post crossed 250+ engagement!', time: '10m ago', read: false },
  { id: 'a2', type: 'warning', title: 'Trending Post', message: 'Your video about SaaS is trending on LinkedIn.', time: '1h ago', read: false },
  { id: 'a3', type: 'danger', title: 'Failed Upload', message: 'Failed to upload video to YouTube. Retrying...', time: '3h ago', read: true },
  { id: 'a4', type: 'danger', title: 'Disconnected Channel', message: 'Your X account token expired. Please reconnect.', time: '5h ago', read: true },
  { id: 'a5', type: 'success', title: 'Milestone Alert', message: 'You reached 10,000 followers on Instagram!', time: '1d ago', read: true },
];

export const MOCK_ANALYTICS = {
  overview: [
    { title: 'Total Reach', value: '1.2M', change: '+12.5%', isPositive: true },
    { title: 'Engagement', value: '45.2K', change: '+5.2%', isPositive: true },
    { title: 'New Followers', value: '3,240', change: '+18.1%', isPositive: true },
    { title: 'Impressions', value: '2.4M', change: '+8.4%', isPositive: true },
  ],
  performanceData: [
    { name: 'Jan', reach: 4000, engagement: 2400 },
    { name: 'Feb', reach: 3000, engagement: 1398 },
    { name: 'Mar', reach: 2000, engagement: 9800 },
    { name: 'Apr', reach: 2780, engagement: 3908 },
    { name: 'May', reach: 1890, engagement: 4800 },
    { name: 'Jun', reach: 2390, engagement: 3800 },
    { name: 'Jul', reach: 3490, engagement: 4300 },
  ],
  platformDistribution: [
    { name: 'Instagram', value: 400, color: '#E1306C' },
    { name: 'LinkedIn', value: 300, color: '#0A66C2' },
    { name: 'X', value: 300, color: '#000000' },
    { name: 'Facebook', value: 200, color: '#1877F2' },
  ],
  topPosts: [
    { id: 1, content: 'Excited to announce our new funding round...', platform: 'LinkedIn', engagement: '12.4k', date: 'Oct 12' },
    { id: 2, content: '10 Tips for better React performance 🚀', platform: 'X', engagement: '8.2k', date: 'Oct 10' },
    { id: 3, content: 'Behind the scenes at our new office! 🏢', platform: 'Instagram', engagement: '5.6k', date: 'Oct 8' },
  ]
};

export const MOCK_EVENTS = [
  { id: 'e1', date: new Date(new Date().setHours(10, 0, 0, 0)), title: 'Product Launch Announcement', platform: 'LinkedIn', type: 'image' },
  { id: 'e2', date: new Date(new Date().setDate(new Date().getDate() + 2)), title: 'Weekly Tip Video', platform: 'Instagram', type: 'video' },
  { id: 'e3', date: new Date(new Date().setDate(new Date().getDate() + 5)), title: 'Community QA', platform: 'X', type: 'text' },
];
