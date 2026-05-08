#!/usr/bin/env python3
"""
Carmen ERP - API Test Data Insertion Script
Inserts 10-20 rows per menu/module and reports errors.
"""

import requests
import json
import uuid
import random
import string
import urllib3
from datetime import datetime, timedelta

# Disable SSL warnings for self-signed certs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ============================================================
# CONFIGURATION
# ============================================================
BASE_URL = "https://ec2-43-209-126-252.ap-southeast-7.compute.amazonaws.com"
EMAIL = "test@test.com"
PASSWORD = "12345678"
X_APP_ID = "9c83fd4b-ce3f-4de2-a522-349ad1280b10"
BU_CODE = "DEMO_AVG"
ROWS_PER_MENU = 10

# ============================================================
# HELPERS
# ============================================================
session = requests.Session()
session.verify = False
session.headers.update({
    "Content-Type": "application/json",
    "x-app-id": X_APP_ID,
})

errors = []
successes = []


def rand_str(prefix="TEST", length=6):
    return f"{prefix}_{''.join(random.choices(string.ascii_uppercase + string.digits, k=length))}"


def rand_code(prefix="T", length=4):
    return f"{prefix}{''.join(random.choices(string.digits, k=length))}"


def log_result(menu, index, response):
    status = response.status_code
    try:
        body = response.json()
    except Exception:
        body = response.text

    if status in (200, 201):
        success_msg = body.get("message", "OK") if isinstance(body, dict) else "OK"
        successes.append({
            "menu": menu,
            "row": index,
            "status": status,
            "message": success_msg,
        })
        data = body.get("data", {}) if isinstance(body, dict) else {}
        item_id = data.get("id") if isinstance(data, dict) else None
        print(f"  ✓ [{menu}] Row {index} - {status} {success_msg}")
        return item_id
    else:
        error_msg = body.get("message", str(body)) if isinstance(body, dict) else str(body)
        errors.append({
            "menu": menu,
            "row": index,
            "status": status,
            "message": error_msg,
            "body": body,
        })
        print(f"  ✗ [{menu}] Row {index} - {status} {error_msg}")
        return None


def api_post(path, data, menu, index):
    url = f"{BASE_URL}/api/{path}"
    try:
        resp = session.post(url, json=data, timeout=30)
        return log_result(menu, index, resp)
    except Exception as e:
        errors.append({"menu": menu, "row": index, "status": "ERROR", "message": str(e)})
        print(f"  ✗ [{menu}] Row {index} - EXCEPTION: {e}")
        return None


def api_get(path):
    url = f"{BASE_URL}/api/{path}"
    try:
        resp = session.get(url, timeout=30)
        if resp.status_code == 200:
            body = resp.json()
            return body.get("data", body)
        return None
    except Exception:
        return None


# ============================================================
# LOGIN
# ============================================================
def login():
    print("=" * 60)
    print("LOGGING IN...")
    print("=" * 60)
    resp = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": EMAIL,
        "password": PASSWORD,
    }, timeout=30)

    if resp.status_code not in (200, 201):
        print(f"LOGIN FAILED: {resp.status_code} {resp.text}")
        return False

    body = resp.json()
    token = None

    # Try from response body (backend gateway returns data.access_token)
    if isinstance(body.get("data"), dict):
        token = body["data"].get("access_token")

    # Fallback: try from cookies
    if not token and "access_token" in session.cookies:
        token = session.cookies["access_token"]

    if token:
        session.headers.update({"Authorization": f"Bearer {token}"})
        print(f"LOGIN SUCCESS - Token: {token[:80]}...")
    else:
        print(f"LOGIN FAILED: No access_token found")
        print(f"  Response: {json.dumps(body, ensure_ascii=False)[:300]}")
        return False

    return True


# ============================================================
# FETCH REFERENCE DATA
# ============================================================
ref_data = {}


