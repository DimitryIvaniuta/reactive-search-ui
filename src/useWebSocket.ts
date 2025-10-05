import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResult } from "./types";

type WsState = "connecting" | "open" | "closing" | "closed";

export function useWebSocket(wsUrl: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const [state, setState] = useState<WsState>("closed");
    const [results, setResults] = useState<SearchResult[]>([]);
    const reconnectRef = useRef(0);
    const timerRef = useRef<number | null>(null);

    const connect = useCallback(() => {
        console.log("connecting...");
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }
        setState("connecting");
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            reconnectRef.current = 0;
            setState("open");
        };

        ws.onmessage = (ev) => {
            try {
                const arr = JSON.parse(ev.data);
                if (Array.isArray(arr)) setResults(arr as SearchResult[]);
            } catch { /* ignore */ }
        };

        ws.onclose = () => {
            setState("closed");
            const backoff = Math.min(4000, 500 * Math.pow(2, reconnectRef.current++));
            window.setTimeout(connect, backoff);
        };

        ws.onerror = () => {
            try { ws.close(); } catch {}
        };
    }, [wsUrl]);

    useEffect(() => {
        connect();
        return () => {
            setState("closing");
            if (timerRef.current) window.clearTimeout(timerRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    /** Clear current results immediately (used when user starts typing or clears input). */
    const clearResults = useCallback(() => {
        setResults([]);
    }, []);

    /** Notify the hook a new search session started (clear + cancel pending send). */
    const beginNewSearch = useCallback(() => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        clearResults();
    }, [clearResults]);

    /** Client-side micro-debounce before sending (server also debounces). */
    const sendTerm = useCallback((term: string, delayMs = 120) => {
        console.log("sendTerm...");
        if (timerRef.current) window.clearTimeout(timerRef.current);
        // If term is empty: clear results and don't send anything
        if (!term || term.trim().length === 0) {
            clearResults();
            return;
        }
        timerRef.current = window.setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log("do SendTerm...");
                wsRef.current.send(term);
            }
        }, delayMs) as unknown as number;
    }, [clearResults]);

    return { state, results, sendTerm, beginNewSearch, clearResults };
}
