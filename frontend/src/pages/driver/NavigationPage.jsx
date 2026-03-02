import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { ArrowLeft, Navigation, Clock, MapPin, Footprints, Car, Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const userIcon = L.divIcon({
    className: 'user-marker',
    html: '<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const destIcon = L.divIcon({
    className: 'dest-marker',
    html: '<div style="background:#ef4444;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 4px 6px rgba(0,0,0,0.3)"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Map Controller to fit bounds
const MapBounds = ({ userLoc, destLoc, recenterTrigger }) => {
    const map = useMap();
    useEffect(() => {
        if (userLoc && destLoc) {
            const bounds = L.latLngBounds([userLoc, destLoc]);
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
    }, [userLoc, destLoc, map, recenterTrigger]);
    return null;
};

const NavigationPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const destLat = parseFloat(searchParams.get("lat"));
    const destLon = parseFloat(searchParams.get("lon"));
    const destName = searchParams.get("name") || "Destination";

    const [userLoc, setUserLoc] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState("driving"); // driving, walking
    const [recenterTrigger, setRecenterTrigger] = useState(0);

    const handleRecenter = () => {
        setRecenterTrigger(prev => prev + 1);
    };

    // Get User Location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
                (err) => {
                    console.error("Location denied", err);
                    // Default fallback (Bangalore center) if permission denied, 
                    // though ideally we'd show an error
                    setUserLoc([12.9716, 77.5946]);
                },
                { enableHighAccuracy: true }
            );
        }
    }, []);

    // Fetch Route from OSRM
    useEffect(() => {
        if (userLoc && destLat && destLon) {
            setLoading(true);
            const profile = mode === 'walking' ? 'foot' : 'driving';
            const url = `https://router.project-osrm.org/route/v1/${profile}/${userLoc[1]},${userLoc[0]};${destLon},${destLat}?overview=full&geometries=geojson&steps=true`;

            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        setRouteData(route);
                        setSteps(route.legs[0].steps);
                    }
                })
                .catch(err => console.error("Routing error", err))
                .finally(() => setLoading(false));
        }
    }, [userLoc, destLat, destLon, mode]);

    // Parse OSRM steps
    // Step instructions often contain html-like text or modifiers
    const formatInstruction = (step) => {
        // Basic cleanup, can be enhanced
        return step.maneuver.type + (step.maneuver.modifier ? ` ${step.maneuver.modifier}` : '') + ` on ${step.name || 'road'}`;
    };

    const formatDuration = (seconds) => {
        const mins = Math.round(seconds / 60);
        if (mins > 60) {
            const hrs = Math.floor(mins / 60);
            return `${hrs} hr ${mins % 60} min`;
        }
        return `${mins} min`;
    };

    const formatDistance = (meters) => {
        return (meters / 1000).toFixed(1) + " km";
    };

    return (
        <div className="page-container">
            {/* Map */}
            <div className="glass-panel overflow-hidden rounded-xl mb-6 relative" style={{ height: '45vh', minHeight: '300px' }}>
                {userLoc && destLat ? (
                    <>
                        <MapContainer
                            center={userLoc}
                            zoom={13}
                            style={{ height: "100%", width: "100%" }}
                            className="z-0"
                        >
                            <TileLayer
                                attribution='&copy; OSRM'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <Marker position={userLoc} icon={userIcon}>
                                <Popup>You</Popup>
                            </Marker>

                            <Marker position={[destLat, destLon]} icon={destIcon}>
                                <Popup>{destName}</Popup>
                            </Marker>

                        {routeData && (
                            <Polyline
                                positions={routeData.geometry.coordinates.map(coord => [coord[1], coord[0]])}
                                color={mode === 'walking' ? '#10b981' : '#3b82f6'}
                                weight={5}
                                opacity={0.7}
                            />
                        )}

                            <MapBounds userLoc={userLoc} destLoc={[destLat, destLon]} recenterTrigger={recenterTrigger} />
                        </MapContainer>
                        
                        {/* Relocate Button */}
                        <button
                            onClick={handleRecenter}
                            style={{
                                position: 'absolute',
                                bottom: '16px',
                                right: '16px',
                                zIndex: 1000,
                                width: '44px',
                                height: '44px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                border: '2px solid white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white'
                            }}
                            title="Recenter map"
                        >
                            <Crosshair size={20} />
                        </button>
                    </>
                ) : (
                    <div className="flex-center h-full">
                        <div className="animate-spin w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Sidebar / Instructions - Bottom */}
            <div className="w-full glass-panel" style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="p-4 border-b border-white/10" style={{ flexShrink: 0 }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-ghost btn-sm flex items-center gap-2 mb-4"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    <h2 className="text-xl font-bold mb-1 truncate">{destName}</h2>

                    {routeData && (
                        <div className="flex items-center justify-between mt-4 bg-white/5 p-3 rounded-lg">
                            <div className="text-center">
                                <p className="text-xs text-secondary">Distance</p>
                                <p className="font-bold text-accent">{formatDistance(routeData.distance)}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="text-center">
                                <p className="text-xs text-secondary">Duration</p>
                                <p className="font-bold text-success text-lg">{formatDuration(routeData.duration)}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button
                            className={`flex-1 btn btn-sm ${mode === 'driving' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setMode('driving')}
                        >
                            <Car size={16} /> Driving
                        </button>
                        <button
                            className={`flex-1 btn btn-sm ${mode === 'walking' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setMode('walking')}
                        >
                            <Footprints size={16} /> Walking
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4 custom-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                    {loading ? (
                        <div className="flex-center py-10">
                            <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full"></div>
                        </div>
                    ) : steps.length > 0 ? (
                        steps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors">
                                <div className="mt-1 text-secondary">
                                    <Navigation size={20} className={idx === 0 ? "text-success" : ""} />
                                </div>
                                <div className="border-b border-white/5 pb-2 flex-1">
                                    <p className="font-medium text-sm capitalize">
                                        {step.maneuver.instruction || formatInstruction(step)}
                                    </p>
                                    <p className="text-xs text-secondary mt-1">
                                        {step.distance > 0 ? `${Math.round(step.distance)}m` : ''}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-secondary py-10">No route found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NavigationPage;
