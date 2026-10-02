#!/usr/bin/env python3
"""
generate_data.py
Generates a realistic restaurant operations dataset based directly on the provided
cafe menu (Xero Degrees style), with menu items (Fries in a Jar, Pizzas, Sliders,
Burgers, Wraps, Pasta, Momos, Garlic Bread, Fried Chicken, Waffles, and Double Xero Shakes)
and prices strictly in Indian Rupees (INR - ₹).
"""

import json
import csv
import random
from datetime import datetime, timedelta

# Set fixed seed for reproducibility
random.seed(42)

# Exact menu items and prices in Indian Rupees (₹) extracted from the menu cards
MENU_ITEMS = [
    # Category: Fries in a Jar
    {"name": "Peri Peri Cheesy Fries", "category": "Fries in a Jar", "price": 199.0, "pop_lunch": 2.2, "pop_dinner": 2.5},
    {"name": "Pizza Fries", "category": "Fries in a Jar", "price": 179.0, "pop_lunch": 1.8, "pop_dinner": 2.0},
    {"name": "Chicken & Cheese Fries", "category": "Fries in a Jar", "price": 219.0, "pop_lunch": 1.5, "pop_dinner": 2.4},
    {"name": "Butter Chicken Cheesy Fries", "category": "Fries in a Jar", "price": 229.0, "pop_lunch": 1.2, "pop_dinner": 2.6},
    {"name": "Classic Salted Fries", "category": "Fries in a Jar", "price": 149.0, "pop_lunch": 1.8, "pop_dinner": 1.4},
    {"name": "Paneer Popcorn Makhni Fries", "category": "Fries in a Jar", "price": 209.0, "pop_lunch": 1.4, "pop_dinner": 1.9},

    # Category: Pizzas
    {"name": "Cheesy Margherita Pizza", "category": "Pizzas", "price": 219.0, "pop_lunch": 1.4, "pop_dinner": 2.2},
    {"name": "Butter Chicken Pizza", "category": "Pizzas", "price": 299.0, "pop_lunch": 1.0, "pop_dinner": 2.8},
    {"name": "Peri Peri Delight Pizza", "category": "Pizzas", "price": 249.0, "pop_lunch": 1.2, "pop_dinner": 2.0},
    {"name": "Chicken Dominator Pizza", "category": "Pizzas", "price": 279.0, "pop_lunch": 0.8, "pop_dinner": 2.5},
    {"name": "Veggie Affair Pizza", "category": "Pizzas", "price": 239.0, "pop_lunch": 1.5, "pop_dinner": 1.8},
    {"name": "Pizza In A Jar (Veg)", "category": "Pizzas", "price": 179.0, "pop_lunch": 1.9, "pop_dinner": 1.5},
    {"name": "Pizza In A Jar (Non-Veg)", "category": "Pizzas", "price": 189.0, "pop_lunch": 1.6, "pop_dinner": 1.8},

    # Category: Sliders & Burgers
    {"name": "Super Veggie Burger", "category": "Sliders & Burgers", "price": 169.0, "pop_lunch": 2.0, "pop_dinner": 1.5},
    {"name": "Chicken Zinger Burger", "category": "Sliders & Burgers", "price": 209.0, "pop_lunch": 2.2, "pop_dinner": 2.0},
    {"name": "Paneer Zinger Burger", "category": "Sliders & Burgers", "price": 189.0, "pop_lunch": 1.8, "pop_dinner": 1.6},
    {"name": "Harry Potter Veg Slider", "category": "Sliders & Burgers", "price": 219.0, "pop_lunch": 1.2, "pop_dinner": 1.8},
    {"name": "Avengers Aloo Patty Slider", "category": "Sliders & Burgers", "price": 239.0, "pop_lunch": 1.5, "pop_dinner": 1.7},
    {"name": "Animal Crispy Chicken Slider", "category": "Sliders & Burgers", "price": 259.0, "pop_lunch": 1.3, "pop_dinner": 2.4},
    {"name": "Bahubali Grilled Patty Slider", "category": "Sliders & Burgers", "price": 259.0, "pop_lunch": 1.0, "pop_dinner": 2.3},

    # Category: Wraps & Sandwiches
    {"name": "Paneer Kebab Wrap", "category": "Wraps & Sandwiches", "price": 179.0, "pop_lunch": 2.2, "pop_dinner": 1.4},
    {"name": "Chicken Seekh Wrap", "category": "Wraps & Sandwiches", "price": 219.0, "pop_lunch": 2.0, "pop_dinner": 1.8},
    {"name": "Peri-Peri Chicken Wrap", "category": "Wraps & Sandwiches", "price": 219.0, "pop_lunch": 1.8, "pop_dinner": 2.0},
    {"name": "Green Goblin Sandwich", "category": "Wraps & Sandwiches", "price": 199.0, "pop_lunch": 2.0, "pop_dinner": 1.2},
    {"name": "Chicken Tikka Sandwich", "category": "Wraps & Sandwiches", "price": 209.0, "pop_lunch": 1.9, "pop_dinner": 1.6},
    {"name": "Juicy Lucy Sandwich", "category": "Wraps & Sandwiches", "price": 219.0, "pop_lunch": 1.6, "pop_dinner": 1.9},

    # Category: Pasta & Momos
    {"name": "Alfredo Penne Pasta", "category": "Pasta & Momos", "price": 249.0, "pop_lunch": 1.8, "pop_dinner": 2.5},
    {"name": "Arabiata Spicy Pasta", "category": "Pasta & Momos", "price": 249.0, "pop_lunch": 1.5, "pop_dinner": 2.2},
    {"name": "Pink Sauce Penne Pasta", "category": "Pasta & Momos", "price": 249.0, "pop_lunch": 1.6, "pop_dinner": 2.4},
    {"name": "Mac & Cheese Classic", "category": "Pasta & Momos", "price": 249.0, "pop_lunch": 1.7, "pop_dinner": 2.0},
    {"name": "Corn N Cheese Momos (8 Pcs)", "category": "Pasta & Momos", "price": 199.0, "pop_lunch": 1.8, "pop_dinner": 2.1},
    {"name": "Chicken Steamed Momos (8 Pcs)", "category": "Pasta & Momos", "price": 229.0, "pop_lunch": 1.6, "pop_dinner": 2.6},
    {"name": "Fresh Vegetable Momos (8 Pcs)", "category": "Pasta & Momos", "price": 199.0, "pop_lunch": 1.7, "pop_dinner": 1.8},

    # Category: Garlic Bread & Chicken
    {"name": "Cheese Garlic Bread (4 Pcs)", "category": "Garlic Bread & Chicken", "price": 159.0, "pop_lunch": 2.0, "pop_dinner": 2.4},
    {"name": "Chicken N Cheese Garlic Bread", "category": "Garlic Bread & Chicken", "price": 199.0, "pop_lunch": 1.5, "pop_dinner": 2.2},
    {"name": "Hot & Spicy Chicken Wings (4 Pcs)", "category": "Garlic Bread & Chicken", "price": 189.0, "pop_lunch": 1.0, "pop_dinner": 2.6},
    {"name": "Crispy Chicken Strips (6 Pcs)", "category": "Garlic Bread & Chicken", "price": 139.0, "pop_lunch": 1.5, "pop_dinner": 2.3},
    {"name": "Crunchy Chicken Poppers", "category": "Garlic Bread & Chicken", "price": 179.0, "pop_lunch": 1.8, "pop_dinner": 2.0},
    {"name": "Crispy Onion Rings (8 Pcs)", "category": "Garlic Bread & Chicken", "price": 139.0, "pop_lunch": 1.4, "pop_dinner": 1.6},
    {"name": "Pizza Pockets (4 Pcs)", "category": "Garlic Bread & Chicken", "price": 149.0, "pop_lunch": 1.6, "pop_dinner": 1.5},

    # Category: Waffles & Shakes
    {"name": "Double Xero 2-in-1 Classic Shakes", "category": "Waffles & Shakes", "price": 269.0, "pop_lunch": 1.8, "pop_dinner": 2.7},
    {"name": "Double Xero 2-in-1 Premium Shakes", "category": "Waffles & Shakes", "price": 309.0, "pop_lunch": 1.5, "pop_dinner": 2.9},
    {"name": "Classic Choco Fudge Waffle", "category": "Waffles & Shakes", "price": 209.0, "pop_lunch": 0.8, "pop_dinner": 2.2},
    {"name": "Nutella Oreo Waffle Jar", "category": "Waffles & Shakes", "price": 229.0, "pop_lunch": 0.7, "pop_dinner": 2.5},
    {"name": "Hot Chocolate Brownie Waffle", "category": "Waffles & Shakes", "price": 219.0, "pop_lunch": 0.6, "pop_dinner": 2.4},
]

