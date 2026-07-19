import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Clock, Flame, CheckCircle } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../api';

const KitchenView = () => {
    const [orders, setOrders] = useState([]);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const prevOrderCount = useRef(0);
    const audioCtxRef = useRef(null);

    // Initialize AudioContext
    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    // Unlock Audio on First User Interaction (Any click anywhere)
    useEffect(() => {
        const unlockAudio = () => {
            initAudio();
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
    }, []);

    // 🔊 Sound Notification
    const playNotificationSound = () => {
        if (!isSoundEnabled) return;
        if (!audioCtxRef.current) initAudio();

        try {
            if (audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume();
            }

            const oscillator = audioCtxRef.current.createOscillator();
            const gainNode = audioCtxRef.current.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtxRef.current.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(500, audioCtxRef.current.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtxRef.current.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.5);

            oscillator.start();
            oscillator.stop(audioCtxRef.current.currentTime + 0.5);
        } catch (e) {
            console.error("Audio Play Error (User interaction likely needed):", e);
        }
    };

    const toggleSound = () => {
        initAudio();
        setIsSoundEnabled(!isSoundEnabled);
    };

    // 🔄 Polling Logic — pulls active tickets from the real backend
    const fetchKitchenOrders = useCallback(async () => {
        try {
            const { data } = await fetchOrders();
            const active = data
                .filter(o => o.status === 'PENDING' || o.status === 'PREPARING')
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            const pendingCount = active.filter(o => o.status === 'PENDING').length;
            if (pendingCount > prevOrderCount.current) {
                playNotificationSound();
            }
            prevOrderCount.current = pendingCount;
            setOrders(active);
        } catch (error) {
            console.error("KDS Error:", error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSoundEnabled]);

    useEffect(() => {
        fetchKitchenOrders();
        const interval = setInterval(fetchKitchenOrders, 3000);
        return () => clearInterval(interval);
    }, [fetchKitchenOrders]);

    // ⚡ Action Handler
    const updateTicketStatus = async (orderPk, newStatus) => {
        initAudio(); // Ensure audio is ready when they interact with buttons

        // Optimistic UI update
        setOrders(prev => {
            const next = prev.map(o => (o.id === orderPk ? { ...o, status: newStatus } : o));
            return next.filter(o => newStatus !== 'READY' || o.id !== orderPk);
        });

        try {
            await updateOrderStatus(orderPk, newStatus);
        } catch (e) {
            console.error('Failed to update ticket status:', e);
            fetchKitchenOrders(); // resync with the server on failure
        }
    };

    // 🕒 Timer Component
    const OrderTimer = ({ timestamp }) => {
        const [elapsed, setElapsed] = useState('');

        useEffect(() => {
            const updateTime = () => {
                const start = new Date(timestamp);
                const now = new Date();
                const diff = Math.floor((now - start) / 1000);

                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
            };
            updateTime();
            const timer = setInterval(updateTime, 1000);
            return () => clearInterval(timer);
        }, [timestamp]);

        const mins = parseInt(elapsed.split(':')[0]) || 0;
        let colorClass = 'text-zinc-400';
        if (mins > 10) colorClass = 'text-yellow-500 font-bold';
        if (mins > 20) colorClass = 'text-red-500 font-black animate-pulse';

        return <span className={`font-mono ${colorClass}`}>{elapsed}</span>;
    };

    return (
        <div className="p-6 bg-zinc-950 min-h-screen text-white font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
                        <Flame className="text-orange-500 fill-orange-500" />
                        KITCHEN DISPLAY SYSTEM
                    </h1>
                    <p className="text-zinc-500 mt-1">Live Feed • {orders.length} Active Tickets</p>
                </div>

                <div className="flex gap-4">
                     {/* Sound Toggle */}
                    <button
                        onClick={toggleSound}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                            isSoundEnabled ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-zinc-800 text-zinc-500'
                        }`}
                    >
                        {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        {isSoundEnabled ? "Sound ON" : "Sound OFF"}
                    </button>
                </div>
            </div>

            {/* Orders Grid */}
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-600 opacity-50">
                    <CheckCircle className="w-24 h-24 mb-4" />
                    <h2 className="text-2xl font-bold">All caught up!</h2>
                    <p>No active orders in the kitchen.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map(order => (
                        <div
                            key={order.id}
                            className={`flex flex-col rounded-2xl border-t-8 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 ${
                                order.status === 'PENDING'
                                ? 'bg-zinc-900 border-yellow-500 shadow-yellow-900/10'
                                : 'bg-zinc-900 border-blue-500 shadow-blue-900/10'
                            }`}
                        >
                            {/* Card Header */}
                            <div className="p-4 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                                        Order #{order.order_id.slice(-4)}
                                    </span>
                                    <h2 className="text-2xl font-black text-white">
                                        Table {order.table_number}
                                    </h2>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 text-sm bg-zinc-800 px-2 py-1 rounded">
                                        <Clock size={14} className="text-zinc-400" />
                                        <OrderTimer timestamp={order.created_at} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase mt-2 px-2 py-0.5 rounded ${
                                        order.status === 'PENDING' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="p-5 flex-1 space-y-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            <span className="bg-zinc-800 text-white font-bold w-8 h-8 flex items-center justify-center rounded-lg shrink-0">
                                                {item.quantity}
                                            </span>
                                            <div>
                                                <span className="block font-bold text-zinc-200 text-lg leading-tight">
                                                    {item.item_name}
                                                </span>
                                                {item.customization && (
                                                    <span className="text-xs text-orange-500 font-bold uppercase">
                                                        {item.customization}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button Footer */}
                            <div className="p-4 border-t border-zinc-800 bg-zinc-950/30">
                                {order.status === 'PENDING' ? (
                                    <button
                                        onClick={() => updateTicketStatus(order.id, 'PREPARING')}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Flame size={20} />
                                        Start Cooking
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => updateTicketStatus(order.id, 'READY')}
                                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        Mark Ready
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default KitchenView;
