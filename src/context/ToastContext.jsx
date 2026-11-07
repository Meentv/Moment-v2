import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { makeId } from '../services/model.js';

const ToastContext = createContext(null);
function Toast({ toast, dismiss }) {
  const timer = useRef(null);
  const start = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => dismiss(toast.id), toast.action ? 10000 : 6000);
  }, [dismiss, toast.id, toast.action]);
  useEffect(() => { start(); return () => clearTimeout(timer.current); }, [start]);
  const Icon = toast.type === 'error' ? AlertCircle : toast.type === 'info' ? Info : CheckCircle2;
  return <div className={`toast toast-${toast.type || 'success'}`} role={toast.type === 'error' ? 'alert' : 'status'} onMouseEnter={() => clearTimeout(timer.current)} onMouseLeave={start} onFocus={() => clearTimeout(timer.current)} onBlur={start}>
    <Icon size={19} className="toast-icon" /><span>{toast.message}</span>
    {toast.action && <button className="toast-action" onClick={() => { toast.action.onClick(); dismiss(toast.id); }}>{toast.action.label}</button>}
    <button className="icon-button small" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={16} /></button>
  </div>;
}
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const notify = useCallback((message, options = {}) => {
    const id = makeId();
    setToasts((current) => [...current.slice(-3), { id, message, ...options }]);
    return id;
  }, []);
  return <ToastContext.Provider value={notify}>{children}<div className="toast-region" role="region" aria-label="Notifications">{toasts.map((toast) => <Toast key={toast.id} toast={toast} dismiss={dismiss} />)}</div></ToastContext.Provider>;
}
export function useToast() { return useContext(ToastContext); }
