import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Bell, Shield, Save, UserPlus, Users, ToggleLeft, ToggleRight } from "lucide-react";
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

    // User Management
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "PARKING_MANAGER" });

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

    // User Management Functions
    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers();
        }
    }, [activeTab]);

    const handleCreateUser = async () => {
        try {
            await api.post('/admin/users', newUser);
            toast.success("User created successfully!");
            setShowCreateModal(false);
            setNewUser({ username: "", email: "", password: "", role: "PARKING_MANAGER" });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create user");
        }
    };

    const handleToggleActive = async (userId, currentStatus) => {
        try {
            const endpoint = currentStatus ? 'deactivate' : 'activate';
            await api.put(`/admin/users/${userId}/${endpoint}`);
            toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}!`);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update user status");
        }
    };

    const tabs = [
        { id: "personal", label: "Profile", icon: <User size={18} /> },
        { id: "preferences", label: "Preferences", icon: <Bell size={18} /> },
        { id: "users", label: "User Management", icon: <Users size={18} /> }
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

                        {/* User Management Tab */}
                        {activeTab === "users" && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                                    <h2 className="text-xl font-semibold">User Management</h2>
                                    <button className="btn btn-primary text-sm" onClick={() => setShowCreateModal(true)}>
                                        <UserPlus size={16} /> Create User
                                    </button>
                                </div>

                                {usersLoading ? (
                                    <div className="flex-center py-12">
                                        <div className="animate-spin w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 px-2">Username</th>
                                                    <th className="text-left py-3 px-2">Email</th>
                                                    <th className="text-left py-3 px-2">Role</th>
                                                    <th className="text-left py-3 px-2">Status</th>
                                                    <th className="text-center py-3 px-2">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((u) => (
                                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="py-3 px-2">{u.username}</td>
                                                        <td className="py-3 px-2 text-secondary">{u.email}</td>
                                                        <td className="py-3 px-2">
                                                            <span className="badge badge-neutral text-xs">{u.role}</span>
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'} text-xs`}>
                                                                {u.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2 text-center">
                                                            <button
                                                                onClick={() => handleToggleActive(u.id, u.isActive)}
                                                                className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                                                                title={u.isActive ? 'Deactivate' : 'Activate'}
                                                            >
                                                                {u.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save Button */}
                        {activeTab !== "users" && (
                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                                <button onClick={handleSave} disabled={loading} className="btn btn-primary px-8">
                                    {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex-center z-50" onClick={() => setShowCreateModal(false)}>
                    <div className="glass-panel p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-semibold mb-4">Create New User</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Username"
                                className="input-field w-full"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                className="input-field w-full"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="input-field w-full"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                            <select
                                className="input-field w-full"
                                value={newUser.role}
                                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            >
                                <option value="PARKING_MANAGER">Parking Manager</option>
                                <option value="CITY_ADMIN">City Admin</option>
                            </select>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button className="btn btn-secondary flex-1" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn btn-primary flex-1" onClick={handleCreateUser}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
