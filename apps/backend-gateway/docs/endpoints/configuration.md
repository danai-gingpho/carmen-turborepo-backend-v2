# Configuration API

> Base URL: `https://{host}:{port}/api/config/:bu_code`

## Table of Contents

- [General Configuration](#general-configuration)
  - [Currencies](#currencies)
  - [Departments](#departments)
  - [Department Users](#department-users)
  - [Exchange Rates](#exchange-rates)
  - [Credit Terms](#credit-terms)
  - [Tax Profiles](#tax-profiles)
  - [Units](#units)
  - [Unit Comments](#unit-comments)
  - [Running Codes](#running-codes)
  - [Delivery Points](#delivery-points)
  - [Adjustment Types](#adjustment-types)
  - [Extra Cost Types](#extra-cost-types)
- [Product Configuration](#product-configuration)
  - [Products](#products)
  - [Product Categories](#product-categories)
  - [Product Sub-Categories](#product-sub-categories)
  - [Product Item Groups](#product-item-groups)
  - [Product-Location Mapping](#product-location-mapping)
  - [Location-Product Mapping](#location-product-mapping)
- [Location Configuration](#location-configuration)
  - [Locations](#locations)
  - [Location Users](#location-users)
  - [User-Location Mapping](#user-location-mapping)
- [Vendor Configuration](#vendor-configuration)
  - [Vendors](#vendors)
  - [Vendor Business Types](#vendor-business-types)
- [Price List Configuration](#price-list-configuration)
  - [Price Lists](#price-lists)
- [Recipe Configuration](#recipe-configuration)
  - [Recipes](#recipes)
  - [Recipe Categories](#recipe-categories)
  - [Recipe Cuisines](#recipe-cuisines)
  - [Recipe Equipment](#recipe-equipment)
- [Workflow & Access Configuration](#workflow--access-configuration)
  - [Workflows](#workflows)
  - [Permissions](#permissions)
  - [Application Roles](#application-roles)
  - [User Application Roles](#user-application-roles)

## Overview

Configuration endpoints manage tenant-scoped master data and settings. All endpoints are under `/api/config/:bu_code/` where `:bu_code` identifies the business unit.

**Authentication:** All endpoints require `KeycloakGuard` + `AppIdGuard` + `x-app-id` header.

**Common Pattern:** Most configuration entities follow standard CRUD with 5-6 endpoints:
- `GET /` — List all (paginated)
- `GET /:id` — Get by ID
- `POST /` — Create
- `PUT /:id` or `PATCH /:id` — Update
- `DELETE /:id` — Soft delete

---

## General Configuration

### Currencies

**Base Path:** `/api/config/:bu_code/currencies`

Manage currency definitions for the business unit.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `currencies.findAll` | 200 | List all currencies |
| GET | `/:id` | `currencies.findOne` | 200 | Get currency by ID |
| POST | `/` | `currencies.create` | 201 | Create currency |
| PUT | `/:id` | `currencies.update` | 200 | Full update |
| PATCH | `/:id` | `currencies.patch` | 200 | Partial update |
| DELETE | `/:id` | `currencies.delete` | 200 | Delete currency |

**Create/Update Body:**

```json
{
  "code": "string — ISO 4217 code (e.g., THB, USD)",
  "name": "string — display name",
  "symbol": "string — currency symbol",
  "decimal_places": "number — decimal precision",
  "is_active": "boolean"
}
```

**Response Schema:** `CurrencyResponseSchema`

---

### Departments

**Base Path:** `/api/config/:bu_code/departments`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `departments.findAll` | 200 | List departments |
| GET | `/:id` | `departments.findOne` | 200 | Get department by ID |
| POST | `/` | `departments.create` | 201 | Create department |
| PATCH | `/:id` | `departments.update` | 200 | Update department |
| DELETE | `/:id` | `departments.delete` | 200 | Delete department |

**Create/Update Body:**

```json
{
  "name": "string — required",
  "code": "string — required, unique within BU",
  "description": "string — optional",
  "is_active": "boolean"
}
```

**Response Schemas:** `DepartmentListItemResponseSchema`, `DepartmentDetailResponseSchema`, `DepartmentMutationResponseSchema`

---

### Department Users

**Base Path:** `/api/config/:bu_code/department-user`

Manage user assignments to departments.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `department-user.findAll` | 200 | List department-user mappings |
| GET | `/:id` | `department-user.findOne` | 200 | Get mapping by ID |
| POST | `/` | `department-user.create` | 201 | Assign user to department |
| PUT | `/:id` | `department-user.update` | 200 | Update assignment |
| DELETE | `/:id` | `department-user.remove` | 200 | Remove assignment |

---

### Exchange Rates

**Base Path:** `/api/config/:bu_code/exchange-rate`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `exchange-rate.findAll` | 200 | List exchange rates |
| GET | `/:id` | `exchange-rate.findOne` | 200 | Get rate by ID |
| POST | `/` | `exchange-rate.create` | 201 | Create rate (supports bulk) |
| PATCH | `/:id` | `exchange-rate.update` | 200 | Update rate |
| DELETE | `/:id` | `exchange-rate.delete` | 200 | Delete rate |

**Create/Update Body:**

```json
{
  "from_currency_id": "uuid",
  "to_currency_id": "uuid",
  "rate": "number — exchange rate value",
  "effective_date": "string — ISO date"
}
```

**Response Schemas:** `ExchangeRateListItemResponseSchema`, `ExchangeRateDetailResponseSchema`, `ExchangeRateMutationResponseSchema`

---

### Credit Terms

**Base Path:** `/api/config/:bu_code/credit-term`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `credit-term.findAll` | 200 | List credit terms |
| GET | `/:id` | `credit-term.findOne` | 200 | Get credit term by ID |
| POST | `/` | `credit-term.create` | 201 | Create credit term |
| PATCH | `/:id` | `credit-term.update` | 200 | Update credit term |
| DELETE | `/:id` | `credit-term.delete` | 200 | Delete credit term |

**Create/Update Body:**

```json
{
  "name": "string — required",
  "code": "string — required",
  "days": "number — payment due days",
  "description": "string — optional",
  "is_active": "boolean"
}
```

**Response Schemas:** `CreditTermListItemResponseSchema`, `CreditTermDetailResponseSchema`, `CreditTermMutationResponseSchema`

---

### Tax Profiles

**Base Path:** `/api/config/:bu_code/tax-profile`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `tax-profile.findAll` | 200 | List tax profiles |
| GET | `/:id` | `tax-profile.findOne` | 200 | Get tax profile by ID |
| POST | `/` | `tax-profile.create` | 201 | Create tax profile |
| PATCH | `/:id` | `tax-profile.update` | 200 | Update tax profile |
| DELETE | `/:id` | `tax-profile.delete` | 200 | Delete tax profile |

**Create/Update Body:**

```json
{
  "name": "string — required",
  "code": "string — required",
  "rate": "number — tax rate percentage",
  "description": "string — optional",
  "is_active": "boolean"
}
```

**Response Schemas:** `TaxProfileListItemResponseSchema`, `TaxProfileDetailResponseSchema`, `TaxProfileMutationResponseSchema`

---

### Units

**Base Path:** `/api/config/:bu_code/units`

Manage units of measurement.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `units.findAll` | 200 | List units |
| GET | `/:id` | `units.findOne` | 200 | Get unit by ID |
| POST | `/` | `units.create` | 201 | Create unit |
| PUT | `/:id` | `units.update` | 200 | Update unit |
| DELETE | `/:id` | `units.delete` | 200 | Delete unit |

**Response Schemas:** `UnitListItemResponseSchema`, `UnitDetailResponseSchema`, `UnitMutationResponseSchema`

---

### Unit Comments

**Base Path:** `/api/config/:bu_code/unit-comment`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `unit-comment.findAll` | 200 | List unit comments |
| GET | `/:id` | `unit-comment.findOne` | 200 | Get comment by ID |
| POST | `/` | `unit-comment.create` | 201 | Create comment |
| PUT | `/:id` | `unit-comment.update` | 200 | Update comment |
| DELETE | `/:id` | `unit-comment.remove` | 200 | Delete comment |

---

### Running Codes

**Base Path:** `/api/config/:bu_code/running-code`

Manage document number sequences (e.g., PR-0001, PO-0001).

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `running-code.findAll` | 200 | List all running codes |
| GET | `/:id` | `running-code.findOne` | 200 | Get by ID |
| GET | `/result/:type` | `running-code.findByType` | 200 | Get by document type |
| POST | `/` | `running-code.create` | 201 | Create running code |
| PUT | `/:id` | `running-code.update` | 200 | Update running code |
| DELETE | `/:id` | `running-code.remove` | 200 | Delete running code |

**Path Parameters (for findByType):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Document type (e.g., `purchase-request`, `purchase-order`) |

---

### Delivery Points

**Base Path:** `/api/config/:bu_code/delivery-point`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `delivery-point.findAll` | 200 | List delivery points |
| GET | `/:id` | `delivery-point.findOne` | 200 | Get by ID |
| POST | `/` | `delivery-point.create` | 201 | Create |
| PUT | `/:id` | `delivery-point.update` | 200 | Full update |
| PATCH | `/:id` | `delivery-point.patch` | 200 | Partial update |
| DELETE | `/:id` | `delivery-point.delete` | 200 | Delete |

**Response Schema:** `DeliveryPointResponseSchema`

---

### Adjustment Types

**Base Path:** `/api/config/:bu_code/adjustment-type`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `adjustment-type.findAll` | 200 | List adjustment types |
| GET | `/:id` | `adjustment-type.findOne` | 200 | Get by ID |
| POST | `/` | `adjustment-type.create` | 201 | Create |
| PUT | `/:id` | `adjustment-type.update` | 200 | Update |
| DELETE | `/:id` | `adjustment-type.delete` | 200 | Delete |

---

### Extra Cost Types

**Base Path:** `/api/config/:bu_code/extra-cost-type`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `extra-cost-type.findAll` | 200 | List extra cost types |
| GET | `/:id` | `extra-cost-type.findOne` | 200 | Get by ID |
| POST | `/` | `extra-cost-type.create` | 201 | Create |
| PATCH | `/:id` | `extra-cost-type.update` | 200 | Update |
| DELETE | `/:id` | `extra-cost-type.delete` | 200 | Delete |

**Response Schemas:** `ExtraCostTypeListItemResponseSchema`, `ExtraCostTypeDetailResponseSchema`, `ExtraCostTypeMutationResponseSchema`

---

## Product Configuration

### Products

**Base Path:** `/api/config/:bu_code/products`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `products.findAll` | 200 | List products |
| GET | `/:id` | `products.findOne` | 200 | Get product by ID |
| GET | `/item-group/:id` | `products.findItemGroup` | 200 | Get products by item group |
| POST | `/` | `products.create` | 201 | Create product |
| PATCH | `/:id` | `products.update` | 200 | Update product |
| DELETE | `/:id` | `products.delete` | 200 | Delete product |

**Response Schemas:** `ProductListItemResponseSchema`, `ProductDetailResponseSchema`, `ProductMutationResponseSchema`, `ProductItemGroupResponseSchema`

---

### Product Categories

**Base Path:** `/api/config/:bu_code/products/category`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `product-category.findAll` | 200 | List categories |
| GET | `/:id` | `product-category.findOne` | 200 | Get by ID |
| POST | `/` | `product-category.create` | 201 | Create category |
| PUT | `/:id` | `product-category.update` | 200 | Update category |
| DELETE | `/:id` | `product-category.delete` | 200 | Delete category |

**Response Schemas:** `ProductCategoryListItemResponseSchema`, `ProductCategoryDetailResponseSchema`, `ProductCategoryMutationResponseSchema`

---

### Product Sub-Categories

**Base Path:** `/api/config/:bu_code/products/sub-category`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `product-sub-category.findAll` | 200 | List sub-categories |
| GET | `/:id` | `product-sub-category.findOne` | 200 | Get by ID |
| POST | `/` | `product-sub-category.create` | 201 | Create sub-category |
| PUT | `/:id` | `product-sub-category.update` | 200 | Update sub-category |
| DELETE | `/:id` | `product-sub-category.remove` | 200 | Delete sub-category |

**Response Schemas:** `ProductSubCategoryListItemResponseSchema`, `ProductSubCategoryDetailResponseSchema`, `ProductSubCategoryMutationResponseSchema`

---

### Product Item Groups

**Base Path:** `/api/config/:bu_code/products/item-group`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `product-item-group.findAll` | 200 | List item groups |
| GET | `/:id` | `product-item-group.findOne` | 200 | Get by ID |
| POST | `/` | `product-item-group.create` | 201 | Create item group |
| PUT | `/:id` | `product-item-group.update` | 200 | Update item group |
| DELETE | `/:id` | `product-item-group.delete` | 200 | Delete item group |

**Response Schemas:** `ProductItemGroupListItemResponseSchema`, `ProductItemGroupDetailResponseSchema`, `ProductItemGroupMutationResponseSchema`

---

### Product-Location Mapping

**Base Path:** `/api/config/:bu_code/product/location`

Read-only: get locations assigned to a specific product.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:productId` | `product-location.getLocationsByProductId` | 200 | Get locations for product |

---

### Location-Product Mapping

**Base Path:** `/api/config/:bu_code/location-product`

Read-only: get products assigned to a specific location.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:locationId` | `location-product.getProductByLocationId` | 200 | Get products for location |

---

## Location Configuration

### Locations

**Base Path:** `/api/config/:bu_code/locations`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `locations.findAll` | 200 | List locations |
| GET | `/:id` | `locations.findOne` | 200 | Get location by ID |
| POST | `/` | `locations.create` | 201 | Create location |
| PATCH | `/:id` | `locations.update` | 200 | Update location |
| DELETE | `/:id` | `locations.delete` | 200 | Delete location |

**GET /:id Additional Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `withUser` | boolean | false | Include assigned users |
| `withProducts` | boolean | false | Include assigned products |

**Response Schemas:** `LocationListItemResponseSchema`, `LocationDetailResponseSchema`, `LocationMutationResponseSchema`

---

### Location Users

**Base Path:** `/api/config/:bu_code/locations/user`

Manage which users have access to a specific location.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:userId` | `locations-user.getLocationByUserId` | 200 | Get locations for user |
| PUT | `/:userId` | `locations-user.managerLocationUser` | 200 | Update user's location access |

---

### User-Location Mapping

**Base Path:** `/api/config/:bu_code/user/location`

Manage which users are assigned to a specific location.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:locationId` | `user-location.getUsersByLocationId` | 200 | Get users for location |
| PUT | `/:locationId` | `user-location.managerUserLocation` | 200 | Update location's user assignments |

---

## Vendor Configuration

### Vendors

**Base Path:** `/api/config/:bu_code/vendors`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `vendors.findAll` | 200 | List vendors |
| GET | `/:id` | `vendors.findOne` | 200 | Get vendor by ID |
| POST | `/` | `vendors.create` | 201 | Create vendor |
| PUT | `/:id` | `vendors.update` | 200 | Update vendor |
| DELETE | `/:id` | `vendors.delete` | 200 | Delete vendor |

**Response Schemas:** `VendorListItemResponseSchema`, `VendorDetailResponseSchema`, `VendorMutationResponseSchema`

---

### Vendor Business Types

**Base Path:** `/api/config/:bu_code/vendor-business-type`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `vendor-business-type.findAll` | 200 | List vendor business types |
| GET | `/:id` | `vendor-business-type.findOne` | 200 | Get by ID |
| POST | `/` | `vendor-business-type.create` | 201 | Create |
| PATCH | `/:id` | `vendor-business-type.update` | 200 | Update |
| DELETE | `/:id` | `vendor-business-type.delete` | 200 | Delete |

---

## Price List Configuration

### Price Lists

**Base Path:** `/api/config/:bu_code/price-list`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `price-list.findAll` | 200 | List price lists |
| GET | `/:id` | `price-list.findOne` | 200 | Get by ID |
| POST | `/` | `price-list.create` | 201 | Create price list |
| PATCH | `/:id` | `price-list.update` | 200 | Update price list |
| DELETE | `/:id` | `price-list.remove` | 200 | Delete price list |
| POST | `/upload-excel` | `price-list.uploadExcel` | 200 | Import from Excel file |
| GET | `/:id/download-excel` | `price-list.downloadExcel` | 200 | Export to Excel file |
| POST | `/import-csv` | `price-list.importCsv` | 200 | Import from CSV (multipart/form-data) |

**File Upload (import-csv):**
- Content-Type: `multipart/form-data`
- Field: `file` — CSV file

---

## Recipe Configuration

### Recipes

**Base Path:** `/api/config/:bu_code/recipe`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `recipe.findAll` | 200 | List recipes |
| GET | `/:id` | `recipe.findOne` | 200 | Get by ID |
| POST | `/` | `recipe.create` | 201 | Create recipe |
| PUT | `/:id` | `recipe.update` | 200 | Full update |
| PATCH | `/:id` | `recipe.patch` | 200 | Partial update |
| DELETE | `/:id` | `recipe.delete` | 200 | Delete recipe |

**Response Schema:** `RecipeResponseSchema`

---

### Recipe Categories

**Base Path:** `/api/config/:bu_code/recipe-category`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `recipe-category.findAll` | 200 | List categories |
| GET | `/:id` | `recipe-category.findOne` | 200 | Get by ID |
| POST | `/` | `recipe-category.create` | 201 | Create |
| PUT | `/:id` | `recipe-category.update` | 200 | Full update |
| PATCH | `/:id` | `recipe-category.patch` | 200 | Partial update |
| DELETE | `/:id` | `recipe-category.delete` | 200 | Delete |

**Response Schema:** `RecipeCategoryResponseSchema`

---

### Recipe Cuisines

**Base Path:** `/api/config/:bu_code/recipe-cuisine`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `recipe-cuisine.findAll` | 200 | List cuisines |
| GET | `/:id` | `recipe-cuisine.findOne` | 200 | Get by ID |
| POST | `/` | `recipe-cuisine.create` | 201 | Create |
| PUT | `/:id` | `recipe-cuisine.update` | 200 | Full update |
| PATCH | `/:id` | `recipe-cuisine.patch` | 200 | Partial update |
| DELETE | `/:id` | `recipe-cuisine.delete` | 200 | Delete |

**Response Schema:** `RecipeCuisineResponseSchema`

---

### Recipe Equipment

**Base Path:** `/api/config/:bu_code/recipe-equipment`

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `recipe-equipment.findAll` | 200 | List equipment |
| GET | `/:id` | `recipe-equipment.findOne` | 200 | Get by ID |
| POST | `/` | `recipe-equipment.create` | 201 | Create |
| PUT | `/:id` | `recipe-equipment.update` | 200 | Full update |
| PATCH | `/:id` | `recipe-equipment.patch` | 200 | Partial update |
| DELETE | `/:id` | `recipe-equipment.delete` | 200 | Delete |

**Response Schema:** `RecipeEquipmentResponseSchema`

---

## Workflow & Access Configuration

### Workflows

**Base Path:** `/api/config/:bu_code/workflows`

Define approval workflows for documents (PR, PO, SR, etc.).

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `workflows.findAll` | 200 | List workflows |
| GET | `/:id` | `workflows.findOne` | 200 | Get by ID |
| POST | `/` | `workflows.create` | 201 | Create workflow |
| PUT | `/:id` | `workflows.update` | 200 | Update workflow |
| DELETE | `/:id` | `workflows.delete` | 200 | Delete workflow |

**Response Schemas:** `WorkflowListItemResponseSchema`, `WorkflowDetailResponseSchema`, `WorkflowMutationResponseSchema`

---

### Permissions

**Base Path:** `/api/config/:bu_code/permissions`

Read-only: list all granular permissions available for the business unit.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | `permissions.findAll` | 200 | List all permissions |

---

### Application Roles

**Base Path:** `/api/config/:bu_code/application-roles`

Manage roles within a business unit context.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/` | — | 200 | List roles |
| GET | `/:id` | — | 200 | Get role by ID |
| POST | `/` | — | 201 | Create role |
| PUT | `/:id` | — | 200 | Update role |
| DELETE | `/:id` | — | 200 | Delete role |

---

### User Application Roles

**Base Path:** `/api/config/:bu_code/user-application-roles`

Manage role assignments for users within a business unit.

| Method | Path | AppIdGuard | Status | Description |
|--------|------|------------|--------|-------------|
| GET | `/:user_id` | — | 200 | Get roles for user |
| POST | `/` | — | 201 | Assign roles to user |
| PATCH | `/` | — | 200 | Update role assignment |
| DELETE | `/` | — | 200 | Remove roles from user |
