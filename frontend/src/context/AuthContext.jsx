import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    };

    const login = async (username, password) => {
        try {
            const response = await api.post("/auth/signin", { username, password });
            // Backend returns: token, id, username, email, role (string)
            // Frontend expects: accessToken, id, email, roles (array)
            const { token, id, email, role } = response.data;

            // Normalize role to roles array
            const roles = role ? [role] : ["ROLE_DRIVER"];

            const userData = { id, username, email, roles };

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            // Clear the session flag so notification toasts show on fresh login
            sessionStorage.removeItem('parkverse_login_toast_shown');
            setUser(userData);

            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.message || "Login failed. Please check your credentials."
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            // Public signup always creates DRIVER accounts only
            // Other roles are created by system admin
            await api.post("/auth/signup", {
                username,
                email,
                password,
                role: "DRIVER"
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || "Registration failed."
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem('parkverse_login_toast_shown');
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
