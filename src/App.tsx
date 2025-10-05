import { useMemo, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import type { SearchResult } from "./types";
import "./app.css";

export default function App() {
    const defaultUrl = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws/search?userId=u1";
    const [url, setUrl] = useState(defaultUrl);
    const { state, results, sendTerm, beginNewSearch } = useWebSocket(url);
    const [term, setTerm] = useState("");

    const statusDot = useMemo(() => {
        const map: Record<string, string> = { connecting: "🟡", open: "🟢", closing: "🟠", closed: "🔴" };
        return map[state] ?? "⚪";
    }, [state]);

    return (
        <div className="container">
            <header>
                <h1 style={{textWrap: "nowrap"}}>Reactive Search (WS)</h1>
                <div className="row">
                    <input className="ws" value={url}
                           style={{padding: "10px 11px"}}
                           onChange={e => setUrl(e.target.value)} />
                    <span className="status">{statusDot} {state}</span>
                </div>
            </header>

            <section className="search">
                <input
                    autoFocus
                    type="text"
                    placeholder="Type to search…"
                    value={term}
                    style={{padding: 10}}
                    onChange={(e) => {
                        console.log('Change search term')
                        const v = e.target.value;
                        setTerm(v);
                        // Clear current list immediately when user starts typing / changes text
                        beginNewSearch();
                        // If cleared, don't send to server (list already empty)
                        if (v.trim().length === 0) return;
                        sendTerm(v);
                    }}
                />
            </section>

            <section className="grid">
                {results.length === 0 ? (
                    <div className="empty">No results</div>
                ) : (
                    <table>
                        <thead>
                        <tr><th>ID</th><th>Title</th><th>Description</th><th>Score</th></tr>
                        </thead>
                        <tbody>
                        {results.map((r: SearchResult) => (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{r.title}</td>
                                <td>{r.description ?? ""}</td>
                                <td>{r.score.toFixed(4)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}
