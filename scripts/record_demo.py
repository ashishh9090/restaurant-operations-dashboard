#!/usr/bin/env python3
"""
record_demo.py
Automates a comprehensive 15-18 second functional walkthrough of the
Restaurant Operations Dashboard using Playwright and Google Chrome,
recording high-definition video ready for GitHub repository demos.
"""

import os
import time
import shutil
from playwright.sync_api import sync_playwright

OUTPUT_DIR = "/Users/apple/.gemini/antigravity-ide/scratch/restaurant-operations-dashboard/assets"
VIDEO_TARGET = "/Users/apple/.gemini/antigravity-ide/scratch/restaurant-operations-dashboard/assets/dashboard_demo.webm"

def record_walkthrough():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    temp_video_dir = os.path.join(OUTPUT_DIR, "temp_video")
    if os.path.exists(temp_video_dir):
        shutil.rmtree(temp_video_dir)
    os.makedirs(temp_video_dir, exist_ok=True)

    print("Launching browser with video recording...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            headless=True
        )
        
        # 1280x800 desktop viewport
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            record_video_dir=temp_video_dir,
            record_video_size={"width": 1280, "height": 800}
        )
        
        page = context.new_page()
        page.goto("http://localhost:8085")
        page.wait_for_load_state("networkidle")
        time.sleep(1.0)
        
        # 1. Hover on KPI cards (1.5s)
        page.hover("#kpi-revenue")
        time.sleep(0.6)
        page.hover("#kpi-aov")
        time.sleep(0.6)
        
        # 2. Test Preset Date Filter: "Last 7 Days" (1.5s)
        print("Testing filter: Last 7 Days...")
        page.click('button[data-preset="last-7"]')
        time.sleep(1.2)
        
        # 3. Test Preset Date Filter: "Weekends Only" (1.5s)
        print("Testing filter: Weekends Only...")
        page.click('button[data-preset="weekends"]')
        time.sleep(1.2)
        
        # 4. Filter by Category: "Fries in a Jar" & "UPI" (2.0s)
        print("Testing category filter: Fries in a Jar...")
        page.select_option("#filter-category", "Fries in a Jar")
        time.sleep(0.8)
        print("Testing payment method: UPI...")
        page.select_option("#filter-payment", "UPI")
        time.sleep(1.0)
        
        # 5. Reset Filters (1.2s)
        print("Resetting filters...")
        page.click("#btn-reset-filters")
        time.sleep(1.2)
        
        # 6. Smooth scroll to Heatmap & Top Items (2.0s)
        print("Scrolling to Heatmap & Top Items...")
        page.evaluate("window.scrollTo({ top: 480, behavior: 'smooth' })")
        time.sleep(1.0)
        
        # Toggle Top Items metric to Revenue
        page.click("#toggle-metric-rev")
        time.sleep(0.8)
        page.click("#toggle-metric-qty")
        time.sleep(0.6)
        
        # Hover over Heatmap cells (Friday & Saturday evening peak rush)
        peak_cell = page.locator('.heatmap-cell[data-day="Friday"][data-hour="19"]')
        if peak_cell.count() > 0:
            peak_cell.hover()
            time.sleep(0.8)
            
        sat_cell = page.locator('.heatmap-cell[data-day="Saturday"][data-hour="20"]')
        if sat_cell.count() > 0:
            sat_cell.hover()
            time.sleep(0.8)
            
        # 7. Scroll to Insights & Recommendation (2.0s)
        print("Viewing Insights & Recommendation...")
        page.evaluate("window.scrollTo({ top: 960, behavior: 'smooth' })")
        time.sleep(1.5)
        
        # 8. Scroll to Order Transactions Table & test search (2.2s)
        print("Testing Table Search & Pagination...")
        page.evaluate("window.scrollTo({ top: 1400, behavior: 'smooth' })")
        time.sleep(0.8)
        page.fill("#table-search-input", "Makhni")
        time.sleep(1.0)
        page.fill("#table-search-input", "")
        time.sleep(0.6)
        page.click("#btn-next-page")
        time.sleep(0.8)
        
        # 9. Scroll to top, toggle Theme & open Data Quality Modal (2.5s)
        print("Testing Theme switch & Data Quality modal...")
        page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        time.sleep(0.8)
        
        # Theme toggle to Light Mode
        page.click("#btn-theme-toggle")
        time.sleep(1.2)
        
        # Theme toggle back to Dark Mode
        page.click("#btn-theme-toggle")
        time.sleep(0.8)
        
        # Open Data Quality Modal
        page.click("#btn-open-assumptions")
        time.sleep(1.2)
        page.click("#btn-close-assumptions")
        time.sleep(0.8)
        
        print("Walkthrough complete. Closing browser to finalize video...")
        context.close()
        browser.close()

    # Move generated video to final target path
    recorded_files = [f for f in os.listdir(temp_video_dir) if f.endswith(".webm")]
    if recorded_files:
        src = os.path.join(temp_video_dir, recorded_files[0])
        shutil.move(src, VIDEO_TARGET)
        shutil.rmtree(temp_video_dir)
        size_mb = os.path.getsize(VIDEO_TARGET) / (1024 * 1024)
        print(f"✅ Video recorded successfully: {VIDEO_TARGET} ({size_mb:.2f} MB)")
    else:
        print("⚠️ No video file found in temp dir.")

if __name__ == "__main__":
    record_walkthrough()
