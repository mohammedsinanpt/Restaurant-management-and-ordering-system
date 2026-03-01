import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChefHat, QrCode, ArrowRight, Settings, User, LogIn } from 'lucide-react';
import { useUser } from '../context/UserContext'; // <--- IMPORT CONTEXT

const LandingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentUser } = useUser(); // <--- GET USER STATE
    const [tableNum, setTableNum] = useState(null);

    useEffect(() => {
        // Table Logic: Prioritize URL, then Session, then Random
        const urlTable = searchParams.get('table');
        const sessionTable = sessionStorage.getItem('tableNumber');

        if (urlTable) {
            setTableNum(urlTable);
            sessionStorage.setItem('tableNumber', urlTable);
        } else if (sessionTable) {
            setTableNum(sessionTable);
        } else {
            // Generate a random table for demo purposes if none exists
            const randomTable = Math.floor(Math.random() * 15) + 1;
            setTableNum(randomTable);
            sessionStorage.setItem('tableNumber', randomTable.toString());
        }
    }, [searchParams]);

    const handleEnter = () => {
        navigate('/menu');
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 animate-pulse" 
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/30" />
            
            {/* Top Right Buttons */}
            <div className="absolute top-6 right-6 z-30 flex gap-3">
                {/* Customer Auth Button */}
                <button 
                    onClick={() => navigate(currentUser ? '/profile' : '/auth')} 
                    className={`flex items-center gap-2 px-4 py-2 backdrop-blur-md border rounded-full text-sm font-bold transition-all duration-300 shadow-lg cursor-pointer ${
                        currentUser 
                        ? 'bg-orange-600/90 border-orange-500/20 hover:bg-orange-500 text-white' 
                        : 'bg-zinc-900/80 border-white/10 hover:bg-white hover:text-black text-zinc-300'
                    }`}
                >
                    {currentUser ? (
                        <>
                            <User className="w-4 h-4" />
                            <span>Hi, {currentUser.name.split(' ')[0]}</span>
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" />
                            <span>Sign In</span>
                        </>
                    )}
                </button>

                {/* Staff Portal Button */}
                <button 
                    onClick={() => navigate('/admin/login')}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-full text-zinc-400 text-sm font-medium hover:bg-white hover:text-black transition-all duration-300 shadow-lg cursor-pointer"
                >
                    <Settings className="w-4 h-4" />
                    <span>Staff</span>
                </button>
            </div>

            <div className="relative z-10 text-center space-y-8 p-6 max-w-2xl w-full">
                <div className="flex justify-center mb-4">
                    <div className="p-4 bg-orange-600/20 rounded-full backdrop-blur-sm border border-orange-500/20 shadow-[0_0_30px_rgba(234,88,12,0.3)]">
                        <ChefHat className="w-16 h-16 text-orange-500" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 drop-shadow-2xl">
                        SPICE<span className="text-orange-500">ROUTE</span>
                    </h1>
                    <p className="text-lg text-zinc-400 font-light tracking-widest uppercase">Premium Dining Experience</p>
                </div>

                {/* Table Detector Badge */}
                <div className="inline-flex items-center gap-3 bg-zinc-800/80 backdrop-blur-md border border-zinc-700 px-6 py-3 rounded-full shadow-2xl animate-in fade-in zoom-in duration-700">
                    <div className="relative">
                        <QrCode className="w-5 h-5 text-green-400" />
                        <div className="absolute inset-0 bg-green-400/20 blur-sm rounded-full animate-ping" />
                    </div>
                    <span className="font-mono text-zinc-200">
                        Table <span className="text-white font-bold text-lg">{tableNum || '...'}</span> Connected
                    </span>
                </div>

                {/* Specials Highlight */}
                <div 
                    onClick={() => navigate('/dish/1')} 
                    className="bg-zinc-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/10 text-left flex gap-5 items-center cursor-pointer shadow-2xl mx-auto max-w-md group ring-1 ring-white/5 hover:ring-orange-500/50 hover:bg-zinc-800 transition-all"
                >
                    <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
                        <img 
                            src="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=300&q=80" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            alt="Special" 
                        />
                    </div>
                    <div>
                        <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Today's Special</span>
                        <h3 className="text-xl font-bold mt-1 text-white group-hover:text-orange-400 transition-colors">Butter Chicken</h3>
                        <p className="text-zinc-400 text-xs mt-1 group-hover:text-zinc-300">Chef's signature recipe.</p>
                    </div>
                    <div className="ml-auto bg-white/5 p-2 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>

                <button 
                    onClick={handleEnter}
                    className="relative w-full max-w-sm mx-auto px-8 py-5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl font-bold text-xl text-white shadow-lg transition-transform transform hover:scale-105 active:scale-95 hover:shadow-orange-500/40 cursor-pointer"
                >
                    <span className="flex items-center justify-center gap-3">
                        View Digital Menu
                        <ArrowRight className="w-6 h-6" />
                    </span>
                </button>
            </div>
        </div>
    );
};

export default LandingPage;