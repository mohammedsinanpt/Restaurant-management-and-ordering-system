import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, UserCircle, Lock, Loader2, ShoppingBag, AlertCircle, Hash, CreditCard } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useUser } from '../context/UserContext'; // <--- 1. Import Context
import { createOrder, createPaymentIntent } from '../api';
import { stripePromise } from '../stripe';

const extractErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return 'Something went wrong placing your order.';
    if (typeof data.error === 'string') return data.error;
    if (Array.isArray(data.error)) return data.error.join(' ');
    return 'Something went wrong placing your order.';
};

// Renders inside the Stripe <Elements> provider once a PaymentIntent exists.
// Confirms the card payment, then only creates the order once Stripe confirms it succeeded.
const CheckoutForm = ({ total, orderPayload, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handlePay = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setSubmitting(true);
        setError('');

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message || 'Payment failed. Please check your card details.');
            setSubmitting(false);
            return;
        }

        if (paymentIntent?.status !== 'succeeded') {
            setError('Payment was not completed. Please try again.');
            setSubmitting(false);
            return;
        }

        try {
            const { data } = await createOrder({ ...orderPayload, payment_intent_id: paymentIntent.id });
            onSuccess(data);
        } catch (err) {
            console.error('Order creation failed after payment succeeded:', err);
            setError(
                `Payment succeeded, but we couldn't finalize your order. ` +
                `Reference: ${paymentIntent.id} — please contact us with this reference.`
            );
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handlePay} className="space-y-4">
            <PaymentElement />

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="px-6 py-4 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={!stripe || submitting}
                    className="flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-xl flex justify-center items-center gap-2 bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                    ) : (
                        <><CreditCard className="w-5 h-5" /> Pay ₹{total.toFixed(2)}</>
                    )}
                </button>
            </div>
        </form>
    );
};

const CartPage = ({ cart, updateQuantity, clearCart }) => {
    const navigate = useNavigate();
    const { currentUser } = useUser(); // <--- 2. Get User from Context
    const [loading, setLoading] = useState(false);
    const [tableNumber, setTableNumber] = useState('');
    const [error, setError] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [orderPayload, setOrderPayload] = useState(null);

    // Calculations
    const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    const serviceCharge = subtotal * 0.05; // 5%
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + serviceCharge + tax;

    const handleProceedToPayment = async () => {
        setError('');

        if (!currentUser) {
            navigate('/auth', { state: { from: '/cart' } });
            return;
        }

        const table = parseInt(tableNumber, 10);
        if (!table || table <= 0) {
            setError('Please enter a valid table number.');
            return;
        }

        setLoading(true);
        try {
            const items = cart.map(item => ({
                menu_item: item.id,
                quantity: item.quantity,
                customization: item.customization || '',
            }));

            const { data } = await createPaymentIntent(items);

            setOrderPayload({ table_number: table, items });
            setClientSecret(data.client_secret);
        } catch (err) {
            console.error('Could not start payment:', err);
            setError(extractErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (order) => {
        clearCart();
        navigate(`/order-confirmation/${order.order_id}`);
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
                                            disabled={!!clientSecret}
                                            className="p-2 hover:text-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1, item.customization)}
                                            disabled={!!clientSecret}
                                            className="p-2 hover:text-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => updateQuantity(item.id, -100, item.customization)}
                                        disabled={!!clientSecret}
                                        className="text-zinc-600 hover:text-red-500 p-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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

                    {/* Table Number */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Table Number</label>
                        <div className="relative">
                            <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <input
                                type="number"
                                min="1"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                disabled={!!clientSecret}
                                placeholder="e.g. 4"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white outline-none focus:border-orange-500/50 transition-all disabled:opacity-60"
                            />
                        </div>
                    </div>

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

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {clientSecret ? (
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#ea580c' } } }}>
                            <CheckoutForm
                                total={total}
                                orderPayload={orderPayload}
                                onSuccess={handlePaymentSuccess}
                                onCancel={() => { setClientSecret(''); setOrderPayload(null); }}
                            />
                        </Elements>
                    ) : (
                        <>
                            {/* The Checkout Button */}
                            <button
                                onClick={handleProceedToPayment}
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-xl flex justify-between px-6 items-center group bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2 mx-auto">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Preparing checkout...</span>
                                    </div>
                                ) : !currentUser ? (
                                    <>
                                        <span>Sign In to Checkout</span>
                                        <Lock className="w-5 h-5" />
                                    </>
                                ) : (
                                    <>
                                        <span>Proceed to Payment</span>
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {!currentUser && (
                                <p className="text-center text-xs text-zinc-500 mt-4">
                                    You'll need to sign in before placing your order — your cart will be waiting.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartPage;
