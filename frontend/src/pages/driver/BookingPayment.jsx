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
                        Floor Plan
                    </h3>

                    {error && (
                        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 text-rose-400 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="mb-6" style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '0.4rem'
                    }}>
                        {spaces.length > 0 ? spaces.map((space) => {
                            const isOccupied = space.isOccupied;
                            const isLocked = lockUpdates && lockUpdates[space.id];
                            const isSelected = selectedSpace?.id === space.id;
                            
                            let bgColor = '#c8e6c9'; // Available - light green
                            let borderColor = '#a5d6a7';
                            let textColor = '#2e7d32';
                            
                            if (isOccupied || isLocked) {
                                bgColor = '#ffcdd2'; // Filled - light red/pink
                                borderColor = '#ef9a9a';
                                textColor = '#c62828';
                            } else if (isSelected) {
                                bgColor = '#bbdefb'; // Selected - light blue
                                borderColor = '#1976d2';
                                textColor = '#1565c0';
                            }
                            
                            return (
                                <button
                                    key={space.id}
                                    onClick={() => handleSelectSpace(space)}
                                    disabled={isOccupied || isSpaceLocked || isLocked}
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        backgroundColor: bgColor,
                                        border: `2px solid ${borderColor}`,
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: isOccupied || isLocked ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSelected ? '0 0 0 3px #1976d2' : 'none',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: textColor,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isOccupied && !isLocked) {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = isSelected ? '0 0 0 3px #1976d2' : 'none';
                                    }}
                                >
                                    {space.spaceNumber}
                                </button>
                            );
                        }) : (
                            // Demo spaces - floor plan style
                            Array.from({ length: 32 }, (_, i) => {
                                const isOccupied = [0, 1, 2, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 30, 31].includes(i);
                                const isSelected = selectedSpace?.id === i + 1;
                                
                                let bgColor = '#c8e6c9'; // Available
                                let borderColor = '#a5d6a7';
                                let textColor = '#2e7d32';
                                
                                if (isOccupied) {
                                    bgColor = '#ffcdd2';
                                    borderColor = '#ef9a9a';
                                    textColor = '#c62828';
                                } else if (isSelected) {
                                    bgColor = '#bbdefb';
                                    borderColor = '#1976d2';
                                    textColor = '#1565c0';
                                }
                                
                                return (
                                    <button
                                        key={i}
                                        onClick={() => !isOccupied && handleSelectSpace({ id: i + 1, spaceNumber: `S${i + 1}` })}
                                        disabled={isOccupied || isSpaceLocked}
                                        style={{
                                            width: '90px',
                                            height: '90px',
                                            backgroundColor: bgColor,
                                            border: `2px solid ${borderColor}`,
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: isOccupied ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: isSelected ? '0 0 0 3px #1976d2' : 'none',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: textColor,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isOccupied) {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = isSelected ? '0 0 0 3px #1976d2' : 'none';
                                        }}
                                    >
                                        S{i + 1}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-6 justify-center mt-6 text-sm font-medium" style={{ color: '#666' }}>
                        <div className="flex items-center gap-2">
                            <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#c8e6c9', border: '2px solid #a5d6a7' }}></div>
                            Available
                        </div>
                        <div className="flex items-center gap-2">
                            <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#ffcdd2', border: '2px solid #ef9a9a' }}></div>
                            Filled
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
