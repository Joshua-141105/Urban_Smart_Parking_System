import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        return {
            isConnected: false,
            occupancyUpdates: {},
            priceAlerts: [],
            lockUpdates: {}
        };
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [occupancyUpdates, setOccupancyUpdates] = useState({});
    const [priceAlerts, setPriceAlerts] = useState([]);
    const [lockUpdates, setLockUpdates] = useState({});
    const [bookingUpdates, setBookingUpdates] = useState([]);
    const [connectionError, setConnectionError] = useState(null);
    const clientRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (!user) return;

        // Clean up existing connection
        if (clientRef.current) {
            clientRef.current.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
            debug: (str) => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('[WS]', str);
                }
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('WebSocket Connected');
                setIsConnected(true);
                setConnectionError(null);

                // Subscribe to occupancy updates
                client.subscribe('/topic/parking/occupancy', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        setOccupancyUpdates(prev => ({
                            ...prev,
                            [data.lotId]: {
                                availableSlots: data.availableSlots,
                                totalCapacity: data.totalCapacity,
                                occupancyPercent: data.occupancyPercent,
                                timestamp: new Date().toISOString()
                            }
                        }));
                    } catch (e) {
                        console.error('Error parsing occupancy update:', e);
                    }
                });

                // Subscribe to price alerts
                client.subscribe('/topic/parking/price', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        setPriceAlerts(prev => [
                            {
                                id: Date.now(),
                                lotId: data.lotId,
                                lotName: data.lotName,
                                oldPrice: data.oldPrice,
                                newPrice: data.newPrice,
                                timestamp: new Date().toISOString()
                            },
                            ...prev.slice(0, 9) // Keep only last 10 alerts
                        ]);
                    } catch (e) {
                        console.error('Error parsing price alert:', e);
                    }
                });

                // Subscribe to user-specific booking updates
                client.subscribe(`/topic/user/${user.id}/bookings`, (message) => {
                    try {
                        const booking = JSON.parse(message.body);
                        setBookingUpdates(prev => [booking, ...prev.slice(0, 9)]);

                        // Also show a toast/notification if needed? 
                        // For now just state update.
                    } catch (e) {
                        console.error('Error parsing booking update:', e);
                    }
                });

                // Subscribe to lock updates
                client.subscribe('/topic/parking/locks', (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        // Ensure spaceId is stored as number for consistent key lookup
                        const spaceId = Number(data.spaceId);
                        console.log('[WS] Lock update received:', { spaceId, isLocked: data.isLocked });
                        setLockUpdates(prev => ({
                            ...prev,
                            [spaceId]: data.isLocked
                        }));
                    } catch (e) {
                        console.error('Error parsing lock update:', e);
                    }
                });
            },
            onDisconnect: () => {
                console.log('WebSocket Disconnected');
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
                setConnectionError('Connection error occurred');
                setIsConnected(false);
            },
            onWebSocketError: (event) => {
                console.error('WebSocket Error:', event);
                setConnectionError('WebSocket connection failed');
                setIsConnected(false);
            }
        });

        try {
            client.activate();
            clientRef.current = client;
        } catch (error) {
            console.error('Failed to activate WebSocket:', error);
            setConnectionError('Failed to connect');
        }
    }, [user]);

    // Connect when user logs in
    useEffect(() => {
        if (user) {
            connect();
        }

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [user, connect]);

    // Method to manually reconnect
    const reconnect = useCallback(() => {
        setConnectionError(null);
        connect();
    }, [connect]);

    // Method to send messages (if needed)
    const sendMessage = useCallback((destination, body) => {
        if (clientRef.current && isConnected) {
            clientRef.current.publish({
                destination,
                body: JSON.stringify(body)
            });
        }
    }, [isConnected]);

    const value = {
        isConnected,
        connectionError,
        occupancyUpdates,
        priceAlerts,
        lockUpdates,
        bookingUpdates,
        reconnect,
        sendMessage
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export default WebSocketContext;
