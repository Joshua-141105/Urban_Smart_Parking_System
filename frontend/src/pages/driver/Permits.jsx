import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { ShieldCheck, MapPin, Calendar, CheckCircle, Car } from "lucide-react";

const Permits = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [permits, setPermits] = useState([]);
    const [parkingLots, setParkingLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buyingLotId, setBuyingLotId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch user permits
                const permitsRes = await api.get("/permits/my-permits");
                setPermits(permitsRes.data);

                // Fetch all parking lots for purchase options
                const lotsRes = await api.get("/parking/all");
                setParkingLots(lotsRes.data);
            } catch (err) {
                console.error("Failed to fetch permit data", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleBuyPermit = (lotId) => {
        const lot = parkingLots.find(l => l.id === lotId);
        navigate("/payment", {
            state: {
                amount: 500, // Fixed price for now as per plan
                type: "PERMIT",
                description: `Monthly Permit for ${lot?.name}`,
                metadata: { lotId }
            }
        });
    };

    const isPermitActive = (lotId) => {
        return permits.some(p => p.parkingLot.id === lotId && p.isActive);
    };

    const getPermitExpiry = (lotId) => {
        const permit = permits.find(p => p.parkingLot.id === lotId && p.isActive);
        return permit ? new Date(permit.endDate).toLocaleDateString() : null;
    };

    return (
        <div className="page-container max-w-6xl">
            <div className="page-header text-center">
                <h1 className="page-title">Monthly Permits</h1>
                <p className="page-subtitle max-w-2xl mx-auto">
                    Purchase a monthly permit for your favorite parking lots and enjoy unlimited parking for a flat rate.
                </p>
            </div>

            {/* Active Permits Section */}
            <div className="mb-10">
                <h2 className="section-title flex items-center gap-2 mb-4">
                    <ShieldCheck size={20} className="text-accent-secondary" />
                    Your Active Permits
                </h2>

                {loading ? (
                    <div className="glass-panel p-8 text-center text-secondary">Loading...</div>
                ) : permits.length === 0 ? (
                    <div className="glass-panel p-8 empty-state">
                        <ShieldCheck size={48} className="empty-state-icon" />
                        <p className="empty-state-title">No active permits</p>
                        <p className="empty-state-text">Purchase a permit below to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {permits.map(permit => (
                            <div key={permit.id} className="glass-card p-5 border-l-4 border-l-accent-primary">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold">{permit.parkingLot.name}</h3>
                                    <span className="badge badge-success">Active</span>
                                </div>
                                <div className="space-y-2 text-sm text-secondary">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} />
                                        <span>Expires: {new Date(permit.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={14} className="text-emerald-400" />
                                        <span>Unlimited Access</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Purchase Section */}
            <div>
                <h2 className="section-title flex items-center gap-2 mb-4">
                    <Car size={20} className="text-accent-secondary" />
                    Available for Purchase
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {parkingLots.map(lot => {
                        const hasPermit = isPermitActive(lot.id);

                        return (
                            <div key={lot.id} className={`glass-card p-6 ${hasPermit ? 'opacity-75' : ''}`}>
                                <h3 className="font-bold text-lg mb-2">{lot.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-secondary mb-4">
                                    <MapPin size={16} />
                                    <span>{lot.address || "Location description"}</span>
                                </div>

                                <div className="flex justify-between items-end mb-6">
                                    <div className="text-2xl font-bold">
                                        ₹500<span className="text-sm font-normal text-secondary">/month</span>
                                    </div>
                                </div>

                                {hasPermit ? (
                                    <button className="btn btn-secondary w-full" disabled>
                                        Active until {getPermitExpiry(lot.id)}
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={() => handleBuyPermit(lot.id)}
                                        disabled={buyingLotId === lot.id}
                                    >
                                        {buyingLotId === lot.id ? 'Processing...' : 'Buy Permit'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Permits;