def fetch_reference_data():
    print("\n" + "=" * 60)
    print("FETCHING REFERENCE DATA...")
    print("=" * 60)

    endpoints = {
        "locations": f"config/{BU_CODE}/locations",
        "units": f"config/{BU_CODE}/units",
        "currencies": f"config/{BU_CODE}/currencies",
        "departments": f"config/{BU_CODE}/departments",
        "product_categories": f"config/{BU_CODE}/products/category",
        "product_sub_categories": f"config/{BU_CODE}/products/sub-category",
        "product_item_groups": f"config/{BU_CODE}/products/item-group",
        "products": f"config/{BU_CODE}/products",
        "vendors": f"config/{BU_CODE}/vendors",
        "delivery_points": f"config/{BU_CODE}/delivery-point",
        "adjustment_types": f"config/{BU_CODE}/adjustment-type",
        "extra_cost_types": f"config/{BU_CODE}/extra-cost-type",
        "credit_terms": f"config/{BU_CODE}/credit-term",
        "vendor_business_types": f"config/{BU_CODE}/vendor-business-type",
        "tax_profiles": f"config/{BU_CODE}/tax-profile",
        "workflows": f"config/{BU_CODE}/workflows",
        "recipe_categories": f"config/{BU_CODE}/recipe-category",
        "recipe_cuisines": f"config/{BU_CODE}/recipe-cuisine",
    }

    for key, path in endpoints.items():
        data = api_get(path)
        items = []
        if isinstance(data, dict):
            items = data.get("data", data.get("items", []))
            if isinstance(items, dict):
                items = items.get("data", [])
        elif isinstance(data, list):
            items = data
        ref_data[key] = items if isinstance(items, list) else []
        print(f"  {key}: {len(ref_data[key])} items")


def get_ref_id(key, fallback=None):
    items = ref_data.get(key, [])
    if items:
        item = random.choice(items)
        return item.get("id", fallback)
    return fallback


def get_ref_ids(key, count=1):
    items = ref_data.get(key, [])
    if items:
        selected = random.sample(items, min(count, len(items)))
        return [item.get("id") for item in selected if item.get("id")]
    return []


# ============================================================
# CONFIG MODULES - INSERT DATA
# ============================================================

def test_units():
    print(f"\n{'─'*40}")
    print("CONFIG: Units")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/units", {
            "name": rand_str("Unit"),
            "description": f"Test unit {i}",
            "is_active": True,
        }, "units", i)


def test_currencies():
    print(f"\n{'─'*40}")
    print("CONFIG: Currencies")
    print(f"{'─'*40}")
    currency_codes = ["USD", "EUR", "GBP", "JPY", "CNY", "KRW", "SGD", "HKD", "AUD", "CAD"]
    for i in range(1, ROWS_PER_MENU + 1):
        code = currency_codes[i-1] if i <= len(currency_codes) else f"X{random.randint(10,99)}"
        api_post(f"config/{BU_CODE}/currencies", {
            "code": code[:3],
            "name": f"Test Currency {code}",
            "symbol": code[0],
            "description": f"Test currency {i}",
            "is_active": True,
            "exchange_rate": round(random.uniform(0.5, 40.0), 4),
        }, "currencies", i)


def test_departments():
    print(f"\n{'─'*40}")
    print("CONFIG: Departments")
    print(f"{'─'*40}")
    dept_names = ["Kitchen", "Front Office", "Housekeeping", "F&B", "Engineering",
                  "Security", "Purchasing", "Accounting", "HR", "IT"]
    for i in range(1, ROWS_PER_MENU + 1):
        name = dept_names[i-1] if i <= len(dept_names) else f"Dept {i}"
        api_post(f"config/{BU_CODE}/departments", {
            "code": rand_code("DPT"),
            "name": f"{name} {rand_code('', 3)}",
            "description": f"Test department {i}",
            "is_active": True,
        }, "departments", i)


def test_delivery_points():
    print(f"\n{'─'*40}")
    print("CONFIG: Delivery Points")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/delivery-point", {
            "name": rand_str("DelPt"),
            "is_active": True,
        }, "delivery-point", i)


