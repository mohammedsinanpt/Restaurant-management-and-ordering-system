import React, { useState, useEffect } from 'react';
import {
    TrendingUp, ShoppingBag, Users,
    ArrowUpRight, ArrowDownRight, DollarSign,
    BarChart3, Award
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { fetchOrders } from '../api';

// --- Components ---

const StatCard = ({ title, value, subtext, icon: Icon, trend, color }) => (
    <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            {trend && (
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border ${
                    trend >= 0 
                    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-red-500 bg-red-500/10 border-red-500/20'
                }`}>
                    {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-zinc-500 mt-2">{subtext}</p>}
    </div>
);

const Dashboard = () => {
    // --- State ---
    const [timeFilter, setTimeFilter] = useState('TODAY'); // 'TODAY' | 'ALL'
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        totalOrders: 0,
        aov: 0,
        topDish: { name: 'N/A', count: 0, revenue: 0 },
    });
    const [salesData, setSalesData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    // --- Data Processing Engine ---
    useEffect(() => {
        const refreshAnalytics = async () => {
            let allOrders = [];
            try {
                const { data } = await fetchOrders();
                // Cancelled orders never generated revenue — exclude them from analytics
                allOrders = data.filter(o => o.status !== 'CANCELLED');
            } catch (e) {
                console.error('Failed to load orders for dashboard:', e);
                return;
            }

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            // 1. Core Metrics
            const todayOrders = allOrders.filter(o => new Date(o.created_at).getTime() >= startOfDay);
            const activeSet = timeFilter === 'TODAY' ? todayOrders : allOrders;

            const totalRev = allOrders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);
            const todayRev = todayOrders.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);
            const activeRev = activeSet.reduce((acc, o) => acc + (parseFloat(o.total_amount) || 0), 0);
            const activeCount = activeSet.length;
            const aov = activeCount > 0 ? Math.round(activeRev / activeCount) : 0;

            // 2. Top Dish Logic
            const itemMap = {};
            const categoryMap = {};

            activeSet.forEach(order => {
                order.items?.forEach(item => {
                    // Item Count
                    const name = item.item_name;
                    if (!itemMap[name]) itemMap[name] = { count: 0, revenue: 0 };
                    itemMap[name].count += (item.quantity || 1);
                    itemMap[name].revenue += (parseFloat(item.price) || 0) * (item.quantity || 1);

                    // Category Count
                    const cat = item.category_name || 'Uncategorized';
                    categoryMap[cat] = (categoryMap[cat] || 0) + (item.quantity || 1);
                });
            });

            // Sort Top Dish
            const sortedItems = Object.entries(itemMap)
                .map(([name, data]) => ({ name, ...data }))
                .sort((a, b) => b.count - a.count);
            const topDishObj = sortedItems[0] || { name: 'No Sales Yet', count: 0, revenue: 0 };

            // 3. Category Data for Pie Chart
            const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

            // 4. Hourly Sales Trend (Area Chart)
            const hours = new Array(12).fill(0).map((_, i) => {
                const h = i + 11; // 11 AM start
                return {
                    time: h > 12 ? `${h-12}PM` : `${h}AM`,
                    fullHour: h,
                    sales: 0
                };
            });

            activeSet.forEach(order => {
                const h = new Date(order.created_at).getHours();
                const bucket = hours.find(b => b.fullHour === h);
                if (bucket) bucket.sales += parseFloat(order.total_amount || 0);
            });

            // Update State
            setMetrics({
                totalRevenue: totalRev,
                todayRevenue: todayRev,
                totalOrders: activeCount,
                aov: aov,
                topDish: topDishObj
            });
            setSalesData(hours);
            setCategoryData(pieData);
            setRecentOrders(activeSet.slice(-5).reverse());
        };

        refreshAnalytics();
        const interval = setInterval(refreshAnalytics, 5000);
        return () => clearInterval(interval);
    }, [timeFilter]);

    // Colors for Charts
    const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6'];

    return (
        <div className="min-h-screen bg-black text-zinc-100 p-8 animate-in fade-in duration-500">
            
            {/* --- Header Section --- */}
            <header className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-orange-500 w-8 h-8" /> 
                        Sales Analytics
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">Financial performance and operational insights.</p>
                </div>

                <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex items-center">
                    <button 
                        onClick={() => setTimeFilter('TODAY')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeFilter === 'TODAY' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Today
                    </button>
                    <button 
                        onClick={() => setTimeFilter('ALL')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${timeFilter === 'ALL' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        All Time
                    </button>
                </div>
            </header>

            {/* --- Key Metrics Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title={timeFilter === 'TODAY' ? "Today's Revenue" : "Total Revenue"}
                    value={`₹${(timeFilter === 'TODAY' ? metrics.todayRevenue : metrics.totalRevenue).toLocaleString()}`} 
                    icon={DollarSign} 
                    color="bg-emerald-500" 
                    trend={12.5}
                />
                <StatCard 
                    title="Total Orders" 
                    value={metrics.totalOrders} 
                    icon={ShoppingBag} 
                    color="bg-blue-500" 
                    subtext="Completed transactions"
                />
                <StatCard 
                    title="Avg. Order Value" 
                    value={`₹${metrics.aov}`} 
                    icon={Users} 
                    color="bg-purple-500" 
                    subtext="Per table average"
                />
                
                {/* Special 'Star Dish' Card */}
                <div className="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Award className="w-24 h-24 text-white transform rotate-12 -mr-8 -mt-8" />
                    </div>
                    <div className="relative z-10 text-white">
                        <div className="flex items-center gap-2 mb-4 opacity-90">
                            <Award className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Top Performer</span>
                        </div>
                        <h3 className="text-2xl font-black mb-1 truncate">{metrics.topDish.name}</h3>
                        <p className="text-sm font-medium opacity-90 mb-4">{metrics.topDish.count} Orders Sold</p>
                        <div className="inline-block bg-black/20 backdrop-blur-md rounded-lg px-3 py-1 text-sm font-mono border border-white/10">
                            Generated ₹{metrics.topDish.revenue.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Charts Section --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                
                {/* 1. Main Revenue Chart */}
                <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="font-bold text-xl text-white">Revenue Trends</h3>
                            <p className="text-zinc-500 text-xs">Hourly sales performance (11 AM - 11 PM)</p>
                        </div>
                        <BarChart3 className="text-zinc-600 w-5 h-5" />
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis 
                                    dataKey="time" 
                                    stroke="#52525b" 
                                    tick={{fontSize: 12}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    stroke="#52525b" 
                                    tick={{fontSize: 12}} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tickFormatter={(val) => `₹${val}`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#f97316' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="sales" 
                                    stroke="#f97316" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorSales)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Category Distribution (Pie) */}
                <div className="lg:col-span-1 bg-zinc-900/50 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 shadow-xl flex flex-col">
                    <h3 className="font-bold text-xl text-white mb-2">Category Sales</h3>
                    <p className="text-zinc-500 text-xs mb-8">Distribution by item type</p>
                    
                    <div className="flex-1 min-h-[200px] relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={categoryData.length > 0 ? categoryData : [{name: 'No Data', value: 1}]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #333' }} />
                            </RePieChart>
                        </ResponsiveContainer>
                        {/* Center Text Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-white">{metrics.totalOrders}</span>
                            <span className="text-[10px] text-zinc-500 uppercase">Orders</span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {categoryData.slice(0, 3).map((cat, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    <span className="text-zinc-300">{cat.name}</span>
                                </div>
                                <span className="font-bold text-white">{cat.value} sold</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Recent Activity Table --- */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl border border-zinc-800 overflow-hidden">
                <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-white">Live Transactions</h3>
                        <p className="text-zinc-500 text-xs mt-1">Real-time order feed</p>
                    </div>
                    <button className="text-orange-500 text-sm font-bold hover:underline">Export Report</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/40">
                            <tr className="text-xs uppercase text-zinc-500 font-medium">
                                <th className="px-8 py-5">Order ID</th>
                                <th className="px-8 py-5">Items</th>
                                <th className="px-8 py-5">Time</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-zinc-500 italic">
                                        No transactions recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order, i) => (
                                    <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-8 py-5 font-mono text-zinc-400">
                                            #{order.order_id ? order.order_id.slice(-6).toUpperCase() : '---'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{order.items?.length || 0} Items</span>
                                                <span className="text-zinc-500 text-xs truncate w-48">
                                                    {order.items?.[0]?.item_name || 'Unknown'} {order.items?.length > 1 && `+${order.items.length - 1} more`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-zinc-400">
                                            {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                order.status === 'READY' ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-orange-500/10 text-orange-500'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    order.status === 'READY' ? 'bg-emerald-500' :
                                                    'bg-orange-500'
                                                }`}></span>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-white">
                                            ₹{order.total_amount}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;