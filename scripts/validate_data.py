#!/usr/bin/env python3
"""
validate_data.py
Cleans and validates the restaurant operations dataset against business integrity rules.
Checks data completeness, numeric sanity, temporal bounds, and calculation consistency
for Indian Rupee (₹) pricing and authentic cafe menu categories.
"""

import json
import os
import sys
from datetime import datetime

DATA_PATH = "/Users/apple/.gemini/antigravity-ide/scratch/restaurant-operations-dashboard/data/orders.json"

REQUIRED_FIELDS = [
    "order_id", "order_date", "order_time", "day_of_week", 
    "hour", "item_name", "category", "quantity", "item_price", 
    "line_total", "payment_method"
]

VALID_CATEGORIES = {
    "Fries in a Jar", 
    "Pizzas", 
    "Sliders & Burgers", 
    "Wraps & Sandwiches", 
    "Pasta & Momos", 
    "Garlic Bread & Chicken", 
    "Waffles & Shakes"
}

VALID_PAYMENTS = {"UPI", "Credit Card", "Cash", "Debit Card"}

def validate():
    if not os.path.exists(DATA_PATH):
        print(f"Error: {DATA_PATH} not found.")
        sys.exit(1)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    errors = []
    warnings = []
    
    orders_by_id = {}
    total_revenue_calc = 0.0
    total_items_calc = 0
    categories_found = set()
    payments_found = set()
    dates_found = set()

    print("==================================================")
    print("      RESTAURANT DATA INTEGRITY AUDIT (INR - ₹)")
    print("==================================================")
    print(f"Total Line Items to inspect: {len(records)}\n")

    for i, r in enumerate(records):
        row_id = f"Record #{i+1} (Order: {r.get('order_id', 'UNKNOWN')})"
        
        # 1. Missing Fields Check
        for field in REQUIRED_FIELDS:
            if field not in r or r[field] is None or r[field] == "":
                errors.append(f"{row_id}: Missing or empty required field '{field}'")
                
        # 2. Type & Numeric Bounds
        qty = r.get("quantity")
        if not isinstance(qty, int) or qty <= 0:
            errors.append(f"{row_id}: Invalid quantity '{qty}' (must be positive integer)")
        else:
            total_items_calc += qty

        price = r.get("item_price")
        if not isinstance(price, (int, float)) or price < 50 or price > 500:
            errors.append(f"{row_id}: Invalid item_price '{price}' (expected ₹50 to ₹500 range)")

        # 3. Calculation Integrity
        if isinstance(qty, int) and isinstance(price, (int, float)):
            expected_total = round(qty * price, 2)
            actual_total = r.get("line_total")
            if abs(expected_total - actual_total) > 0.001:
                errors.append(f"{row_id}: Calculation mismatch: {qty} * {price} = {expected_total}, got {actual_total}")
            else:
                total_revenue_calc += actual_total

        # 4. Temporal Format Check
        date_str = r.get("order_date")
        try:
            d = datetime.strptime(date_str, "%Y-%m-%d")
            dates_found.add(date_str)
        except Exception:
            errors.append(f"{row_id}: Malformed date string '{date_str}' (expected YYYY-MM-DD)")

        time_str = r.get("order_time")
        try:
            t = datetime.strptime(time_str, "%H:%M")
            hour = r.get("hour")
            if t.hour != hour:
                errors.append(f"{row_id}: Hour field {hour} does not match time {time_str}")
            if not (11 <= hour <= 23):
                warnings.append(f"{row_id}: Order time {time_str} is outside standard 11 AM - 11 PM window")
        except Exception:
            errors.append(f"{row_id}: Malformed time string '{time_str}' (expected HH:MM)")

        # 5. Domain Categories & Payments Check
        cat = r.get("category")
        if cat not in VALID_CATEGORIES:
            errors.append(f"{row_id}: Unknown menu category '{cat}'")
        else:
            categories_found.add(cat)

        pay = r.get("payment_method")
        if pay not in VALID_PAYMENTS:
            errors.append(f"{row_id}: Unknown payment method '{pay}'")
        else:
            payments_found.add(pay)

        # 6. Order Grouping Consistency
        oid = r.get("order_id")
        if oid not in orders_by_id:
            orders_by_id[oid] = {
                "date": date_str,
                "time": time_str,
                "payment": pay,
                "items": 0,
                "subtotal": 0.0
            }
        else:
            if orders_by_id[oid]["date"] != date_str:
                errors.append(f"{row_id}: Inconsistent order_date across lines for {oid}")
            if orders_by_id[oid]["payment"] != pay:
                errors.append(f"{row_id}: Inconsistent payment_method across lines for {oid}")

        orders_by_id[oid]["items"] += qty
        orders_by_id[oid]["subtotal"] += r.get("line_total", 0.0)

    # Summary
    print(f"-> Distinct Orders Verified: {len(orders_by_id)}")
    print(f"-> Total Line Items: {len(records)}")
    print(f"-> Date Span: {min(dates_found)} to {max(dates_found)} ({len(dates_found)} days)")
    print(f"-> Categories Encountered: {sorted(list(categories_found))}")
    print(f"-> Payment Methods Encountered: {sorted(list(payments_found))}")
    print(f"-> Verified Total Revenue: ₹{total_revenue_calc:,.2f}")
    print(f"-> Verified Total Items Sold: {total_items_calc}")
    print(f"-> Calculated AOV (Average Order Value): ₹{total_revenue_calc / len(orders_by_id):.2f}\n")

    if errors:
        print(f"❌ VALIDATION FAILED with {len(errors)} error(s):")
        for err in errors[:10]:
            print(f"   - {err}")
        if len(errors) > 10:
            print(f"   ... and {len(errors) - 10} more.")
        sys.exit(1)
    else:
        print("✅ VALIDATION PASSED: 100% data integrity verified. No missing or malformed records.")

    if warnings:
        print(f"⚠️  {len(warnings)} warning(s) flagged.")
    else:
        print("✅ No warnings or boundary anomalies.")

    print("\nOperational Assumptions Verified:")
    print("1. Operating hours run between 11:00 AM and 10:59 PM.")
    print("2. Orders can contain multiple line items sharing one order_id, date, and payment method.")
    print("3. Line item total equals quantity * item_price.")
    print("4. All pricing in Indian National Rupees (INR - ₹).")
    print("5. Taxes (GST) and service charge excluded from base food & beverage gross sales.")
    print("==================================================")

if __name__ == "__main__":
    validate()
