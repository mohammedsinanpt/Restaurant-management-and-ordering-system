import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    || 'pk_test_51Tuthd0LSwz1eEGh72GWFUrFQYql31TZTwgRWi1sqSZIwBBXxH462M2lHcZTMTfXftGusDvKaEt3OLpYHFNM098h00euZfMaTB';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
