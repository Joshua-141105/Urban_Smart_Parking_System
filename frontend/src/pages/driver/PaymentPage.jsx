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
        <div className="animate-fade-in max-w-2xl mx-auto p-4 py-8 justify-center">
            <button
                onClick={() => navigate(-1)}
                className="btn-back mb-6"
            >
                <ArrowLeft size={18} />
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

                <h3 className="text-lg font-semibold mb-4 justify-center" style={{ textAlign: 'center' }}>Select Payment Method</h3>

                <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem', paddingBottom: '1rem', justifyContent: 'center' }}>
                    {PAYMENT_METHODS.map((method) => {
                        const isSelected = selectedMethod === method.id;
                        return (
                            <div
                                key={method.id}
                                onClick={() => setSelectedMethod(method.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.15)',
                                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    flex: '1',
                                    minWidth: '240px',
                                    maxWidth: '300px',
                                    transform: isSelected ? 'scale(1.02)' : 'none',
                                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.25)' : 'none'
                                }}
                            >
                                <div style={{ flexShrink: 0, width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {isSelected ? (
                                        <CheckCircle size={24} color="var(--accent-primary)" />
                                    ) : (
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid rgba(255, 255, 255, 0.3)' }} />
                                    )}
                                </div>
                                
                                <div style={{ 
                                    width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)',
                                    color: isSelected ? '#fff' : 'var(--text-secondary)'
                                }}>
                                    {method.icon}
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', overflow: 'hidden' }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: isSelected ? '#fff' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {method.label}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {method.description}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
