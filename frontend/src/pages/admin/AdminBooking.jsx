import { useState, useEffect } from "react";
import {
    Building2, Car, Clock, Ticket, X, AlertTriangle,
    CheckCircle, RefreshCw, IndianRupee, MapPin
} from "lucide-react";
import { toast } from "react-toastify";

const AdminBooking = () => {
    const [lots, setLots] = useState([]);
    const [selectedLot, setSelectedLot] = useState(null);
    const [spaces, setSpaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [spacesLoading, setSpacesLoading] = useState(false);

    // Booking form
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [durationHours, setDurationHours] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Fetch admin's own lots
    useEffect(() => {
        const fetchLots = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/admin/my-lots', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLots(data);
                    if (data.length > 0) {
                        setSelectedLot(data[0]);
                    }
                } else {
                    toast.error("Failed to fetch your parking lots");
                }
            } catch (err) {
                toast.error("Error connecting to server");
            } finally {
                setLoading(false);
            }
        };
        fetchLots();
    }, []);

    // Fetch spaces when lot changes
    useEffect(() => {
        if (!selectedLot) return;
        const fetchSpaces = async () => {
            setSpacesLoading(true);
            setSelectedSpace(null);
            try {
                const res = await fetch(`http://localhost:8080/api/parking/${selectedLot.id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSpaces(data.spaces || []);
                }
            } catch (err) {
                toast.error("Error fetching spaces");
            } finally {
                setSpacesLoading(false);
            }
        };
        fetchSpaces();
    }, [selectedLot]);

    const availableSpaces = spaces.filter(s => !s.isOccupied);
    const occupiedSpaces = spaces.filter(s => s.isOccupied);

    const handleSelectSpace = (space) => {
        if (space.isOccupied) return;
        setSelectedSpace(space);
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!selectedSpace || !vehicleNumber.trim()) {
            toast.error("Please select a space and enter vehicle number");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:8080/api/admin/offline-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    lotId: selectedLot.id,
                    spaceId: selectedSpace.id,
                    vehicleNumber: vehicleNumber.trim().toUpperCase(),
                    durationHours
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success(`Booking confirmed! Amount: ₹${data.totalAmount?.toFixed(0)}`);
                setSelectedSpace(null);
                setVehicleNumber("");
                setDurationHours(1);

                // Refresh spaces to show updated occupancy
                const spacesRes = await fetch(`http://localhost:8080/api/parking/${selectedLot.id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (spacesRes.ok) {
                    const spacesData = await spacesRes.json();
                    setSpaces(spacesData.spaces || []);
                }

                // Refresh lot stats
                const lotsRes = await fetch('http://localhost:8080/api/admin/my-lots', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (lotsRes.ok) {
                    const lotsData = await lotsRes.json();
                    setLots(lotsData);
                    const updated = lotsData.find(l => l.id === selectedLot.id);
                    if (updated) setSelectedLot(updated);
                }
            } else {
                toast.error(data.message || "Booking failed");
            }
        } catch (err) {
            toast.error("Error creating booking");
        } finally {
            setSubmitting(false);
        }
    };

    const estimatedCost = ((selectedLot?.baseRate || 30) * durationHours).toFixed(0);

    if (loading) {
        return (
            <div className="flex-center min-h-[400px]">
                <div className="animate-spin w-10 h-10 rounded-full border-3 border-accent-primary border-t-transparent"></div>
            </div>
        );
    }

    if (lots.length === 0) {
        return (
            <div className="page-container">
                <div className="flex-center min-h-[400px]">
                    <div className="text-center">
                        <Building2 size={48} className="mx-auto mb-4 text-muted" />
                        <h2 className="text-xl font-bold mb-2">No Parking Lots Assigned</h2>
                        <p className="text-secondary">You don't have any parking lots under your management.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">
                        <span className="gradient-text">Spot Booking</span>
                    </h1>
                    <p className="page-subtitle">Book parking slots for walk-in customers</p>
                </div>
            </div>

            {/* Lot Selector */}
            <div className="glass-panel p-4 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <Building2 size={20} className="text-indigo-400 shrink-0" />
                    <span className="text-sm font-medium text-secondary shrink-0">Select Lot:</span>
                    <div className="flex gap-2 flex-wrap">
                        {lots.map(lot => (
                            <button
                                key={lot.id}
                                onClick={() => setSelectedLot(lot)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedLot?.id === lot.id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'glass-card-static hover:bg-white/10 text-secondary'
                                }`}
                            >
                                {lot.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lot Stats Bar */}
            {selectedLot && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="glass-card-static p-3 text-center">
                        <p className="text-xs text-secondary mb-1">Total Spaces</p>
                        <p className="text-lg font-bold">{selectedLot.totalSpaces}</p>
                    </div>
                    <div className="glass-card-static p-3 text-center">
                        <p className="text-xs text-secondary mb-1">Available</p>
                        <p className="text-lg font-bold text-emerald-400">{selectedLot.availableSpaces}</p>
                    </div>
                    <div className="glass-card-static p-3 text-center">
                        <p className="text-xs text-secondary mb-1">Occupied</p>
                        <p className="text-lg font-bold text-rose-400">{selectedLot.totalSpaces - selectedLot.availableSpaces}</p>
                    </div>
                    <div className="glass-card-static p-3 text-center">
                        <p className="text-xs text-secondary mb-1">Rate</p>
                        <p className="text-lg font-bold text-cyan-400">₹{selectedLot.baseRate}/hr</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Floor Plan */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <div className="flex-between mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Car size={20} />
                            Floor Plan
                        </h3>
                        <button
                            onClick={() => {
                                setSpacesLoading(true);
                                fetch(`http://localhost:8080/api/parking/${selectedLot.id}`, {
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                }).then(r => r.json()).then(d => {
                                    setSpaces(d.spaces || []);
                                    setSpacesLoading(false);
                                }).catch(() => setSpacesLoading(false));
                            }}
                            className="btn btn-ghost btn-sm"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={spacesLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {spacesLoading ? (
                        <div className="flex-center py-12">
                            <div className="animate-spin w-8 h-8 rounded-full border-3 border-accent-primary border-t-transparent"></div>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '0.4rem',
                            }}>
                                {spaces.map(space => {
                                    const isOccupied = space.isOccupied;
                                    const isSelected = selectedSpace?.id === space.id;

                                    let bgColor = '#c8e6c9';
                                    let borderColor = '#a5d6a7';
                                    let textColor = '#2e7d32';

                                    if (isOccupied) {
                                        bgColor = '#e0e0e0';
                                        borderColor = '#bdbdbd';
                                        textColor = '#757575';
                                    } else if (isSelected) {
                                        bgColor = '#bbdefb';
                                        borderColor = '#1976d2';
                                        textColor = '#1565c0';
                                    }

                                    return (
                                        <button
                                            key={space.id}
                                            onClick={() => handleSelectSpace(space)}
                                            disabled={isOccupied}
                                            style={{
                                                width: '80px',
                                                height: '80px',
                                                backgroundColor: bgColor,
                                                border: `2px solid ${borderColor}`,
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: isOccupied ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isSelected ? '0 0 0 3px #1976d2' : 'none',
                                                fontSize: '13px',
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
                                            {space.spaceNumber}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 justify-center mt-6 text-sm font-medium" style={{ color: '#888' }}>
                                <div className="flex items-center gap-2">
                                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#c8e6c9', border: '2px solid #a5d6a7' }}></div>
                                    Available
                                </div>
                                <div className="flex items-center gap-2">
                                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#e0e0e0', border: '2px solid #bdbdbd' }}></div>
                                    Occupied
                                </div>
                                <div className="flex items-center gap-2">
                                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#bbdefb', border: '2px solid #1976d2' }}></div>
                                    Selected
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Booking Form */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Ticket size={20} className="text-indigo-400" />
                        Book Slot
                    </h3>

                    {selectedSpace ? (
                        <form onSubmit={handleBooking} className="space-y-4">
                            {/* Selected Space Info */}
                            <div className="glass-card-static p-3">
                                <p className="text-xs text-secondary mb-1">Selected Space</p>
                                <p className="text-lg font-bold text-indigo-400">{selectedSpace.spaceNumber}</p>
                                <p className="text-xs text-muted">{selectedSpace.vehicleType}</p>
                            </div>

                            {/* Vehicle Number */}
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                    <Car size={14} /> Vehicle Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={vehicleNumber}
                                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                    className="input-field"
                                    placeholder="e.g. KA 01 AB 1234"
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                    <Clock size={14} /> Duration (hours)
                                </label>
                                <div className="flex gap-2 mb-2">
                                    {[1, 2, 3, 4].map(h => (
                                        <button
                                            key={h}
                                            type="button"
                                            onClick={() => setDurationHours(h)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                durationHours === h
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'glass-card-static text-secondary hover:text-white'
                                            }`}
                                        >
                                            {h}hr
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="24"
                                    value={durationHours}
                                    onChange={(e) => setDurationHours(parseInt(e.target.value) || 1)}
                                    className="input-field"
                                />
                            </div>

                            {/* Cost Estimate */}
                            <div className="glass-card-static p-4">
                                <div className="flex-between mb-1">
                                    <span className="text-sm text-secondary">Rate</span>
                                    <span className="text-sm">₹{selectedLot?.baseRate}/hr</span>
                                </div>
                                <div className="flex-between mb-1">
                                    <span className="text-sm text-secondary">Duration</span>
                                    <span className="text-sm">{durationHours} hr(s)</span>
                                </div>
                                <div className="border-t border-glass-border my-2"></div>
                                <div className="flex-between">
                                    <span className="font-semibold">Total</span>
                                    <span className="text-xl font-bold text-emerald-400">₹{estimatedCost}</span>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Ticket size={18} />
                                        Confirm Booking
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedSpace(null)}
                                className="btn btn-ghost w-full"
                            >
                                Cancel Selection
                            </button>
                        </form>
                    ) : (
                        <div className="flex-center flex-col py-8 text-center">
                            <MapPin size={40} className="text-muted mb-3" />
                            <p className="text-secondary text-sm">Select a space from the floor plan to begin booking</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBooking;