def test_adjustment_types():
    print(f"\n{'─'*40}")
    print("CONFIG: Adjustment Types")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        adj_type = random.choice(["STOCK_IN", "STOCK_OUT"])
        api_post(f"config/{BU_CODE}/adjustment-type", {
            "code": rand_code("ADJ"),
            "name": rand_str("AdjType"),
            "type": adj_type,
            "description": f"Test adjustment type {i}",
            "is_active": True,
        }, "adjustment-type", i)


def test_extra_cost_types():
    print(f"\n{'─'*40}")
    print("CONFIG: Extra Cost Types")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/extra-cost-type", {
            "name": rand_str("ExtraCost"),
            "description": f"Test extra cost type {i}",
            "is_active": True,
        }, "extra-cost-type", i)


def test_credit_terms():
    print(f"\n{'─'*40}")
    print("CONFIG: Credit Terms")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/credit-term", {
            "name": rand_str("CreditTerm"),
            "value": random.choice([7, 15, 30, 45, 60, 90]),
            "description": f"Test credit term {i}",
            "is_active": True,
        }, "credit-term", i)


def test_vendor_business_types():
    print(f"\n{'─'*40}")
    print("CONFIG: Vendor Business Types")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/vendor-business-type", {
            "name": rand_str("VBType"),
            "description": f"Test vendor business type {i}",
            "is_active": True,
        }, "vendor-business-type", i)


def test_product_categories():
    print(f"\n{'─'*40}")
    print("CONFIG: Product Categories")
    print(f"{'─'*40}")
    cat_names = ["Meat", "Seafood", "Vegetables", "Fruits", "Dairy",
                 "Beverages", "Dry Goods", "Frozen", "Bakery", "Condiments"]
    for i in range(1, ROWS_PER_MENU + 1):
        name = cat_names[i-1] if i <= len(cat_names) else f"Category {i}"
        api_post(f"config/{BU_CODE}/products/category", {
            "code": rand_code("CAT"),
            "name": f"{name} {rand_code('', 3)}",
            "description": f"Test product category {i}",
            "is_active": True,
        }, "product-category", i)


def test_product_sub_categories():
    print(f"\n{'─'*40}")
    print("CONFIG: Product Sub-Categories")
    print(f"{'─'*40}")
    # Refresh categories after creation
    fetch_single("product_categories", f"config/{BU_CODE}/products/category")
    cat_id = get_ref_id("product_categories")
    if not cat_id:
        print("  ⚠ No product categories found, skipping sub-categories")
        return
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/products/sub-category", {
            "code": rand_code("SUB"),
            "name": rand_str("SubCat"),
            "product_category_id": get_ref_id("product_categories", cat_id),
            "description": f"Test sub-category {i}",
            "is_active": True,
        }, "product-sub-category", i)


def test_product_item_groups():
    print(f"\n{'─'*40}")
    print("CONFIG: Product Item Groups")
    print(f"{'─'*40}")
    fetch_single("product_sub_categories", f"config/{BU_CODE}/products/sub-category")
    subcat_id = get_ref_id("product_sub_categories")
    if not subcat_id:
        print("  ⚠ No product sub-categories found, skipping item groups")
        return
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/products/item-group", {
            "code": rand_code("GRP"),
            "name": rand_str("ItemGrp"),
            "product_subcategory_id": get_ref_id("product_sub_categories", subcat_id),
            "description": f"Test item group {i}",
            "is_active": True,
        }, "product-item-group", i)


def test_locations():
    print(f"\n{'─'*40}")
    print("CONFIG: Locations")
    print(f"{'─'*40}")
    loc_types = ["inventory", "direct"]
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/locations", {
            "code": rand_code("LOC"),
            "name": rand_str("Location"),
            "location_type": random.choice(loc_types),
            "description": f"Test location {i}",
            "is_active": True,
        }, "locations", i)


