# Notification API

> Base URL: `https://{host}:{port}/api/notifications`

## Table of Contents

- [Overview](#overview)
- [Proxy Endpoints](#proxy-endpoints)
- [WebSocket](#websocket)

## Overview

The notification controller acts as a **pure HTTP proxy** to the `micro-notification` service. It forwards all requests to `http://{NOTIFICATION_SERVICE_HOST}:{NOTIFICATION_SERVICE_HTTP_PORT}` and returns the upstream response directly.

**Authentication:** No `KeycloakGuard` or `PermissionGuard` applied on proxy endpoints.

**Headers:** Requires `x-app-id` header. All request headers (string values) are forwarded to the upstream service. The `Content-Type` is set to `application/json`.

**Error Handling:** Returns `500` with `{ error: "..." }` if the proxy request fails.

---

## Proxy Endpoints

### Proxy Root

**`GET /api/notifications`**

Proxies to the notification service root. Typically returns the user's notification list.

**Response:** Passthrough from micro-notification service.

---

### Proxy All Paths

**`ALL /api/notifications/*path`**

Catch-all proxy that forwards any HTTP method and subpath to the notification service.

**Examples:**
- `GET /api/notifications/unread` → proxied to notification service `/unread`
- `POST /api/notifications/mark-read` → proxied to notification service `/mark-read`
- `GET /api/notifications/count` → proxied to notification service `/count`

**Response:** Passthrough from micro-notification service with matching HTTP status code.

---

## WebSocket

Real-time notifications are delivered via WebSocket connections.

### Socket.IO Gateway

**Path:** `/ws` (configured at gateway level)

**Events:**

| Event | Direction | Description |
|-------|-----------|-------------|
| `register` | Client → Server | Register for notifications (subscribe to user's channel) |
| `markAsRead` | Client → Server | Mark notification(s) as read |
| `notification` | Server → Client | New notification pushed to client |

### Native WebSocket Gateway

An additional native WebSocket gateway connects to micro-notification for internal event forwarding.

**Connection:** `ws://{NOTIFICATION_SERVICE_HOST}:{NOTIFICATION_SERVICE_HTTP_PORT}`

### Request/Response DTOs

**NotificationProxyRequestDto:**

```json
{
  "body": "any — request payload forwarded to notification service"
}
```

**NotificationProxyResponseDto:**

```json
{
  "data": "any",
  "status": 200,
  "success": true,
  "message": "string",
  "timestamp": "string"
}
```

**NotificationProxyErrorResponseDto:**

```json
{
  "error": "string — error message"
}
```
