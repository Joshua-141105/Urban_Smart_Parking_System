import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    MapPin,
    Clock,
    CreditCard,
    TrendingUp,
    Shield,
    Zap,
    ArrowRight,
    Car,
    Building2,
    BarChart3
} from "lucide-react";

const Home = () => {
    const { user } = useAuth();

    const features = [
        {
            icon: <MapPin size={28} />,
            title: "Real-Time Availability",
            description: "View live parking space availability across the city with our smart IoT sensors.",
            color: "from-emerald-500 to-teal-600"
        },
        {
            icon: <Clock size={28} />,
            title: "Smart Navigation",
            description: "Get the fastest route to available parking with real-time traffic integration.",
            color: "from-blue-500 to-indigo-600"
        },
        {
            icon: <CreditCard size={28} />,
            title: "Seamless Payments",
            description: "Pay digitally with multiple options. No more fumbling for change.",
            color: "from-purple-500 to-pink-600"
        },
        {
            icon: <TrendingUp size={28} />,
            title: "Dynamic Pricing",
            description: "Fair pricing based on demand. Save money during off-peak hours.",
            color: "from-orange-500 to-red-600"
        }
    ];

    const stats = [
        { value: "50+", label: "Parking Locations", icon: <Building2 size={24} /> },
        { value: "1000+", label: "Parking Spaces", icon: <Car size={24} /> },
        { value: "25 min", label: "Avg. Time Saved", icon: <Clock size={24} /> },
        { value: "98%", label: "User Satisfaction", icon: <BarChart3 size={24} /> }
    ];

    return (
        <div className="min-h-screen mesh-gradient">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-panel" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
                <div className="container-wide flex-between py-4">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg flex-center" style={{ background: 'var(--accent-gradient)' }}>
                            <Car size={24} className="text-white" />
                        </div>
                        <span className="text-2xl font-bold gradient-text">EDITH</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary">
                                Go to Dashboard
                                <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost">
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn btn-primary">
                                    Get Started
                                    <ArrowRight size={18} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-22 px-6 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

                <div className="container-wide text-center relative">
                    <div className="animate-fade-in-up">
                        <span className="badge badge-info mb-6">
                            <Zap size={14} className="mr-1" />
                            Smart City Solution
                        </span>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                            Urban Smart Parking
                            <br />
                            <span className="gradient-text">Reimagined</span>
                        </h1>

                        <p className="text-xl text-secondary max-w-2xl mx-auto mb-10">
                            EDITH transforms urban parking with real-time availability, intelligent routing,
                            and dynamic pricing — reducing traffic congestion by up to 30%.
                        </p>

                        <br />

                        <div className="flex flex-wrap justify-center gap-6 mb-10">
                            <Link to={user ? "/find-parking" : "/register"} className="btn btn-primary btn-lg animate-glow">
                                <MapPin size={20} />
                                Find Parking Now
                            </Link>
                            <a href="#features" className="btn btn-secondary btn-lg">
                                Learn More
                            </a>
                        </div>
                        <br />
                    </div>

                    {/* Hero image placeholder - animated map preview */}
                    <div className="mt-12 animate-fade-in delay-300">
                        <div className="glass-panel p-4 max-w-4xl mx-auto">
                            <div className="aspect-video rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)' }}>
                                {/* Simulated map with animated markers */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative w-full h-full">
                                        {/* Grid lines */}
                                        <div className="absolute inset-0" style={{
                                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                                            backgroundSize: '50px 50px'
                                        }}></div>

                                        {/* Animated parking markers */}
                                        {/* Status Bar */}
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-card-static py-3 px-8 w-fit flex items-center justify-center gap-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                                <span className="text-sm font-medium">Available: <span className="text-white ml-1">35</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse delay-100"></div>
                                                <span className="text-sm font-medium">Filling: <span className="text-white ml-1">5</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse delay-200"></div>
                                                <span className="text-sm font-medium">Busy: <span className="text-white ml-1">2</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse delay-300"></div>
                                                <span className="text-sm font-medium">Full: <span className="text-white ml-1">0</span></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6">
                <div className="container-wide">
                    <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="stat-card flex items-center gap-4 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="stat-icon mb-0" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-secondary)' }}>
                                    {stat.icon}
                                </div>
                                <div className="text-left">
                                    <div className="stat-value gradient-text text-2xl md:text-3xl">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6">
                <div className="container-wide">
                    <div className="text-center mb-16 animate-fade-in md:mb-20">
                        <h2 className="text-4xl font-bold mb-6 md-8">
                            Why Choose <span className="gradient-text">EDITH</span>?
                        </h2>
                        <p className="text-secondary text-lg max-w-2xl mx-auto md:text-xl">
                            Our platform combines cutting-edge technology with user-friendly design
                            to solve urban parking challenges.
                        </p>
                        <br></br>
                    </div>

                    <div className="max-w-7xl mx-auto grid grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="glass-card p-6 flex items-center gap-4 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.15}s` }}
                            >
                                <div
                                    className="w-14 h-14 rounded-xl flex-center flex-shrink-0 text-white"
                                    style={{ background: `linear-gradient(135deg, ${feature.color.split(' ')[0].replace('from-', '')} 0%, ${feature.color.split(' ')[1]?.replace('to-', '') || feature.color.split(' ')[0].replace('from-', '')} 100%)`.replace('emerald-500', '#10b981').replace('teal-600', '#0d9488').replace('blue-500', '#3b82f6').replace('indigo-600', '#4f46e5').replace('purple-500', '#a855f7').replace('pink-600', '#db2777').replace('orange-500', '#f97316').replace('red-600', '#dc2626') }}
                                >
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                                    <p className="text-secondary text-sm md:text-base leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="container-wide">
                    <div className="glass-panel p-12 text-center relative overflow-hidden">
                        {/* Background glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>

                        <div className="relative">
                            <Shield size={48} className="mx-auto mb-6 text-accent" />
                            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Parking Experience?</h2>
                            <p className="text-secondary max-w-xl mx-auto mb-8">
                                Join thousands of smart drivers who save time, money, and frustration with EDITH.
                            </p>
                            <Link to={user ? "/find-parking" : "/register"} className="btn btn-primary btn-lg">
                                Get Started Free
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-glass-border">
                <div className="container-wide">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex-center" style={{ background: 'var(--accent-gradient)' }}>
                                <Car size={18} className="text-white" />
                            </div>
                            <span className="text-lg font-bold gradient-text">EDITH</span>
                        </div>

                        <p className="text-muted text-sm">
                            © 2026 EDITH Smart Parking System. Urban Traffic Management Solution.
                        </p>

                        <div className="flex gap-6 text-muted text-sm">
                            <a href="#" className="hover:text-primary">Privacy</a>
                            <a href="#" className="hover:text-primary">Terms</a>
                            <a href="#" className="hover:text-primary">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
