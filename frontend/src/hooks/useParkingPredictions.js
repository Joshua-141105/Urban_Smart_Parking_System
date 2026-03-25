import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";

/**
 * useParkingPredictions
 * ──────────────────────
 * Fetches ML predictions for a list of parking lot IDs in parallel.
 * Results are cached in a ref for 3 minutes to avoid hammering the backend.
 *
 * @param {number[]} lotIds  - Array of parking lot IDs
 * @returns {{ predictions: Object, loading: boolean, error: string|null }}
 *   predictions = { [lotId]: { predictedAvailability, demandScore,
 *                              confidenceLevel, fillingFastAlert,
 *                              recommendationScore, message, ... } }
 */
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const useParkingPredictions = (lotIds = []) => {
    const [predictions, setPredictions] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cache: { lotId -> { data, timestamp } }
    const cacheRef = useRef({});

    const fetchPredictions = useCallback(async (ids) => {
        if (!ids || ids.length === 0) return;

        setLoading(true);
        setError(null);

        const now = Date.now();
        const stale = ids.filter(id => {
            const entry = cacheRef.current[id];
            return !entry || (now - entry.timestamp > CACHE_TTL_MS);
        });

        if (stale.length === 0) {
            // All cached — rebuild from cache
            const result = {};
            ids.forEach(id => { result[id] = cacheRef.current[id].data; });
            setPredictions(result);
            setLoading(false);
            return;
        }

        try {
            const settled = await Promise.allSettled(
                stale.map(id =>
                    api.get(`/parking/prediction/${id}`)
                        .then(res => ({ id, data: res.data }))
                )
            );

            settled.forEach(r => {
                if (r.status === "fulfilled") {
                    const { id, data } = r.value;
                    cacheRef.current[id] = { data, timestamp: Date.now() };
                }
            });

            // Merge fresh + still-valid cached entries
            const result = {};
            ids.forEach(id => {
                if (cacheRef.current[id]) {
                    result[id] = cacheRef.current[id].data;
                }
            });
            setPredictions(result);
        } catch (err) {
            console.error("Failed to fetch parking predictions:", err);
            setError("ML predictions unavailable");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (lotIds.length > 0) {
            fetchPredictions(lotIds);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(lotIds)]);

    const refresh = useCallback(() => {
        // Invalidate cache and re-fetch
        cacheRef.current = {};
        fetchPredictions(lotIds);
    }, [fetchPredictions, lotIds]);

    return { predictions, loading, error, refresh };
};

export default useParkingPredictions;
