import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserPlus, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Register = () => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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

        const result = await register(formData.username, formData.email, formData.password);

        setLoading(false);

        if (result.success) {
            navigate("/login");
        } else {
            setError(result.message);
        }
    };

    const fields = [
        { name: 'username', label: 'Username', type: 'text', placeholder: 'Choose a username', icon: <User size={13} /> },
        { name: 'email', label: 'Email Address', type: 'email', placeholder: 'name@example.com', icon: <Mail size={13} /> },
    ];

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
                    <UserPlus size={22} />
                </div>
                <h2 style={{
                    fontSize: '1.5rem', fontWeight: 700,
                    letterSpacing: '-0.02em', marginBottom: '0.375rem',
                    color: '#f1f5f9',
                }}>Create account</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Join our smart parking community as a driver
                </p>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '0.75rem 1rem', marginBottom: '1.25rem',
                    borderRadius: '10px',
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#fca5a5', fontSize: '0.875rem',
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {fields.map(field => (
                    <div key={field.name}>
                        <label style={{
                            display: 'flex', alignItems: 'center', gap: '0.375rem',
                            fontSize: '0.8125rem', fontWeight: 500,
                            color: 'var(--text-secondary)', marginBottom: '0.5rem',
                        }}>
                            {field.icon} {field.label}
                        </label>
                        <input
                            type={field.type}
                            name={field.name}
                            className="input-field"
                            placeholder={field.placeholder}
                            value={formData[field.name]}
                            onChange={handleChange}
                            required
                            style={{ borderRadius: '10px' }}
                        />
                    </div>
                ))}

                {/* Password with toggle */}
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
                            placeholder="Create a strong password (min. 6 chars)"
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
                        Creating Account…
                    </span>
                ) : (
                    <><UserPlus size={16} /> Sign Up</>
                )}
            </button>

            {/* Role note */}
            <p style={{
                textAlign: 'center', marginTop: '1rem',
                fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5,
            }}>
                Signing up as a{' '}
                <strong style={{ color: '#a5b4fc' }}>Driver</strong>.
                {' '}For other roles, contact your system administrator.
            </p>

            <p style={{
                textAlign: 'center', marginTop: '1.25rem',
                fontSize: '0.875rem', color: 'var(--text-secondary)',
            }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}>
                    Sign in
                </Link>
            </p>
        </form>
    );
};

export default Register;