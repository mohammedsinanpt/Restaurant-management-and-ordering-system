import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu, ShoppingBag, Utensils, LogOut } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname.includes(to);
        return (
            <button 
                onClick={() => navigate(to)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
            >
                <Icon className="w-5 h-5" />
                {label}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex text-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col hidden md:flex">
                <h1 className="text-2xl font-black text-orange-500 mb-10 tracking-tight">SpiceRoute <span className="text-white">Admin</span></h1>
                
                <nav className="space-y-2 flex-1">
                    <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/admin/menu" icon={Menu} label="Menu Management" />
                    <NavItem to="/admin/orders" icon={ShoppingBag} label="Orders" />
                    <NavItem to="/admin/kitchen" icon={Utensils} label="Kitchen View" />
                </nav>

                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-500 hover:text-red-500 mt-auto px-4 py-2">
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </aside>

            {/* Mobile Header (Visible only on small screens) */}
            <div className="md:hidden fixed top-0 w-full bg-zinc-900 border-b border-zinc-800 z-50 p-4 flex justify-between items-center">
                 <span className="font-bold text-orange-500">Admin Panel</span>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;