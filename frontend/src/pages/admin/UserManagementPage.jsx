import { useState, useEffect } from "react";
import { UserPlus, Users, ToggleLeft, ToggleRight } from "lucide-react";
import api from "../../api/axios";
import { toast } from "react-toastify";

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "PARKING_MANAGER" });

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
        fetchUsers();
    }, []);

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

    return (
        <div className="page-container max-w-6xl">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">
                        <span className="gradient-text">User Management</span>
                    </h1>
                    <p className="page-subtitle">Manage system administrators and parking managers</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <UserPlus size={18} /> Create User
                </button>
            </div>

            <div className="glass-panel p-6 md:p-8 min-h-[500px]">
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
                                    <th className="text-left py-3 px-2">Phone</th>
                                    <th className="text-left py-3 px-2">Role</th>
                                    <th className="text-left py-3 px-2">Bookings</th>
                                    <th className="text-left py-3 px-2">Status</th>
                                    <th className="text-center py-3 px-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-2">{u.username}</td>
                                        <td className="py-3 px-2 text-secondary">{u.email}</td>
                                        <td className="py-3 px-2 text-secondary">{u.phoneNumber || '—'}</td>
                                        <td className="py-3 px-2">
                                            <span className="badge badge-neutral text-xs">{u.role}</span>
                                        </td>
                                        <td className="py-3 px-2 text-secondary">{u.completedBookings ?? 0}</td>
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
                        {users.length === 0 && (
                            <div className="text-center py-12 text-secondary">
                                <Users size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No users found in the system.</p>
                            </div>
                        )}
                    </div>
                )}
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
                                placeholder="Password (Default: 123456)"
                                className="input-field w-full"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>Leave blank to use default password: 123456</p>
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

export default UserManagementPage;
