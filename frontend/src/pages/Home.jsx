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
            gradient: 'linear-gradient(135deg, #10b981, #0d9488)'
        },
        {
            icon: <Clock size={28} />,
            title: "Smart Navigation",
            description: "Get the fastest route to available parking with real-time traffic integration.",
            gradient: 'linear-gradient(135deg, #3b82f6, #4f46e5)'
        },
        {
            icon: <CreditCard size={28} />,
            title: "Seamless Payments",
            description: "Pay digitally with multiple options. No more fumbling for change.",
            gradient: 'linear-gradient(135deg, #a855f7, #db2777)'
        },
        {
            icon: <TrendingUp size={28} />,
            title: "Dynamic Pricing",
            description: "Fair pricing based on demand. Save money during off-peak hours.",
            gradient: 'linear-gradient(135deg, #f97316, #dc2626)'
        }
    ];

    const stats = [
        { value: "50+", label: "Parking Locations", icon: <Building2 size={24} /> },
        { value: "1000+", label: "Parking Spaces", icon: <Car size={24} /> },
        { value: "25 min", label: "Avg. Time Saved", icon: <Clock size={24} /> },
        { value: "98%", label: "User Satisfaction", icon: <BarChart3 size={24} /> }
    ];

    // Shared container style - fluid width, no fixed pixel max-width
    const sectionPad = {
        paddingLeft: '5%',
        paddingRight: '5%',
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%' }} className="mesh-gradient">
            {/* Navigation */}
            <nav className="glass-panel" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1vw 5%',
                }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5vw', textDecoration: 'none' }}>
                        <div style={{
                            width: '3vw', height: '3vw', minWidth: '28px', minHeight: '28px',
                            maxWidth: '44px', maxHeight: '44px',
                            borderRadius: '0.5vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--accent-gradient)',
                        }}>
                            <Car style={{ width: '1.5vw', height: '1.5vw', minWidth: '14px', minHeight: '14px', maxWidth: '24px', maxHeight: '24px' }} className="text-white" />
                        </div>
                        <span className="gradient-text" style={{ fontSize: 'max(1vw, 14px)', fontWeight: 700 }}>EDITH</span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8vw' }}>
                        {!user && (
                            <>
                                <Link to="/login" className="btn btn-ghost" style={{ fontSize: 'max(0.9vw, 12px)', padding: 'max(0.5vw, 6px) max(1.2vw, 12px)' }}>
                                    Sign In
                                </Link>
                                <Link to="/register" className="btn btn-primary" style={{ fontSize: 'max(0.9vw, 12px)', padding: 'max(0.5vw, 6px) max(1.2vw, 12px)' }}>
                                    Get Started <ArrowRight style={{ width: 'max(1vw, 14px)', height: 'max(1vw, 14px)' }} />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                paddingTop: '10vw',
                paddingBottom: '5vw',
                ...sectionPad,
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Background effects */}
                <div style={{
                    position: 'absolute', top: '15%', left: '15%',
                    width: '25vw', height: '25vw',
                    background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(80px)',
                }}></div>
                <div style={{
                    position: 'absolute', bottom: '15%', right: '15%',
                    width: '25vw', height: '25vw',
                    background: 'rgba(139, 92, 246, 0.15)', borderRadius: '50%', filter: 'blur(80px)',
                }}></div>

                <div style={{ maxWidth: '65vw', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
                    <span className="badge badge-info" style={{ marginBottom: '1.5vw', display: 'inline-flex', fontSize: 'max(0.85vw, 13px)', padding: 'max(0.4vw, 5px) max(1vw, 10px)' }}>
                        <Zap style={{ width: 'max(0.8vw, 12px)', height: 'max(0.8vw, 12px)', marginRight: '0.3vw' }} />
                        Smart City Solution
                    </span>

                    <h1 style={{
                        fontSize: 'max(4vw, 28px)',
                        fontWeight: 700, lineHeight: 1.15,
                        marginBottom: '1.5vw',
                        fontFamily: 'var(--font-main)',
                    }}>
                        Urban Smart Parking
                        <br />
                        <span className="gradient-text">Reimagined</span>
                    </h1>

                    <p style={{
                        fontSize: 'max(1.3vw, 15px)',
                        color: 'var(--text-secondary)', lineHeight: 1.7,
                        maxWidth: '50vw', margin: '0 auto',
                        marginBottom: '2.5vw',
                    }}>
                        EDITH transforms urban parking with real-time availability, intelligent routing,
                        and dynamic pricing — reducing traffic congestion by up to 30%.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'max(1vw, 8px)' }}>
                        <Link to={user ? "/find-parking" : "/register"} className="btn btn-primary animate-glow" style={{
                            fontSize: 'max(1.1vw, 14px)',
                            padding: 'max(0.8vw, 10px) max(2vw, 20px)',
                        }}>
                            <MapPin style={{ width: 'max(1.1vw, 14px)', height: 'max(1.1vw, 14px)' }} />
                            Find Parking Now
                        </Link>
                        <a href="#features" className="btn btn-secondary" style={{
                            fontSize: 'max(1.1vw, 14px)',
                            padding: 'max(0.8vw, 10px) max(2vw, 20px)',
                        }}>
                            Learn More
                        </a>
                    </div>

                    {/* Go to Dashboard */}
                    {user && (
                        <div style={{ marginTop: '1.5vw' }}>
                            <Link to="/dashboard" className="btn btn-primary" style={{
                                padding: 'max(0.7vw, 8px) max(2vw, 20px)',
                                fontSize: 'max(1vw, 13px)',
                                boxShadow: '0 0.5vw 2vw rgba(99, 102, 241, 0.4)',
                            }}>
                                Go to Dashboard <ArrowRight style={{ width: 'max(1.1vw, 14px)', height: 'max(1.1vw, 14px)' }} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Stats Section */}
            <section style={{ paddingTop: '4vw', paddingBottom: '4vw', ...sectionPad }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'max(1.2vw, 10px)',
                }}>
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="stat-card animate-fade-in-up"
                            style={{
                                animationDelay: `${index * 0.1}s`,
                                padding: 'max(1.2vw, 12px)',
                                display: 'flex', alignItems: 'center', gap: 'max(0.8vw, 8px)',
                            }}
                        >
                            <div style={{
                                width: 'max(3vw, 32px)', height: 'max(3vw, 32px)',
                                borderRadius: '0.6vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-secondary)', flexShrink: 0,
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div className="gradient-text" style={{
                                    fontSize: 'max(1.6vw, 16px)',
                                    fontWeight: 700, fontFamily: 'var(--font-main)', lineHeight: 1, marginBottom: '0.3vw',
                                }}>{stat.value}</div>
                                <div style={{ fontSize: 'max(0.8vw, 10px)', color: 'var(--text-secondary)' }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="features" style={{ paddingTop: '4vw', paddingBottom: '4vw', ...sectionPad }}>
                <div style={{ textAlign: 'center', marginBottom: '3vw' }} className="animate-fade-in">
                    <h2 style={{
                        fontSize: 'max(2.2vw, 18px)',
                        fontWeight: 700, marginBottom: 'max(0.8vw, 6px)',
                        fontFamily: 'var(--font-main)',
                    }}>
                        Why Choose <span className="gradient-text">EDITH</span>?
                    </h2>
                    <p style={{
                        fontSize: 'max(1vw, 12px)',
                        color: 'var(--text-secondary)', maxWidth: '45vw', margin: '0 auto', lineHeight: 1.7,
                    }}>
                        Our platform combines cutting-edge technology with user-friendly design
                        to solve urban parking challenges.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'max(1.2vw, 10px)',
                }}>
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="glass-card animate-fade-in-up"
                            style={{
                                padding: 'max(1.5vw, 14px)',
                                animationDelay: `${index * 0.15}s`,
                                display: 'flex', flexDirection: 'column', gap: 'max(0.8vw, 8px)',
                            }}
                        >
                            <div style={{
                                width: 'max(3.2vw, 36px)', height: 'max(3.2vw, 36px)',
                                borderRadius: '0.7vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: feature.gradient, color: '#fff', flexShrink: 0,
                            }}>
                                {feature.icon}
                            </div>
                            <div>
                                <h3 style={{
                                    fontSize: 'max(1.1vw, 13px)',
                                    fontWeight: 600, marginBottom: '0.3vw',
                                    fontFamily: 'var(--font-main)',
                                }}>{feature.title}</h3>
                                <p style={{
                                    fontSize: 'max(0.85vw, 11px)',
                                    color: 'var(--text-secondary)', lineHeight: 1.6,
                                }}>{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ paddingTop: '4vw', paddingBottom: '4vw', ...sectionPad }}>
                <div className="glass-panel" style={{
                    padding: 'max(3.5vw, 24px) max(2.5vw, 16px)',
                    textAlign: 'center', position: 'relative', overflow: 'hidden',
                }}>
                    {/* Background glow */}
                    <div style={{
                        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                        width: '30vw', height: '15vw',
                        background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(60px)',
                    }}></div>

                    <div style={{ position: 'relative' }}>
                        <Shield style={{ width: 'max(2.5vw, 28px)', height: 'max(2.5vw, 28px)', margin: '0 auto', marginBottom: '1.5vw', color: 'var(--accent-secondary)' }} />
                        <h2 style={{
                            fontSize: 'max(1.8vw, 16px)',
                            fontWeight: 700, marginBottom: 'max(0.8vw, 6px)',
                            fontFamily: 'var(--font-main)',
                        }}>Ready to Transform Your Parking Experience?</h2>
                        <p style={{
                            color: 'var(--text-secondary)', maxWidth: '40vw', margin: '0 auto',
                            marginBottom: '2vw', lineHeight: 1.7,
                            fontSize: 'max(0.9vw, 11px)',
                        }}>
                            Join thousands of smart drivers who save time, money, and frustration with EDITH.
                        </p>
                        <Link to={user ? "/find-parking" : "/register"} className="btn btn-primary" style={{
                            fontSize: 'max(0.95vw, 12px)',
                            padding: 'max(0.7vw, 8px) max(1.8vw, 16px)',
                        }}>
                            Get Started Free <ArrowRight style={{ width: 'max(1.1vw, 14px)', height: 'max(1.1vw, 14px)' }} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid var(--glass-border)',
                padding: 'max(2.5vw, 16px) 5%',
                marginTop: '2vw',
            }}>
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 'max(1vw, 8px)', textAlign: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5vw' }}>
                        <div style={{
                            width: 'max(2vw, 24px)', height: 'max(2vw, 24px)',
                            borderRadius: '0.4vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--accent-gradient)',
                        }}>
                            <Car style={{ width: 'max(1.1vw, 12px)', height: 'max(1.1vw, 12px)' }} className="text-white" />
                        </div>
                        <span className="gradient-text" style={{ fontSize: 'max(1vw, 13px)', fontWeight: 700 }}>EDITH</span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: 'max(0.8vw, 10px)' }}>
                        © 2026 EDITH Smart Parking System. Urban Traffic Management Solution.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'max(1.5vw, 12px)' }}>
                        <a href="#" style={{ color: 'var(--text-muted)', fontSize: 'max(0.8vw, 10px)', transition: 'color 0.2s', textDecoration: 'none' }}>Privacy</a>
                        <a href="#" style={{ color: 'var(--text-muted)', fontSize: 'max(0.8vw, 10px)', transition: 'color 0.2s', textDecoration: 'none' }}>Terms</a>
                        <a href="#" style={{ color: 'var(--text-muted)', fontSize: 'max(0.8vw, 10px)', transition: 'color 0.2s', textDecoration: 'none' }}>Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
