import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Check, X, Clock, ChefHat, ShoppingBag } from 'lucide-react';
import { fetchOrders, updateOrderStatus as apiUpdateOrderStatus } from '../api';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // For the Details Modal

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await fetchOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Load orders on mount, then poll for new ones
  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // 2. Function to update status against the real backend
  const updateStatus = async (orderPk, newStatus) => {
    const previous = orders;
    setOrders(prev => prev.map(o => (o.id === orderPk ? { ...o, status: newStatus } : o)));
    try {
      await apiUpdateOrderStatus(orderPk, newStatus);
    } catch (e) {
      console.error('Failed to update order status:', e);
      setOrders(previous); // revert optimistic update on failure
    }
  };

  // 3. Reject an order (kept as a status change, not a hard delete, to preserve order history)
  const rejectOrder = (orderPk) => {
    if (window.confirm("Are you sure you want to reject/cancel this order?")) {
        updateStatus(orderPk, 'CANCELLED');
        setSelectedOrder(null);
    }
  };

  // Helper to format time (e.g., "5 mins ago")
  const getTimeAgo = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes > 60) return `${Math.floor(diffInMinutes/60)} hrs ago`;
    return `${diffInMinutes} mins ago`;
  };

  // Status Badge Logic
  const getStatusColor = (status) => {
    switch(status) {
        case 'PENDING': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'PREPARING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'READY': return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
        default: return 'bg-zinc-500/10 text-zinc-500';
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">Loading orders...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-white">Kitchen Orders</h2>
            <p className="text-zinc-400 text-sm">Manage incoming orders and live status.</p>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-bold border border-yellow-500/30">
             {orders.filter(o => o.status === 'PENDING').length} Pending
           </span>
           <span className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-sm font-bold border border-blue-500/30">
             {orders.filter(o => o.status === 'PREPARING').length} Cooking
           </span>
        </div>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">No orders found.</div>
        ) : (
            orders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col lg:flex-row items-center justify-between shadow-lg hover:border-zinc-700 transition-all gap-6">

                {/* Order Info Left */}
                <div className="flex items-center gap-6 w-full lg:w-auto">
                    <div className="bg-zinc-800 px-5 py-4 rounded-xl text-center min-w-[90px] border border-zinc-700">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Table</p>
                        <p className="font-black text-3xl text-white">{order.table_number}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-white">#{order.order_id.slice(-6).toUpperCase()}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> {order.items?.length || 0} Items</span>
                            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                            <span className="text-orange-500 font-bold">₹{order.total_amount}</span>
                            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {getTimeAgo(order.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Controls Right */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* Status Dropdown */}
                    <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full sm:w-40 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-300 outline-none focus:border-orange-500 cursor-pointer"
                    >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setSelectedOrder(order)}
                            className="flex-1 sm:flex-none p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-white transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-5 h-5"/>
                        </button>

                        {order.status === 'PENDING' && (
                            <button
                                onClick={() => updateStatus(order.id, 'PREPARING')}
                                className="flex-1 sm:flex-none p-3 bg-green-900/20 hover:bg-green-900/40 border border-green-900/30 rounded-xl text-green-500 transition-colors"
                                title="Accept Order"
                            >
                                <Check className="w-5 h-5"/>
                            </button>
                        )}

                        {order.status !== 'CANCELLED' && (
                            <button
                                onClick={() => rejectOrder(order.id)}
                                className="flex-1 sm:flex-none p-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded-xl text-red-500 transition-colors"
                                title="Reject/Cancel"
                            >
                                <X className="w-5 h-5"/>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                <button
                    onClick={() => setSelectedOrder(null)}
                    className="absolute top-4 right-4 p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">Order Details</h3>
                    <p className="text-zinc-500 text-sm">Order ID: #{selectedOrder.order_id}</p>
                </div>

                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                    {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-zinc-800 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-300">
                                    {item.quantity}x
                                </div>
                                <span className="text-zinc-200 font-medium">{item.item_name}</span>
                                {item.customization && <span className="text-xs text-orange-500">({item.customization})</span>}
                            </div>
                            <span className="text-zinc-400 font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                    <span className="text-zinc-400">Total Amount</span>
                    <span className="text-2xl font-black text-orange-500">₹{selectedOrder.total_amount}</span>
                </div>

                <div className="mt-6 flex gap-3">
                    {selectedOrder.status === 'PENDING' ? (
                        <button
                            onClick={() => { updateStatus(selectedOrder.id, 'PREPARING'); setSelectedOrder(null); }}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            <ChefHat className="w-5 h-5" /> Accept & Start Cooking
                        </button>
                    ) : (
                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl"
                        >
                            Close Details
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
