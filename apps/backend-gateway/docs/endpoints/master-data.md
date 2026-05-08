# Master Data API

> Base URL: `https://{host}:{port}/api/:bu_code`

## Table of Contents

- [Products by Location](#products-by-location)
- [Currencies (Active)](#currencies-active)
- [Currencies (All ISO)](#currencies-all-iso)
- [Locations (User-Accessible)](#locations-user-accessible)
- [Departments](#departments)
- [Tax Profiles](#tax-profiles)
- [Credit Terms](#credit-terms)
- [Unit Conversion](#unit-conversion)
- [Vendor Products](#vendor-products)
- [Price List (Compare)](#price-list-compare)
- [Price List Templates](#price-list-templates)
- [Periods](#periods)
- [News](#news)
- [Check Price List (Token-Based)](#check-price-list-token-based)

## Overview

Master data endpoints provide application-level read views and operational data for business units. These are distinct from the configuration endpoints — they serve the application layer (procurement, inventory) with filtered, contextual data.

**Authentication:** All endpoints require `KeycloakGuard` + `AppIdGuard` + `x-app-id` header.

---

## Products by Location

**`GET /api/:bu_code/products/locations/:id`**

**AppIdGuard:** `products.getByLocation`

Get products assigned to a specific location, with pagination.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bu_code` | string | Yes | Business unit code |
| `id` | UUID | Yes | Location ID |

**Query Parameters:** Standard pagination

**Response:** `200 OK` — Serialized with `ProductLocationListItemResponseSchema`

---

## Currencies (Active)

**`GET /api/:bu_code/currencies`**

**AppIdGuard:** `currencies.findAllActive`

Get all active currencies for the business unit.

**Query Parameters:** Standard pagination

**Response:** `200 OK` — Serialized with `CurrencyListItemResponseSchema`

---

## Currencies (All ISO)

**`GET /api/currencies`**

> Note: No `:bu_code` prefix — returns all ISO 4217 currencies.

Get the complete list of ISO 4217 currencies.

**Response:** `200 OK`

---

## Locations (User-Accessible)

**`GET /api/:bu_code/locations`**

**AppIdGuard:** `locations.findAll`

Get locations accessible to the authenticated user.

**Response:** `200 OK` — Serialized with `LocationListItemResponseSchema`

---

## Departments

**`GET /api/:bu_code/department`**

**AppIdGuard:** `department.findAll`

Get all departments for the business unit.

**Query Parameters:** Standard pagination

**Response:** `200 OK` — Serialized with `DepartmentListItemResponseSchema`

---

## Tax Profiles

**Base Path:** `/api/:bu_code/tax-profile`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `taxProfile.findAll` | 200 | List tax profiles |
| GET | `/:id` | `taxProfile.findOne` | 200 | Get tax profile by ID |

**Response:** Serialized with `TaxProfileDetailResponseSchema`

---

## Credit Terms

**Base Path:** `/api/:bu_code/credit-term`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `creditTerm.findAll` | 200 | List credit terms |
| GET | `/:id` | `creditTerm.findOne` | 200 | Get credit term by ID |

**Response:** Serialized with `CreditTermListItemResponseSchema`

---

## Unit Conversion

**Base Path:** `/api/:bu_code/unit`

Get available units for a product in different contexts.

### Order Units

**`GET /api/:bu_code/unit/order/product/:productId`**

Get units available for ordering a specific product.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | UUID | Yes | Product ID |

**Response:** `200 OK`

### Ingredient Units

**`GET /api/:bu_code/unit/ingredient/product/:productId`**

Get units available for a product when used as an ingredient.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `productId` | UUID | Yes | Product ID |

**Response:** `200 OK`

---

## Vendor Products

**Base Path:** `/api/:bu_code/vendor-product`

Manage vendor-product mappings (which vendors supply which products).

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `vendorProduct.findAll` | 200 | List vendor-product mappings |
| GET | `/:id` | `vendorProduct.findOne` | 200 | Get mapping by ID |
| POST | `/` | `vendorProduct.create` | 201 | Create mapping |
| PUT | `/:id` | `vendorProduct.update` | 200 | Update mapping |
| DELETE | `/:id` | `vendorProduct.delete` | 200 | Delete mapping |

---

## Price List (Compare)

**`GET /api/:bu_code/price-list/price-compare`**

**AppIdGuard:** `priceList.priceCompare`

Compare prices across multiple price lists.

**Query Parameters:** Standard pagination

**Response:** `200 OK`

---

## Price List Templates

**Base Path:** `/api/:bu_code/price-list-template`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `priceListTemplate.findAll` | 200 | List templates |
| GET | `/:id` | `priceListTemplate.findOne` | 200 | Get template by ID |
| POST | `/` | `priceListTemplate.create` | 201 | Create template |
| PATCH | `/:id` | `priceListTemplate.update` | 200 | Update template |
| DELETE | `/:id` | `priceListTemplate.delete` | 200 | Delete template |
| PATCH | `/:id/status` | `priceListTemplate.updateStatus` | 200 | Update template status |

---

## Periods

**Base Path:** `/api/:bu_code/period`

Manage accounting/operational periods.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `period.findAll` | 200 | List periods |
| GET | `/:id` | `period.findOne` | 200 | Get period by ID |

---

## News

**Base Path:** `/api/news`

> Note: No `:bu_code` prefix.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `news.findAll` | 200 | List news/announcements |
| GET | `/:id` | `news.findOne` | 200 | Get news by ID |

---

## Check Price List (Token-Based)

**Base Path:** `/api/check-price-list`

> Note: No `:bu_code` prefix. Uses `UrlTokenGuard` instead of `KeycloakGuard` — accessed via a URL token for external vendor price list validation.

### Validate Price List

**`POST /api/check-price-list/:url_token`**

**Guard:** `UrlTokenGuard` (not KeycloakGuard)

Validate a price list submission via a unique URL token sent to the vendor.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url_token` | string | Yes | Unique URL token for vendor access |

**Response:** `200 OK`
