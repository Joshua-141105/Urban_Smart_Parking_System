import { Outlet } from "react-router-dom";
import { Car } from "lucide-react";

const AuthLayout = () => {
    return (
        <div style={{
            minHeight: '100vh', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: "url('https://images.unsplash.com/photo-1470224114660-3f6686c562eb?q=80&w=2535&auto=format&fit=crop')",
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: 0.08,
                pointerEvents: 'none',
            }} />

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
                pointerEvents: 'none',
            }} />

            {/* Glow orbs */}
            <div style={{
                position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
                width: '500px', height: '400px',
                background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '1.5rem' }}>
                {/* Brand mark above card */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.625rem', marginBottom: '1.75rem',
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    }}>
                        <Car size={18} color="#fff" />
                    </div>
                    <span style={{
                        fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em',
                        background: 'linear-gradient(135deg, #e0e7ff, #a5b4fc)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    }}>ParkVerse</span>
                </div>

                {/* Auth card */}
                <div style={{
                    background: 'rgba(13,18,30,0.92)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '18px',
                    padding: '2.25rem',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;