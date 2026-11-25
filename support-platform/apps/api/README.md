Support Platform API

- REST endpoints:
  - GET /support/requests
  - POST /support/requests
  - PATCH /support/requests
- SSE stream: GET /support/stream
- WebSocket: ws://localhost:4500/support/ws

Auth

- Send Authorization: Bearer <token>
- For WebSocket, pass ?token=<token>