# Realistic payment methods in Indian casual dining / cafes
PAYMENT_METHODS = ["UPI", "Credit Card", "Cash", "Debit Card"]
PAYMENT_WEIGHTS = [0.58, 0.22, 0.14, 0.06]

def get_hour_distribution(hour, is_weekend):
    """Returns probability weight for order placement at operating hour (11-22)."""
    base_weights = {
        11: 3,
        12: 12,
        13: 16,
        14: 10,
        15: 5,
        16: 6,
        17: 10,
        18: 18,
        19: 26,
        20: 24,
        21: 15,
        22: 6
    }
    weight = base_weights.get(hour, 1)
    if is_weekend:
        if hour in [12, 13, 14]:
            weight *= 1.35  # weekend lunch
        elif hour in [17, 18, 19, 20, 21]:
            weight *= 1.65  # weekend dinner peak
    return weight

def generate_orders(num_orders=350, start_date_str="2026-09-01", days=30):
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    all_order_records = []
    
    hours = list(range(11, 23))
    weekday_hour_weights = [get_hour_distribution(h, is_weekend=False) for h in hours]
    weekend_hour_weights = [get_hour_distribution(h, is_weekend=True) for h in hours]
    
    day_weights = []
    dates = [start_date + timedelta(days=i) for i in range(days)]
    for d in dates:
        if d.weekday() in [4, 5]: # Friday, Saturday
            day_weights.append(2.1)
        elif d.weekday() == 6: # Sunday
            day_weights.append(1.7)
        elif d.weekday() == 3: # Thursday
            day_weights.append(1.1)
        else: # Mon, Tue, Wed
            day_weights.append(0.85)
            
    total_day_weight = sum(day_weights)
    orders_per_day = [int(round((w / total_day_weight) * num_orders)) for w in day_weights]
    
    order_id_counter = 1001
    
    for day_idx, current_date in enumerate(dates):
        count_for_day = orders_per_day[day_idx]
        is_weekend = current_date.weekday() in [4, 5, 6]
        hour_weights = weekend_hour_weights if is_weekend else weekday_hour_weights
        
        for _ in range(count_for_day):
            order_id = f"ORD-{order_id_counter}"
            order_id_counter += 1
            
            chosen_hour = random.choices(hours, weights=hour_weights, k=1)[0]
            chosen_minute = random.randint(0, 59)
            time_str = f"{chosen_hour:02d}:{chosen_minute:02d}"
            
            payment_method = random.choices(PAYMENT_METHODS, weights=PAYMENT_WEIGHTS, k=1)[0]
            is_lunch = chosen_hour <= 15
            
            # Party ticket size
            if is_lunch:
                num_items_in_order = random.choices([1, 2, 3], weights=[0.45, 0.40, 0.15], k=1)[0]
            else:
                num_items_in_order = random.choices([1, 2, 3, 4, 5], weights=[0.15, 0.35, 0.30, 0.15, 0.05], k=1)[0]
                
            item_weights = [
                item["pop_lunch"] if is_lunch else item["pop_dinner"]
                for item in MENU_ITEMS
            ]
            
            chosen_items = random.choices(MENU_ITEMS, weights=item_weights, k=num_items_in_order)
            
            item_counts = {}
            for item in chosen_items:
                name = item["name"]
                if name not in item_counts:
                    item_counts[name] = {"item": item, "qty": 0}
                item_counts[name]["qty"] += 1
                
            for item_info in item_counts.values():
                item = item_info["item"]
                extra_qty = random.choices([0, 1, 2], weights=[0.84, 0.13, 0.03], k=1)[0]
                qty = item_info["qty"] + extra_qty
                line_total = round(qty * item["price"], 2)
                
                record = {
                    "order_id": order_id,
                    "order_date": current_date.strftime("%Y-%m-%d"),
                    "order_time": time_str,
                    "day_of_week": current_date.strftime("%A"),
                    "hour": chosen_hour,
                    "item_name": item["name"],
                    "category": item["category"],
                    "quantity": qty,
                    "item_price": item["price"],
                    "line_total": line_total,
                    "payment_method": payment_method
                }
                all_order_records.append(record)
                
    return all_order_records

