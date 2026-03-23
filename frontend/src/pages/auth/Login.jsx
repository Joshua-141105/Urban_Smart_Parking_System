import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogIn, User, Lock, Eye, EyeOff } from "lucide-react";

const Login = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const result = await login(formData.username, formData.password);

        setLoading(false);

        if (result.success) {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const userObj = JSON.parse(userStr);
                const roles = userObj.roles || [];
                if (roles.includes("CITY_ADMIN") || roles.includes("SYSTEM_ADMIN")) {
                    navigate("/admin/dashboard");
                } else if (roles.includes("PARKING_MANAGER")) {
                    navigate("/manager/dashboard");
                } else {
                    navigate("/dashboard");
                }
            } else {
                navigate("/dashboard");
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                    border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem', color: '#a5b4fc',
                }}>
                    <LogIn size={22} />
                </div>
                <h2 style={{
                    fontSize: '1.5rem', fontWeight: 700,
                    letterSpacing: '-0.02em', marginBottom: '0.375rem',
                    color: '#f1f5f9',
                }}>Welcome back</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Sign in to continue to your dashboard
                </p>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fca5a5',
                    fontSize: '0.875rem',
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Username */}
                <div>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        fontSize: '0.8125rem', fontWeight: 500,
                        color: 'var(--text-secondary)', marginBottom: '0.5rem',
                    }}>
                        <User size={13} /> Username
                    </label>
                    <input
                        type="text"
                        name="username"
                        className="input-field"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        style={{ borderRadius: '10px' }}
                    />
                </div>

                {/* Password */}
                <div>
                    <label style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        fontSize: '0.8125rem', fontWeight: 500,
                        color: 'var(--text-secondary)', marginBottom: '0.5rem',
                    }}>
                        <Lock size={13} /> Password
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={{ borderRadius: '10px', paddingRight: '2.75rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '0.75rem', top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none', border: 'none',
                                color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
                                display: 'flex', alignItems: 'center',
                            }}
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </div>

                {/* Forgot Password */}
                <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
                    <Link to="/forgot-password" style={{
                        color: '#a5b4fc', fontSize: '0.8125rem', fontWeight: 500,
                        textDecoration: 'none',
                    }}>
                        Forgot Password?
                    </Link>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ marginTop: '1.5rem', borderRadius: '10px', height: '44px' }}
            >
                {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                            width: '15px', height: '15px', borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                            animation: 'spin 0.7s linear infinite',
                        }} />
                        Signing in…
                    </span>
                ) : (
                    <><LogIn size={16} /> Sign In</>
                )}
            </button>

            <p style={{
                textAlign: 'center', marginTop: '1.5rem',
                fontSize: '0.875rem', color: 'var(--text-secondary)',
            }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>
                    Sign up
                </Link>
            </p>
        </form>
    );
};

export default Login;