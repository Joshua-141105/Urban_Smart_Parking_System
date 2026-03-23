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
            icon: <MapPin size={22} />,
            title: "Real-Time Availability",
            description: "View live parking space availability across the city with our smart IoT sensors.",
            gradient: 'linear-gradient(135deg, #10b981, #0d9488)'
        },
        {
            icon: <Clock size={22} />,
            title: "Smart Navigation",
            description: "Get the fastest route to available parking with real-time traffic integration.",
            gradient: 'linear-gradient(135deg, #3b82f6, #4f46e5)'
        },
        {
            icon: <CreditCard size={22} />,
            title: "Seamless Payments",
            description: "Pay digitally with multiple options. No more fumbling for change.",
            gradient: 'linear-gradient(135deg, #a855f7, #db2777)'
        },
        {
            icon: <TrendingUp size={22} />,
            title: "Dynamic Pricing",
            description: "Fair pricing based on demand. Save money during off-peak hours.",
            gradient: 'linear-gradient(135deg, #f97316, #dc2626)'
        }
    ];

    const stats = [
        { value: "50+", label: "Parking Locations", icon: <Building2 size={20} /> },
        { value: "1000+", label: "Parking Spaces", icon: <Car size={20} /> },
        { value: "25 min", label: "Avg. Time Saved", icon: <Clock size={20} /> },
        { value: "98%", label: "User Satisfaction", icon: <BarChart3 size={20} /> }
    ];

    return (
        <div style={{ minHeight: '100vh', width: '100%', background: 'var(--bg-primary)' }}>

            {/* ── NAVBAR ── */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                background: 'rgba(10, 15, 26, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div style={{
                    maxWidth: '1200px', margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 2rem', height: '64px',
                }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
                        <div style={{
                            width: '34px', height: '34px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                        }}>
                            <Car size={17} color="#fff" />
                        </div>
                        <span style={{
                            fontSize: '1.15rem', fontWeight: 700,
                            background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text', letterSpacing: '-0.01em',
                        }}>ParkVerse</span>
                    </Link>

                    {!user && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Link to="/login" style={{
                                padding: '0.5rem 1.125rem',
                                borderRadius: '8px',
                                color: 'var(--text-secondary)',
                                fontWeight: 500, fontSize: '0.875rem',
                                textDecoration: 'none',
                                transition: 'color 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                            >
                                Sign In
                            </Link>
                            <Link to="/register" style={{
                                display: 'flex', alignItems: 'center', gap: '0.375rem',
                                padding: '0.5rem 1.125rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                                textDecoration: 'none',
                                boxShadow: '0 2px 10px rgba(99,102,241,0.35)',
                                transition: 'opacity 0.15s, transform 0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                Get Started <ArrowRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── HERO ── */}
            <section style={{
                paddingTop: '140px', paddingBottom: '80px',
                padding: '140px 2rem 80px',
                position: 'relative', overflow: 'hidden',
                textAlign: 'center',
            }}>
                {/* Background glows */}
                <div style={{
                    position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                    width: '600px', height: '400px',
                    background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', top: '30%', left: '15%',
                    width: '280px', height: '280px',
                    background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(60px)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', top: '20%', right: '15%',
                    width: '220px', height: '220px',
                    background: 'rgba(6,182,212,0.07)', borderRadius: '50%', filter: 'blur(60px)',
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', maxWidth: '760px', margin: '0 auto' }}>
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.35rem 0.875rem',
                        borderRadius: '999px',
                        background: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        color: '#a5b4fc',
                        fontSize: '0.78rem', fontWeight: 600,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        marginBottom: '2rem',
                    }}>
                        <Zap size={12} />
                        Smart City Parking Solution
                    </div>

                    {/* Headline */}
                    <h1 style={{
                        fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                        fontWeight: 800, lineHeight: 1.1,
                        letterSpacing: '-0.03em',
                        marginBottom: '1.5rem',
                        color: '#f1f5f9',
                    }}>
                        Urban Parking,{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>Reimagined</span>
                    </h1>

                    {/* Subheadline */}
                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.75,
                        maxWidth: '560px',
                        margin: '0 auto 2.5rem',
                    }}>
                        ParkVerse transforms urban parking with real-time availability, intelligent routing,
                        and dynamic pricing — reducing traffic congestion by up to 30%.
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.875rem' }}>
                        <Link to={user ? "/find-parking" : "/register"} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.75rem',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 600, fontSize: '0.9375rem',
                            textDecoration: 'none',
                            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; }}
                        >
                            <MapPin size={16} /> Find Parking Now
                        </Link>
                        <a href="#features" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.75rem 1.75rem',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9375rem',
                            textDecoration: 'none',
                            transition: 'background 0.15s, border-color 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            Learn More
                        </a>
                    </div>

                    {user && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <Link to="/dashboard" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.625rem 1.5rem',
                                borderRadius: '8px',
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                color: '#a5b4fc', fontWeight: 600, fontSize: '0.875rem',
                                textDecoration: 'none',
                                transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
                            >
                                Go to Dashboard <ArrowRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* ── STATS ── */}
            <section style={{ padding: '0 2rem 80px' }}>
                <div style={{
                    maxWidth: '1200px', margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                }}>
                    {stats.map((stat, index) => (
                        <div key={index} style={{
                            padding: '1.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '14px',
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            transition: 'border-color 0.2s, background 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '11px', flexShrink: 0,
                                background: 'rgba(99,102,241,0.12)',
                                color: '#a5b4fc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {stat.icon}
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '1.5rem', fontWeight: 800, lineHeight: 1,
                                    marginBottom: '0.25rem',
                                    background: 'linear-gradient(135deg, #f1f5f9, #a5b4fc)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                }}>{stat.value}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" style={{ padding: '0 2rem 100px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Section Header */}
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <h2 style={{
                            fontSize: 'clamp(1.625rem, 3vw, 2.25rem)',
                            fontWeight: 700, letterSpacing: '-0.025em',
                            marginBottom: '0.875rem', color: '#f1f5f9',
                        }}>
                            Why Choose{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>ParkVerse</span>?
                        </h2>
                        <p style={{
                            fontSize: '1rem', color: 'var(--text-secondary)',
                            maxWidth: '480px', margin: '0 auto', lineHeight: 1.7,
                        }}>
                            Our platform combines cutting-edge technology with user-friendly design
                            to solve urban parking challenges.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '1.25rem',
                    }}>
                        {features.map((feature, index) => (
                            <div key={index} style={{
                                padding: '1.75rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '16px',
                                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                                cursor: 'default',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
                                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.25)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '46px', height: '46px', borderRadius: '12px',
                                    background: feature.gradient,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', marginBottom: '1.25rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{
                                    fontSize: '1rem', fontWeight: 650,
                                    marginBottom: '0.625rem', color: '#f1f5f9',
                                    letterSpacing: '-0.01em',
                                }}>{feature.title}</h3>
                                <p style={{
                                    fontSize: '0.875rem', color: 'var(--text-secondary)',
                                    lineHeight: 1.65, margin: 0,
                                }}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER ── */}
            <section style={{ padding: '0 2rem 80px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{
                        padding: '4rem 2rem',
                        borderRadius: '20px',
                        background: 'rgba(99,102,241,0.07)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        textAlign: 'center',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                            width: '400px', height: '300px',
                            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, transparent 65%)',
                            pointerEvents: 'none',
                        }} />
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '14px',
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                color: '#a5b4fc',
                            }}>
                                <Shield size={22} />
                            </div>
                            <h2 style={{
                                fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)',
                                fontWeight: 700, letterSpacing: '-0.02em',
                                marginBottom: '0.875rem', color: '#f1f5f9',
                            }}>Ready to Transform Your Parking Experience?</h2>
                            <p style={{
                                color: 'var(--text-secondary)', maxWidth: '440px',
                                margin: '0 auto 2rem', lineHeight: 1.7, fontSize: '0.9375rem',
                            }}>
                                Join thousands of smart drivers who save time, money, and frustration with ParkVerse.
                            </p>
                            <Link to={user ? "/find-parking" : "/register"} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1.75rem',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', fontWeight: 600, fontSize: '0.9375rem',
                                textDecoration: 'none',
                                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.5)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)'; }}
                            >
                                Get Started Free <ArrowRight size={15} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '2rem',
            }}>
                <div style={{
                    maxWidth: '1200px', margin: '0 auto',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '1rem', textAlign: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Car size={14} color="#fff" />
                        </div>
                        <span style={{
                            fontSize: '0.9375rem', fontWeight: 700,
                            background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>ParkVerse</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        © 2026 ParkVerse Smart Parking System. Urban Traffic Management Solution.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        {['Privacy', 'Terms', 'Contact'].map(item => (
                            <a key={item} href="#" style={{
                                color: 'var(--text-muted)', fontSize: '0.8125rem',
                                textDecoration: 'none', transition: 'color 0.15s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >{item}</a>
                        ))}
                    </div>
                </div>
            </footer>

            {/* ── RESPONSIVE ── */}
            <style>{`
                @media (max-width: 640px) {
                    nav > div { padding: 0 1.25rem !important; }
                    section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
                    footer { padding: 1.5rem 1.25rem !important; }
                }
            `}</style>
        </div>
    );
};

export default Home;