def main():
    records = generate_orders(num_orders=350, start_date_str="2026-09-01", days=30)
    
    # Save as JSON
    json_path = "/Users/apple/.gemini/antigravity-ide/scratch/restaurant-operations-dashboard/data/orders.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
        
    # Save as CSV
    csv_path = "/Users/apple/.gemini/antigravity-ide/scratch/restaurant-operations-dashboard/data/orders.csv"
    if records:
        fieldnames = list(records[0].keys())
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)
            
    # Save as JS file for direct web dashboard access without CORS/fetch restrictions
    js_path = "/Users/apple/.gemini/antigravity-ide/scratch/restaurant-operations-dashboard/js/data.js"
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// Restaurant Operations Dashboard Sample Dataset\n")
        f.write("// Extracted from authentic cafe menu with Rupee (INR - ₹) pricing\n")
        f.write("const RAW_ORDERS_DATA = ")
        json.dump(records, f, indent=2)
        f.write(";\n")
        
    unique_orders = len(set(r["order_id"] for r in records))
    total_revenue = sum(r["line_total"] for r in records)
    total_items = sum(r["quantity"] for r in records)
    
    print(f"Generated {len(records)} line items across {unique_orders} distinct orders.")
    print(f"Total Revenue: ₹{total_revenue:,.2f}")
    print(f"Total Items Sold: {total_items}")
    print(f"Average Order Value: ₹{total_revenue / unique_orders:.2f}")

if __name__ == "__main__":
    main()
