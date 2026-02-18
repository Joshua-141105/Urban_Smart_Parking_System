import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import api from "../../api/axios";
import {
    MapPin, Clock, Car, IndianRupee, CreditCard, Lock, Unlock,
    AlertCircle, CheckCircle, ArrowLeft, Timer, Shield
} from "lucide-react";

const BookingPayment = () => {
    const { lotId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { sendMessage, isConnected, lockUpdates } = useWebSocket();

    const [lot, setLot] = useState(location.state?.lot || null);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lockingSpace, setLockingSpace] = useState(false);
    const [isSpaceLocked, setIsSpaceLocked] = useState(false);
    const [lockTimeout, setLockTimeout] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(60); // 1 min lock timeout
    const [duration, setDuration] = useState(1); // hours
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const LOCK_DURATION = 60; // 1 minute in seconds

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate("/login", { state: { from: `/booking/${lotId}` } });
        }
    }, [user, navigate, lotId]);

    const fetchLotDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/parking/${lotId}`);
            setLot(res.data);
            setSpaces(res.data.spaces || []);
        } catch (err) {
            console.error("Failed to fetch lot details", err);
            setError("Failed to load parking lot details");
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (lotId) {
            fetchLotDetails();
        }
    }, [lotId]);

    // Countdown timer for lock
    useEffect(() => {
        let interval;
        if (isSpaceLocked && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleUnlockSpace();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSpaceLocked, timeRemaining]);

    const handleSelectSpace = (space) => {
        if (space.isOccupied || isSpaceLocked || (lockUpdates && lockUpdates[space.id])) return;
        setSelectedSpace(space);
        setError("");
    };

    const handleLockSpace = async () => {
        if (!selectedSpace) return;
        if (!user || !user.id) {
            setError("User authentication incomplete. Please login again.");
            return;
        }

        setLockingSpace(true);
        setError("");

        const lockPayload = {
            spaceId: selectedSpace.id,
            userId: user.id,
            duration: LOCK_DURATION
        };
        console.log("Lock Payload:", lockPayload);

        try {
            // Call API to lock the space
            const res = await api.post("/bookings/lock", lockPayload);

            if (res.data.success) {
                setIsSpaceLocked(true);
                setTimeRemaining(LOCK_DURATION);

                // Broadcast lock via WebSocket
                if (isConnected && sendMessage) {
                    sendMessage("/app/parking/lock", {
                        spaceId: selectedSpace.id,
                        lotId: lot.id,
                        locked: true,
                        userId: user.id
                    });
                }
            } else {
                setError(res.data.message || "Failed to lock space");
            }
        } catch (err) {
            console.error("Lock failed", err);
            console.log("Full Error Response:", err.response); // Debugging
            const errorMessage = err.response?.data?.message || err.message || "Could not connect to server";

            if (spaces.length === 0) {
                console.warn("API failed, falling back to demo mode");
                setIsSpaceLocked(true);
                setTimeRemaining(LOCK_DURATION);
            } else {
                // For real data, show the actual error
                const isOccupiedError = errorMessage.toLowerCase().includes("occupied") || errorMessage.toLowerCase().includes("locked");

                if (isOccupiedError) {
                    setError(`This space was just taken. Refreshing map...`);
                    // Auto-refresh the map to show true status
                    setTimeout(() => {
                        fetchLotDetails();
                        setSelectedSpace(null);
                    }, 1500);
                } else {
                    setError(`Lock failed: ${errorMessage}`);
                }
            }
        } finally {
            setLockingSpace(false);
        }
    };

    const handleUnlockSpace = async () => {
        try {
            // Call API to unlock
            await api.post("/bookings/unlock", {
                spaceId: selectedSpace?.id,
                userId: user?.id
            });
        } catch (err) {
            console.error("Unlock failed", err);
        }

        // Broadcast unlock via WebSocket
        if (isConnected && sendMessage && selectedSpace) {
            sendMessage("/app/parking/lock", {
                spaceId: selectedSpace.id,
                lotId: lot?.id,
                locked: false,
                userId: user?.id
            });
        }

        setIsSpaceLocked(false);
        setTimeRemaining(LOCK_DURATION);
        setSelectedSpace(null);
    };

    const handlePayment = () => {
        if (!vehicleNumber.trim()) {
            setError("Please enter your vehicle number");
            return;
        }

        const totalAmount = calculateTotal();
        const bookingMetadata = {
            userId: user.id,
            spaceId: selectedSpace.id,
            lotId: lot.id,
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            startTime: new Date().toISOString(),
            durationHours: duration,
            totalAmount: totalAmount
        };

        navigate("/payment", {
            state: {
                amount: totalAmount,
                type: "BOOKING",
                description: `Parking at ${lot.name} for ${duration} hr(s)`,
                metadata: bookingMetadata
            }
        });
    };

    const calculateTotal = () => {
        if (!lot) return 0;
        const basePrice = lot.baseRate * duration;
        return Number(basePrice.toFixed(2));
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full animate-spin"
                        style={{ border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)' }}></div>
                    <p className="text-secondary">Loading booking details...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center glass-panel p-8 max-w-md animate-fade-in">
                    <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-secondary mb-4">
                        Your parking spot has been reserved. Redirecting to your bookings...
                    </p>
                    <div className="text-sm text-muted">
                        Space: {selectedSpace?.spaceNumber} | Duration: {duration}hr
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => {
                        if (isSpaceLocked) handleUnlockSpace();
                        navigate(-1);
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">{lot?.name}</h1>
                    <p className="text-secondary text-sm">{lot?.address}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Space Selection */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Car size={20} />
                        Select Parking Space
                    </h3>

                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 text-rose-400 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
                        {spaces.length > 0 ? spaces.map((space) => (
                            <button
                                key={space.id}
                                className={`aspect-[3/2] rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 shadow-sm ${space.isOccupied
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 cursor-not-allowed'
                                    : (lockUpdates && lockUpdates[space.id])
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 cursor-not-allowed'
                                        : selectedSpace?.id === space.id
                                            ? 'shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-[1.02]'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-md'
                                    }`}
                                onClick={() => handleSelectSpace(space)}
                                disabled={space.isOccupied || isSpaceLocked}
                                style={selectedSpace?.id === space.id ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white' } : {}}
                            >
                                {space.spaceNumber}
                            </button>
                        )) : (
                            // Demo spaces
                            Array.from({ length: 20 }, (_, i) => (
                                <button
                                    key={i}
                                    className={`aspect-[3/2] rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 shadow-sm ${i % 5 === 0
                                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 cursor-not-allowed'
                                        : selectedSpace?.id === i + 1
                                            ? 'shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-[1.02]'
                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-md'
                                        }`}
                                    onClick={() => i % 5 !== 0 && handleSelectSpace({ id: i + 1, spaceNumber: `A${i + 1}` })}
                                    disabled={i % 5 === 0 || isSpaceLocked}
                                    style={selectedSpace?.id === i + 1 ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: 'white' } : {}}
                                >
                                    A{i + 1}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 justify-center mt-6 text-sm font-medium text-secondary">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: '#10b981', borderColor: '#10b981', opacity: 0.3 }}></div>
                            Available
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md border" style={{ backgroundColor: '#f43f5e', borderColor: '#f43f5e', opacity: 0.3 }}></div>
                            Occupied
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md border shadow-sm" style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}></div>
                            Selected
                        </div>
                    </div>
                </div>

                {/* Booking Details & Payment */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard size={20} />
                        Booking Details
                    </h3>

                    {/* Lock Status */}
                    {isSpaceLocked && (
                        <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="flex items-center gap-2 text-amber-400">
                                <Lock size={16} />
                                <span className="text-sm">Space locked for you</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Timer size={16} className="text-amber-400" />
                                <span className="font-mono font-bold text-amber-400">
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                        </div>
                    )}

                    {selectedSpace && !isSpaceLocked && (
                        (lockUpdates && lockUpdates[selectedSpace.id]) ? (
                            <div className="flex items-center justify-center p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 gap-2">
                                <Lock size={16} />
                                <span className="text-sm font-medium">Locked by another user</span>
                            </div>
                        ) : (
                            <button
                                className="btn btn-secondary w-full mb-4"
                                onClick={handleLockSpace}
                                disabled={lockingSpace}
                            >
                                {lockingSpace ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Locking...
                                    </>
                                ) : (
                                    <>
                                        <Lock size={16} />
                                        Lock Space for 1 Minute
                                    </>
                                )}
                            </button>
                        )
                    )}

                    {isSpaceLocked && (
                        <button
                            className="btn btn-ghost w-full mb-4 text-rose-400 hover:bg-rose-500/10"
                            onClick={handleUnlockSpace}
                        >
                            <Unlock size={16} />
                            Cancel & Unlock
                        </button>
                    )}

                    <div className="space-y-4">
                        {/* Selected Space */}
                        <div className="flex justify-between text-sm">
                            <span className="text-secondary">Selected Space</span>
                            <span className="font-semibold">
                                {selectedSpace ? selectedSpace.spaceNumber : '—'}
                            </span>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-sm text-secondary block mb-2">Duration (hours)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 6, 8].map((h) => (
                                    <button
                                        key={h}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${duration === h
                                            ? 'text-white shadow-md'
                                            : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                        style={duration === h ? { backgroundColor: '#2563eb' } : {}}
                                        onClick={() => setDuration(h)}
                                    >
                                        {h}h
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Vehicle Number */}
                        <div>
                            <label className="text-sm text-secondary block mb-2">Vehicle Number</label>
                            <input
                                type="text"
                                className="input w-full uppercase"
                                placeholder="KA-01-AB-1234"
                                value={vehicleNumber}
                                onChange={(e) => setVehicleNumber(e.target.value)}
                            />
                        </div>

                        {/* Price Breakdown */}
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-secondary">Base Rate</span>
                                <span>₹{Number(lot?.baseRate || 0).toFixed(2)}/hr</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-secondary">Duration</span>
                                <span>{duration} hour(s)</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-white/10">
                                <span>Total</span>
                                <span className="text-accent flex items-center gap-1">
                                    <IndianRupee size={18} />
                                    {calculateTotal().toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Pay Button */}
                        <button
                            className="btn btn-primary w-full py-4 text-lg"
                            onClick={handlePayment}
                            disabled={!selectedSpace || !isSpaceLocked || processing || !vehicleNumber.trim()}
                        >
                            {processing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Shield size={20} />
                                    Pay ₹{calculateTotal().toFixed(2)}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-muted">
                            🔒 Secure payment • Space reserved until payment completes
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPayment;
