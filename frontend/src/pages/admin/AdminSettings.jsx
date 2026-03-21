import { useState, useEffect } from "react";
import { User, Mail, Phone, Bell, Shield, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "react-toastify";

const AdminSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("personal");
    const [loading, setLoading] = useState(false);

    // Personal Info Form
    const [personalInfo, setPersonalInfo] = useState({
        username: "",
        email: "",
        phone: "",
        role: ""
    });

    // Notification Preferences
    const [preferences, setPreferences] = useState({
        notifyEmail: true,
        notifySms: false,
        notifyPush: true
    });

    // Note: User Management has been extracted to UserManagementPage.jsx

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/me');
                const userData = res.data;
                setPersonalInfo({
                    username: userData.username || "",
                    email: userData.email || "",
                    phone: userData.phoneNumber || "",
                    role: userData.role || ""
                });
                setPreferences({
                    notifyEmail: userData.notifyEmail ?? true,
                    notifySms: userData.notifySms ?? false,
                    notifyPush: userData.notifyPush ?? true
                });
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
            await api.put('/users/me', {
                phoneNumber: personalInfo.phone,
                notifyEmail: preferences.notifyEmail,
                notifySms: preferences.notifySms,
                notifyPush: preferences.notifyPush
            });
            toast.success("Settings saved successfully!");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    // User Management logic previously here is now in UserManagementPage.jsx

    const tabs = [
        { id: "personal", label: "Profile", icon: <User size={18} /> },
        { id: "preferences", label: "Preferences", icon: <Bell size={18} /> }
    ];

    return (
        <div className="page-container max-w-5xl">
            <div className="page-header">
                <h1 className="page-title">
                    <span className="gradient-text">Admin Settings</span>
                </h1>
                <p className="page-subtitle">Manage account and system settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
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
                </div>

                {/* Main Content */}
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
                                        <label className="text-sm text-secondary">Email</label>
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
                                        <label className="text-sm text-secondary">Phone</label>
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
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === "preferences" && (
                            <div className="animate-fade-in space-y-6">
                                <h2 className="text-xl font-semibold border-b border-white/10 pb-4 mb-6">Notifications</h2>
                                <div className="space-y-4">
                                    {[
                                        { key: "notifyEmail", label: "Email Notifications", desc: "Receive system alerts via email" },
                                        { key: "notifySms", label: "SMS Notifications", desc: "Receive alerts via SMS" },
                                        { key: "notifyPush", label: "Push Notifications", desc: "Browser push notifications" }
                                    ].map((pref) => (
                                        <div key={pref.key} className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">{pref.label}</h4>
                                                <p className="text-sm text-secondary">{pref.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences[pref.key]}
                                                    onChange={() => handlePrefChange(pref.key)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Removed User Management Tab Here */}

                        {/* Save Button */}
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                            <button onClick={handleSave} disabled={loading} className="btn btn-primary px-8">
                                {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Removed Create User Modal */}
        </div>
    );
};

export default AdminSettings;
