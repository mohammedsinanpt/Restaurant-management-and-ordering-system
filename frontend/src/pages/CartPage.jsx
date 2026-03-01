import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, UserCircle, Lock, Loader2, ShoppingBag } from 'lucide-react';
import { useUser } from '../context/UserContext'; // <--- 1. Import Context

const CartPage = ({ cart, updateQuantity, clearCart }) => {
    const navigate = useNavigate();
    const { currentUser } = useUser(); // <--- 2. Get User from Context
    const [loading, setLoading] = useState(false);

    // Calculations
    const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    const serviceCharge = subtotal * 0.05; // 5%
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + serviceCharge + tax;

    const handlePlaceOrder = async () => {
        setLoading(true);

        // --- 1. AUTH CHECK ---
        if (!currentUser) {
            alert("Please Sign In to confirm your order.");
            setLoading(false);
            navigate('/auth');
            return;
        }

        // Simulate network delay for "Processing"
        setTimeout(() => {
            try {
                // --- 2. CREATE ORDER OBJECT ---
                const newOrderId = `ORD-${Date.now().toString().slice(-6)}`;
                
                const orderPayload = {
                    id: newOrderId,
                    userId: currentUser.uid, // Link order to this user
                    userName: currentUser.name,
                    items: cart,
                    subtotal: subtotal,
                    total: parseFloat(total.toFixed(2)),
                    status: 'PENDING',
                    timestamp: new Date().toISOString()
                };

                // --- 3. SAVE TO LOCAL DATABASE ---
                const allOrders = JSON.parse(localStorage.getItem('allOrders') || '[]');
                allOrders.push(orderPayload);
                localStorage.setItem('allOrders', JSON.stringify(allOrders));
                
                // --- 4. SUCCESS ---
                console.log("Order Placed:", orderPayload);
                
                // Clear cart
                clearCart();
                
                // --- REDIRECT TO CONFIRMATION PAGE ---
                // Updated to point to your OrderConfirmationPage
                navigate(`/order-confirmation/${newOrderId}`); 
                
            } catch (error) {
                console.error("Order Failed:", error);
                alert("Something went wrong placing your order.");
            } finally {
                setLoading(false);
            }
        }, 1500);
    };

    // EMPTY CART VIEW
    if (cart.length === 0) return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
                <ShoppingBag className="w-10 h-10 text-zinc-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Your Cart is Empty</h2>
            <p className="text-zinc-400 mb-8">Looks like you haven't made your choice yet.</p>
            <button
                onClick={() => navigate('/menu')}
                className="bg-orange-600 px-8 py-3 rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-600/20"
            >
                Browse Menu
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 pb-32">
            
            {/* User Status Banner */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Your Order</h1>
                    {currentUser ? (
                        <p className="text-emerald-400 flex items-center gap-2 text-sm mt-2 bg-emerald-400/10 px-3 py-1.5 rounded-lg w-fit border border-emerald-400/20">
                            <UserCircle className="w-4 h-4" /> 
                            Ordering as <span className="font-bold">{currentUser.name}</span>
                        </p>
                    ) : (
                        <p className="text-zinc-500 flex items-center gap-2 text-sm mt-2 bg-zinc-900 px-3 py-1.5 rounded-lg w-fit border border-zinc-800">
                            <Lock className="w-4 h-4" /> 
                            You are currently a Guest
                        </p>
                    )}
                </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-12">
                {/* Items List */}
                <div className="lg:col-span-2 space-y-6">
                    {cart.map((item, idx) => (
                        <div
                            key={`${item.id}-${idx}`}
                            className="flex gap-4 bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-md"
                        >
                            {/* Image Handling with Fallback */}
                            <div className="w-24 h-24 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        className="w-full h-full object-cover"
                                        alt={item.name}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <ShoppingBag size={24} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{item.name}</h3>
                                        {item.customization && (
                                            <p className="text-sm text-orange-500 mt-1 bg-orange-500/10 inline-block px-2 py-0.5 rounded">
                                                {item.customization}
                                            </p>
                                        )}
                                    </div>
                                    <span className="font-bold text-lg text-white">
                                        ₹{item.price * item.quantity}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center bg-zinc-950 rounded-lg border border-zinc-800">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1, item.customization)}
                                            className="p-2 hover:text-orange-500 transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1, item.customization)}
                                            className="p-2 hover:text-orange-500 transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => updateQuantity(item.id, -100, item.customization)}
                                        className="text-zinc-600 hover:text-red-500 p-2 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bill Summary */}
                <div className="h-fit bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl lg:sticky lg:top-8">
                    <h3 className="text-xl font-bold mb-6 text-white">Payment Summary</h3>
                    <div className="space-y-4 mb-8 text-zinc-400">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Service Charge (5%)</span>
                            <span>₹{serviceCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>GST (18%)</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-zinc-700 pt-4 flex justify-between text-white text-xl font-bold">
                            <span>Total</span>
                            <span className="text-orange-500">₹{total.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    {/* The Checkout Button */}
                    <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl flex justify-between px-6 items-center group ${
                            currentUser 
                            ? 'bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/20' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2 mx-auto">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <>
                                <span>{currentUser ? 'Confirm Order' : 'Login to Order'}</span>
                                {currentUser ? (
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                ) : (
                                    <Lock className="w-5 h-5" />
                                )}
                            </>
                        )}
                    </button>
                    
                    {!currentUser && (
                        <p className="text-center text-xs text-zinc-500 mt-4">
                            You need to be logged in to complete your purchase.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartPage;