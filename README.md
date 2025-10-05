# Reactive Search UI

Minimal React + TypeScript + Vite app that connects to a WebSocket search service
(`ws://localhost:8080/ws/search?userId=u1`), sends keystrokes, and renders debounced results.

## Dev setup
```bash
npm i
cp .env.example .env   # edit if needed
npm run dev
