import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Car,
    Calendar,
    Clock,
    MapPin,
    Navigation,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MoreVertical,
    RefreshCw,
    Star,
    Download
} from "lucide-react";
import { toast } from "react-toastify";
import Modal from "../../components/Modal";
import api from "../../api/axios";

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 5;

    // Modal State
    const [modalState, setModalState] = useState({ type: 'NONE', bookingId: null });
    const [extendHours, setExtendHours] = useState(1);
    const [actionLoading, setActionLoading] = useState(false);

    // Review State
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");


    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get("/bookings/user");

                // Map API response to UI model
                const mappedBookings = res.data.map(b => ({
                    id: b.id,
                    parkingLotName: b.parkingSpace.parkingLot.name,
                    address: b.parkingSpace.parkingLot.address,
                    latitude: b.parkingSpace.parkingLot.latitude,
                    longitude: b.parkingSpace.parkingLot.longitude,
                    parkingLotId: b.parkingSpace.parkingLot.id, // Added for review mapping
                    vehicleNumber: b.vehicleNumber || "N/A",
                    spaceNumber: b.parkingSpace.spaceNumber,
                    startTime: b.startTime,
                    endTime: b.endTime,
                    duration: Math.round((new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60 * 60)),
                    amount: b.totalAmount,
                    status: b.status,
                    canCancel: b.status === 'ACTIVE' || b.status === 'PENDING',
                    canExtend: b.status === 'ACTIVE'
                }));

                // Sort by date desc (newest first)
                mappedBookings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

                setBookings(mappedBookings);
            } catch (err) {
                console.error("Failed to fetch bookings", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="badge badge-success"><CheckCircle2 size={12} className="mr-1" />Active</span>;
            case 'COMPLETED':
                return <span className="badge badge-neutral"><CheckCircle2 size={12} className="mr-1" />Completed</span>;
            case 'CANCELLED':
                return <span className="badge badge-danger"><XCircle size={12} className="mr-1" />Cancelled</span>;
            case 'PENDING':
                return <span className="badge badge-warning"><AlertCircle size={12} className="mr-1" />Pending</span>;
            default:
                return <span className="badge badge-neutral">{status}</span>;
        }
    };

    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        };
    };

    // Filter bookings
    const filteredBookings = bookings.filter(booking => {
        const matchesFilter = filter === 'all' || booking.status.toLowerCase() === filter;
        const matchesSearch = booking.parkingLotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            booking.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // Reset page when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery]);

    const stats = {
        total: bookings.length,
        active: bookings.filter(b => b.status === 'ACTIVE').length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        cancelled: bookings.filter(b => b.status === 'CANCELLED').length
    };

    const handleCancelClick = (bookingId) => {
        setModalState({ type: 'CANCEL', bookingId });
    };

    const handleExtendClick = (bookingId) => {
        setExtendHours(1);
        setModalState({ type: 'EXTEND', bookingId });
    };

    const confirmCancel = async () => {
        if (!modalState.bookingId) return;
        setActionLoading(true);
        try {
            await api.post(`/bookings/${modalState.bookingId}/cancel`);
            setBookings(prev => prev.map(b =>
                b.id === modalState.bookingId ? { ...b, status: 'CANCELLED', canCancel: false, canExtend: false } : b
            ));
            setModalState({ type: 'NONE', bookingId: null });
        } catch (err) {
            console.error("Cancel failed", err);
            alert("Failed to cancel booking: " + (err.response?.data || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const confirmExtend = async () => {
        if (!modalState.bookingId) return;
        setActionLoading(true);
        try {
            const res = await api.post(`/bookings/${modalState.bookingId}/extend`, { extraHours: parseInt(extendHours) });
            const updatedBooking = res.data;
            setBookings(prev => prev.map(b => {
                if (b.id === modalState.bookingId) {
                    return {
                        ...b,
                        endTime: updatedBooking.endTime,
                        amount: updatedBooking.totalAmount,
                        duration: Math.round((new Date(updatedBooking.endTime) - new Date(b.startTime)) / (1000 * 60 * 60))
                    };
                }
                return b;
            }));
            setModalState({ type: 'NONE', bookingId: null });
            // Optional: Success toast
        } catch (err) {
            console.error("Extend failed", err);
            alert("Failed to extend booking: " + (err.response?.data || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReviewClick = (bookingId) => {
        setReviewRating(5);
        setReviewComment("");
        setModalState({ type: 'REVIEW', bookingId });
    };

    const submitReview = async () => {
        if (!modalState.bookingId) return;
        setActionLoading(true);
        try {
            const booking = bookings.find(b => b.id === modalState.bookingId);
            await api.post('/reviews', {
                bookingId: booking.id,
                parkingLotId: booking.parkingLotId,
                rating: reviewRating,
                comment: reviewComment,
                userId: 1 // Backend gets from token typically, but sending 1 as placeholder if needed or backend handles it completely
            });
            toast.success("Review submitted successfully!");
            setModalState({ type: 'NONE', bookingId: null });
        } catch (err) {
            console.error("Review failed", err);
            toast.error("Failed to submit review");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadReceipt = (booking) => {
        const start = formatDateTime(booking.startTime);
        const end = formatDateTime(booking.endTime);
        const receiptHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Parking Receipt - ${booking.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
                    .header h1 { color: #6366f1; margin: 0; }
                    .header p { color: #666; margin: 5px 0 0 0; }
                    .details { margin: 20px 0; }
                    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .label { color: #666; }
                    .value { font-weight: bold; }
                    .total { background: #f3f4f6; padding: 15px; margin-top: 20px; text-align: right; font-size: 1.2em; }
                    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>ParkSmart</h1>
                    <p>Parking Payment Receipt</p>
                </div>
                <div class="details">
                    <div class="row"><span class="label">Receipt #</span><span class="value">${booking.id}</span></div>
                    <div class="row"><span class="label">Parking Lot</span><span class="value">${booking.parkingLotName}</span></div>
                    <div class="row"><span class="label">Address</span><span class="value">${booking.address}</span></div>
                    <div class="row"><span class="label">Space Number</span><span class="value">${booking.spaceNumber}</span></div>
                    <div class="row"><span class="label">Vehicle</span><span class="value">${booking.vehicleNumber}</span></div>
                    <div class="row"><span class="label">Date</span><span class="value">${start.date}</span></div>
                    <div class="row"><span class="label">Time</span><span class="value">${start.time} - ${end.time}</span></div>
                    <div class="row"><span class="label">Duration</span><span class="value">${booking.duration} hour(s)</span></div>
                </div>
                <div class="total">Total Paid: ₹${booking.amount?.toFixed(2) || '0.00'}</div>
                <div class="footer">Thank you for using ParkSmart!</div>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <>
            <div className="page-container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">
                        <span className="gradient-text">My Bookings</span>
                    </h1>
                    <p className="page-subtitle">View and manage your parking reservations</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`stat-card cursor-pointer transition-all text-center ${filter === 'all' ? 'ring-2 ring-accent-primary' : ''}`}
                    >
                        <div className="stat-value text-xl" style={{ color: '#fff' }}>{stats.total}</div>
                        <div className="stat-label text-xs">All</div>
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`stat-card cursor-pointer transition-all text-center ${filter === 'active' ? 'ring-2 ring-emerald-500' : ''}`}
                    >
                        <div className="stat-value text-xl" style={{ color: '#fff' }}>{stats.active}</div>
                        <div className="stat-label text-xs">Active</div>
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`stat-card cursor-pointer transition-all text-center ${filter === 'completed' ? 'ring-2 ring-indigo-500' : ''}`}
                    >
                        <div className="stat-value text-xl" style={{ color: '#fff' }}>{stats.completed}</div>
                        <div className="stat-label text-xs">Completed</div>
                    </button>
                    <button
                        onClick={() => setFilter('cancelled')}
                        className={`stat-card cursor-pointer transition-all text-center ${filter === 'cancelled' ? 'ring-2 ring-red-500' : ''}`}
                    >
                        <div className="stat-value text-xl" style={{ color: '#fff' }}>{stats.cancelled}</div>
                        <div className="stat-label text-xs">Cancelled</div>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="glass-panel p-4 mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by parking lot or vehicle number..."
                            className="input-field pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card p-6">
                                <div className="skeleton skeleton-title w-1/3 mb-3"></div>
                                <div className="skeleton skeleton-text w-1/2 mb-2"></div>
                                <div className="skeleton skeleton-text w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="glass-panel p-12 text-center">
                        <Car size={48} className="mx-auto mb-4 text-muted" />
                        <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
                        <p className="text-secondary mb-6">
                            {filter !== 'all'
                                ? `No ${filter} bookings to display`
                                : searchQuery
                                    ? 'No bookings match your search'
                                    : 'You haven\'t made any bookings yet'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {paginatedBookings.map((booking, index) => {
                                const start = formatDateTime(booking.startTime);
                                const end = formatDateTime(booking.endTime);

                                return (
                                    <div
                                        key={booking.id}
                                        className="glass-card p-6 animate-fade-in-up"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div
                                                className="w-14 h-14 rounded-xl flex-center shrink-0"
                                                style={{
                                                    background: booking.status === 'ACTIVE'
                                                        ? 'rgba(16, 185, 129, 0.15)'
                                                        : 'rgba(99, 102, 241, 0.15)'
                                                }}
                                            >
                                                <Car
                                                    size={28}
                                                    className={booking.status === 'ACTIVE' ? 'text-success' : 'text-accent'}
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold truncate">{booking.parkingLotName}</h3>
                                                    {getStatusBadge(booking.status)}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-secondary mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={14} />
                                                        {booking.address}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Car size={14} />
                                                        Space: {booking.spaceNumber}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-secondary">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {start.date}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {start.time} - {end.time}
                                                    </span>
                                                    <span className="text-muted">({booking.duration} hours)</span>
                                                </div>
                                            </div>

                                            {/* Right side - Amount & Actions */}
                                            <div className="text-right shrink-0">
                                                <p className="text-2xl font-bold mb-1">₹{Number(booking.amount).toFixed(2)}</p>
                                                <p className="text-xs text-muted mb-3">{booking.vehicleNumber}</p>

                                                {booking.status === 'ACTIVE' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => navigate(`/navigation?lat=${booking.latitude}&lon=${booking.longitude}&name=${encodeURIComponent(booking.parkingLotName)}`)}
                                                        >
                                                            <Navigation size={14} />
                                                            Navigate
                                                        </button>
                                                        {booking.canExtend && (
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => handleExtendClick(booking.id)}
                                                            >
                                                                <RefreshCw size={14} />
                                                                Extend
                                                            </button>
                                                        )}
                                                        {booking.canCancel && (
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleCancelClick(booking.id)}
                                                            >
                                                                <XCircle size={14} />
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {/* For Pending bookings */}
                                                {booking.status === 'PENDING' && (
                                                    <button
                                                        className="btn btn-danger btn-sm w-full mt-2"
                                                        onClick={() => handleCancelClick(booking.id)}
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                )}

                                                {/* Review Button for Completed */}
                                                {booking.status === 'COMPLETED' && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            className="btn btn-ghost btn-sm flex-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                                                            onClick={() => handleReviewClick(booking.id)}
                                                        >
                                                            <Star size={14} className="fill-current mr-1" />
                                                            Rate
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-sm flex-1 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                                                            onClick={() => handleDownloadReceipt(booking)}
                                                        >
                                                            <Download size={14} className="mr-1" />
                                                            Receipt
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-6">
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
                )}

            </div>

            {/* Cancel Modal */}
            <Modal
                isOpen={modalState.type === 'CANCEL'}
                onClose={() => setModalState({ type: 'NONE', bookingId: null })}
                title="Cancel Booking"
            >
                <div className="space-y-6">
                    <p className="text-secondary text-lg">
                        Are you sure you want to cancel this booking? This action cannot be undone.
                    </p>
                    <div className="flex gap-4">
                        <button
                            className="btn btn-secondary flex-1"
                            onClick={() => setModalState({ type: 'NONE', bookingId: null })}
                            disabled={actionLoading}
                        >
                            Back
                        </button>
                        <button
                            className="btn btn-danger flex-1"
                            onClick={confirmCancel}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Extend Modal */}
            <Modal
                isOpen={modalState.type === 'EXTEND'}
                onClose={() => setModalState({ type: 'NONE', bookingId: null })}
                title="Extend Booking"
            >
                <div className="space-y-6">
                    <p className="text-secondary">
                        How many hours would you like to extend your booking?
                    </p>

                    <div className="flex items-center gap-4 justify-center py-4">
                        <button
                            className="btn btn-secondary py-3 px-5 text-xl"
                            onClick={() => setExtendHours(Math.max(1, extendHours - 1))}
                        >-</button>
                        <span className="text-3xl font-bold w-16 text-center">{extendHours}</span>
                        <button
                            className="btn btn-secondary py-3 px-5 text-xl"
                            onClick={() => setExtendHours(Math.min(24, extendHours + 1))}
                        >+</button>
                    </div>

                    <div className="flex gap-4">
                        <button
                            className="btn btn-secondary flex-1"
                            onClick={() => setModalState({ type: 'NONE', bookingId: null })}
                            disabled={actionLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary flex-1"
                            onClick={confirmExtend}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Processing...' : `Extend for ${extendHours} hr`}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Review Modal */}
            <Modal
                isOpen={modalState.type === 'REVIEW'}
                onClose={() => setModalState({ type: 'NONE', bookingId: null })}
                title="Rate Your Experience"
            >
                <div className="space-y-6">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setReviewRating(star)}
                                className={`text-3xl transition-transform hover:scale-110 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                            >
                                <Star />
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Comment (Optional)</label>
                        <textarea
                            className="input-field w-full min-h-[100px]"
                            placeholder="Share your experience..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex gap-4">
                        <button
                            className="btn btn-secondary flex-1"
                            onClick={() => setModalState({ type: 'NONE', bookingId: null })}
                            disabled={actionLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary flex-1"
                            onClick={submitReview}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default MyBookings;
