import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, User, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../api/axios";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1 = enter username/email, 2 = enter new password
    const [usernameOrEmail, setUsernameOrEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleNext = async (e) => {
        e.preventDefault();
        setError("");
        if (!usernameOrEmail.trim()) {
            setError("Please enter your username or email.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/verify-user", {
                usernameOrEmail: usernameOrEmail.trim()
            });
            setStep(2);
        } catch (err) {
            const msg = err.response?.data?.message || "No account found with that username or email.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/reset-password", {
                usernameOrEmail: usernameOrEmail.trim(),
                newPassword
            });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to reset password. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="animate-fade-in text-center">
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <CheckCircle size={32} style={{ color: '#10b981' }} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                <p className="text-secondary text-sm mb-6">
                    Your password has been changed successfully. Redirecting to login...
                </p>
                <div
                    className="animate-spin mx-auto"
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255,255,255,0.1)',
                        borderTopColor: 'var(--accent-primary)'
                    }}
                ></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-8">
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: 'var(--accent-primary)'
                }}>
                    <KeyRound size={28} />
                </div>
                <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
                <p className="text-secondary text-sm">
                    {step === 1
                        ? "Enter your username or email to get started"
                        : "Set your new password"
                    }
                </p>
            </div>

            {error && (
                <div className="glass-card-static p-3 mb-6 border-l-4 border-l-danger text-danger text-sm">
                    {error}
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleNext}>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                            <User size={16} className="text-secondary" />
                            <span>Username or Email</span>
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter your username or email"
                            value={usernameOrEmail}
                            onChange={(e) => setUsernameOrEmail(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-full mt-6" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white"></span>
                                Verifying...
                            </span>
                        ) : (
                            "Continue"
                        )}
                    </button>

                    <p className="text-center mt-6 text-sm text-secondary">
                        Remember your password?{" "}
                        <Link to="/login" className="text-accent font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </form>
            ) : (
                <form onSubmit={handleReset}>
                    <div className="space-y-8">
                        {/* Identity display */}
                        <div className="p-3 flex items-center gap-3" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                            <User size={16} className="text-accent" style={{ flexShrink: 0 }} />
                            <span className="text-sm" style={{ wordBreak: 'break-all' }}>{usernameOrEmail}</span>
                            <button
                                type="button"
                                onClick={() => { setStep(1); setError(""); }}
                                className="text-accent text-xs hover:underline"
                                style={{ marginLeft: 'auto', flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Change
                            </button>
                        </div>

                        {/* New Password */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                                <Lock size={16} className="text-secondary" />
                                <span>New Password</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-field"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoFocus
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '4px'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                                <Lock size={16} className="text-secondary" />
                                <span>Confirm Password</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    className="input-field"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '4px'
                                    }}
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
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
                                Resetting...
                            </span>
                        ) : (
                            <>
                                <KeyRound size={18} /> Reset Password
                            </>
                        )}
                    </button>

                    <p className="text-center mt-6 text-sm text-secondary">
                        <Link to="/login" className="btn-back mx-auto mt-2" style={{ display: 'inline-flex' }}>
                            <ArrowLeft size={18} /> Back to Sign In
                        </Link>
                    </p>
                </form>
            )}
        </div>
    );
};

export default ForgotPassword;
