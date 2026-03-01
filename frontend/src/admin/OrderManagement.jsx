import React, { useState, useEffect } from 'react';
import { Eye, Check, X, Clock, MapPin, ChefHat, ShoppingBag } from 'lucide-react';

// Mock Data to initialize if LocalStorage is empty (so you have something to test)
const MOCK_INITIAL_ORDERS = [
    { 
        id: 'ORD-101', 
        table: 4, 
        total: 1250, 
        status: 'PENDING', 
        timestamp: new Date().toISOString(),
        items: [
            { name: "Butter Chicken Royale", quantity: 2, price: 380 },
            { name: "Garlic Naan Basket", quantity: 1, price: 120 }
        ]
    },
    { 
        id: 'ORD-102', 
        table: 2, 
        total: 450, 
        status: 'PREPARING', 
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        items: [
            { name: "Hyderabadi Dum Biryani", quantity: 1, price: 450 }
        ]
    },
];

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null); // For the Details Modal

  // 1. Load Orders from LocalStorage on mount
  useEffect(() => {
    const savedOrders = localStorage.getItem('allOrders');
    if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
    } else {
        // If empty, load mock data so you can see how it looks
        setOrders(MOCK_INITIAL_ORDERS);
        localStorage.setItem('allOrders', JSON.stringify(MOCK_INITIAL_ORDERS));
    }

    // Optional: Poll every 5 seconds to check for new orders from customers
    const interval = setInterval(() => {
        const freshOrders = localStorage.getItem('allOrders');
        if (freshOrders) {
            // Only update if different to prevent re-renders (simple check)
            const parsed = JSON.parse(freshOrders);
            if(JSON.stringify(parsed) !== JSON.stringify(orders)) {
                setOrders(parsed);
            }
        }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 2. Function to Update Status (Syncs to LocalStorage)
  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('allOrders', JSON.stringify(updatedOrders));
  };

  // 3. Delete/Reject Order
  const deleteOrder = (orderId) => {
    if(window.confirm("Are you sure you want to reject/remove this order?")) {
        const updatedOrders = orders.filter(order => order.id !== orderId);
        setOrders(updatedOrders);
        localStorage.setItem('allOrders', JSON.stringify(updatedOrders));
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
        case 'COMPLETED': return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        default: return 'bg-zinc-500/10 text-zinc-500';
    }
  };

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
            <div className="text-center py-20 text-zinc-500">No active orders found.</div>
        ) : (
            orders.map(order => (
            <div key={order.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col lg:flex-row items-center justify-between shadow-lg hover:border-zinc-700 transition-all gap-6">
                
                {/* Order Info Left */}
                <div className="flex items-center gap-6 w-full lg:w-auto">
                    <div className="bg-zinc-800 px-5 py-4 rounded-xl text-center min-w-[90px] border border-zinc-700">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Table</p>
                        <p className="font-black text-3xl text-white">{order.table || "Takeaway"}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-white">#{order.id.slice(-6).toUpperCase()}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> {order.items?.length || 0} Items</span>
                            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                            <span className="text-orange-500 font-bold">₹{order.total}</span>
                            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {getTimeAgo(order.timestamp)}</span>
                        </div>
                    </div>
                </div>

                {/* Controls Right */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    {/* Status Dropdown */}
                    <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="w-full sm:w-40 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-300 outline-none focus:border-orange-500 cursor-pointer"
                    >
                        <option value="PENDING">Pending</option>
                        <option value="PREPARING">Preparing</option>
                        <option value="READY">Ready</option>
                        <option value="COMPLETED">Completed</option>
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
                                onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                                className="flex-1 sm:flex-none p-3 bg-green-900/20 hover:bg-green-900/40 border border-green-900/30 rounded-xl text-green-500 transition-colors" 
                                title="Accept Order"
                            >
                                <Check className="w-5 h-5"/>
                            </button>
                        )}
                        
                        <button 
                            onClick={() => deleteOrder(order.id)}
                            className="flex-1 sm:flex-none p-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 rounded-xl text-red-500 transition-colors" 
                            title="Reject/Delete"
                        >
                            <X className="w-5 h-5"/>
                        </button>
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
                    <p className="text-zinc-500 text-sm">Order ID: #{selectedOrder.id}</p>
                </div>

                <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
                    {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-zinc-800 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-300">
                                    {item.quantity}x
                                </div>
                                <span className="text-zinc-200 font-medium">{item.name}</span>
                                {item.variety && <span className="text-xs text-orange-500">({item.variety})</span>}
                            </div>
                            <span className="text-zinc-400 font-mono">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                    <span className="text-zinc-400">Total Amount</span>
                    <span className="text-2xl font-black text-orange-500">₹{selectedOrder.total}</span>
                </div>

                <div className="mt-6 flex gap-3">
                    {selectedOrder.status === 'PENDING' ? (
                        <button 
                            onClick={() => { updateOrderStatus(selectedOrder.id, 'PREPARING'); setSelectedOrder(null); }}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl"
                        >
                            Accept & Start Cooking
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