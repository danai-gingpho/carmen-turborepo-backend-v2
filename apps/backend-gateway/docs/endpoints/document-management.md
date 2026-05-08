# Document Management API

> Base URL: `https://{host}:{port}/api/:bu_code/documents`

## Table of Contents

- [Upload Document](#upload-document)
- [List Documents](#list-documents)
- [Get Document Content](#get-document-content)
- [Get Document Info](#get-document-info)
- [Get Presigned URL](#get-presigned-url)
- [Delete Document](#delete-document)

## Overview

Document management endpoints handle file upload, download, and metadata operations. Files are stored via the micro-file service and referenced by file tokens.

**Authentication:** All endpoints require `KeycloakGuard` + `AppIdGuard` + `x-app-id` header.

---

## Upload Document

**`POST /api/:bu_code/documents/upload`**

**AppIdGuard:** `documents.upload`

Upload a file using multipart/form-data.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | File to upload |

**Response:** `201 Created`

---

## List Documents

**`GET /api/:bu_code/documents`**

**AppIdGuard:** `documents.list`

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

## Get Document Content

**`GET /api/:bu_code/documents/:filetoken`**

**AppIdGuard:** `documents.get`

Retrieve the document file content by file token.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filetoken` | string | Yes | File token identifier |

**Response:** `200 OK` — File content

---

## Get Document Info

**`GET /api/:bu_code/documents/:filetoken/info`**

**AppIdGuard:** `documents.info`

Get document metadata (filename, size, content type, upload date, etc.) without downloading the file.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filetoken` | string | Yes | File token identifier |

**Response:** `200 OK`

---

## Get Presigned URL

**`GET /api/:bu_code/documents/:filetoken/presigned-url`**

**AppIdGuard:** `documents.presignedUrl`

Generate a temporary presigned URL for direct file download.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filetoken` | string | Yes | File token identifier |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `expirySeconds` | number | No | URL expiry duration in seconds |

**Response:** `200 OK`

---

## Delete Document

**`DELETE /api/:bu_code/documents/:filetoken`**

**AppIdGuard:** `documents.delete`

Delete a document by file token.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filetoken` | string | Yes | File token identifier |

**Response:** `200 OK`
