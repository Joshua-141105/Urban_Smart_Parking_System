import { Outlet } from "react-router-dom";

const AuthLayout = () => {
    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: "url('https://images.unsplash.com/photo-1470224114660-3f6686c562eb?q=80&w=2535&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(4px)'
            }}></div>

            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '450px', padding: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
