import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, MapPin, CreditCard, Bell, Shield, Award, Car, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const UserProfile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("personal");
    const [loading, setLoading] = useState(false);

    // Form states
    const [personalInfo, setPersonalInfo] = useState({
        username: "",
        email: "",
        phone: "",
        role: ""
    });

    const [preferences, setPreferences] = useState({
        notifyEmail: true,
        notifySms: false,
        notifyPush: true,
        accessibility: "NONE"
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/users/me', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                if (res.ok) {
                    const userData = await res.json();
                    setPersonalInfo({
                        username: userData.username || "",
                        email: userData.email || "",
                        phone: userData.phoneNumber || "",
                        role: userData.role || ""
                    });

                    setPreferences({
                        notifyEmail: userData.notifyEmail ?? true,
                        notifySms: userData.notifySms ?? false,
                        notifyPush: userData.notifyPush ?? true,
                        accessibility: userData.accessibilityNeeds || "NONE"
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        fetchProfile();
    }, []);

    const handleInfoChange = (e) => {
        setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
    };

    const handlePrefChange = (key) => {
        setPreferences({ ...preferences, [key]: !preferences[key] });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatePayload = {
                phoneNumber: personalInfo.phone,
                notifyEmail: preferences.notifyEmail,
                notifySms: preferences.notifySms,
                accessibilityNeeds: preferences.accessibility
            };

            const res = await fetch('http://localhost:8080/api/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatePayload)
            });

            if (res.ok) {
                alert("Profile updated successfully!");
            } else {
                alert("Failed to update profile");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error saving profile");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "personal", label: "Personal Info", icon: <User size={18} /> },
        { id: "vehicles", label: "My Vehicles", icon: <Car size={18} /> },
        { id: "payment", label: "Payment & Billing", icon: <CreditCard size={18} /> },
        { id: "preferences", label: "Preferences", icon: <Bell size={18} /> },
    ];

    return (
        <div className="page-container max-w-5xl">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">My Profile</span>
                </h1>
                <p className="page-subtitle">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar Navigation */}
                <div className="col-span-1">
                    <div className="glass-panel p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id
                                    ? "bg-accent-primary text-white shadow-lg"
                                    : "text-secondary hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                {tab.icon}
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Loyalty Card Summary */}
                    <div className="glass-card mt-6 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Award size={100} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Loyalty Points</h3>
                        <p className="text-3xl font-bold text-accent-secondary mb-2">1,240</p>
                        <p className="text-xs text-secondary mb-4">You're a Gold Member!</p>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary w-3/4"></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-secondary">760 pts to Platinum</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-span-1 md:col-span-3">
                    <div className="glass-panel p-6 md:p-8 min-h-[500px]">

                        {/* Personal Info Tab */}
                        {activeTab === "personal" && (
                            <div className="animate-fade-in space-y-6">
                                <h2 className="text-xl font-semibold border-b border-white/10 pb-4 mb-6">Personal Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                            <input
                                                type="text"
                                                value={personalInfo.username}
                                                disabled
                                                className="input-field pl-10 opacity-70 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Role</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                            <input
                                                type="text"
                                                value={personalInfo.role}
                                                disabled
                                                className="input-field pl-10 opacity-70 cursor-not-allowed uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                            <input
                                                type="email"
                                                name="email"
                                                value={personalInfo.email}
                                                onChange={handleInfoChange}
                                                className="input-field pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-secondary">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                            <input
                                                type="text"
                                                name="phone"
                                                value={personalInfo.phone}
                                                onChange={handleInfoChange}
                                                placeholder="+91 98765 43210"
                                                className="input-field pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <label className="text-sm text-secondary">Change Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                            <input
                                                type="password"
                                                placeholder="Enter new password to change"
                                                className="input-field pl-10"
                                            />
                                        </div>
                                        <p className="text-xs text-secondary mt-1">Leave blank to keep current password</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Vehicles Tab */}
                        {activeTab === "vehicles" && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                                    <h2 className="text-xl font-semibold">My Vehicles</h2>
                                    <button className="btn btn-primary text-sm py-2">
                                        + Add Vehicle
                                    </button>
                                </div>

                                <div className="grid gap-4">
                                    {/* Mock Vehicle Card */}
                                    <div className="glass-card p-4 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex-center text-accent-primary">
                                                <Car size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Hyundai Creta</h4>
                                                <p className="text-sm text-secondary">KA 01 AB 1234 • SUV</p>
                                            </div>
                                        </div>
                                        <span className="badge badge-success">Primary</span>
                                    </div>

                                    <div className="glass-card p-4 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-accent-secondary/20 flex-center text-accent-secondary">
                                                <Car size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Honda City</h4>
                                                <p className="text-sm text-secondary">KA 05 CD 5678 • Sedan</p>
                                            </div>
                                        </div>
                                        <button className="text-sm text-secondary hover:text-white transition-colors">Make Primary</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Tab */}
                        {activeTab === "payment" && (
                            <div className="animate-fade-in space-y-6">
                                <h2 className="text-xl font-semibold border-b border-white/10 pb-4 mb-6">Payment Methods</h2>

                                <div className="glass-card p-6 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 mb-6">
                                    <div className="flex justify-between items-start mb-8">
                                        <CreditCard size={32} className="text-white/80" />
                                        <span className="text-white/60 font-mono">DEBIT</span>
                                    </div>
                                    <div className="mb-4">
                                        <p className="font-mono text-xl tracking-widest text-white/90">•••• •••• •••• 4242</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-white/60 mb-1">CARD HOLDER</p>
                                            <p className="text-sm font-medium uppercase">{user?.username || "JOHN DOE"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/60 mb-1">EXPIRES</p>
                                            <p className="text-sm font-medium">12/28</p>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-medium mb-4">Transaction History</h3>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex justify-between items-center p-3 border-b border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex-center">
                                                    <IndianRupee size={14} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Parking at MG Road Mall</p>
                                                    <p className="text-xs text-secondary">25 Jan, 2026 • 2h 30m</p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-success">-₹150.00</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === "preferences" && (
                            <div className="animate-fade-in space-y-8">
                                <div>
                                    <h2 className="text-xl font-semibold border-b border-white/10 pb-4 mb-6">Notifications</h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">Email Notifications</h4>
                                                <p className="text-sm text-secondary">Receive booking confirmations and bills via email</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={preferences.notifyEmail} onChange={() => handlePrefChange("notifyEmail")} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">SMS Notifications</h4>
                                                <p className="text-sm text-secondary">Receive alerts and reminders via SMS</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" checked={preferences.notifySms} onChange={() => handlePrefChange("notifySms")} className="sr-only peer" />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold border-b border-white/10 pb-4 mb-6">Accessibility</h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Special Requirements</label>
                                            <select
                                                value={preferences.accessibility}
                                                onChange={(e) => setPreferences({ ...preferences, accessibility: e.target.value })}
                                                className="input-field w-full md:w-1/2"
                                            >
                                                <option value="NONE">None</option>
                                                <option value="WHEELCHAIR">Wheelchair Access Required</option>
                                                <option value="SENIOR">Senior Citizen Priority</option>
                                                <option value="EXPECTANT">Expectant Mother Priority</option>
                                            </select>
                                            <p className="text-xs text-secondary mt-2">We'll prioritize parking spots near elevators and exits.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button (Global) */}
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn btn-primary px-8"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white"></span>
                                        Saving...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save size={18} />
                                        Save Changes
                                    </span>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// Quick helper component for Indian Rupee icon if not imported
const IndianRupee = ({ size = 24, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 3h12" />
        <path d="M6 8h12" />
        <path d="M6 13h12" />
        <path d="M6 13l5.5 10" />
        <path d="M6 21h7" />
    </svg>
);

export default UserProfile;
