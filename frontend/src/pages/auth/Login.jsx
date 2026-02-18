import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LogIn, User, Lock } from "lucide-react";

const Login = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
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
            navigate("/dashboard");
        } else {
            setError(result.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                <p className="text-secondary text-sm">Sign in to continue to your dashboard</p>
            </div>

            {error && (
                <div className="glass-card-static p-3 mb-6 border-l-4 border-l-danger text-danger text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-8">
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                        <User size={16} className="text-secondary" />
                        <span>Username</span>
                    </label>
                    <input
                        type="text"
                        name="username"
                        className="input-field"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary">
                        <Lock size={16} className="text-secondary" />
                        <span>Password</span>
                    </label>

                    <input
                        type="password"
                        name="password"
                        className="input-field"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

            </div>

            <button
                type="submit"
                className="btn btn-primary w-full mt-8"
                disabled={loading}
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <span className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white"></span>
                        Signing in...
                    </span>
                ) : (
                    <>
                        <LogIn size={18} /> Sign In
                    </>
                )}
            </button>

            <p className="text-center mt-6 text-sm text-secondary">
                Don't have an account? <Link to="/register" className="text-accent font-medium hover:underline">Sign up</Link>
            </p>
        </form>
    );
};

export default Login;
