import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";

const ToastContext = createContext({ notify: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message, type = "success", ttlMs = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [{ id, message, type }, ...prev]);
    window.setTimeout(() => remove(id), ttlMs);
  }, [remove]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}




