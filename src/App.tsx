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
                           onChange={e => setUrl(e.target.value)}/>
                    <span className="status">{statusDot} {state}</span>
                </div>
            </header>

            {/* Scroll container: pins search + grid header, body scrolls */}
            <div className="content">
                {/* Pinned search bar inside scroll container */}
                <section className="search pinned">
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
                            beginNewSearch();             // clear list immediately
                            // If cleared, don't send to server (list already empty)
                            if (v.trim().length === 0) return;
                            sendTerm(v);                  // debounce-send to server
                        }}
                    />
                </section>

                {/* Flex “grid” */}
                <section className="grid flex-grid">
                    {/* Pinned grid header */}
                    <div className="grid-header pinned">
                        <div className="cell col-id">ID</div>
                        <div className="cell col-title">Title</div>
                        <div className="cell col-desc">Description</div>
                        <div className="cell col-score">Score</div>
                    </div>

                    {/* Scrollable rows */}
                    <div className="grid-body">
                        {results.length === 0 ? (
                            <div className="empty">No results</div>
                        ) : (
                            results.map((r: SearchResult) => (
                                <div className="grid-row" key={r.id}>
                                    <div className="cell col-id">{r.id}</div>
                                    <div className="cell col-title">{r.title}</div>
                                    <div className="cell col-desc">{r.description ?? ""}</div>
                                    <div className="cell col-score">{r.score.toFixed(4)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
