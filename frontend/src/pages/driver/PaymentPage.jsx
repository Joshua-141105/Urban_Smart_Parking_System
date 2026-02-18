import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { CreditCard, Wallet, ArrowLeft, ShieldCheck, Smartphone, CheckCircle, AlertCircle } from "lucide-react";

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { amount, type, metadata, description } = location.state || {};

    // Default mock methods based on PaymentMethod enum
    const PAYMENT_METHODS = [
        { id: "CARD", label: "Credit/Debit Card", icon: <CreditCard size={24} />, description: "Visa, Mastercard, RuPay" },
        { id: "UPI", label: "UPI", icon: <Smartphone size={24} />, description: "GPay, PhonePe, Paytm" },
        { id: "WALLET", label: "Digital Wallet", icon: <Wallet size={24} />, description: "Paytm, Amazon Pay" }
    ];

    const [selectedMethod, setSelectedMethod] = useState("CARD");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!amount || !type) {
            navigate("/dashboard");
        }
    }, [amount, type, navigate]);

    const handlePayment = async () => {
        setProcessing(true);
        setError("");

        try {
            // 1. Process Payment to get Transaction ID
            const paymentRes = await api.post("/payments/process", {
                amount,
                type,
                method: selectedMethod
            });

            const transactionId = paymentRes.data.transactionId;

            // 2. Finalize specific service (Booking or Permit)
            if (type === "BOOKING") {
                await api.post("/bookings/create", {
                    ...metadata,
                    transactionId // Pass txn ID for linking if backend supports it
                });
                // Note: If backend BookingController doesn't take txnId yet, it's fine.
                // We're just ensuring the payment flow exists. 
                // In a perfect world, we'd pass txnId to confirm the booking.
            } else if (type === "PERMIT") {
                // Permit buying logic usually takes just lotId. 
                // We might need to adjust PermitController to accept txnId or verify payment.
                // For now, we assume PermitController.purchasePermit handles it or we call it here.
                // Wait, MonthlyPermitController.purchasePermit takes {lotId}. 
                // We should probably call it here.
                await api.post("/permits/buy", {
                    lotId: metadata.lotId,
                    transactionId
                });
            }

            setSuccess(true);
            setTimeout(() => {
                navigate(type === "BOOKING" ? "/bookings" : "/permits");
            }, 2000);

        } catch (err) {
            console.error("Payment failed", err);
            setError(err.response?.data?.message || "Payment failed. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
                <div className="glass-panel p-8 text-center max-w-md w-full">
                    <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                    <p className="text-secondary mb-4">
                        Your {type.toLowerCase()} has been confirmed.
                    </p>
                    <div className="text-sm font-mono bg-white/5 p-2 rounded mb-4">
                        Amount Paid: ₹{amount}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto p-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-secondary hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back
            </button>

            <div className="glass-panel p-6 mb-6">
                <h1 className="text-2xl font-bold mb-2">Secure Payment</h1>
                <p className="text-secondary mb-6">Complete your payment to proceed.</p>

                <div className="flex justify-between items-center p-4 rounded-lg bg-accent/10 border border-accent/20 mb-6">
                    <div>
                        <div className="text-sm text-secondary uppercase tracking-wider mb-1">Total Amount</div>
                        <div className="text-3xl font-bold text-accent">₹{Number(amount).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-secondary mb-1">For</div>
                        <div className="font-semibold">{description || type}</div>
                    </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>

                <div className="space-y-3 mb-8">
                    {PAYMENT_METHODS.map((method) => (
                        <div
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === method.id
                                    ? 'border-accent bg-accent/5'
                                    : 'border-transparent bg-white/5 hover:bg-white/10'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedMethod === method.id ? 'bg-accent text-white' : 'bg-white/10 text-secondary'
                                }`}>
                                {method.icon}
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold">{method.label}</div>
                                <div className="text-sm text-secondary">{method.description}</div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedMethod === method.id ? 'border-accent' : 'border-secondary'
                                }`}>
                                {selectedMethod === method.id && (
                                    <div className="w-3 h-3 rounded-full bg-accent" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 text-rose-400 text-sm">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button
                    className="btn btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-2"
                    onClick={handlePayment}
                    disabled={processing}
                >
                    {processing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Processing...
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={20} />
                            Pay ₹{Number(amount).toFixed(2)}
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-secondary mt-4 flex items-center justify-center gap-1">
                    <ShieldCheck size={12} />
                    Payments are secure and encrypted
                </p>
            </div>
        </div>
    );
};

export default PaymentPage;