def test_vendors():
    print(f"\n{'─'*40}")
    print("CONFIG: Vendors")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/vendors", {
            "code": rand_code("VND"),
            "name": rand_str("Vendor"),
            "description": f"Test vendor {i}",
            "vendor_contact": {
                "add": [{
                    "name": f"Contact Person {i}",
                    "email": f"vendor{i}@test.com",
                    "phone": f"08{random.randint(10000000, 99999999)}",
                    "is_primary": True,
                }]
            },
            "vendor_address": {
                "add": [{
                    "address_type": random.choice(["contact_address", "mailing_address", "register_address"]),
                    "address_line1": f"{random.randint(1,999)} Test Street",
                    "city": "Bangkok",
                    "province": "Bangkok",
                    "postal_code": f"10{random.randint(100,999)}",
                    "country": "Thailand",
                }]
            },
        }, "vendors", i)


def test_products():
    print(f"\n{'─'*40}")
    print("CONFIG: Products")
    print(f"{'─'*40}")
    fetch_single("units", f"config/{BU_CODE}/units")
    fetch_single("product_item_groups", f"config/{BU_CODE}/products/item-group")
    unit_id = get_ref_id("units")
    if not unit_id:
        print("  ⚠ No units found, skipping products")
        return
    product_names = ["Chicken Breast", "Salmon Fillet", "Basmati Rice", "Olive Oil", "Butter",
                     "Tomato Paste", "Garlic", "Onion", "Carrot", "Potato",
                     "Soy Sauce", "Fish Sauce", "Sugar", "Salt", "Pepper"]
    for i in range(1, ROWS_PER_MENU + 1):
        name = product_names[i-1] if i <= len(product_names) else f"Product {i}"
        body = {
            "code": rand_code("PRD"),
            "name": f"{name} {rand_code('', 3)}",
            "description": f"Test product {i}",
            "inventory_unit_id": get_ref_id("units", unit_id),
            "product_status_type": "active",
        }
        ig_id = get_ref_id("product_item_groups")
        if ig_id:
            body["product_item_group_id"] = ig_id
        api_post(f"config/{BU_CODE}/products", body, "products", i)


def test_recipe_categories():
    print(f"\n{'─'*40}")
    print("CONFIG: Recipe Categories")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/recipe-category", {
            "code": rand_code("RCAT"),
            "name": rand_str("RecipeCat"),
            "description": f"Test recipe category {i}",
            "is_active": True,
        }, "recipe-category", i)


def test_recipe_cuisines():
    print(f"\n{'─'*40}")
    print("CONFIG: Recipe Cuisines")
    print(f"{'─'*40}")
    regions = ["ASIA", "EUROPE", "AMERICAS", "AFRICA", "MIDDLE_EAST", "OCEANIA"]
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/recipe-cuisine", {
            "name": rand_str("Cuisine"),
            "region": random.choice(regions),
            "description": f"Test recipe cuisine {i}",
            "is_active": True,
        }, "recipe-cuisine", i)


def test_recipe_equipment():
    print(f"\n{'─'*40}")
    print("CONFIG: Recipe Equipment")
    print(f"{'─'*40}")
    equip_names = ["Oven", "Mixer", "Blender", "Grill", "Fryer",
                   "Steam Table", "Refrigerator", "Freezer", "Food Processor", "Slicer"]
    for i in range(1, ROWS_PER_MENU + 1):
        name = equip_names[i-1] if i <= len(equip_names) else f"Equipment {i}"
        api_post(f"config/{BU_CODE}/recipe-equipment", {
            "code": rand_code("EQP"),
            "name": f"{name} {rand_code('', 3)}",
            "description": f"Test equipment {i}",
            "is_active": True,
        }, "recipe-equipment", i)


def test_tax_profiles():
    print(f"\n{'─'*40}")
    print("CONFIG: Tax Profiles")
    print(f"{'─'*40}")
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"config/{BU_CODE}/tax-profile", {
            "name": rand_str("Tax"),
            "rate": round(random.uniform(0, 15), 2),
            "description": f"Test tax profile {i}",
            "is_active": True,
        }, "tax-profile", i)


