import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ParkingMap from "../../components/ParkingMap";
import MLPredictionBadge from "../../components/MLPredictionBadge";
import BestTimeSuggestion from "../../components/BestTimeSuggestion";
import useParkingPredictions from "../../hooks/useParkingPredictions";
import {
    Search, Navigation, Loader2, MapPin, Car, Clock,
    RefreshCw, Star, ChevronUp, ChevronDown, Zap, TrendingUp, Award, ShieldCheck,
} from "lucide-react";
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
    const [sortMode, setSortMode] = useState("recommendation"); // "recommendation" | "distance"
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [permitLotIds, setPermitLotIds] = useState(new Set());

    const { occupancyUpdates } = useWebSocket();

    // ── ML Predictions ────────────────────────────────────────────────────────
    const lotIds = parkingLots.map(l => l.id);
    const { predictions, loading: mlLoading, refresh: refreshML } = useParkingPredictions(lotIds);

    // Merge ML data into lots
    const enrichedLots = parkingLots.map(lot => ({
        ...lot,
        ...(predictions[lot.id] || {}),
    }));

    // ── Fetch parking lots ────────────────────────────────────────────────────
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
        setParkingLots([
            { id: 1, name: "M.G. Road Parking Complex", latitude: 12.9716, longitude: 77.5946, availableSlots: 15, totalCapacity: 50, baseRate: 40, distance: 0.5, eta: 3 },
            { id: 2, name: "Indiranagar Metro Parking", latitude: 12.9784, longitude: 77.6408, availableSlots: 5, totalCapacity: 30, baseRate: 35, distance: 2.1, eta: 8 },
            { id: 3, name: "Koramangala Forum Mall", latitude: 12.9352, longitude: 77.6135, availableSlots: 42, totalCapacity: 100, baseRate: 50, distance: 3.5, eta: 12 },
            { id: 4, name: "UB City Premium Parking", latitude: 12.9719, longitude: 77.5956, availableSlots: 8, totalCapacity: 80, baseRate: 60, distance: 0.8, eta: 4 },
            { id: 5, name: "Brigade Road Multi-Level", latitude: 12.9726, longitude: 77.6077, availableSlots: 25, totalCapacity: 60, baseRate: 45, distance: 1.2, eta: 5 },
            { id: 6, name: "Jayanagar 4th Block", latitude: 12.9308, longitude: 77.5838, availableSlots: 3, totalCapacity: 40, baseRate: 30, distance: 4.2, eta: 15 },
            { id: 7, name: "HSR Layout Hub", latitude: 12.9116, longitude: 77.6389, availableSlots: 18, totalCapacity: 45, baseRate: 25, distance: 5.0, eta: 18 },
            { id: 8, name: "Whitefield IT Park", latitude: 12.9698, longitude: 77.7500, availableSlots: 55, totalCapacity: 150, baseRate: 20, distance: 12.0, eta: 35 },
        ]);
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = [position.coords.latitude, position.coords.longitude];
                    setUserLocation(loc);
                    fetchParkingLots(loc[0], loc[1]);
                },
                () => fetchParkingLots(),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            fetchParkingLots();
        }
    }, [fetchParkingLots]);

    // Fetch user permits to highlight free parking lots
    useEffect(() => {
        const fetchPermits = async () => {
            try {
                const res = await api.get("/permits/my-permits");
                const permits = res.data || [];
                const activeIds = new Set(
                    permits
                        .filter(p => p.active && new Date(p.endDate) > new Date())
                        .map(p => p.parkingLot?.id)
                        .filter(Boolean)
                );
                setPermitLotIds(activeIds);
            } catch (err) {
                // Silent fail — permits are an enhancement
            }
        };
        if (user) fetchPermits();
    }, [user]);

    // Real-time occupancy updates via WebSocket
    useEffect(() => {
        if (occupancyUpdates && Object.keys(occupancyUpdates).length > 0) {
            setParkingLots(prev => prev.map(lot => {
                if (occupancyUpdates[lot.id]) {
                    return {
                        ...lot,
                        availableSlots: occupancyUpdates[lot.id].availableSlots,
                        totalCapacity: occupancyUpdates[lot.id].totalCapacity || lot.totalCapacity,
                    };
                }
                return lot;
            }));
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
                () => setIsLocating(false),
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
        refreshML();
    };

    const [routeCoordinates, setRouteCoordinates] = useState(null);

    useEffect(() => {
        if (selectedLot && userLocation) {
            const fetchRoute = async () => {
                try {
                    const url = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${selectedLot.longitude},${selectedLot.latitude}?overview=full&geometries=geojson`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (data.routes && data.routes.length > 0) {
                        setRouteCoordinates(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
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
        return ((lot.totalCapacity - (lot.availableSlots ?? 0)) / lot.totalCapacity) * 100;
    };

    const getStatusBadge = (percent) => {
        if (percent < 50) return { class: 'badge-available', text: 'Available' };
        if (percent < 80) return { class: 'badge-moderate', text: 'Filling Up' };
        if (percent < 95) return { class: 'badge-busy', text: 'Almost Full' };
        return { class: 'badge-full', text: 'Full' };
    };

    // ── Filter + sort ─────────────────────────────────────────────────────────
    const filteredLots = enrichedLots.filter(lot =>
        lot.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedLots = [...filteredLots].sort((a, b) => {
        const aHasPermit = permitLotIds.has(a.id);
        const bHasPermit = permitLotIds.has(b.id);

        if (sortMode === "recommendation") {
            const scoreA = a.recommendationScore ?? (100 - (a.distance || 0) * 5);
            const scoreB = b.recommendationScore ?? (100 - (b.distance || 0) * 5);

            // Both have permits or both don't — sort by ML score
            if (aHasPermit === bHasPermit) return scoreB - scoreA;

            // Find the top ML score to keep #1 ML-recommended at the top
            const allScores = filteredLots.map(l => l.recommendationScore ?? (100 - (l.distance || 0) * 5));
            const topScore = Math.max(...allScores);

            // If the non-permit lot is the #1 ML pick, keep it on top
            if (!aHasPermit && scoreA >= topScore) return -1;
            if (!bHasPermit && scoreB >= topScore) return 1;

            // Otherwise, permit lot comes first
            return aHasPermit ? -1 : 1;
        }
        return (a.distance || 0) - (b.distance || 0);
    });

    const topLotId = sortedLots.length > 0 ? sortedLots[0].id : null;

    // Filling-fast alert: any lot within 5 km that's filling fast
    const nearbyFillingFast = enrichedLots.filter(
        l => l.fillingFastAlert && (l.distance || 0) <= 5
    );

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(sortedLots.length / itemsPerPage);
    useEffect(() => { setCurrentPage(1); }, [searchQuery, sortMode]);
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

    // ── Parking Card ─────────────────────────────────────────────────────────
    const ParkingCard = ({ lot, isTop, isPermit }) => {
        const occupancyPercent = getOccupancyPercent(lot);
        const status = getStatusBadge(occupancyPercent);
        const available = lot.availableSlots ?? 0;
        const isSelected = selectedLot?.id === lot.id;
        const isExpanded = expandedCardId === lot.id;

        const predAvail = lot.predictedAvailability;
        const confidence = lot.confidenceLevel;
        const demandScore = lot.demandScore;
        const mlReady = demandScore != null;

        return (
            <div
                id={`lot-${lot.id}`}
                className="transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedLot(lot)}
                style={{
                    padding: '0.875rem 1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    background: isSelected ? 'rgba(99,102,241,0.1)'
                        : isTop ? 'rgba(16,185,129,0.05)'
                        : isPermit ? 'rgba(245,158,11,0.06)'
                        : 'transparent',
                    borderLeft: isSelected
                        ? '3px solid var(--accent-primary)'
                        : isTop
                        ? '3px solid #10b981'
                        : isPermit
                        ? '3px solid #f59e0b'
                        : '3px solid transparent',
                    transition: 'background 0.2s',
                }}
            >
                {/* Top Recommended badge */}
                {isTop && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        marginBottom: '0.4rem', fontSize: '0.68rem', fontWeight: 700,
                        color: '#6ee7b7',
                    }}>
                        <Award size={11} style={{ color: '#10b981' }} />
                        ⭐ ML Recommended
                    </div>
                )}

                {/* Permit badge */}
                {isPermit && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        marginBottom: '0.4rem', fontSize: '0.68rem', fontWeight: 700,
                        color: '#fcd34d',
                    }}>
                        <ShieldCheck size={11} style={{ color: '#f59e0b' }} />
                        🎫 Monthly Permit — FREE Parking
                    </div>
                )}

                {/* Row 1: Name + status badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {lot.name}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                        <span className={`badge ${status.class}`} style={{ fontSize: '0.68rem' }}>
                            {status.text}
                        </span>
                        {mlReady && (
                            <MLPredictionBadge
                                demandScore={demandScore}
                                confidenceLevel={confidence}
                                fillingFastAlert={lot.fillingFastAlert}
                                compact
                            />
                        )}
                    </div>
                </div>

                {/* Row 2: Slots + rating + price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                        <Car size={12} /> {available}/{lot.totalCapacity}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#facc15', fontSize: '0.78rem' }}>
                        <Star size={11} style={{ fill: 'currentColor' }} />
                        {lot.rating > 0 ? lot.rating.toFixed(1) : 'New'}
                    </span>
                    {permitLotIds.has(lot.id) ? (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            fontWeight: 700, color: '#10b981', fontSize: '0.82rem',
                            background: 'rgba(16,185,129,0.12)', padding: '0.15rem 0.45rem',
                            borderRadius: '6px', border: '1px solid rgba(16,185,129,0.25)',
                        }}>
                            <ShieldCheck size={12} />
                            FREE
                        </span>
                    ) : (
                        <span style={{ fontWeight: 600, color: 'var(--accent-secondary)', fontSize: '0.88rem' }}>
                            ₹{Number(lot.baseRate).toFixed(0)}/hr
                        </span>
                    )}
                </div>

                {/* Current occupancy bar */}
                <div className="progress-bar" style={{ height: '4px', marginBottom: '0.5rem' }}>
                    <div
                        className={`progress-fill ${occupancyPercent < 50 ? 'success' : occupancyPercent < 80 ? 'warning' : 'danger'}`}
                        style={{ width: `${occupancyPercent}%` }}
                    />
                </div>

                {/* ML prediction row */}
                {mlReady && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.5rem',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '6px',
                        background: 'rgba(255,255,255,0.03)',
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <TrendingUp size={11} style={{ color: '#a5b4fc' }} />
                            In 15 min:&nbsp;
                            <strong style={{ color: predAvail <= 3 ? '#ef4444' : predAvail <= 10 ? '#f59e0b' : '#10b981' }}>
                                ~{predAvail} slots
                            </strong>
                        </span>
                        {confidence != null && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                Confidence:&nbsp;
                                <strong style={{ color: confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444' }}>
                                    {confidence}%
                                </strong>
                            </span>
                        )}
                        {lot.recommendationScore != null && sortMode === "recommendation" && (
                            <span title="ML recommendation score">
                                Score: <strong style={{ color: '#a5b4fc' }}>{lot.recommendationScore.toFixed(0)}</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: isExpanded ? '0.5rem' : 0 }}>
                    <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.45rem' }}
                        onClick={(e) => handleBookNow(e, lot)}
                        disabled={available === 0}
                    >
                        {available > 0 ? (user ? 'Book Now' : 'Login to Book') : 'Full'}
                    </button>
                    <button
                        className="btn btn-secondary btn-sm btn-icon"
                        style={{ padding: '0.45rem' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/navigation?lat=${lot.latitude}&lon=${lot.longitude}&name=${encodeURIComponent(lot.name)}`);
                        }}
                        title="Navigate"
                    >
                        <Navigation size={14} />
                    </button>
                    <button
                        className="btn btn-secondary btn-sm btn-icon"
                        style={{ padding: '0.45rem', fontSize: '0.75rem' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCardId(prev => prev === lot.id ? null : lot.id);
                        }}
                        title="Best time to park"
                    >
                        <Clock size={14} />
                    </button>
                </div>

                {/* Best Time panel (lazy) */}
                {isExpanded && (
                    <div onClick={e => e.stopPropagation()}>
                        <BestTimeSuggestion lotId={lot.id} lotName={lot.name} />
                    </div>
                )}
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
            {/* Full-screen Map */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <ParkingMap
                    parkingLots={sortedLots}
                    userLocation={userLocation}
                    selectedLot={selectedLot}
                    onSelectLot={setSelectedLot}
                    onBookLot={(lot) => handleBookNow({ stopPropagation: () => {} }, lot)}
                    routeCoordinates={routeCoordinates}
                />
            </div>

            {/* Search Bar */}
            <div style={{
                position: 'absolute', top: '1rem', left: '50%',
                transform: 'translateX(-50%)', zIndex: 10,
                width: '90%', maxWidth: '600px',
            }}>
                <div className="glass-panel" style={{
                    padding: '0.75rem', display: 'flex', gap: '0.5rem',
                    alignItems: 'center', background: 'rgba(17,24,39,0.92)',
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
                    <button className="btn btn-primary btn-sm" onClick={handleFindNearest} disabled={isLocating}
                        style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.6rem 0.75rem' }}>
                        {isLocating ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                        <span className="hidden-mobile" style={{ marginLeft: '0.25rem' }}>Nearest</span>
                    </button>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={handleRefresh}
                        title="Refresh" style={{ padding: '0.6rem' }}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Desktop Left Panel */}
            <div className="parking-side-panel" style={{
                position: 'absolute', top: 0, left: 0, bottom: 0, width: '390px',
                zIndex: 5, display: 'flex', flexDirection: 'column',
                background: 'rgba(10,15,26,0.95)', backdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--glass-border)', overflowY: 'hidden',
            }}>
                {/* Panel Header */}
                <div style={{
                    padding: '0.875rem 1rem', borderBottom: '1px solid var(--glass-border)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <MapPin size={18} style={{ color: 'var(--accent-secondary)' }} />
                            {loading ? 'Loading...' : `${sortedLots.length} Parking Spots`}
                            {mlLoading && <Loader2 size={13} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />}
                        </h3>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {lastUpdated.toLocaleTimeString()}
                        </span>
                    </div>

                    {/* Sort toggle */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                            className={`btn btn-sm ${sortMode === 'recommendation' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, fontSize: '0.72rem', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            onClick={() => setSortMode('recommendation')}
                        >
                            <Zap size={11} /> ML Recommended
                        </button>
                        <button
                            className={`btn btn-sm ${sortMode === 'distance' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ flex: 1, fontSize: '0.72rem', padding: '0.35rem 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                            onClick={() => setSortMode('distance')}
                        >
                            <Navigation size={11} /> Distance
                        </button>
                    </div>
                </div>

                {/* Filling-fast alert banner */}
                {nearbyFillingFast.length > 0 && (
                    <div style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(239,68,68,0.1)',
                        borderBottom: '1px solid rgba(239,68,68,0.25)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.75rem', color: '#fca5a5',
                        flexShrink: 0,
                    }}>
                        <Zap size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <span>
                            <strong>{nearbyFillingFast.length} nearby {nearbyFillingFast.length === 1 ? 'lot' : 'lots'}</strong>
                            {' '}filling fast — showing alternatives first
                        </span>
                    </div>
                )}

                {/* Scrollable List */}
                <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                    {loading ? (
                        <div style={{ padding: '1rem' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <div className="skeleton skeleton-title" />
                                    <div className="skeleton skeleton-text" style={{ width: '75%' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                                </div>
                            ))}
                        </div>
                    ) : currentLots.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <MapPin size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                            <p>No parking spots found</p>
                        </div>
                    ) : (
                        currentLots.map((lot) => (
                            <ParkingCard
                                key={lot.id}
                                lot={lot}
                                isTop={sortMode === 'recommendation' && lot.id === topLotId}
                                isPermit={permitLotIds.has(lot.id)}
                            />
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        padding: '0.75rem 1rem', borderTop: '1px solid var(--glass-border)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem',
                        flexShrink: 0, background: 'rgba(10,15,26,0.95)',
                    }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                            Prev
                        </button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {currentPage} / {totalPages}
                        </span>
                        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages} style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Bottom Sheet */}
            <div className="parking-bottom-panel" style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 5,
                display: 'none', flexDirection: 'column',
                background: 'rgba(10,15,26,0.95)', backdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-border)',
                borderRadius: '1rem 1rem 0 0',
                maxHeight: panelExpanded ? '60vh' : '3.5rem',
                transition: 'max-height 0.3s ease', overflow: 'hidden',
            }}>
                <div onClick={() => setPanelExpanded(!panelExpanded)}
                    style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <h3 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <MapPin size={16} style={{ color: 'var(--accent-secondary)' }} />
                        {loading ? 'Loading...' : `${sortedLots.length} Spots`}
                    </h3>
                    {panelExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>

                {panelExpanded && (
                    <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                        {/* Filling-fast alert mobile */}
                        {nearbyFillingFast.length > 0 && (
                            <div style={{
                                padding: '0.4rem 1rem', background: 'rgba(239,68,68,0.1)',
                                borderBottom: '1px solid rgba(239,68,68,0.22)',
                                fontSize: '0.72rem', color: '#fca5a5',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}>
                                <Zap size={12} style={{ color: '#ef4444' }} />
                                {nearbyFillingFast.length} nearby {nearbyFillingFast.length === 1 ? 'lot' : 'lots'} filling fast
                            </div>
                        )}
                        {loading ? (
                            <div style={{ padding: '1rem' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                        <div className="skeleton skeleton-title" />
                                        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            currentLots.map((lot) => (
                                <ParkingCard
                                    key={lot.id}
                                    lot={lot}
                                    isTop={sortMode === 'recommendation' && lot.id === topLotId}
                                />
                            ))
                        )}

                        {totalPages > 1 && (
                            <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ fontSize: '0.8rem' }}>Prev</button>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{currentPage}/{totalPages}</span>
                                <button className="btn btn-secondary btn-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ fontSize: '0.8rem' }}>Next</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
