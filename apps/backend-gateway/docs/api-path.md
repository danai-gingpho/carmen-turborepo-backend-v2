# API Path Reference

## Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with email/username |
| POST | `/api/auth/logout` | Logout (invalidate tokens) |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/invite-user` | Send invitation email |
| POST | `/api/auth/register-confirm` | Confirm invited user registration |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/forgot-password` | Initiate password recovery |
| POST | `/api/auth/reset-password-with-token` | Reset password with email token |
| POST | `/api/auth/reset-password` | Admin: force reset user password |
| POST | `/api/auth/change-password` | Change own password |

## Platform Admin

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/api-system/cluster[/:id]` | Cluster CRUD |
| GET/POST/PUT/DELETE | `/api-system/business-unit[/:id]` | Business unit CRUD |
| GET/POST/PUT/DELETE | `/api-system/user[/:id]` | Platform user CRUD |
| GET/POST/PUT/DELETE | `/api-system/application-role[/:id]` | Application role CRUD |
| GET/POST/PUT/DELETE | `/api-system/application-permission[/:id]` | Permission CRUD |
| GET/POST/PUT/DELETE | `/api-system/application-role-permission[/:id]` | Role-permission mapping |
| GET/POST/PUT/DELETE | `/api-system/user-business-unit[/:id]` | User-BU assignment |
| GET/POST/PUT/DELETE | `/api-system/user-cluster[/:id]` | User-cluster assignment |

## Configuration (all under `/api/config/:bu_code/`)

| Method | Path | Description |
|--------|------|-------------|
| CRUD | `currencies[/:id]` | Currency configuration |
| CRUD | `departments[/:id]` | Department configuration |
| CRUD | `locations[/:id]` | Location/warehouse configuration |
| CRUD | `products[/:id]` | Product configuration |
| CRUD | `vendors[/:id]` | Vendor configuration |
| CRUD | `units[/:id]` | Unit of measurement |
| CRUD | `credit-term[/:id]` | Credit term configuration |
| CRUD | `exchange-rate[/:id]` | Exchange rate configuration |
| CRUD | `delivery-point[/:id]` | Delivery point configuration |
| CRUD | `adjustment-type[/:id]` | Adjustment type configuration |
| CRUD | `tax-profile[/:id]` | Tax profile configuration |
| CRUD | `product-category[/:id]` | Product category configuration |
| CRUD | `product-sub-category[/:id]` | Product sub-category configuration |
| CRUD | `product-item-group[/:id]` | Product item group configuration |
| CRUD | `running-code[/:id]` | Running code/sequence configuration |
| CRUD | `extra-cost-type[/:id]` | Extra cost type configuration |
| CRUD | `unit-comment[/:id]` | Unit comment configuration |
| CRUD | `application-roles[/:id]` | Application role configuration |
| CRUD | `user-application-roles[/:id]` | User-role assignment |
| CRUD | `workflows[/:id]` | Workflow configuration |
| CRUD | `permissions[/:id]` | Permission configuration |
| CRUD | `price-list[/:id]` | Price list configuration |
| CRUD | `recipe[/:id]` | Recipe configuration |
| CRUD | `recipe-category[/:id]` | Recipe category configuration |
| CRUD | `recipe-cuisine[/:id]` | Recipe cuisine configuration |
| CRUD | `recipe-equipment[/:id]` | Recipe equipment configuration |
| CRUD | `vendor-business-type[/:id]` | Vendor business type configuration |
| GET | `location-product/:locationId` | Products by location |
| GET/PUT | `locations/user/:userId` | Location-user assignments |
| GET | `product/location/:productId` | Locations by product |
| GET/PUT | `user/location/:locationId` | User-location assignments |
| GET/PUT | `department/user/:departmentId` | Department-user assignments |

## Application (all under `/api/:bu_code/` unless noted)

### Procurement

| Method | Path | Description |
|--------|------|-------------|
| CRUD | `purchase-request[/:id]` | Purchase request CRUD |
| PATCH | `purchase-request/:id/submit` | Submit PR |
| PATCH | `purchase-request/:id/approve` | Approve PR |
| PATCH | `purchase-request/:id/reject` | Reject PR |
| PATCH | `purchase-request/:id/review` | Review PR |
| PATCH | `purchase-request/:id/save` | Save PR changes |
| POST | `purchase-request/duplicate-pr` | Duplicate PR |
| POST | `purchase-request/:id/split` | Split PR |
| GET | `purchase-request/:id/export` | Export PR to Excel |
| GET | `purchase-request/:id/print` | Print PR to PDF |
| CRUD | `purchase-order[/:id]` | Purchase order CRUD |
| PATCH | `purchase-order/:id/save` | Save PO changes |
| PATCH | `purchase-order/:id/approve` | Approve PO |
| PATCH | `purchase-order/:id/reject` | Reject PO |
| PATCH | `purchase-order/:id/review` | Review PO |
| POST | `purchase-order/:id/cancel` | Cancel PO |
| POST | `purchase-order/:id/close` | Close PO |
| POST | `purchase-order/group-pr` | Group PRs for PO creation |
| POST | `purchase-order/confirm-pr` | Confirm PRs to create POs |
| GET | `purchase-order/:id/export` | Export PO to Excel |
| GET | `purchase-order/:id/print` | Print PO to PDF |
| CRUD | `good-received-note[/:id]` | Good received note CRUD |
| CRUD | `store-requisition[/:id]` | Store requisition CRUD |
| CRUD | `credit-note[/:id]` | Credit note CRUD |
| CRUD | `request-for-pricing[/:id]` | Request for pricing CRUD |

### Inventory

| Method | Path | Description |
|--------|------|-------------|
| CRUD | `stock-in[/:id]` | Stock-in CRUD |
| CRUD | `stock-out[/:id]` | Stock-out CRUD |
| CRUD | `transfer[/:id]` | Transfer CRUD |
| CRUD | `inventory-adjustment[/:id]` | Inventory adjustment CRUD |
| CRUD | `physical-count[/:id]` | Physical count CRUD |
| CRUD | `spot-check[/:id]` | Spot check CRUD |
| CRUD | `physical-count-period[/:id]` | Physical count period CRUD |

### Master Data & Other

| Method | Path | Description |
|--------|------|-------------|
| GET | `products/locations/:id` | Products by location (read-only) |
| CRUD | `currencies[/:id]` | Currency management |
| CRUD | `credit-term[/:id]` | Credit term management |
| CRUD | `department[/:id]` | Department management |
| CRUD | `locations[/:id]` | Location management |
| CRUD | `tax-profile[/:id]` | Tax profile management |
| CRUD | `unit-conversion[/:id]` | Unit conversion management |
| CRUD | `vendor-product[/:id]` | Vendor-product mapping |
| CRUD | `workflow[/:id]` | Workflow management |
| CRUD | `price-list[/:id]` | Price list management |
| CRUD | `price-list-template[/:id]` | Price list template management |
| CRUD | `news[/:id]` | News/announcements |
| CRUD | `period[/:id]` | Accounting period management |
| GET | `activity-log` | Activity log viewer |
| GET | `user-location` | User location assignments |
| POST | `business-unit/default` | Set default business unit |

## My Pending (under `/api/my-pending/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `purchase-request` | List pending PRs |
| GET | `purchase-order` | List pending POs |
| GET | `store-requisition` | List pending SRs |
| GET | `my-approve` | List all pending approvals |

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List user notifications |

## Swagger/API Docs

| Path | Description |
|------|-------------|
| `/swagger` | Scalar API Reference (interactive) |
