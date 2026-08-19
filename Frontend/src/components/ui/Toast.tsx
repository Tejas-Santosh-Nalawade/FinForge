import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  type?: 'success' | 'error' | 'info';
}

export function Toast({ message, visible, type = 'success' }: ToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg shadow-dropdown px-4 py-2.5 text-xs">
        {type === 'success' ? (
          <CheckCircle2 size={16} className="text-status-success shrink-0" />
        ) : (
          <AlertCircle size={16} className="text-status-critical shrink-0" />
        )}
        <p className="font-medium text-slate-800">{message}</p>
      </div>
    </div>
  );
}

export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('success');

  const show = (msg: string, toastType: 'success' | 'error' | 'info' = 'success') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  };

  return { visible, message, type, show };
}
