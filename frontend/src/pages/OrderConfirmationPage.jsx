import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle, Clock, UtensilsCrossed } from 'lucide-react';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // 🎊 Party Popper Effect
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ea580c', '#ffffff'] // Orange & White
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ea580c', '#ffffff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-zinc-950 pointer-events-none" />
      
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-md w-full shadow-2xl relative z-10">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-black mb-2">Order Confirmed!</h1>
        <p className="text-zinc-400 mb-8">Thank you for dining with SpiceRoute.</p>
        
        <div className="bg-zinc-950 rounded-xl p-4 mb-6 text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-500">Order ID</span>
            <span className="font-mono font-bold text-orange-500">#{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 flex items-center gap-2"><Clock className="w-4 h-4"/> Est. Time</span>
            <span className="font-bold">25 Mins</span>
          </div>
        </div>

        {/* Buttons Container */}
        <div className="space-y-3">
            <button 
              onClick={() => navigate(`/status/${orderId}`)}
              className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors shadow-lg"
            >
              Track Live Status
            </button>

            <button 
              onClick={() => navigate('/menu')}
              // Updated hover classes here:
              className="w-full bg-zinc-800 text-zinc-300 py-4 rounded-xl font-bold border border-zinc-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-colors flex items-center justify-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" />
              Return to Menu
            </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;