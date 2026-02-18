import { useState } from "react";
import { X, Calendar, Clock, CreditCard } from "lucide-react";
import api from "../api/axios";

const BookingModal = ({ parkingLot, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [startTime, setStartTime] = useState("");
    const [duration, setDuration] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const calculateTotal = () => {
        // Basic calculation, should ideally come from backend pricing engine
        // Assuming base rate of 50
        const baseRate = 50;
        return baseRate * duration;
    };

    const handleBooking = async () => {
        setLoading(true);
        setError("");

        try {
            // Mock payload structure based on SRS
            const payload = {
                parkingLotId: parkingLot.id,
                startTime: new Date(startTime).toISOString(),
                durationHours: duration,
                vehicleNumber: "KA-01-AB-1234" // Should come from user profile
            };

            // const res = await api.post("/bookings/reserve", payload);
            // Mock success for UI demo
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);

        } catch (err) {
            setError("Failed to create booking. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-md p-6 relative animate-fade-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-1">Book Parking</h2>
                <p className="text-slate-400 mb-6">{parkingLot.name}</p>

                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="label">Start Time</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    className="input pl-10"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div>
                            <label className="label">Duration (Hours)</label>
                            <div className="flex items-center gap-4">
                                <button
                                    className="btn btn-secondary py-2 px-4"
                                    onClick={() => setDuration(Math.max(1, duration - 1))}
                                >-</button>
                                <span className="text-xl font-bold w-12 text-center">{duration}</span>
                                <button
                                    className="btn btn-secondary py-2 px-4"
                                    onClick={() => setDuration(Math.min(8, duration + 1))}
                                >+</button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Rate per hour</span>
                                <span>₹50.00</span>
                            </div>
                            <div className="flex justify-between items-center text-xl font-bold text-emerald-400">
                                <span>Total</span>
                                <span>₹{calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary w-full mt-4"
                            disabled={!startTime}
                            onClick={() => setStep(2)}
                        >
                            Proceed to Payment
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 text-center">
                        <div className="py-8">
                            <CreditCard size={64} className="mx-auto text-indigo-400 mb-4" />
                            <p className="text-lg">Process payment of <span className="font-bold text-white">₹{calculateTotal()}</span>?</p>
                            <p className="text-sm text-slate-400 mt-2">Mock payment integration</p>
                        </div>

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            className="btn btn-primary w-full"
                            onClick={handleBooking}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Pay & Confirm"}
                        </button>

                        <button
                            className="text-slate-400 text-sm hover:text-white mt-4"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
