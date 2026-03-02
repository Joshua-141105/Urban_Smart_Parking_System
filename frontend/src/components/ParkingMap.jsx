import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useCallback } from "react";
import { Navigation, Clock, Car, IndianRupee } from "lucide-react";

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored markers based on occupancy
const createColoredIcon = (occupancyPercent) => {
    let color, className;

    if (occupancyPercent < 50) {
        color = '#10b981'; // Green - Available
        className = 'available';
    } else if (occupancyPercent < 80) {
        color = '#eab308'; // Yellow - Moderate
        className = 'moderate';
    } else if (occupancyPercent < 95) {
        color = '#f97316'; // Orange - Busy
        className = 'busy';
    } else {
        color = '#ef4444'; // Red - Full
        className = 'full';
    }

    return L.divIcon({
        className: `parking-marker ${className}`,
        html: `<div style="
            width: 36px;
            height: 36px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 11px;
            cursor: pointer;
            transition: box-shadow 0.2s ease;
        ">${Math.round(100 - occupancyPercent)}%</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
    });
};

// User location icon
const userLocationIcon = L.divIcon({
    className: 'user-marker',
    html: `<div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 4px 12px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Component to handle map center updates
const MapController = ({ center, zoom, initialFocus }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 14, { duration: 1 });
        }
    }, [center, zoom, map]);

    // Handle initial focus when data loads (only once)
    useEffect(() => {
        if (initialFocus) {
            map.setView(initialFocus, 13);
        }
    }, [initialFocus, map]);

    return null;
};

const ParkingMap = ({
    parkingLots = [],
    userLocation,
    selectedLot,
    onSelectLot,
    onBookLot,
    routeCoordinates = null,
    showControls = true
}) => {
    // Center priority: userLocation > first parking lot > fallback to Bangalore
    const center = userLocation 
        || (parkingLots.length > 0 ? [parkingLots[0].latitude, parkingLots[0].longitude] : null)
        || [12.9716, 77.5946];

    // Calculate occupancy percentage for each lot
    const getOccupancyPercent = useCallback((lot) => {
        if (!lot.totalCapacity || lot.totalCapacity === 0) return 0;
        const available = lot.availableSlots ?? (lot.totalCapacity - (lot.occupiedSlots || 0));
        return ((lot.totalCapacity - available) / lot.totalCapacity) * 100;
    }, []);

    // Get status badge class
    const getStatusBadge = (percent) => {
        if (percent < 50) return { class: 'badge-available', text: 'Available' };
        if (percent < 80) return { class: 'badge-moderate', text: 'Filling Up' };
        if (percent < 95) return { class: 'badge-busy', text: 'Almost Full' };
        return { class: 'badge-full', text: 'Full' };
    };

    const markerRefs = { current: {} }; // Using object to store refs without causing re-renders

    // Effect to open popup when selectedLot changes
    useEffect(() => {
        if (selectedLot && markerRefs.current[selectedLot.id]) {
            const marker = markerRefs.current[selectedLot.id];
            marker.openPopup();
        }
    }, [selectedLot]);

    // Calculate initial focus for when lots load
    const initialFocusRef = useMemo(() => {
        if (!userLocation && parkingLots.length > 0) {
            return [parkingLots[0].latitude, parkingLots[0].longitude];
        }
        return null;
    }, [userLocation, parkingLots.length > 0 ? parkingLots[0]?.id : null]);

    return (
        <div className="map-container relative" style={{ height: '100%', width: '100%' }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <MapController 
                    center={selectedLot ? [selectedLot.latitude, selectedLot.longitude] : null} 
                    zoom={15}
                    initialFocus={initialFocusRef}
                />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={userLocationIcon}>
                        <Popup>
                            <div className="p-1">
                                <p className="font-semibold text-sm">📍 Your Location</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Parking lot markers */}
                {parkingLots.map((lot) => {
                    const occupancyPercent = getOccupancyPercent(lot);
                    const status = getStatusBadge(occupancyPercent);
                    const available = lot.availableSlots ?? (lot.totalCapacity - (lot.occupiedSlots || 0));

                    return (
                        <Marker
                            key={lot.id}
                            position={[lot.latitude, lot.longitude]}
                            icon={createColoredIcon(occupancyPercent)}
                            eventHandlers={{
                                click: () => onSelectLot && onSelectLot(lot)
                            }}
                            ref={(el) => {
                                if (el) markerRefs.current[lot.id] = el;
                            }}
                        >
                            <Popup>
                                <div className="min-w-[200px]">
                                    <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                                        {lot.name}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`badge ${status.class}`}>{status.text}</span>
                                    </div>

                                    <div className="space-y-1 text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                                        <div className="flex items-center gap-2">
                                            <Car size={14} />
                                            <span>{available} / {lot.totalCapacity} spots available</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IndianRupee size={14} />
                                            <span>₹{lot.baseRate?.toFixed(0) || '30'}/hour</span>
                                        </div>
                                        {lot.distance && (
                                            <div className="flex items-center gap-2">
                                                <Navigation size={14} />
                                                <span>{lot.distance.toFixed(1)} km away</span>
                                            </div>
                                        )}
                                        {lot.eta && (
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span>{lot.eta} mins drive</span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="btn btn-primary btn-sm w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onBookLot && onBookLot(lot);
                                        }}
                                        disabled={available === 0}
                                    >
                                        {available > 0 ? 'Book Now' : 'No Spots Available'}
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Route Visualization */}
                {routeCoordinates && (
                    <Polyline
                        positions={routeCoordinates}
                        color="#3b82f6"
                        weight={5}
                        opacity={0.7}
                        dashArray="10, 10" // Dashed line for visualization
                    />
                )}
            </MapContainer>

            {/* Map Legend Overlay */}
            {showControls && (
                <div className="absolute bottom-4 left-4 z-[1000] glass-card-static p-3">
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Availability
                    </p>
                    <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: '#10b981' }}></span>
                            <span style={{ color: 'var(--text-primary)' }}>&lt;50% Full</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: '#eab308' }}></span>
                            <span style={{ color: 'var(--text-primary)' }}>50-80% Full</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: '#f97316' }}></span>
                            <span style={{ color: 'var(--text-primary)' }}>80-95% Full</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }}></span>
                            <span style={{ color: 'var(--text-primary)' }}>&gt;95% Full</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Last updated indicator */}
            <div className="absolute top-4 right-4 z-[1000] glass-card-static px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Live updates</span>
                </div>
            </div>
        </div>
    );
};

export default ParkingMap;
