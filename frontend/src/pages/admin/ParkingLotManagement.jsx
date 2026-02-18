import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Building2,
    MapPin,
    Users,
    Edit,
    Plus,
    Search,
    Save,
    X,
    Trash2,
    AlertTriangle,
    IndianRupee
} from "lucide-react";
import { toast } from "react-toastify";

const ParkingLotManagement = () => {
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        address: "",
        city: "",
        latitude: "",
        longitude: "",
        totalCapacity: 50,
        baseRate: 20
    });

    const fetchLots = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/admin/parking-lots', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLots(data);
            } else {
                toast.error("Failed to fetch parking lots");
            }
        } catch (error) {
            console.error("Error fetching lots:", error);
            toast.error("Error submitting request");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLots();
    }, []);

    const handleOpenModal = (lot = null) => {
        if (lot) {
            setFormData({
                id: lot.id,
                name: lot.name,
                address: lot.address,
                city: lot.city,
                latitude: lot.latitude,
                longitude: lot.longitude,
                totalCapacity: lot.totalCapacity,
                baseRate: lot.baseRate
            });
            setIsEditMode(true);
        } else {
            setFormData({
                id: null,
                name: "",
                address: "",
                city: "",
                latitude: "",
                longitude: "",
                totalCapacity: 50,
                baseRate: 20
            });
            setIsEditMode(false);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = isEditMode
                ? `http://localhost:8080/api/admin/parking-lots/${formData.id}`
                : 'http://localhost:8080/api/admin/parking-lots';

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(`Parking lot ${isEditMode ? 'updated' : 'created'} successfully`);
                fetchLots();
                setIsModalOpen(false);
            } else {
                const err = await response.json();
                toast.error(err.message || "Operation failed");
            }
        } catch (error) {
            console.error("Error saving lot:", error);
            toast.error("Error saving parking lot");
        }
    };

    const handleDeleteLot = async (lotId, lotName) => {
        if (!window.confirm(`Are you sure you want to delete "${lotName}"? All bookings will be archived.`)) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/api/admin/parking-lots/${lotId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                toast.success("Parking lot deleted and bookings archived");
                fetchLots();
            } else {
                const err = await response.json();
                toast.error(err.message || "Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting parking lot");
        }
    };

    const filteredLots = lots.filter(lot =>
        lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex-center min-h-screen">
            <div className="animate-spin w-10 h-10 rounded-full border-3 border-accent-primary border-t-transparent"></div>
        </div>;
    }

    return (
        <div className="page-container">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">
                        <span className="gradient-text">Parking Lot Management</span>
                    </h1>
                    <p className="page-subtitle">Create and manage parking facilities</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus size={18} />
                    Add New Lot
                </button>
            </div>

            {/* Search */}
            <div className="mb-6 relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                    type="text"
                    placeholder="Search by name or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredLots.map((lot) => (
                    <div key={lot.id} className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex-center shrink-0">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{lot.name}</h3>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary mt-1">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} /> {lot.city}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} /> Capacity: {lot.totalCapacity}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <IndianRupee size={14} /> Rate: {lot.baseRate}/hr
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                onClick={() => handleOpenModal(lot)}
                                className="btn btn-secondary btn-sm flex-1 md:flex-none"
                            >
                                <Edit size={16} />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteLot(lot.id, lot.name)}
                                className="btn btn-danger btn-sm flex-1 md:flex-none"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {filteredLots.length === 0 && (
                    <div className="text-center py-12 text-muted">
                        No parking lots found matching your search.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-lg p-6 animate-scale-in">
                        <div className="flex-between mb-6">
                            <h2 className="text-xl font-bold">
                                {isEditMode ? 'Edit Parking Lot' : 'Create New Parking Lot'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-secondary hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Lot Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g. Central Mall Parking"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="input-field"
                                    placeholder="Full street address"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">City</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Base Rate (₹/hr)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.5"
                                        value={formData.baseRate}
                                        onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        required
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        required
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Total Capacity</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.totalCapacity}
                                    onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) })}
                                    className="input-field"
                                />
                                {isEditMode && (
                                    <p className="text-xs text-warning mt-1 flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        Reducing capacity will remove unoccupied spaces.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-glass-border">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary flex-1">
                                    <Save size={18} />
                                    {isEditMode ? 'Update Lot' : 'Create Lot'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParkingLotManagement;