# ============================================================
# TRANSACTION MODULES - INSERT DATA
# ============================================================

def test_stock_in():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Stock In")
    print(f"{'─'*40}")
    fetch_single("locations", f"config/{BU_CODE}/locations")
    fetch_single("products", f"config/{BU_CODE}/products")
    fetch_single("adjustment_types", f"config/{BU_CODE}/adjustment-type")

    loc_id = get_ref_id("locations")
    adj_id = get_ref_id("adjustment_types")

    for i in range(1, ROWS_PER_MENU + 1):
        products = ref_data.get("products", [])
        detail_items = []
        for j in range(random.randint(1, 3)):
            prod = random.choice(products) if products else {}
            detail_items.append({
                "product_id": prod.get("id", str(uuid.uuid4())),
                "product_code": prod.get("code", f"P{j}"),
                "product_name": prod.get("name", f"Product {j}"),
                "qty": random.randint(1, 100),
                "cost_per_unit": round(random.uniform(10, 500), 2),
                "total_cost": 0,
            })

        api_post(f"{BU_CODE}/stock-in", {
            "description": f"Test stock in {i}",
            "adjustment_type_id": adj_id,
            "location_id": get_ref_id("locations", loc_id),
            "doc_status": "draft",
            "stock_in_detail": {"add": detail_items},
        }, "stock-in", i)


def test_stock_out():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Stock Out")
    print(f"{'─'*40}")
    loc_id = get_ref_id("locations")
    adj_id = get_ref_id("adjustment_types")

    for i in range(1, ROWS_PER_MENU + 1):
        products = ref_data.get("products", [])
        detail_items = []
        for j in range(random.randint(1, 3)):
            prod = random.choice(products) if products else {}
            detail_items.append({
                "product_id": prod.get("id", str(uuid.uuid4())),
                "product_code": prod.get("code", f"P{j}"),
                "product_name": prod.get("name", f"Product {j}"),
                "qty": random.randint(1, 50),
            })

        api_post(f"{BU_CODE}/stock-out", {
            "description": f"Test stock out {i}",
            "adjustment_type_id": adj_id,
            "location_id": get_ref_id("locations", loc_id),
            "doc_status": "draft",
            "stock_out_detail": {"add": detail_items},
        }, "stock-out", i)


def test_transfer():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Transfer")
    print(f"{'─'*40}")
    locations = ref_data.get("locations", [])
    products = ref_data.get("products", [])

    for i in range(1, ROWS_PER_MENU + 1):
        from_loc = random.choice(locations) if locations else {}
        to_loc = random.choice(locations) if locations else {}
        detail_items = []
        for j in range(random.randint(1, 3)):
            prod = random.choice(products) if products else {}
            qty = random.randint(1, 30)
            cost = round(random.uniform(10, 300), 2)
            detail_items.append({
                "product_id": prod.get("id", str(uuid.uuid4())),
                "product_name": prod.get("name", f"Product {j}"),
                "qty": qty,
                "cost_per_unit": cost,
                "total_cost": round(qty * cost, 2),
            })

        api_post(f"{BU_CODE}/transfer", {
            "description": f"Test transfer {i}",
            "from_location_id": from_loc.get("id"),
            "from_location_code": from_loc.get("code"),
            "from_location_name": from_loc.get("name"),
            "to_location_id": to_loc.get("id"),
            "to_location_code": to_loc.get("code"),
            "to_location_name": to_loc.get("name"),
            "details": detail_items,
        }, "transfer", i)


