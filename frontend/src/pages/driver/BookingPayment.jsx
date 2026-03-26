import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";
import api from "../../api/axios";
import {
    MapPin, Clock, Car, IndianRupee, CreditCard, Lock, Unlock,
    AlertCircle, CheckCircle, ArrowLeft, Timer, Shield, Calendar, RefreshCw,
    Zap, CalendarClock, Info, ShieldCheck
} from "lucide-react";

// Helper functions for time management
const roundToNearest5Minutes = (date) => {
    const ms = 1000 * 60 * 5; // 5 minutes in milliseconds
    return new Date(Math.ceil(date.getTime() / ms) * ms);
};

const formatDateTimeLocal = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const parseLocalDateTime = (str) => {
    return new Date(str);
};

// Format date to ISO string without timezone (for backend LocalDateTime)
const toLocalDateTimeString = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const BookingPayment = () => {
    const { lotId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { sendMessage, isConnected, lockUpdates } = useWebSocket();

    const [lot, setLot] = useState(location.state?.lot || null);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [spaces, setSpaces] = useState([]);
    const [availableSpaceIds, setAvailableSpaceIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [lockingSpace, setLockingSpace] = useState(false);
    const [isSpaceLocked, setIsSpaceLocked] = useState(false);
    const [lockTimeout, setLockTimeout] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(60); // 1 min lock timeout
    
    // Time-based booking state
    const now = roundToNearest5Minutes(new Date());
    const [startTime, setStartTime] = useState(formatDateTimeLocal(now));
    const [endTime, setEndTime] = useState(formatDateTimeLocal(new Date(now.getTime() + 60 * 60 * 1000))); // +1 hour
    const [timeError, setTimeError] = useState("");
    
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(false);
    const [revalidating, setRevalidating] = useState(false);
    const [hasPermit, setHasPermit] = useState(false);
    const [permitExpiry, setPermitExpiry] = useState(null);

    // Debounce ref for API calls
    const debounceRef = useRef(null);
    // AbortController ref for canceling pending API calls
    const abortControllerRef = useRef(null);

    // Calculate lock duration based on start time
    const calculateLockDuration = (start) => {
        const startDate = parseLocalDateTime(start);
        const nowDate = new Date();
        const fiveMinutesFromNow = new Date(nowDate.getTime() + 5 * 60 * 1000);
        
        // Real-time booking: within 5 minutes = 60s lock
        // Advance booking: more than 5 minutes = 180s lock
        if (startDate <= fiveMinutesFromNow) {
            return 60;
        }
        return 180;
    };

    // Check if this is a real-time booking (starts within 5 minutes)
    const isRealTimeBooking = () => {
        const startDate = parseLocalDateTime(startTime);
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
        return startDate <= fiveMinutesFromNow;
    };

    const LOCK_DURATION = calculateLockDuration(startTime);

    // Redirect if not logged in
    useEffect(() => {
        if (!user) {
            navigate("/login", { state: { from: `/booking/${lotId}` } });
        }
    }, [user, navigate, lotId]);

    // Fetch user permits to check if this lot is covered
    useEffect(() => {
        const fetchPermits = async () => {
            try {
                const res = await api.get("/permits/my-permits");
                const permits = res.data || [];
                const activePermit = permits.find(
                    p => p.parkingLot && String(p.parkingLot.id) === String(lotId) && p.active && new Date(p.endDate) > new Date()
                );
                if (activePermit) {
                    setHasPermit(true);
                    setPermitExpiry(new Date(activePermit.endDate).toLocaleDateString());
                }
            } catch (err) {
                console.error("Failed to fetch permits", err);
            }
        };
        if (user && lotId) {
            fetchPermits();
        }
    }, [user, lotId]);

    // Time validation
    const validateTimeRange = useCallback(() => {
        const start = parseLocalDateTime(startTime);
        const end = parseLocalDateTime(endTime);
        const nowDate = new Date();
        const maxAdvance = new Date(nowDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        // Start time cannot be before now (allow 5 min buffer)
        if (start < new Date(nowDate.getTime() - 5 * 60 * 1000)) {
            return "Start time cannot be in the past";
        }
        
        // Start time cannot be more than 7 days in future
        if (start > maxAdvance) {
            return "Cannot book more than 7 days in advance";
        }
        
        // End time must be after start time
        if (end <= start) {
            return "End time must be after start time";
        }
        
        // Minimum duration: 1 hour
        const durationHours = (end - start) / (1000 * 60 * 60);
        if (durationHours < 1) {
            return "Minimum booking duration is 1 hour";
        }
        
        // Maximum duration: 8 hours
        if (durationHours > 8) {
            return "Maximum booking duration is 8 hours";
        }
        
        return "";
    }, [startTime, endTime]);

    useEffect(() => {
        setTimeError(validateTimeRange());
    }, [validateTimeRange]);

    // Fetch lot details (initial)
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

    // Fetch available slots for time range
    const fetchAvailableSlots = useCallback(async () => {
        if (!lotId || timeError) return;
        
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        const start = parseLocalDateTime(startTime);
        const end = parseLocalDateTime(endTime);
        
        try {
            setSlotsLoading(true);
            setAvailabilityError(false);
            const res = await api.get(`/parking/${lotId}/available`, {
                params: {
                    startTime: toLocalDateTimeString(start),
                    endTime: toLocalDateTimeString(end)
                },
                signal: abortControllerRef.current.signal
            });
            
            // Update available space IDs - ensure numbers for consistent lookup
            const availableIds = new Set((res.data.spaceIds || []).map(id => Number(id)));
            setAvailableSpaceIds(availableIds);
            
            // If selected space is no longer available, deselect it
            if (selectedSpace && !availableIds.has(Number(selectedSpace.id))) {
                setSelectedSpace(null);
                setIsSpaceLocked(false);
            }
        } catch (err) {
            // Ignore aborted requests
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                return;
            }
            console.error("Failed to fetch available slots", err);
            setAvailabilityError(true);
            // Clear available slots on error to prevent stale data
            setAvailableSpaceIds(new Set());
        } finally {
            setSlotsLoading(false);
        }
    }, [lotId, startTime, endTime, timeError, spaces, selectedSpace]);

    // Initial fetch
    useEffect(() => {
        if (lotId) {
            fetchLotDetails();
        }
    }, [lotId]);

    // Debounced fetch when time changes
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        if (startTime && endTime && !timeError) {
            debounceRef.current = setTimeout(() => {
                fetchAvailableSlots();
            }, 300);
        }
        
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [startTime, endTime, timeError]);

    // Initial slot fetch after lot loads
    useEffect(() => {
        if (lot && spaces.length > 0 && !timeError) {
            fetchAvailableSlots();
        }
    }, [lot, spaces.length]);

    // Countdown timer for lock
    useEffect(() => {
        let interval;
        if (isSpaceLocked && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        // Lock expired - notify user, unlock, and refresh
                        setError("Lock expired! Please lock the space again.");
                        handleUnlockSpace();
                        fetchAvailableSlots();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSpaceLocked, timeRemaining]);

    // Quick duration buttons
    const handleQuickDuration = (hours) => {
        const start = parseLocalDateTime(startTime);
        const newEnd = new Date(start.getTime() + hours * 60 * 60 * 1000);
        setEndTime(formatDateTimeLocal(newEnd));
    };

    const handleSelectSpace = (space) => {
        const spaceId = Number(space.id);
        const isLockedByOther = lockUpdates && lockUpdates[spaceId];
        console.log('[Debug] handleSelectSpace:', { spaceId, isLockedByOther, isSpaceLocked, lockUpdates });
        if (!availableSpaceIds.has(spaceId) || isSpaceLocked || isLockedByOther) return;
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

        const lockDuration = calculateLockDuration(startTime);
        const lockPayload = {
            spaceId: selectedSpace.id,
            userId: user.id,
            duration: lockDuration
        };
        console.log("Lock Payload:", lockPayload);

        try {
            // Call API to lock the space
            const res = await api.post("/bookings/lock", lockPayload);

            if (res.data.success) {
                setIsSpaceLocked(true);
                setTimeRemaining(lockDuration);

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
                setTimeRemaining(lockDuration);
            } else {
                // For real data, show the actual error
                const isOccupiedError = errorMessage.toLowerCase().includes("occupied") || errorMessage.toLowerCase().includes("locked");

                if (isOccupiedError) {
                    setError(`This space was just taken. Refreshing map...`);
                    // Auto-refresh the map to show true status
                    setTimeout(() => {
                        fetchAvailableSlots();
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
        setTimeRemaining(calculateLockDuration(startTime));
        setSelectedSpace(null);
    };

    // Revalidate slot availability before proceeding to payment
    const revalidateSlot = async () => {
        if (!selectedSpace || !lotId) return false;
        
        const start = parseLocalDateTime(startTime);
        const end = parseLocalDateTime(endTime);
        
        try {
            const res = await api.get(`/parking/${lotId}/spaces/${selectedSpace.id}/available`, {
                params: {
                    startTime: toLocalDateTimeString(start),
                    endTime: toLocalDateTimeString(end)
                }
            });
            return res.data === true || res.data?.available === true;
        } catch (err) {
            console.error("Slot revalidation failed", err);
            return false;
        }
    };

    const handlePayment = async () => {
        // Step 8: Payment Payload Validation
        if (!selectedSpace) {
            setError("Please select a parking space");
            return;
        }
        
        if (!isSpaceLocked) {
            setError("Please lock the space before proceeding");
            return;
        }
        
        if (!vehicleNumber.trim()) {
            setError("Please enter your vehicle number");
            return;
        }
        
        if (timeError) {
            setError(timeError);
            return;
        }

        const start = parseLocalDateTime(startTime);
        const end = parseLocalDateTime(endTime);
        const nowDate = new Date();
        
        // Validate start time not in past (5 min buffer)
        if (start < new Date(nowDate.getTime() - 5 * 60 * 1000)) {
            setError("Start time cannot be in the past");
            return;
        }
        
        // Validate end > start
        if (end <= start) {
            setError("End time must be after start time");
            return;
        }
        
        const durationHours = (end - start) / (1000 * 60 * 60);
        
        // Validate duration 1-8 hours
        if (durationHours < 1 || durationHours > 8) {
            setError("Duration must be between 1 and 8 hours");
            return;
        }
        
        // Step 5: Revalidate slot before payment
        setRevalidating(true);
        setError("");
        
        const isStillAvailable = await revalidateSlot();
        
        if (!isStillAvailable) {
            setError("Slot no longer available. Please select another.");
            setRevalidating(false);
            setIsSpaceLocked(false);
            setSelectedSpace(null);
            fetchAvailableSlots();
            return;
        }
        
        setRevalidating(false);
        
        const totalAmount = hasPermit ? 0 : calculateTotal();
        
        const bookingMetadata = {
            userId: user.id,
            spaceId: selectedSpace.id,
            lotId: lot.id,
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
            startTime: toLocalDateTimeString(start),
            endTime: toLocalDateTimeString(end),
            durationHours: durationHours,
            totalAmount: totalAmount,
            paymentMethod: hasPermit ? "PERMIT" : undefined
        };

        // PERMIT FLOW: Skip payment, directly create booking
        if (hasPermit) {
            setProcessing(true);
            try {
                await api.post("/bookings/create", bookingMetadata);
                setSuccess(true);
                setTimeout(() => navigate("/bookings"), 2500);
            } catch (err) {
                console.error("Permit booking failed", err);
                setError(err.response?.data?.message || "Booking failed. Please try again.");
            } finally {
                setProcessing(false);
            }
            return;
        }

        // NORMAL FLOW: Navigate to payment page
        navigate("/payment", {
            state: {
                amount: totalAmount,
                type: "BOOKING",
                description: `Parking at ${lot.name} for ${durationHours.toFixed(1)} hr(s)`,
                metadata: bookingMetadata
            }
        });
    };

    const calculateTotal = () => {
        if (!lot) return 0;
        const start = parseLocalDateTime(startTime);
        const end = parseLocalDateTime(endTime);
        const durationHours = Math.max(0, (end - start) / (1000 * 60 * 60));
        const basePrice = lot.baseRate * durationHours;
        return Number(basePrice.toFixed(2));
    };

    // Get current duration in hours for display
    const getCurrentDuration = () => {
        const start = parseLocalDateTime(startTime);
        const end = parseLocalDateTime(endTime);
        return Math.max(0, (end - start) / (1000 * 60 * 60));
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
                        {hasPermit
                            ? '🎉 Booked using Monthly Permit — No payment required!'
                            : 'Your parking spot has been reserved. Redirecting to your bookings...'}
                    </p>
                    <div className="text-sm text-muted">
                        Space: {selectedSpace?.spaceNumber} | Duration: {getCurrentDuration()}hr
                        {hasPermit && ' | Payment: FREE (Permit)'}
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

                    {/* Step 3: API Failure Banner */}
                    {availabilityError && (
                        <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={16} />
                                Unable to check availability. Please retry.
                            </div>
                            <button 
                                onClick={fetchAvailableSlots}
                                className="flex items-center gap-1 px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 transition-colors"
                            >
                                <RefreshCw size={14} />
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Slots Loading Indicator */}
                    {slotsLoading && (
                        <div className="flex items-center justify-center gap-2 p-3 mb-4 rounded-lg bg-blue-500/10 text-blue-400 text-sm">
                            <RefreshCw size={16} className="animate-spin" />
                            Checking availability for selected time...
                        </div>
                    )}

                    {/* Step 2: Availability Summary */}
                    {!slotsLoading && !timeError && !availabilityError && availableSpaceIds.size > 0 && (
                        <div className="flex items-center justify-center gap-2 p-3 mb-4 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm">
                            <CheckCircle size={16} />
                            {availableSpaceIds.size} slot(s) available for selected time range
                        </div>
                    )}

                    {/* Step 2: No Slots Available Message */}
                    {!slotsLoading && !timeError && !availabilityError && spaces.length > 0 && availableSpaceIds.size === 0 && (
                        <div className="flex items-center justify-center gap-2 p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
                            <AlertCircle size={16} />
                            No slots available for this time range. Try adjusting your time.
                        </div>
                    )}

                    {/* Step 4: Slot Grid with Enhanced States */}
                    <div className="mb-6" style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        opacity: (slotsLoading || availabilityError) ? 0.5 : 1,
                        pointerEvents: (slotsLoading || availabilityError) ? 'none' : 'auto'
                    }}>
                        {/* Step 4: Shimmer/skeleton when loading */}
                        {slotsLoading && spaces.length === 0 && (
                            Array.from({ length: 12 }, (_, i) => (
                                <div
                                    key={`skeleton-${i}`}
                                    className="animate-pulse"
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        backgroundColor: '#e0e0e0',
                                        borderRadius: '6px',
                                    }}
                                />
                            ))
                        )}
                        {spaces.length > 0 ? spaces.map((space) => {
                            // Use availableSpaceIds from backend instead of isOccupied flag
                            const spaceId = Number(space.id);
                            const isAvailable = availableSpaceIds.has(spaceId);
                            const isLockedByOther = lockUpdates && lockUpdates[spaceId] && (!isSpaceLocked || selectedSpace?.id !== space.id);
                            const isLockedByYou = isSpaceLocked && selectedSpace?.id === space.id;
                            const isSelected = selectedSpace?.id === space.id;
                            const isUnavailable = !isAvailable || isLockedByOther;
                            
                            let bgColor = '#c8e6c9'; // Available - light green
                            let borderColor = '#a5d6a7';
                            let textColor = '#2e7d32';
                            
                            if (isUnavailable) {
                                bgColor = '#e0e0e0'; // Unavailable - gray
                                borderColor = '#bdbdbd';
                                textColor = '#757575';
                            } else if (isLockedByYou) {
                                bgColor = '#fff3e0'; // Locked by you - orange highlight
                                borderColor = '#ff9800';
                                textColor = '#e65100';
                            } else if (isSelected) {
                                bgColor = '#bbdefb'; // Selected - light blue
                                borderColor = '#1976d2';
                                textColor = '#1565c0';
                            }
                            
                            return (
                                <button
                                    key={space.id}
                                    onClick={() => handleSelectSpace(space)}
                                    disabled={isUnavailable || isSpaceLocked}
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        backgroundColor: bgColor,
                                        border: `2px solid ${borderColor}`,
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSelected ? '0 0 0 3px #1976d2' : 'none',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: textColor,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isUnavailable) {
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

                    {/* Step 4: Enhanced Legend */}
                    <div className="flex flex-wrap gap-4 justify-center mt-6 text-sm font-medium" style={{ color: '#666' }}>
                        <div className="flex items-center gap-2">
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#c8e6c9', border: '2px solid #a5d6a7' }}></div>
                            Available
                        </div>
                        <div className="flex items-center gap-2">
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#e0e0e0', border: '2px solid #bdbdbd' }}></div>
                            Unavailable
                        </div>
                        <div className="flex items-center gap-2">
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#bbdefb', border: '2px solid #1976d2' }}></div>
                            Selected
                        </div>
                        <div className="flex items-center gap-2">
                            <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#fff3e0', border: '2px solid #ff9800' }}></div>
                            Locked by You
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
                        (lockUpdates && lockUpdates[Number(selectedSpace.id)]) ? (
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
                                        Lock Space ({calculateLockDuration() === 60 ? '1 min' : '3 min'})
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

                        {/* Step 9: Booking Type Badge */}
                        {selectedSpace && (
                            <div className={`flex items-center gap-2 p-3 mb-2 rounded-lg text-sm ${
                                isRealTimeBooking() 
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                    : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                            }`}>
                                {isRealTimeBooking() ? (
                                    <><Zap size={16} /> Real-time Booking — Lock: 1 min</>
                                ) : (
                                    <><CalendarClock size={16} /> Advance Booking — Lock: 3 min</>
                                )}
                                <div className="ml-auto group relative">
                                    <Info size={14} className="cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {isRealTimeBooking() 
                                            ? 'Starting within 5 minutes. Quick lock timer.' 
                                            : 'Starting later. Extended lock timer for payment.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Start Time */}
                        <div>
                            <label className="text-sm text-secondary block mb-2">Start Time</label>
                            <input
                                type="datetime-local"
                                className="input w-full"
                                value={startTime}
                                onChange={(e) => {
                                    // Step 1: Round to nearest 5 minutes and auto-adjust end time
                                    const rawStart = parseLocalDateTime(e.target.value);
                                    const roundedStart = roundToNearest5Minutes(rawStart);
                                    const newStartStr = formatDateTimeLocal(roundedStart);
                                    setStartTime(newStartStr);
                                    
                                    // Auto-adjust end time to maintain minimum 1 hour
                                    const currentEnd = parseLocalDateTime(endTime);
                                    const minEnd = new Date(roundedStart.getTime() + 60 * 60 * 1000);
                                    
                                    if (currentEnd <= roundedStart || currentEnd < minEnd) {
                                        setEndTime(formatDateTimeLocal(minEnd));
                                    }
                                }}
                                min={formatDateTimeLocal(new Date())}
                                max={formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                                step={300}
                            />
                            <p className="text-xs text-secondary mt-1">
                                {isRealTimeBooking() ? 
                                    '⚡ Real-time booking (starts now)' : 
                                    '📅 Advance booking'}
                            </p>
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="text-sm text-secondary block mb-2">End Time</label>
                            <input
                                type="datetime-local"
                                className="input w-full"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                min={startTime}
                            />
                        </div>

                        {/* Quick Duration Buttons */}
                        <div>
                            <label className="text-sm text-secondary block mb-2">Quick Duration</label>
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 4, 6, 8].map((h) => (
                                    <button
                                        key={h}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${getCurrentDuration() === h
                                            ? 'text-white shadow-md'
                                            : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                        style={getCurrentDuration() === h ? { backgroundColor: '#2563eb' } : {}}
                                        onClick={() => handleQuickDuration(h)}
                                    >
                                        {h}h
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Validation Error */}
                        {timeError && (
                            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                {timeError}
                            </div>
                        )}

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

                        {/* Permit Banner */}
                        {hasPermit && (
                            <div className="flex items-center gap-3 p-4 rounded-xl mb-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                <ShieldCheck size={22} style={{ color: '#10b981', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6ee7b7', marginBottom: '0.15rem' }}>
                                        Monthly Permit Active
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#86efac', margin: 0 }}>
                                        FREE parking — no payment required
                                        {permitExpiry && <span> • Valid until {permitExpiry}</span>}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Price Breakdown */}
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-secondary">Base Rate</span>
                                {hasPermit ? (
                                    <span>
                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                                            ₹{Number(lot?.baseRate || 0).toFixed(2)}/hr
                                        </span>
                                        <span style={{ color: '#10b981', fontWeight: 600 }}>FREE</span>
                                    </span>
                                ) : (
                                    <span>₹{Number(lot?.baseRate || 0).toFixed(2)}/hr</span>
                                )}
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-secondary">Duration</span>
                                <span>{getCurrentDuration()} hour(s)</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-white/10">
                                <span>Total</span>
                                {hasPermit ? (
                                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <ShieldCheck size={18} />
                                        FREE
                                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#86efac' }}>(Covered by Permit)</span>
                                    </span>
                                ) : (
                                    <span className="text-accent flex items-center gap-1">
                                        <IndianRupee size={18} />
                                        {calculateTotal().toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Pay / Confirm Button */}
                        <button
                            className="btn btn-primary w-full py-4 text-lg"
                            onClick={handlePayment}
                            disabled={!selectedSpace || !isSpaceLocked || processing || revalidating || !vehicleNumber.trim() || timeError}
                            style={hasPermit ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}
                        >
                            {processing || revalidating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {revalidating ? 'Verifying slot...' : 'Processing...'}
                                </>
                            ) : hasPermit ? (
                                <>
                                    <ShieldCheck size={20} />
                                    Confirm Booking (Free)
                                </>
                            ) : (
                                <>
                                    <Shield size={20} />
                                    Pay ₹{calculateTotal().toFixed(2)}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-muted">
                            {hasPermit
                                ? '🎫 Covered by Monthly Permit • No payment needed'
                                : '🔒 Secure payment • Space reserved until payment completes'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingPayment;
