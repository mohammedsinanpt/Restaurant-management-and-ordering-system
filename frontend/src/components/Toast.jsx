import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

const TOAST_DURATION = 2800;

const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="pointer-events-auto relative overflow-hidden w-80 max-w-[calc(100vw-2rem)] flex items-center gap-3 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 ring-1 ring-white/5 rounded-2xl shadow-2xl shadow-black/40 pl-3 pr-4 py-3"
    >
      <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 flex items-center justify-center">
        {toast.image ? (
          <img src={toast.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag className="w-5 h-5 text-zinc-500" />
        )}
        <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 rounded-full p-0.5 ring-2 ring-zinc-900">
          <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{toast.name}</p>
        <p className="text-xs text-emerald-400 font-medium">
          {toast.qty > 1 ? `${toast.qty}× added to cart` : 'Added to cart'}
        </p>
      </div>

      <motion.span
        className="absolute bottom-0 left-0 h-0.5 bg-orange-500/70"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  </div>
);

export default ToastContainer;
