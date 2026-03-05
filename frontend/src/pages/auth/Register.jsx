import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserPlus, User, Mail, Lock } from "lucide-react";

const Register = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const { register } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await register(
            formData.username,
            formData.email,
            formData.password
        );

        setLoading(false);

        if (result.success) {
            navigate("/login");
        } else {
            setError(result.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Create Account</h2>
                <p className="text-secondary text-sm">Join our smart parking community as a driver</p>
            </div>

            {error && (
                <div className="glass-card-static p-3 mb-6 border-l-4 border-l-danger text-danger text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="label">Username</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="username"
                            className="input-field pl-10"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="label">Email Address</label>
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            className="input-field pl-10"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="label">Password</label>
                    <div className="relative">
                        <input
                            type="password"
                            name="password"
                            className="input-field pl-10"
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="btn btn-primary w-full mt-6"
                disabled={loading}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white"></span>
                        Creating Account...
                    </span>
                ) : (
                    <>
                        <UserPlus size={18} /> Sign Up
                    </>
                )}
            </button>

            <p className="text-center mt-4 text-xs text-muted" style={{ lineHeight: 1.5 }}>
                Signing up as a <strong style={{ color: 'var(--accent-secondary)' }}>Driver</strong>. For other roles, contact your system administrator.
            </p>

            <p className="text-center mt-4 text-sm text-secondary">
                Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
            </p>
        </form>
    );
};

export default Register;
