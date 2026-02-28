import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ParkingMap from "../../components/ParkingMap";
import { Search, Navigation, Loader2, MapPin, Car, IndianRupee, Clock, RefreshCw, Star, ChevronUp, ChevronDown, X } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useWebSocket } from "../../context/WebSocketContext";

const FindParking = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [parkingLots, setParkingLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [selectedLot, setSelectedLot] = useState(null);
    const [isLocating, setIsLocating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [panelExpanded, setPanelExpanded] = useState(true);

    // WebSocket context for real-time updates
    const { occupancyUpdates } = useWebSocket();

    // Fetch parking lots from API
    const fetchParkingLots = useCallback(async (lat = 12.9716, lon = 77.5946) => {
        try {
            setLoading(true);
            const res = await api.get(`/parking/all?lat=${lat}&lon=${lon}`);
            if (res.data && res.data.length > 0) {
                setParkingLots(res.data);
            } else {
                loadDemoData();
            }
        } catch (err) {
            console.error("Failed to fetch parking lots", err);
            loadDemoData();
        } finally {
            setLoading(false);
            setLastUpdated(new Date());
        }
    }, []);

    const loadDemoData = () => {
        const demoLots = [
            { id: 1, name: "M.G. Road Parking Complex", latitude: 12.9716, longitude: 77.5946, availableSlots: 15, totalCapacity: 50, baseRate: 40, distance: 0.5, eta: 3 },
            { id: 2, name: "Indiranagar Metro Parking", latitude: 12.9784, longitude: 77.6408, availableSlots: 5, totalCapacity: 30, baseRate: 35, distance: 2.1, eta: 8 },
            { id: 3, name: "Koramangala Forum Mall", latitude: 12.9352, longitude: 77.6135, availableSlots: 42, totalCapacity: 100, baseRate: 50, distance: 3.5, eta: 12 },
            { id: 4, name: "UB City Premium Parking", latitude: 12.9719, longitude: 77.5956, availableSlots: 8, totalCapacity: 80, baseRate: 60, distance: 0.8, eta: 4 },
            { id: 5, name: "Brigade Road Multi-Level", latitude: 12.9726, longitude: 77.6077, availableSlots: 25, totalCapacity: 60, baseRate: 45, distance: 1.2, eta: 5 },
            { id: 6, name: "Jayanagar 4th Block", latitude: 12.9308, longitude: 77.5838, availableSlots: 3, totalCapacity: 40, baseRate: 30, distance: 4.2, eta: 15 },
            { id: 7, name: "HSR Layout Hub", latitude: 12.9116, longitude: 77.6389, availableSlots: 18, totalCapacity: 45, baseRate: 25, distance: 5.0, eta: 18 },
            { id: 8, name: "Whitefield IT Park", latitude: 12.9698, longitude: 77.7500, availableSlots: 55, totalCapacity: 150, baseRate: 20, distance: 12.0, eta: 35 },
        ];
        setParkingLots(demoLots);
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = [position.coords.latitude, position.coords.longitude];
                    setUserLocation(loc);
                    fetchParkingLots(loc[0], loc[1]);
                },
                () => {
                    console.log("Location access denied, defaulting to Bangalore");
                    fetchParkingLots();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            fetchParkingLots();
        }
    }, [fetchParkingLots]);

    // Handle real-time occupancy updates from WebSocket
    useEffect(() => {
        if (occupancyUpdates && Object.keys(occupancyUpdates).length > 0) {
            setParkingLots(prevLots =>
                prevLots.map(lot => {
                    if (occupancyUpdates[lot.id]) {
                        return {
                            ...lot,
                            availableSlots: occupancyUpdates[lot.id].availableSlots,
                            totalCapacity: occupancyUpdates[lot.id].totalCapacity || lot.totalCapacity
                        };
                    }
                    return lot;
                })
            );
            setLastUpdated(new Date());
        }
    }, [occupancyUpdates]);

    const handleFindNearest = () => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = [position.coords.latitude, position.coords.longitude];
                    setUserLocation(loc);
                    fetchParkingLots(loc[0], loc[1]).finally(() => setIsLocating(false));
                },
                (error) => {
                    console.error("Location error:", error);
                    setIsLocating(false);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setIsLocating(false);
        }
    };

    const handleRefresh = () => {
        if (userLocation) {
            fetchParkingLots(userLocation[0], userLocation[1]);
        } else {
            fetchParkingLots();
        }
    };

    const [routeCoordinates, setRouteCoordinates] = useState(null);

    // Fetch Route when selectedLot changes
    useEffect(() => {
        if (selectedLot && userLocation) {
            const fetchRoute = async () => {
                try {
                    const url = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${selectedLot.longitude},${selectedLot.latitude}?overview=full&geometries=geojson`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.routes && data.routes.length > 0) {
                        const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        setRouteCoordinates(coords);
                    }
                } catch (err) {
                    console.error("Failed to fetch route preview", err);
                }
            };
            fetchRoute();
        } else {
            setRouteCoordinates(null);
        }
    }, [selectedLot, userLocation]);

    const handleBookNow = (e, lot) => {
        e.stopPropagation();
        if (!user) {
            navigate("/login", { state: { from: "/find-parking" } });
            return;
        }
        navigate(`/booking/${lot.id}`, { state: { lot } });
    };

    const getOccupancyPercent = (lot) => {
        if (!lot.totalCapacity) return 0;
        const available = lot.availableSlots ?? 0;
        return ((lot.totalCapacity - available) / lot.totalCapacity) * 100;
    };

    const getStatusBadge = (percent) => {
        if (percent < 50) return { class: 'badge-available', text: 'Available' };
        if (percent < 80) return { class: 'badge-moderate', text: 'Filling Up' };
        if (percent < 95) return { class: 'badge-busy', text: 'Almost Full' };
        return { class: 'badge-full', text: 'Full' };
    };

    // Filter and sort lots
    const filteredLots = parkingLots.filter(lot =>
        lot.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const sortedLots = [...filteredLots].sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedLots.length / itemsPerPage);
    useEffect(() => { setCurrentPage(1); }, [searchQuery]);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentLots = sortedLots.slice(startIndex, startIndex + itemsPerPage);

    const listRef = useRef(null);
    useEffect(() => {
        if (listRef.current) listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);

    useEffect(() => {
        if (selectedLot) {
            const el = document.getElementById(`lot-${selectedLot.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedLot]);

    // --- Parking Card Component ---
    const ParkingCard = ({ lot, index }) => {
        const occupancyPercent = getOccupancyPercent(lot);
        const status = getStatusBadge(occupancyPercent);
        const available = lot.availableSlots ?? 0;

        return (
            <div
                id={`lot-${lot.id}`}
                className={`transition-all duration-200 cursor-pointer`}
                onClick={() => setSelectedLot(lot)}
                style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    background: selectedLot?.id === lot.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                    borderLeft: selectedLot?.id === lot.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                            {lot.distance && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Navigation size={11} /> {lot.distance.toFixed(1)} km
                                </span>
                            )}
                            {lot.eta && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Clock size={11} /> {lot.eta} min
                                </span>
                            )}
                        </p>
                    </div>
                    <span className={`badge ${status.class}`} style={{ fontSize: '0.7rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {status.text}
                    </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                        <Car size={13} /> {available}/{lot.totalCapacity}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#facc15', fontSize: '0.8rem' }}>
                        <Star size={12} style={{ fill: 'currentColor' }} />
                        {lot.rating > 0 ? lot.rating.toFixed(1) : 'New'}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--accent-secondary)', fontSize: '0.9rem' }}>
                        ₹{Number(lot.baseRate).toFixed(0)}/hr
                    </span>
                </div>

                {/* Occupancy bar */}
                <div className="progress-bar" style={{ height: '4px', marginBottom: '0.75rem' }}>
                    <div
                        className={`progress-fill ${occupancyPercent < 50 ? 'success' : occupancyPercent < 80 ? 'warning' : 'danger'}`}
                        style={{ width: `${occupancyPercent}%` }}
                    ></div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                        onClick={(e) => handleBookNow(e, lot)}
                        disabled={available === 0}
                    >
                        {available > 0 ? (user ? 'Book Now' : 'Login to Book') : 'Full'}
                    </button>
                    <button
                        className="btn btn-secondary btn-sm btn-icon"
                        style={{ padding: '0.5rem' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/navigation?lat=${lot.latitude}&lon=${lot.longitude}&name=${encodeURIComponent(lot.name)}`);
                        }}
                        title="Navigate"
                    >
                        <Navigation size={14} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{
            position: 'relative',
            width: 'calc(100% + 3rem)',
            height: 'calc(100vh - 64px)',
            overflow: 'hidden',
            margin: '-1.5rem',
        }}>
            {/* Full-screen Map Background */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <ParkingMap
                    parkingLots={sortedLots}
                    userLocation={userLocation}
                    selectedLot={selectedLot}
                    onSelectLot={setSelectedLot}
                    onBookLot={(lot) => handleBookNow({ stopPropagation: () => { } }, lot)}
                    routeCoordinates={routeCoordinates}
                />
            </div>

            {/* Search Bar - overlayed on top of map */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                width: '90%',
                maxWidth: '600px',
            }}>
                <div className="glass-panel" style={{
                    padding: '0.75rem',
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'center',
                    background: 'rgba(17, 24, 39, 0.92)',
                    backdropFilter: 'blur(20px)',
                }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search parking..."
                            className="input-field"
                            style={{ paddingLeft: '2.25rem', fontSize: '0.9rem', padding: '0.6rem 0.75rem 0.6rem 2.25rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleFindNearest}
                        disabled={isLocating}
                        style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.6rem 0.75rem' }}
                    >
                        {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                        <span className="hidden-mobile" style={{ marginLeft: '0.25rem' }}>Nearest</span>
                    </button>
                    <button
                        className="btn btn-secondary btn-icon btn-sm"
                        onClick={handleRefresh}
                        title="Refresh"
                        style={{ padding: '0.6rem' }}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Desktop: Left Side Panel */}
            <div className="parking-side-panel" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '380px',
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(10, 15, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--glass-border)',
                overflowY: 'hidden',
            }}>
                {/* Panel Header */}
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexShrink: 0,
                    marginTop: 0,
                }}>
                    <h3 style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <MapPin size={18} style={{ color: 'var(--accent-secondary)' }} />
                        {loading ? 'Loading...' : `${sortedLots.length} Parking Spots`}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {lastUpdated.toLocaleTimeString()}
                    </span>
                </div>

                {/* Scrollable List */}
                <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {loading ? (
                        <div style={{ padding: '1rem' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-text" style={{ width: '75%' }}></div>
                                    <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
                                </div>
                            ))}
                        </div>
                    ) : currentLots.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <MapPin size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                            <p>No parking spots found</p>
                        </div>
                    ) : (
                        currentLots.map((lot, index) => (
                            <ParkingCard key={lot.id} lot={lot} index={index} />
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        borderTop: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem',
                        flexShrink: 0,
                        background: 'rgba(10, 15, 26, 0.95)',
                    }}>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                        >
                            Prev
                        </button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile: Bottom Sheet Panel */}
            <div className="parking-bottom-panel" style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 5,
                display: 'none', /* shown via CSS @media */
                flexDirection: 'column',
                background: 'rgba(10, 15, 26, 0.95)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-border)',
                borderRadius: '1rem 1rem 0 0',
                maxHeight: panelExpanded ? '60vh' : '3.5rem',
                transition: 'max-height 0.3s ease',
                overflow: 'hidden',
            }}>
                {/* Drag Handle / Toggle */}
                <div
                    onClick={() => setPanelExpanded(!panelExpanded)}
                    style={{
                        padding: '0.75rem 1rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', flexShrink: 0,
                    }}
                >
                    <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <MapPin size={16} style={{ color: 'var(--accent-secondary)' }} />
                        {loading ? 'Loading...' : `${sortedLots.length} Spots`}
                    </h3>
                    {panelExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>

                {/* Mobile Scrollable List */}
                {panelExpanded && (
                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {loading ? (
                            <div style={{ padding: '1rem' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div className="skeleton skeleton-title"></div>
                                        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            currentLots.map((lot, index) => (
                                <ParkingCard key={lot.id} lot={lot} index={index} />
                            ))
                        )}

                        {/* Mobile Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                padding: '0.75rem', display: 'flex', justifyContent: 'center',
                                alignItems: 'center', gap: '1rem',
                            }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ fontSize: '0.8rem' }}>Prev</button>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentPage}/{totalPages}</span>
                                <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ fontSize: '0.8rem' }}>Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Responsive CSS - inline style tag */}
            <style>{`
                @media (max-width: 768px) {
                    .parking-side-panel { display: none !important; }
                    .parking-bottom-panel { display: flex !important; }
                    .hidden-mobile { display: none !important; }
                }
                @media (min-width: 769px) {
                    .parking-side-panel { display: flex !important; }
                    .parking-bottom-panel { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default FindParking;
