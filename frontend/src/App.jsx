import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis'; // <--- Professional Smooth Scroll Library

// Page Imports
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage'; 
import MenuPage from './pages/MenuPage';
import DishDetailsPage from './pages/DishDetailsPage';
import CartPage from './pages/CartPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import LiveStatusPage from './pages/LiveStatusPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Context Import
import { UserProvider } from './context/UserContext';

// Admin Imports
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/Dashboard';
import MenuManagement from './admin/MenuManagement';
import OrderManagement from './admin/OrderManagement';
import KitchenView from './admin/KitchenView';

function App() {
  // --- 1. PROFESSIONAL SMOOTH SCROLL SETUP ---
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Custom Easing
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // 2. Cart Initialization (Lazy Load)
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('shoppingCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error("Failed to load cart", e);
      return [];
    }
  });

  // 3. Save Cart Persistence
  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
  }, [cart]);

  // Add to Cart Logic
  const addToCart = (item, qty = 1, customization = '') => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.customization === customization);
      if (existing) {
        return prev.map(i => 
          i.id === item.id && i.customization === customization 
            ? { ...i, quantity: i.quantity + qty } 
            : i
        );
      }
      return [...prev, { ...item, quantity: qty, customization }];
    });
  };

  // Update Quantity Logic
  const updateQuantity = (itemId, delta, customization) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId && item.customization === customization) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Clear Cart Logic
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('shoppingCart');
  };

  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

          <Route path="/menu" element={<MenuPage addToCart={addToCart} cart={cart} />} />
          <Route path="/dish/:id" element={<DishDetailsPage addToCart={addToCart} />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          <Route 
            path="/cart" 
            element={
              <CartPage 
                cart={cart} 
                updateQuantity={updateQuantity} 
                clearCart={clearCart} 
              />
            } 
          />
          
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/status/:orderId" element={<LiveStatusPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
             <Route path="dashboard" element={<AdminDashboard />} />
             <Route path="menu" element={<MenuManagement />} />
             <Route path="orders" element={<OrderManagement />} />
             <Route path="kitchen" element={<KitchenView />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;