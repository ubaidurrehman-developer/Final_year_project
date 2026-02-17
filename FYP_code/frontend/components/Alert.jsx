import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Alert = ({ message, type = 'info', onClose, duration = 4000 }) => {
    useEffect(() => {        
        const timer = setTimeout(() => {
            if (onClose) onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: <CheckCircle className="w-6 h-6 text-green-500" />,
        error: <XCircle className="w-6 h-6 text-red-500" />,
        warning: <AlertCircle className="w-6 h-6 text-yellow-500" />,
        info: <Info className="w-6 h-6 text-blue-500" />
    };

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const normalizedType = type === 'danger' ? 'error' : type;

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-none">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`pointer-events-auto flex items-center justify-center gap-3 px-3 py-1 rounded-xl shadow-2xl border ${styles[normalizedType] || styles.info} min-w-[320px] max-w-md bg-white`}
                >
                    {icons[normalizedType] || icons.info}
                    <p className="font-medium text-lg">{message}</p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Alert;