def test_purchase_request():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Purchase Request")
    print(f"{'─'*40}")
    fetch_single("departments", f"config/{BU_CODE}/departments")
    fetch_single("workflows", f"config/{BU_CODE}/workflows")

    products = ref_data.get("products", [])
    dept_id = get_ref_id("departments")
    unit_id = get_ref_id("units")

    for i in range(1, ROWS_PER_MENU + 1):
        pr_date = (datetime.now() + timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        detail_items = []
        for j in range(random.randint(1, 3)):
            prod = random.choice(products) if products else {}
            detail_items.append({
                "product_id": prod.get("id", str(uuid.uuid4())),
                "product_code": prod.get("code", f"P{j}"),
                "product_name": prod.get("name", f"Product {j}"),
                "requested_qty": random.randint(1, 100),
                "requested_unit_id": unit_id,
                "delivery_date": (datetime.now() + timedelta(days=random.randint(7, 60))).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                "foc_qty": 0,
            })

        body = {
            "stage_role": "create",
            "details": {
                "pr_date": pr_date,
                "description": f"Test purchase request {i}",
                "department_id": dept_id,
                "purchase_request_detail": {"add": detail_items},
            }
        }
        wf_id = get_ref_id("workflows")
        if wf_id:
            body["details"]["workflow_id"] = wf_id

        api_post(f"{BU_CODE}/purchase-request", body, "purchase-request", i)


def test_store_requisition():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Store Requisition")
    print(f"{'─'*40}")
    products = ref_data.get("products", [])
    locations = ref_data.get("locations", [])
    dept_id = get_ref_id("departments")

    for i in range(1, ROWS_PER_MENU + 1):
        sr_date = (datetime.now() + timedelta(days=random.randint(0, 14))).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        from_loc = random.choice(locations) if locations else {}
        to_loc = random.choice(locations) if locations else {}

        detail_items = []
        for j in range(random.randint(1, 3)):
            prod = random.choice(products) if products else {}
            detail_items.append({
                "product_id": prod.get("id", str(uuid.uuid4())),
                "product_code": prod.get("code", f"P{j}"),
                "product_name": prod.get("name", f"Product {j}"),
                "requested_qty": random.randint(1, 50),
            })

        body = {
            "stage_role": "create",
            "details": {
                "sr_date": sr_date,
                "expected_date": (datetime.now() + timedelta(days=random.randint(1, 30))).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                "description": f"Test store requisition {i}",
                "department_id": dept_id,
                "from_location_id": from_loc.get("id"),
                "to_location_id": to_loc.get("id"),
                "store_requisition_detail": {"add": detail_items},
            }
        }

        api_post(f"{BU_CODE}/store-requisition", body, "store-requisition", i)


def test_physical_count():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Physical Count")
    print(f"{'─'*40}")
    fetch_single("locations", f"config/{BU_CODE}/locations")
    # Need a period - fetch or we'll let backend handle it
    loc_id = get_ref_id("locations")
    if not loc_id:
        print("  ⚠ No locations found, skipping physical count")
        return

    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"{BU_CODE}/physical-count", {
            "location_id": get_ref_id("locations", loc_id),
            "description": f"Test physical count {i}",
        }, "physical-count", i)


def test_spot_check():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Spot Check")
    print(f"{'─'*40}")
    loc_id = get_ref_id("locations")
    if not loc_id:
        print("  ⚠ No locations found, skipping spot check")
        return

    methods = ["random", "high_value"]
    for i in range(1, ROWS_PER_MENU + 1):
        api_post(f"{BU_CODE}/spot-check", {
            "location_id": get_ref_id("locations", loc_id),
            "method": random.choice(methods),
            "items": random.randint(3, 10),
            "description": f"Test spot check {i}",
        }, "spot-check", i)


def test_good_received_note():
    print(f"\n{'─'*40}")
    print("TRANSACTION: Good Received Note")
    print(f"{'─'*40}")
    fetch_single("vendors", f"config/{BU_CODE}/vendors")
    fetch_single("currencies", f"config/{BU_CODE}/currencies")
    products = ref_data.get("products", [])

    for i in range(1, ROWS_PER_MENU + 1):
        vendor = random.choice(ref_data.get("vendors", [{}]))
        detail_items = []
        for j in range(random.randint(1, 3)):
            prod = random.choice(products) if products else {}
            loc_id = get_ref_id("locations")
            qty = random.randint(1, 50)
            price = round(random.uniform(10, 500), 2)
            detail_items.append({
                "product_id": prod.get("id", str(uuid.uuid4())),
                "product_code": prod.get("code"),
                "product_name": prod.get("name"),
                "location_id": loc_id,
                "qty": qty,
                "price_per_unit": price,
                "total_amount": round(qty * price, 2),
            })

        api_post(f"{BU_CODE}/good-received-note", {
            "grn_date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S.000Z"),
            "doc_type": "manual",
            "doc_status": "draft",
            "vendor_id": vendor.get("id"),
            "description": f"Test GRN {i}",
            "good_received_note_detail": {"add": detail_items},
        }, "good-received-note", i)


