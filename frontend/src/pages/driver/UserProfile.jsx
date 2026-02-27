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
        { id: "personal", label: "Personal Info", icon: <User size={16} /> },
        { id: "vehicles", label: "My Vehicles", icon: <Car size={16} /> },
        { id: "payment", label: "Payment & Billing", icon: <CreditCard size={16} /> },
        { id: "preferences", label: "Preferences", icon: <Bell size={16} /> },
    ];

    return (
        <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h1 className="page-title">
                    <span className="gradient-text">My Profile</span>
                </h1>
                <p className="page-subtitle">Manage your account settings and preferences</p>
            </div>

            {/* Horizontal Scrollable Tab Navigation */}
            <div style={{
                marginBottom: '1.5rem',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    padding: '0.375rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)',
                    minWidth: 'max-content',
                }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.625rem 1.25rem',
                                borderRadius: 'var(--radius-md)',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontFamily: 'var(--font-main)',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                transition: 'all 0.2s ease',
                                background: activeTab === tab.id
                                    ? 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)'
                                    : 'transparent',
                                color: activeTab === tab.id
                                    ? '#fff'
                                    : 'var(--text-secondary)',
                                boxShadow: activeTab === tab.id
                                    ? '0 4px 15px rgba(99, 102, 241, 0.3)'
                                    : 'none',
                            }}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Loyalty Card */}
            <div className="glass-card p-6 relative overflow-hidden" style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.08 }}>
                    <Award size={100} />
                </div>
                <div className="flex items-center gap-6" style={{ flexWrap: 'wrap' }}>
                    <div>
                        <h3 className="text-lg font-bold mb-1">Loyalty Points</h3>
                        <p className="text-3xl font-bold" style={{ color: 'var(--accent-secondary)' }}>1,240</p>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <p className="text-xs text-secondary mb-2">You're a Gold Member!</p>
                        <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', width: '75%' }}></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-secondary">760 pts to Platinum</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="glass-panel p-6" style={{ minHeight: '400px' }}>

                {/* Personal Info Tab */}
                {activeTab === "personal" && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h2 className="text-xl font-semibold" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Personal Information</h2>

                        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                            {/* Username */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <User size={14} />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={personalInfo.username}
                                    disabled
                                    className="input-field"
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                />
                            </div>

                            {/* Role */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <Shield size={14} />
                                    Role
                                </label>
                                <input
                                    type="text"
                                    value={personalInfo.role}
                                    disabled
                                    className="input-field"
                                    style={{ opacity: 0.7, cursor: 'not-allowed', textTransform: 'uppercase' }}
                                />
                            </div>

                            {/* Email */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <Mail size={14} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={personalInfo.email}
                                    onChange={handleInfoChange}
                                    className="input-field"
                                />
                            </div>

                            {/* Phone */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <Phone size={14} />
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={personalInfo.phone}
                                    onChange={handleInfoChange}
                                    placeholder="+91 98765 43210"
                                    className="input-field"
                                />
                            </div>

                            {/* Change Password - full width */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    <Lock size={14} />
                                    Change Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="Enter new password to change"
                                    className="input-field"
                                />
                                <p className="text-xs text-secondary" style={{ marginTop: '0.25rem' }}>Leave blank to keep current password</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vehicles Tab */}
                {activeTab === "vehicles" && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                            <h2 className="text-xl font-semibold" style={{ marginBottom: 0 }}>My Vehicles</h2>
                            <button className="btn btn-primary text-sm py-2">
                                + Add Vehicle
                            </button>
                        </div>

                        <div className="grid gap-4">
                            {/* Vehicle Card 1 */}
                            <div className="glass-card p-4 flex justify-between items-center" style={{ cursor: 'pointer' }}>
                                <div className="flex items-center gap-4">
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        background: 'rgba(99, 102, 241, 0.15)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)'
                                    }}>
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold" style={{ marginBottom: '0.125rem' }}>Hyundai Creta</h4>
                                        <p className="text-sm text-secondary">KA 01 AB 1234 • SUV</p>
                                    </div>
                                </div>
                                <span className="badge badge-success">Primary</span>
                            </div>

                            {/* Vehicle Card 2 */}
                            <div className="glass-card p-4 flex justify-between items-center" style={{ cursor: 'pointer' }}>
                                <div className="flex items-center gap-4">
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '50%',
                                        background: 'rgba(129, 140, 248, 0.15)', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', color: 'var(--accent-secondary)'
                                    }}>
                                        <Car size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold" style={{ marginBottom: '0.125rem' }}>Honda City</h4>
                                        <p className="text-sm text-secondary">KA 05 CD 5678 • Sedan</p>
                                    </div>
                                </div>
                                <button className="text-sm text-secondary" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>Make Primary</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Tab */}
                {activeTab === "payment" && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h2 className="text-xl font-semibold" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Payment Methods</h2>

                        <div className="glass-card p-6" style={{
                            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <div className="flex justify-between items-start mb-8">
                                <CreditCard size={32} style={{ color: 'rgba(255,255,255,0.8)' }} />
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>DEBIT</span>
                            </div>
                            <div className="mb-4">
                                <p style={{ fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.9)' }}>•••• •••• •••• 4242</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>CARD HOLDER</p>
                                    <p className="text-sm font-medium" style={{ textTransform: 'uppercase' }}>{user?.username || "JOHN DOE"}</p>
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>EXPIRES</p>
                                    <p className="text-sm font-medium">12/28</p>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-medium" style={{ marginBottom: '0.5rem' }}>Transaction History</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex justify-between items-center p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-center gap-3">
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.05)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <IndianRupee size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Parking at MG Road Mall</p>
                                            <p className="text-xs text-secondary">25 Jan, 2026 • 2h 30m</p>
                                        </div>
                                    </div>
                                    <span style={{ fontFamily: 'monospace', color: 'var(--success)' }}>-₹150.00</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === "preferences" && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <h2 className="text-xl font-semibold" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Notifications</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                            <h2 className="text-xl font-semibold" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Accessibility</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        <Shield size={14} />
                                        Special Requirements
                                    </label>
                                    <select
                                        value={preferences.accessibility}
                                        onChange={(e) => setPreferences({ ...preferences, accessibility: e.target.value })}
                                        className="input-field"
                                        style={{ maxWidth: '350px' }}
                                    >
                                        <option value="NONE">None</option>
                                        <option value="WHEELCHAIR">Wheelchair Access Required</option>
                                        <option value="SENIOR">Senior Citizen Priority</option>
                                        <option value="EXPECTANT">Expectant Mother Priority</option>
                                    </select>
                                    <p className="text-xs text-secondary" style={{ marginTop: '0.5rem' }}>We'll prioritize parking spots near elevators and exits.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Button (Global) */}
                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
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
    );
};

// Quick helper component for Indian Rupee icon
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
