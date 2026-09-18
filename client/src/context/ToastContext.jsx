import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 4000;

const TOAST_CONFIG = {
  success: {
    icon: <CheckCircle2 size={18} className="text-green-500" />,
    border: 'border-l-4 border-l-green-500',
  },
  error: {
    icon: <AlertCircle size={18} className="text-red-500" />,
    border: 'border-l-4 border-l-red-500',
  },
  info: {
    icon: <Info size={18} className="text-[#ff6b1a]" />,
    border: 'border-l-4 border-l-[#ff6b1a]',
  },
};

const ToastItem = ({ toast, onClose }) => {
  const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  return (
    <div
      className={`toast-in relative flex items-center gap-3 pl-3 pr-8 py-3 rounded-lg bg-[#161616] border border-white/10 ${config.border} shadow-2xl text-[#e9e4dc] max-w-sm`}
    >
      {config.icon}
      <span className="text-sm">{toast.message}</span>
      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a554e] hover:text-[#e9e4dc] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type, message) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      timers.current.set(
        id,
        setTimeout(() => removeToast(id), TOAST_DURATION_MS)
      );
    },
    [removeToast]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg) => addToast('success', msg),
      error: (msg) => addToast('error', msg),
      info: (msg) => addToast('info', msg),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};
