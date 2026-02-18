import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ParkingMap from "../../components/ParkingMap";
import { Search, Navigation, Loader2, MapPin, Car, IndianRupee, Clock, RefreshCw, Star } from "lucide-react";
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
                        // Leaflet needs [lat, lon], OSRM returns [lon, lat]
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

    // Filter lots based on search
    const filteredLots = parkingLots.filter(lot =>
        lot.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by distance
    const sortedLots = [...filteredLots].sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(sortedLots.length / itemsPerPage);

    // Reset page on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentLots = sortedLots.slice(startIndex, startIndex + itemsPerPage);

    // Scroll Refs
    const listContainerRef = useRef(null);

    // Scroll to top on page change
    useEffect(() => {
        if (listContainerRef.current) {
            listContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    // Scroll to selected lot
    useEffect(() => {
        if (selectedLot) {
            const element = document.getElementById(`lot-${selectedLot.id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [selectedLot]);

    return (
        <div className="page-container">
            {/* Search Bar */}
            <div className="glass-panel p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search by location or lot name..."
                            className="input-field pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={handleFindNearest}
                        disabled={isLocating}
                    >
                        {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                        {isLocating ? 'Locating...' : 'Find Nearest'}
                    </button>
                    <button className="btn btn-secondary btn-icon" onClick={handleRefresh} title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                    <span className="text-xs text-muted hidden sm:inline">
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Map */}
            <div className="glass-panel overflow-hidden mb-6 rounded-xl" style={{ height: '45vh', minHeight: '300px' }}>
                <ParkingMap
                    parkingLots={sortedLots}
                    userLocation={userLocation}
                    selectedLot={selectedLot}
                    onSelectLot={setSelectedLot}
                    onBookLot={(lot) => handleBookNow({ stopPropagation: () => { } }, lot)}
                    routeCoordinates={routeCoordinates}
                />
            </div>

            {/* Parking List */}
            <div className="glass-panel p-6">
                <div className="section-header">
                    <h3 className="section-title flex items-center gap-2">
                        <MapPin size={20} className="text-accent-secondary" />
                        {loading ? 'Loading...' : `${sortedLots.length} Parking Spots`}
                    </h3>
                </div>

                {
                    loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="glass-card-static p-4">
                                    <div className="skeleton skeleton-title"></div>
                                    <div className="skeleton skeleton-text w-3/4"></div>
                                    <div className="skeleton skeleton-text w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                                {currentLots.map((lot, index) => {
                                    const occupancyPercent = getOccupancyPercent(lot);
                                    const status = getStatusBadge(occupancyPercent);
                                    const available = lot.availableSlots ?? 0;

                                    return (
                                        <div
                                            key={lot.id}
                                            className={`glass-card p-4 cursor-pointer transition-all duration-200 ${selectedLot?.id === lot.id ? 'ring-2 ring-accent-primary' : ''
                                                }`}
                                            onClick={() => setSelectedLot(lot)}
                                            style={{ animationDelay: `${index * 0.03}s` }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-sm truncate">{lot.name}</h4>
                                                    <p className="text-xs text-muted flex items-center gap-2 mt-1">
                                                        {lot.distance && (
                                                            <span className="flex items-center gap-1">
                                                                <Navigation size={10} />
                                                                {lot.distance.toFixed(1)} km
                                                            </span>
                                                        )}
                                                        {lot.eta && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {lot.eta} min
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <span className={`badge ${status.class} ml-2 text-xs`}>
                                                    {status.text}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="flex items-center gap-1 text-secondary text-xs">
                                                    <Car size={12} />
                                                    {available}/{lot.totalCapacity}
                                                </span>
                                                <span className="flex items-center gap-1 text-yellow-400 text-xs">
                                                    <Star size={12} className="fill-current" />
                                                    {lot.rating > 0 ? lot.rating.toFixed(1) : 'New'}
                                                    {lot.reviewCount > 0 && <span className="text-muted">({lot.reviewCount})</span>}
                                                </span>
                                                <span className="flex items-center gap-1 font-semibold text-accent text-sm">
                                                    <IndianRupee size={12} />
                                                    {Number(lot.baseRate).toFixed(2)}/hr
                                                </span>
                                            </div>

                                            {/* Occupancy bar */}
                                            <div className="progress-bar mb-3" style={{ height: '4px' }}>
                                                <div
                                                    className={`progress-fill ${occupancyPercent < 50 ? 'success' :
                                                        occupancyPercent < 80 ? 'warning' : 'danger'
                                                        }`}
                                                    style={{ width: `${occupancyPercent}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-primary btn-sm flex-1"
                                                    onClick={(e) => handleBookNow(e, lot)}
                                                    disabled={available === 0}
                                                >
                                                    {available > 0 ? (user ? 'Book Now' : 'Login to Book') : 'Full'}
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-sm btn-icon"
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
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-2">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-secondary">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )
                }
            </div>
        </div>
    );
};

export default FindParking;
