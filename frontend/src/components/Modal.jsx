import { X } from "lucide-react";
import { useEffect } from "react";

const Modal = ({ isOpen, onClose, title, children }) => {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 relative shadow-2xl border border-white/10 scale-100 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                >
                    <X size={20} />
                </button>

                {title && <h2 className="text-2xl font-bold mb-6 pr-8">{title}</h2>}

                <div className="max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
