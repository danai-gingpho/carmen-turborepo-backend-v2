# Authentication API

> Base URL: `https://{host}:{port}/api/auth`

## Table of Contents

- [Login](#login)
- [Logout](#logout)
- [Register](#register)
- [Invite User](#invite-user)
- [Register Confirm](#register-confirm)
- [Refresh Token](#refresh-token)
- [Forgot Password](#forgot-password)
- [Reset Password with Token](#reset-password-with-token)
- [Reset Password (Admin)](#reset-password-admin)
- [Change Password](#change-password)
- [Test Notification (Deprecated)](#test-notification-deprecated)

## Overview

Authentication endpoints handle user login/logout, registration, invitation flows, and password management. The system uses Keycloak for token validation and JWT for session management.

All endpoints require the `x-app-id` header. Only specific endpoints require Bearer token authentication (noted per endpoint).

---

## Login

**`POST /api/auth/login`**

Authenticate a user with email/username and password. Returns JWT tokens.

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "email": "string — user email address (provide email OR username)",
  "username": "string — username (provide email OR username)",
  "password": "string — required, min 6 characters"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "expires_in": 300,
    "refresh_expires_in": 1800,
    "token_type": "Bearer"
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Validation error (missing password, neither email nor username provided) |
| 401 | Invalid credentials |

---

## Logout

**`POST /api/auth/logout`**

Invalidate the user's session and refresh token.

**Authentication:** KeycloakGuard (Bearer token required)

**Request Body:**

```json
{
  "refresh_token": "string — required, from login response"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "message": "Logout successful"
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid or expired Bearer token |

---

## Register

**`POST /api/auth/register`**

Register a new user account.

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "username": "string — required",
  "email": "string — required, valid email",
  "password": "string — required, min 6 characters",
  "user_info": {
    "first_name": "string — required",
    "middle_name": "string — optional",
    "last_name": "string — required",
    "telephone": "string — optional"
  }
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "status": 201,
  "success": true,
  "message": "Created",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Validation error |
| 409 | Email or username already exists |

---

## Invite User

**`POST /api/auth/invite-user`**

Send an invitation email to a new user. The recipient can complete registration via the register-confirm endpoint.

**Authentication:** KeycloakGuard (Bearer token required)

**Request Body:**

```json
{
  "email": "string — required, valid email address"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "message": "Invitation sent successfully"
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid email format |
| 401 | Unauthorized |

---

## Register Confirm

**`POST /api/auth/register-confirm`**

Complete registration for an invited user using the token from the invitation email.

**Authentication:** None (public endpoint, guard explicitly bypassed)

**Request Body:**

```json
{
  "email_token": "string — required, from invitation email",
  "reference_code": "string — required, invitation reference",
  "password": "string — required, min 6 characters",
  "user_info": {
    "first_name": "string — required",
    "middle_name": "string — optional",
    "last_name": "string — required"
  }
}
```

**Response:** `201 Created`

```json
{
  "data": {
    "id": "uuid",
    "username": "invited_user",
    "email": "invited@example.com"
  },
  "status": 201,
  "success": true,
  "message": "Created",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid or expired token |

---

## Refresh Token

**`POST /api/auth/refresh-token`**

Exchange a refresh token for new access and refresh tokens.

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "refresh_token": "string — required, from login response"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "expires_in": 300,
    "refresh_expires_in": 1800
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Invalid or expired refresh token |

---

## Forgot Password

**`POST /api/auth/forgot-password`**

Initiate password recovery. Sends a reset link to the user's email.

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "email": "string — required, registered email address"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "message": "Password reset email sent"
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid email format |

> Note: Returns 200 even if email not found (to prevent email enumeration).

---

## Reset Password with Token

**`POST /api/auth/reset-password-with-token`**

Reset password using the token received from the forgot-password email.

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "token": "string — required, from reset email link",
  "new_password": "string — required, min 6 characters"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "message": "Password reset successful"
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid or expired token |

---

## Reset Password (Admin)

**`POST /api/auth/reset-password`**

Admin endpoint to force-reset a user's password. Hidden from Swagger documentation.

**Authentication:** KeycloakGuard (Bearer token required)

**Request Body:**

```json
{
  "email": "string — required, target user email",
  "new_password": "string — required, min 6 characters"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "message": "Password reset successful"
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized |
| 404 | User not found |

---

## Change Password

**`POST /api/auth/change-password`**

Change the authenticated user's own password. Requires current password verification.

**Authentication:** KeycloakGuard (Bearer token required)

**Request Body:**

```json
{
  "current_password": "string — required, min 6 characters",
  "new_password": "string — required, min 6 characters"
}
```

**Response:** `200 OK`

```json
{
  "data": {
    "message": "Password changed successfully"
  },
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Current password incorrect |
| 401 | Unauthorized |

---

## Test Notification (Deprecated)

**`GET /api/auth/test-notification`**

> **Deprecated** — Dev/test endpoint. Returns all users.

**Authentication:** None

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "...",
      "email": "..."
    }
  ],
  "status": 200,
  "success": true,
  "message": "Success",
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```
