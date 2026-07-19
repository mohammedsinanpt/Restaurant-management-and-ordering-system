import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ChefHat, CheckCircle, ArrowLeft, ShoppingBag, XCircle, Utensils, LogIn } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { fetchOrders, trackOrder } from '../api';

const LiveStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const isLiveMode = !orderId || orderId === 'live';

  // State for all active orders (live mode) and the currently viewed order
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 1. REAL-TIME DATA FETCHING
  useEffect(() => {
    let cancelled = false;

    const fetchLiveOrders = async () => {
      if (!currentUser) {
        if (!cancelled) {
          setActiveOrders([]);
          setSelectedOrder(null);
          setLoading(false);
        }
        return;
      }
      try {
        const { data } = await fetchOrders();
        const active = data
          .filter(o => ['PENDING', 'PREPARING', 'READY'].includes(o.status))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        if (cancelled) return;
        setActiveOrders(active);
        setSelectedOrder(prev => {
          if (prev) {
            const stillActive = active.find(o => o.order_id === prev.order_id);
            if (stillActive) return stillActive;
          }
          return active[0] || null;
        });
      } catch (e) {
        console.error('Error fetching orders:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchSingleOrder = async () => {
      try {
        const { data } = await trackOrder(orderId);
        if (cancelled) return;
        setSelectedOrder(data);
        setNotFound(false);
      } catch {
        if (cancelled) return;
        setSelectedOrder(null);
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    const runFetch = isLiveMode ? fetchLiveOrders : fetchSingleOrder;
    runFetch();
    const interval = setInterval(runFetch, 4000); // Poll periodically

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, isLiveMode, currentUser]);

  // Loading State
  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-400">Syncing live orders...</p>
        </div>
    </div>
  );

  // Signed-out guest browsing "live" without a specific order to track
  if (isLiveMode && !currentUser) return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
             <LogIn className="w-10 h-10 text-zinc-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Sign In to Track Orders</h1>
          <p className="text-zinc-400 mb-8 max-w-md">
            Guest orders are tracked via the link on your confirmation page. Sign in to see all of your active orders here.
          </p>
          <button onClick={() => navigate('/auth')}
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20">
            Sign In
          </button>
      </div>
  );

  // No Orders Found State
  if (!selectedOrder) return (
      <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
             <ShoppingBag className="w-10 h-10 text-zinc-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{notFound ? 'Order Not Found' : 'No Active Orders'}</h1>
          <p className="text-zinc-400 mb-8 max-w-md">
            {notFound
              ? "We couldn't find an order with that ID. Double-check the link from your confirmation page."
              : "Looks like all your orders are completed or you haven't placed one yet."}
          </p>
          <button onClick={() => navigate('/menu')}
            className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20">
            Browse Menu
          </button>
      </div>
  );

  // Helper for rendering logic
  const status = selectedOrder.status;
  const steps = ['PENDING', 'PREPARING', 'READY'];
  let currentStepIdx = steps.indexOf(status);
  if (currentStepIdx === -1) currentStepIdx = 0;

  const getStepColor = (stepIdx) => {
      if (stepIdx < currentStepIdx) return 'bg-green-500 text-white border-green-500';
      if (stepIdx === currentStepIdx) {
          if (status === 'PENDING') return 'bg-yellow-500 text-white border-yellow-500 animate-pulse';
          if (status === 'PREPARING') return 'bg-blue-500 text-white border-blue-500 animate-pulse';
          if (status === 'READY') return 'bg-green-600 text-white border-green-600 animate-bounce';
      }
      return 'bg-zinc-900 text-zinc-600 border-zinc-800';
  };

  const formatTime = (isoString) => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-20 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate('/menu')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                <div className="p-2 bg-zinc-900 rounded-full group-hover:bg-zinc-800 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium hidden sm:inline">Back to Menu</span>
            </button>
            <div className="text-zinc-500 text-sm font-mono">
                Live Status
            </div>
        </div>

        {/* MULTI-ORDER SWITCHER */}
        {activeOrders.length > 1 && (
            <div className="mb-6 overflow-x-auto pb-2 custom-scrollbar">
                <div className="flex gap-3">
                    {activeOrders.map((ord) => (
                        <button
                            key={ord.order_id}
                            onClick={() => setSelectedOrder(ord)}
                            className={`flex flex-col items-start min-w-[140px] p-3 rounded-xl border transition-all ${
                                selectedOrder.order_id === ord.order_id
                                ? 'bg-zinc-800 border-orange-500 ring-1 ring-orange-500/50'
                                : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                            }`}
                        >
                            <div className="flex justify-between w-full mb-1">
                                <span className="text-xs font-bold text-zinc-400">#{ord.order_id.slice(-4)}</span>
                                <span className="text-xs font-mono text-zinc-500">{formatTime(ord.created_at)}</span>
                            </div>
                            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                ord.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                                ord.status === 'PREPARING' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-green-500/10 text-green-500'
                            }`}>
                                {ord.status}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" key={selectedOrder.order_id}>

            {status === 'CANCELLED' ? (
                /* Cancelled State */
                <div className="bg-zinc-900 border border-red-900/40 rounded-3xl p-8 text-center shadow-2xl">
                    <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950 border border-zinc-700 text-xs font-bold tracking-wider text-zinc-400 mb-4 uppercase">
                        <span>Order #{selectedOrder.order_id.slice(-6).toUpperCase()}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight text-white">Order Cancelled</h1>
                    <p className="text-red-400 font-medium text-lg">This order was cancelled by the restaurant.</p>
                </div>
            ) : (
            <>
            {/* Status Card Header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
                {/* Dynamic Background Progress Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800" />
                <div
                    className={`absolute top-0 left-0 h-1 transition-all duration-1000 ease-out ${
                        status === 'PENDING' ? 'bg-yellow-500 w-[10%]' :
                        status === 'PREPARING' ? 'bg-blue-500 w-[60%]' :
                        'bg-green-500 w-full'
                    }`}
                />

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950 border border-zinc-700 text-xs font-bold tracking-wider text-zinc-400 mb-4 uppercase">
                    <span>Order #{selectedOrder.order_id.slice(-6).toUpperCase()}</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight text-white">
                    {status === 'PENDING' && "Order Received"}
                    {status === 'PREPARING' && "Chef is Cooking"}
                    {status === 'READY' && "Order Ready!"}
                </h1>

                <p className={`font-medium text-lg ${
                    status === 'PENDING' ? 'text-yellow-500' :
                    status === 'PREPARING' ? 'text-blue-500' :
                    'text-green-500'
                }`}>
                    {status === 'PENDING' && "Restaurant is reviewing your order"}
                    {status === 'PREPARING' && "Preparing your delicious food"}
                    {status === 'READY' && "Please collect from the counter"}
                </p>
            </div>

            {/* Visual Stepper */}
            <div className="px-2 py-4">
                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2 -z-10 rounded-full" />
                    <div
                        className={`absolute top-1/2 left-0 h-1 -translate-y-1/2 -z-10 transition-all duration-1000 rounded-full ${
                            status === 'READY' ? 'bg-green-500' : 'bg-zinc-700'
                        }`}
                        style={{ width: status === 'PENDING' ? '0%' : status === 'PREPARING' ? '50%' : '100%' }}
                    />

                    <div className="flex justify-between w-full">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center gap-3 bg-zinc-950 px-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${getStepColor(0)}`}>
                                <Clock className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Received</span>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center gap-3 bg-zinc-950 px-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${getStepColor(1)}`}>
                                <ChefHat className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cooking</span>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center gap-3 bg-zinc-950 px-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${getStepColor(2)}`}>
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Ready</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Activity Log */}
            <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800/50 backdrop-blur-sm">
               <h3 className="font-bold text-lg mb-6 text-zinc-300 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Updates
               </h3>

               <div className="space-y-0 border-l-2 border-zinc-800 ml-3 pl-8 relative">
                  {(currentStepIdx >= 2) && (
                      <div className="mb-8 relative animate-in slide-in-from-bottom-2 fade-in duration-500">
                         <div className="absolute -left-[41px] bg-zinc-950 p-1 border border-green-500 rounded-full">
                             <div className="w-4 h-4 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                         </div>
                         <span className="text-green-500 text-xs font-bold uppercase block mb-1">Just Now</span>
                         <p className="text-white font-medium">Order is ready to serve!</p>
                      </div>
                  )}

                  {(currentStepIdx >= 1) && (
                      <div className="mb-8 relative animate-in slide-in-from-bottom-2 fade-in duration-500">
                         <div className="absolute -left-[41px] bg-zinc-950 p-1 border border-blue-500 rounded-full">
                             <div className="w-4 h-4 bg-blue-500 rounded-full" />
                         </div>
                         <span className="text-blue-500 text-xs font-bold uppercase block mb-1">In Progress</span>
                         <p className="text-white font-medium">Chef has started preparing your order.</p>
                      </div>
                  )}

                  <div className="relative animate-in slide-in-from-bottom-2 fade-in duration-500">
                      <div className="absolute -left-[41px] bg-zinc-950 p-1 border border-yellow-500 rounded-full">
                          <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                      </div>
                      <span className="text-yellow-500 text-xs font-bold uppercase block mb-1">{formatTime(selectedOrder.created_at)}</span>
                      <p className="text-white font-medium">Order received by the kitchen.</p>
                  </div>
               </div>
            </div>
            </>
            )}

            {/* Order Items Summary */}
            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl">
                <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-orange-500" />
                        <h3 className="font-bold text-lg text-white">Order Details</h3>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono bg-zinc-950 px-2 py-1 rounded">
                        {selectedOrder.items.length} Items
                    </span>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-zinc-800 w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
                                    {item.quantity}x
                                </div>
                                <div>
                                    <span className="text-zinc-200 font-medium block">{item.item_name}</span>
                                    {item.customization && (
                                        <span className="text-xs text-orange-500">{item.customization}</span>
                                    )}
                                </div>
                            </div>
                            <span className="text-zinc-400 font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-zinc-500 text-sm">Total Amount</span>
                    <span className="text-xl font-black text-orange-500">₹{selectedOrder.total_amount}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStatusPage;