# ============================================================
# HELPER: REFRESH SINGLE REFERENCE
# ============================================================
def fetch_single(key, path):
    data = api_get(path)
    items = []
    if isinstance(data, dict):
        items = data.get("data", data.get("items", []))
        if isinstance(items, dict):
            items = items.get("data", [])
    elif isinstance(data, list):
        items = data
    ref_data[key] = items if isinstance(items, list) else []


# ============================================================
# MAIN
# ============================================================
def main():
    print("╔══════════════════════════════════════════════════════════╗")
    print("║       Carmen ERP - API Test Data Insertion              ║")
    print("║       Target: {:<41s}║".format(BASE_URL[:41]))
    print("║       BU Code: {:<40s}║".format(BU_CODE))
    print("║       Rows per menu: {:<34d}║".format(ROWS_PER_MENU))
    print("╚══════════════════════════════════════════════════════════╝")

    if not login():
        return

    fetch_reference_data()

    # --- Config Modules ---
    print("\n" + "=" * 60)
    print("INSERTING CONFIG DATA")
    print("=" * 60)

    test_units()
    test_currencies()
    test_departments()
    test_delivery_points()
    test_adjustment_types()
    test_extra_cost_types()
    test_credit_terms()
    test_vendor_business_types()
    test_tax_profiles()
    test_product_categories()
    test_product_sub_categories()
    test_product_item_groups()
    test_locations()
    test_vendors()
    test_products()
    test_recipe_categories()
    test_recipe_cuisines()
    test_recipe_equipment()

    # --- Transaction Modules ---
    print("\n" + "=" * 60)
    print("INSERTING TRANSACTION DATA")
    print("=" * 60)

    test_stock_in()
    test_stock_out()
    test_transfer()
    test_purchase_request()
    test_store_requisition()
    test_physical_count()
    test_spot_check()
    test_good_received_note()

    # --- REPORT ---
    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)
    total = len(successes) + len(errors)
    print(f"\nTotal requests: {total}")
    print(f"  ✓ Success: {len(successes)}")
    print(f"  ✗ Errors:  {len(errors)}")

    if errors:
        print(f"\n{'─'*60}")
        print("ERROR DETAILS:")
        print(f"{'─'*60}")

        # Group errors by menu
        error_by_menu = {}
        for e in errors:
            menu = e["menu"]
            if menu not in error_by_menu:
                error_by_menu[menu] = []
            error_by_menu[menu].append(e)

        for menu, errs in error_by_menu.items():
            print(f"\n  [{menu}] - {len(errs)} errors:")
            for e in errs:
                print(f"    Row {e['row']}: [{e['status']}] {e['message']}")
                if isinstance(e.get('body'), dict):
                    detail = e['body'].get('errors') or e['body'].get('error')
                    if detail:
                        print(f"      Detail: {json.dumps(detail, ensure_ascii=False)[:200]}")

    # Save report to file
    report_file = "test_insert_report.json"
    with open(report_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "base_url": BASE_URL,
            "bu_code": BU_CODE,
            "total_requests": total,
            "successes": len(successes),
            "errors_count": len(errors),
            "errors": errors,
            "success_details": successes,
        }, f, indent=2, ensure_ascii=False, default=str)
    print(f"\n📄 Full report saved to: {report_file}")


if __name__ == "__main__":
    main()
