import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#818cf8' }}>Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check role if allowedRoles is provided
    if (allowedRoles && allowedRoles.length > 0) {
        // Backend returns roles as array of strings, e.g. ["ROLE_DRIVER"] or ["DRIVER"]
        // SRS says: DRIVER, PARKING_MANAGER, CITY_ADMIN, SYSTEM_ADMIN
        // Let's assume backend might send "ROLE_" prefix or not. We should check loosely.

        // Normalizing user roles (e.g. "ROLE_DRIVER" -> "DRIVER")
        const userRoles = user.roles.map(r => r.replace("ROLE_", ""));

        const hasPermission = allowedRoles.some(role => userRoles.includes(role));

        if (!hasPermission) {
            // User is logged in but doesn't have permission
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
