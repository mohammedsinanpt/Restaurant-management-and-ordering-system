import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMenu } from '../api';
import Card3D from '../components/Card3D';
import { ShoppingCart, Plus, Search, ChefHat, Activity, LogIn, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';

const MenuPage = ({ addToCart, cart }) => {
    const navigate = useNavigate();
    const { currentUser } = useUser();

    const [menu, setMenu] = useState([]);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(false);
            try {
                const { data } = await fetchMenu();
                setMenu(data);
            } catch (err) {
                console.error('Failed to load menu:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredMenu = menu.filter(item => {
        const category = item.category_name; 
        return (
            (filter === 'All' || category === filter) &&
            item.name.toLowerCase().includes(search.toLowerCase())
        );
    });

    const cartCount = cart ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

    // Helper to render the correct badge
    const renderBadge = (item) => {
        const category = item.category_name;
        
        if (category === 'Drinks') {
            return (
                <span className="bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur shadow-sm">
                    DRINK
                </span>
            );
        }
        
        if (category === 'Desserts') {
            return (
                <span className="bg-pink-500/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur shadow-sm">
                    DESSERT
                </span>
            );
        }

        // Default to Veg/Non-Veg for Starters and Main Course
        if (item.is_veg) {
            return (
                <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur shadow-sm">
                    VEG
                </span>
            );
        } else {
            return (
                <span className="bg-rose-500/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur shadow-sm">
                    NON-VEG
                </span>
            );
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 pb-24 text-white font-sans">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center shadow-lg">
                
                {/* Branding */}
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none"
                >
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg shadow-orange-500/20 shadow-lg">
                        <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight hidden md:block text-zinc-100">SpiceRoute</span>
                </button>

                <div className="flex items-center gap-3">
                    
                    {/* Live Orders Button */}
                    <button 
                        onClick={() => navigate('/status/live')} 
                        className="flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-sm font-medium transition-all"
                    >
                        <Activity className="w-4 h-4 text-emerald-500" /> 
                        <span className="hidden sm:inline">Orders</span>
                    </button>

                    {/* DYNAMIC PROFILE BUTTON */}
                    <button 
                        onClick={() => navigate(currentUser ? '/profile' : '/auth')} 
                        className={`flex items-center gap-2 px-1 pr-3 py-1 rounded-full border transition-all ${
                            currentUser 
                            ? 'bg-zinc-800 border-zinc-700 hover:border-orange-500' 
                            : 'bg-orange-600 border-orange-500 hover:bg-orange-500'
                        }`}
                    >
                        {currentUser ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                                    {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                                </div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] text-zinc-400">Hello,</span>
                                    <span className="text-xs font-bold text-white max-w-[80px] truncate">
                                        {currentUser.name.split(' ')[0]}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <LogIn className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xs font-bold text-white">Sign In</span>
                            </>
                        )}
                    </button>

                    {/* Cart Button */}
                    <button 
                        onClick={() => navigate('/cart')}
                        className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white text-zinc-950 shadow-xl shadow-white/5 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-zinc-950 shadow-sm animate-in zoom-in">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto space-y-8">
                
                {/* Search & Filter */}
                <div className="space-y-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Try "Butter Chicken" or "Paneer"...`}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 outline-none shadow-lg transition-all text-white placeholder:text-zinc-600"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {['All', 'Starters', 'Main Course', 'Drinks', 'Desserts'].map(cat => (
                            <button 
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`snap-start px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                                    filter === cat 
                                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20 scale-105' 
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-zinc-400">Curating the menu...</p>
                        </div>
                    ) : error ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                            <p>Couldn't load the menu. Please check your connection and try again.</p>
                        </div>
                    ) : filteredMenu.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-zinc-500">
                            <p>No dishes found matching your search.</p>
                        </div>
                    ) : (
                        filteredMenu.map(item => (
                            <div key={item.id} className="h-[420px]" onClick={() => navigate(`/dish/${item.id}`)}>
                                <Card3D className="h-full">
                                    <div className="flex flex-col h-full">
                                        {/* Image Section */}
                                        <div className="relative h-[55%] w-full overflow-hidden">
                                            <img 
                                                src={item.image_url || item.imageUrl} 
                                                alt={item.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                style={{ transform: "translateZ(20px)" }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-60" />
                                            
                                            {/* DYNAMIC BADGE */}
                                            <div className="absolute top-3 left-3 z-20">
                                                {renderBadge(item)}
                                            </div>

                                            {/* Sold Out Overlay */}
                                            {item.is_available === false && (
                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
                                                    <span className="text-white font-bold border-2 border-white px-6 py-2 rounded-lg uppercase tracking-widest transform -rotate-12">Sold Out</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content Section */}
                                        <div className="p-5 flex flex-col flex-1 bg-zinc-900 border-t border-white/5">
                                            <div className="mb-2">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-lg text-zinc-100 leading-tight" style={{ transform: "translateZ(30px)" }}>{item.name}</h3>
                                                    <span className="text-orange-500 font-bold" style={{ transform: "translateZ(30px)" }}>₹{item.price}</span>
                                                </div>
                                                <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed h-10" style={{ transform: "translateZ(20px)" }}>
                                                    {item.description || "A delicious culinary experience."}
                                                </p>
                                            </div>
                                            
                                            <button 
                                                disabled={item.is_available === false}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(item.is_available !== false) addToCart(item);
                                                }}
                                                className={`w-full mt-auto py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 group/btn ${
                                                    item.is_available !== false
                                                    ? 'bg-white text-zinc-950 hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/30' 
                                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                }`}
                                                style={{ transform: "translateZ(40px)" }}
                                            >
                                                {item.is_available !== false ? (
                                                    <>
                                                        <Plus size={18} className="group-hover/btn:rotate-90 transition-transform" /> 
                                                        Add to Order
                                                    </>
                                                ) : (
                                                    "Currently Unavailable"
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </Card3D>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MenuPage;