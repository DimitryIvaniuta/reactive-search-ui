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

    /** Client-side micro-debounce before sending (server also debounces). */
    const sendTerm = useCallback((term: string, delayMs = 120) => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(term);
            }
        }, delayMs) as unknown as number;
    }, []);

    return { state, results, sendTerm };
}
