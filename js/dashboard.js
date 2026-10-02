/**
 * Restaurant Operations Dashboard
 * Beginner-friendly, modular JavaScript logic for reactive filtering,
 * KPI metric computations, Chart.js visualizations, and heatmap rendering.
 * Configured for Indian Rupee (₹) pricing and authentic cafe menu items.
 */

// Application State
const state = {
  data: [],            // Full raw order line items
  filteredData: [],    // Currently active subset after user filters
  filters: {
    startDate: "",
    endDate: "",
    category: "all",
    paymentMethod: "all",
    dayType: "all",    // "all", "weekdays", "weekends"
  },
  topItemMetric: "quantity", // "quantity" or "revenue"
  table: {
    search: "",
    page: 1,
    pageSize: 10
  },
  charts: {
    salesByDay: null,
    categoryRevenue: null,
    topItems: null
  }
};

// Available category color accents for the authentic menu
const CATEGORY_COLORS = {
  "Fries in a Jar": "#f59e0b",         // Amber
  "Pizzas": "#ef4444",                 // Crimson
  "Sliders & Burgers": "#3b82f6",      // Electric Blue
  "Wraps & Sandwiches": "#10b981",     // Emerald
  "Pasta & Momos": "#8b5cf6",          // Violet
  "Garlic Bread & Chicken": "#ea580c", // Flame Orange
  "Waffles & Shakes": "#ec4899"        // Sweet Pink
};

// Days of week in chronological order
const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// Operating hours from 11 AM to 10 PM
const OPERATING_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

/**
 * Initialize Dashboard
 */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof RAW_ORDERS_DATA === "undefined" || !Array.isArray(RAW_ORDERS_DATA)) {
    console.error("RAW_ORDERS_DATA is not defined. Ensure data.js is loaded.");
    return;
  }

  state.data = [...RAW_ORDERS_DATA];
  
  // Discover date bounds
  const dates = state.data.map(d => d.order_date).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  const startDateInput = document.getElementById("filter-start-date");
  const endDateInput = document.getElementById("filter-end-date");
  
  startDateInput.min = minDate;
  startDateInput.max = maxDate;
  startDateInput.value = minDate;

  endDateInput.min = minDate;
  endDateInput.max = maxDate;
  endDateInput.value = maxDate;

  state.filters.startDate = minDate;
  state.filters.endDate = maxDate;

  // Setup event listeners
  setupEventListeners();

  // Populate category and payment dropdown options
  populateFilterDropdowns();

  // Initial render of all components
  applyFilters();

  // Setup theme toggle
  initTheme();
});

/**
 * Setup Event Listeners for Filters, Modals, and Controls
 */
function setupEventListeners() {
  const startDateInput = document.getElementById("filter-start-date");
  const endDateInput = document.getElementById("filter-end-date");
  const categorySelect = document.getElementById("filter-category");
  const paymentSelect = document.getElementById("filter-payment");
  const btnReset = document.getElementById("btn-reset-filters");

  startDateInput.addEventListener("change", (e) => {
    state.filters.startDate = e.target.value;
    clearPresetPillActiveState();
    applyFilters();
  });

  endDateInput.addEventListener("change", (e) => {
    state.filters.endDate = e.target.value;
    clearPresetPillActiveState();
    applyFilters();
  });

  categorySelect.addEventListener("change", (e) => {
    state.filters.category = e.target.value;
    applyFilters();
  });

  paymentSelect.addEventListener("change", (e) => {
    state.filters.paymentMethod = e.target.value;
    applyFilters();
  });

  btnReset.addEventListener("click", () => {
    resetAllFilters();
  });

  // Preset Date Pills
  document.querySelectorAll(".preset-pill").forEach(pill => {
    pill.addEventListener("click", (e) => {
      const preset = e.target.dataset.preset;
      applyPresetDate(preset);
      document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
      e.target.classList.add("active");
    });
  });

  // Top Items Metric Toggle
  const toggleQty = document.getElementById("toggle-metric-qty");
  const toggleRev = document.getElementById("toggle-metric-rev");

  toggleQty.addEventListener("click", () => {
    toggleQty.classList.add("active");
    toggleRev.classList.remove("active");
    state.topItemMetric = "quantity";
    renderTopItemsChart();
  });

  toggleRev.addEventListener("click", () => {
    toggleRev.classList.add("active");
    toggleQty.classList.remove("active");
    state.topItemMetric = "revenue";
    renderTopItemsChart();
  });

  // Table Search and Pagination
  const searchInput = document.getElementById("table-search-input");
  searchInput.addEventListener("input", (e) => {
    state.table.search = e.target.value.toLowerCase().trim();
    state.table.page = 1;
    renderOrderTable();
  });

  document.getElementById("btn-prev-page").addEventListener("click", () => {
    if (state.table.page > 1) {
      state.table.page--;
      renderOrderTable();
    }
  });

  document.getElementById("btn-next-page").addEventListener("click", () => {
    const totalPages = Math.ceil(getTableFilteredRows().length / state.table.pageSize);
    if (state.table.page < totalPages) {
      state.table.page++;
      renderOrderTable();
    }
  });

  // Export CSV
  document.getElementById("btn-export-csv").addEventListener("click", () => {
    exportFilteredDataToCSV();
  });

  // Data Assumptions Modal
  const modal = document.getElementById("assumptions-modal");
  document.getElementById("btn-open-assumptions").addEventListener("click", () => {
    modal.classList.add("active");
  });
  document.getElementById("btn-close-assumptions").addEventListener("click", () => {
    modal.classList.remove("active");
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });
}

/**
 * Theme Toggle Setup
 */
function initTheme() {
  const btnTheme = document.getElementById("btn-theme-toggle");
  const currentTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);

  btnTheme.addEventListener("click", () => {
    const active = document.documentElement.getAttribute("data-theme");
    const next = active === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon(next);
    // Refresh charts to adopt theme text and grid colors
    renderSalesByDayChart();
    renderCategoryRevenueChart();
    renderTopItemsChart();
  });
}

function updateThemeIcon(theme) {
  const btnTheme = document.getElementById("btn-theme-toggle");
  btnTheme.innerHTML = theme === "light" ? "🌙" : "☀️";
  btnTheme.title = theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode";
}

/**
 * Preset date handler
 */
function applyPresetDate(preset) {
  const dates = [...new Set(state.data.map(d => d.order_date))].sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  state.filters.dayType = "all";

  if (preset === "all") {
    state.filters.startDate = minDate;
    state.filters.endDate = maxDate;
  } else if (preset === "last-7") {
    const maxD = new Date(maxDate);
    const minD = new Date(maxD);
    minD.setDate(maxD.getDate() - 6);
    state.filters.startDate = minD.toISOString().split("T")[0];
    state.filters.endDate = maxDate;
  } else if (preset === "last-14") {
    const maxD = new Date(maxDate);
    const minD = new Date(maxD);
    minD.setDate(maxD.getDate() - 13);
    state.filters.startDate = minD.toISOString().split("T")[0];
    state.filters.endDate = maxDate;
  } else if (preset === "weekends") {
    state.filters.startDate = minDate;
    state.filters.endDate = maxDate;
    state.filters.dayType = "weekends";
  } else if (preset === "weekdays") {
    state.filters.startDate = minDate;
    state.filters.endDate = maxDate;
    state.filters.dayType = "weekdays";
  }

  document.getElementById("filter-start-date").value = state.filters.startDate;
  document.getElementById("filter-end-date").value = state.filters.endDate;

  applyFilters();
}

function clearPresetPillActiveState() {
  document.querySelectorAll(".preset-pill").forEach(p => p.classList.remove("active"));
}

function resetAllFilters() {
  const dates = state.data.map(d => d.order_date).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];

  state.filters.startDate = minDate;
  state.filters.endDate = maxDate;
  state.filters.category = "all";
  state.filters.paymentMethod = "all";
  state.filters.dayType = "all";

  document.getElementById("filter-start-date").value = minDate;
  document.getElementById("filter-end-date").value = maxDate;
  document.getElementById("filter-category").value = "all";
  document.getElementById("filter-payment").value = "all";

  clearPresetPillActiveState();
  const allPill = document.querySelector('.preset-pill[data-preset="all"]');
  if (allPill) allPill.classList.add("active");

  state.table.search = "";
  document.getElementById("table-search-input").value = "";
  state.table.page = 1;

  applyFilters();
}

/**
 * Populates Category & Payment filters based on dataset
 */
function populateFilterDropdowns() {
  const categories = [...new Set(state.data.map(d => d.category))].sort();
  const payments = [...new Set(state.data.map(d => d.payment_method))].sort();

  const catSelect = document.getElementById("filter-category");
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });

  const paySelect = document.getElementById("filter-payment");
  payments.forEach(pay => {
    const opt = document.createElement("option");
    opt.value = pay;
    opt.textContent = pay;
    paySelect.appendChild(opt);
  });
}

/**
 * Filter Engine: filters RAW data and triggers UI updates
 */
function applyFilters() {
  const { startDate, endDate, category, paymentMethod, dayType } = state.filters;

  state.filteredData = state.data.filter(row => {
    if (startDate && row.order_date < startDate) return false;
    if (endDate && row.order_date > endDate) return false;

    if (category !== "all" && row.category !== category) return false;
    if (paymentMethod !== "all" && row.payment_method !== paymentMethod) return false;

    const isWeekend = ["Friday", "Saturday", "Sunday"].includes(row.day_of_week);
    if (dayType === "weekends" && !isWeekend) return false;
    if (dayType === "weekdays" && isWeekend) return false;

    return true;
  });

  state.table.page = 1;

  // Update UI components
  updateFilterStatusBadge();
  updateKPICards();
  renderSalesByDayChart();
  renderCategoryRevenueChart();
  renderTopItemsChart();
  renderHeatmap();
  renderOrderTable();
}

/**
 * Update active filters status banner
 */
function updateFilterStatusBadge() {
  const tagsContainer = document.getElementById("active-filter-tags");
  const countSpan = document.getElementById("record-count-display");
  tagsContainer.innerHTML = "";

  const tags = [];
  const { startDate, endDate, category, paymentMethod, dayType } = state.filters;

  if (startDate && endDate) {
    tags.push(`${startDate} to ${endDate}`);
  }
  if (category !== "all") {
    tags.push(`Category: ${category}`);
  }
  if (paymentMethod !== "all") {
    tags.push(`Payment: ${paymentMethod}`);
  }
  if (dayType !== "all") {
    tags.push(dayType === "weekends" ? "Weekends Only" : "Weekdays Only");
  }

  tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "active-tag";
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });

  const distinctOrders = new Set(state.filteredData.map(r => r.order_id)).size;
  countSpan.textContent = `Showing ${state.filteredData.length} items across ${distinctOrders} orders`;
}

/**
 * Compute and update 4 Key KPI Cards in Indian Rupees (₹)
 */
function updateKPICards() {
  const distinctOrders = new Set(state.filteredData.map(r => r.order_id)).size;
  const totalRevenue = state.filteredData.reduce((sum, r) => sum + r.line_total, 0);
  const totalItems = state.filteredData.reduce((sum, r) => sum + r.quantity, 0);
  const aov = distinctOrders > 0 ? (totalRevenue / distinctOrders) : 0;
  const avgItemsPerOrder = distinctOrders > 0 ? (totalItems / distinctOrders).toFixed(1) : 0;

  // Update DOM in Rupees
  document.getElementById("kpi-revenue").textContent = formatCurrency(totalRevenue);
  document.getElementById("kpi-orders").textContent = distinctOrders.toLocaleString("en-IN");
  document.getElementById("kpi-aov").textContent = formatCurrency(aov);
  document.getElementById("kpi-items").textContent = totalItems.toLocaleString("en-IN");

  // Subtext micro-stats
  const uniqueDatesCount = Math.max(1, (new Set(state.filteredData.map(r => r.order_date)).size));
  const dailyAverage = totalRevenue > 0 ? (totalRevenue / uniqueDatesCount) : 0;

  document.getElementById("kpi-revenue-sub").textContent = distinctOrders > 0 ? `Across ${distinctOrders} customer tickets` : "No data";
  document.getElementById("kpi-orders-sub").textContent = totalRevenue > 0 ? `₹${Math.round(dailyAverage).toLocaleString("en-IN")}/day average` : "No data";
  document.getElementById("kpi-aov-sub").textContent = `Avg ${avgItemsPerOrder} items per customer`;
  
  // Category breakdown top share
  const catRev = {};
  state.filteredData.forEach(r => {
    catRev[r.category] = (catRev[r.category] || 0) + r.line_total;
  });
  let topCat = "-";
  let topCatVal = 0;
  Object.entries(catRev).forEach(([cat, rev]) => {
    if (rev > topCatVal) {
      topCatVal = rev;
      topCat = cat;
    }
  });
  const topCatShare = totalRevenue > 0 ? Math.round((topCatVal / totalRevenue) * 100) : 0;
  document.getElementById("kpi-items-sub").textContent = topCat !== "-" ? `Top: ${topCat} (${topCatShare}% rev)` : "No items";
}

/**
 * Chart 1: Sales by Day (Line Chart with Rupee axes and tooltips)
 */
function renderSalesByDayChart() {
  const canvas = document.getElementById("chart-sales-by-day");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const dailyMap = {};
  state.filteredData.forEach(r => {
    const d = r.order_date;
    if (!dailyMap[d]) {
      dailyMap[d] = { revenue: 0, orderIds: new Set() };
    }
    dailyMap[d].revenue += r.line_total;
    dailyMap[d].orderIds.add(r.order_id);
  });

  const sortedDates = Object.keys(dailyMap).sort();
  const revenueData = sortedDates.map(d => Math.round(dailyMap[d].revenue));
  const orderCountData = sortedDates.map(d => dailyMap[d].orderIds.size);

  const dateLabels = sortedDates.map(d => {
    const parts = d.split("-");
    const dt = new Date(parts[0], parts[1] - 1, parts[2]);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  if (state.charts.salesByDay) {
    state.charts.salesByDay.destroy();
  }

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, "rgba(245, 158, 11, 0.35)");
  gradient.addColorStop(1, "rgba(245, 158, 11, 0.0)");

  state.charts.salesByDay = new Chart(ctx, {
    type: "line",
    data: {
      labels: dateLabels,
      datasets: [
        {
          label: "Daily Revenue (₹)",
          data: revenueData,
          borderColor: "#f59e0b",
          backgroundColor: gradient,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: "#f59e0b",
          pointRadius: sortedDates.length > 20 ? 2 : 4,
          pointHoverRadius: 6,
          yAxisID: "y"
        },
        {
          label: "Order Volume",
          data: orderCountData,
          borderColor: "#3b82f6",
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          fill: false,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          labels: { color: textColor, boxWidth: 12 }
        },
        tooltip: {
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          titleColor: isDark ? "#f8fafc" : "#0f172a",
          bodyColor: isDark ? "#cbd5e1" : "#334155",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 0) {
                return ` Revenue: ₹${context.raw.toLocaleString("en-IN")}`;
              }
              return ` Orders: ${context.raw} orders`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor }
        },
        y: {
          type: "linear",
          display: true,
          position: "left",
          ticks: {
            color: textColor,
            callback: value => `₹${value.toLocaleString("en-IN")}`
          },
          grid: { color: gridColor }
        },
        y1: {
          type: "linear",
          display: true,
          position: "right",
          ticks: {
            color: "#3b82f6",
            precision: 0
          },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

/**
 * Chart 2: Revenue by Menu Category (Donut Chart)
 */
function renderCategoryRevenueChart() {
  const canvas = document.getElementById("chart-category-revenue");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const catMap = {};
  let totalRev = 0;
  state.filteredData.forEach(r => {
    catMap[r.category] = (catMap[r.category] || 0) + r.line_total;
    totalRev += r.line_total;
  });

  const categories = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);
  const dataValues = categories.map(c => Math.round(catMap[c]));
  const backgroundColors = categories.map(c => CATEGORY_COLORS[c] || "#94a3b8");

  if (state.charts.categoryRevenue) {
    state.charts.categoryRevenue.destroy();
  }

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const textColor = isDark ? "#94a3b8" : "#475569";

  state.charts.categoryRevenue = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: isDark ? "#161e2b" : "#ffffff",
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "66%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: textColor, boxWidth: 12, padding: 12 }
        },
        tooltip: {
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          titleColor: isDark ? "#f8fafc" : "#0f172a",
          bodyColor: isDark ? "#cbd5e1" : "#334155",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const val = context.raw;
              const pct = totalRev > 0 ? ((val / totalRev) * 100).toFixed(1) : 0;
              return ` ₹${val.toLocaleString("en-IN")} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Chart 3: Top-Selling Menu Items (Horizontal Bar Chart)
 * Toggleable by Quantity Sold or Revenue (₹) Generated
 */
function renderTopItemsChart() {
  const canvas = document.getElementById("chart-top-items");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const itemMap = {};
  state.filteredData.forEach(r => {
    if (!itemMap[r.item_name]) {
      itemMap[r.item_name] = {
        name: r.item_name,
        category: r.category,
        quantity: 0,
        revenue: 0
      };
    }
    itemMap[r.item_name].quantity += r.quantity;
    itemMap[r.item_name].revenue += r.line_total;
  });

  const isMetricQty = state.topItemMetric === "quantity";
  const sortedItems = Object.values(itemMap)
    .sort((a, b) => isMetricQty ? (b.quantity - a.quantity) : (b.revenue - a.revenue))
    .slice(0, 10);

  const labels = sortedItems.map(item => item.name);
  const values = sortedItems.map(item => isMetricQty ? item.quantity : Math.round(item.revenue));
  const barColors = sortedItems.map(item => CATEGORY_COLORS[item.category] || "#f59e0b");

  if (state.charts.topItems) {
    state.charts.topItems.destroy();
  }

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const textColor = isDark ? "#94a3b8" : "#475569";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";

  state.charts.topItems = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: isMetricQty ? "Units Sold" : "Revenue (₹)",
          data: values,
          backgroundColor: barColors,
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? "#1e293b" : "#ffffff",
          titleColor: isDark ? "#f8fafc" : "#0f172a",
          bodyColor: isDark ? "#cbd5e1" : "#334155",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const item = sortedItems[context.dataIndex];
              if (isMetricQty) {
                return ` ${context.raw} sold (₹${item.revenue.toLocaleString("en-IN")} revenue)`;
              }
              return ` ₹${context.raw.toLocaleString("en-IN")} (${item.quantity} units sold)`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
            callback: value => isMetricQty ? value : `₹${value.toLocaleString("en-IN")}`
          },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor, font: { size: 11 } },
          grid: { display: false }
        }
      }
    }
  });
}

/**
 * Busy Hours and Days Heatmap
 * 7 Days of the week (Y) x 12 Operating Hours (X)
 */
function renderHeatmap() {
  const container = document.getElementById("heatmap-wrapper");
  if (!container) return;

  const matrix = {};
  DAYS_ORDER.forEach(day => {
    matrix[day] = {};
    OPERATING_HOURS.forEach(hour => {
      matrix[day][hour] = { orders: new Set(), revenue: 0, items: 0 };
    });
  });

  let maxOrdersInSlot = 0;
  let peakSlot = { day: "", hour: 12, count: 0, revenue: 0 };

  state.filteredData.forEach(r => {
    const day = r.day_of_week;
    const hour = r.hour;
    if (matrix[day] && matrix[day][hour]) {
      matrix[day][hour].orders.add(r.order_id);
      matrix[day][hour].revenue += r.line_total;
      matrix[day][hour].items += r.quantity;
    }
  });

  DAYS_ORDER.forEach(day => {
    OPERATING_HOURS.forEach(hour => {
      const orderCount = matrix[day][hour].orders.size;
      if (orderCount > maxOrdersInSlot) {
        maxOrdersInSlot = orderCount;
      }
      if (orderCount > peakSlot.count) {
        peakSlot = {
          day: day,
          hour: hour,
          count: orderCount,
          revenue: matrix[day][hour].revenue
        };
      }
    });
  });

  let html = `<table class="heatmap-table">
    <thead>
      <tr>
        <th class="day-label">Day</th>`;

  OPERATING_HOURS.forEach(hour => {
    const hourLabel = formatHourLabel(hour);
    html += `<th>${hourLabel}</th>`;
  });

  html += `</tr>
    </thead>
    <tbody>`;

  DAYS_ORDER.forEach(day => {
    html += `<tr><th class="day-label">${day.slice(0, 3)}</th>`;
    OPERATING_HOURS.forEach(hour => {
      const slot = matrix[day][hour];
      const count = slot.orders.size;
      const rev = slot.revenue;
      const intensity = maxOrdersInSlot > 0 ? (count / maxOrdersInSlot) : 0;
      
      const bgColor = getHeatmapCellColor(intensity, count);
      const isPeak = count === peakSlot.count && count > 0;

      html += `<td class="heatmap-cell ${isPeak ? 'peak-cell' : ''}" 
                   style="background-color: ${bgColor};" 
                   data-day="${day}" 
                   data-hour="${hour}" 
                   data-orders="${count}" 
                   data-revenue="${rev.toFixed(0)}">
                   ${count > 0 ? count : ''}
               </td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  // Update Peak Badge in Rupees
  const peakDisplay = document.getElementById("heatmap-peak-badge");
  if (peakDisplay) {
    if (peakSlot.count > 0) {
      peakDisplay.textContent = `🔥 Peak: ${peakSlot.day} ${formatHourLabel(peakSlot.hour)} (${peakSlot.count} orders, ₹${Math.round(peakSlot.revenue).toLocaleString("en-IN")})`;
    } else {
      peakDisplay.textContent = `No orders found for current filter`;
    }
  }

  setupHeatmapTooltips();
}

function getHeatmapCellColor(intensity, count) {
  if (count === 0) {
    return "rgba(255, 255, 255, 0.03)";
  }
  const alpha = (0.2 + intensity * 0.78).toFixed(2);
  if (intensity > 0.7) {
    return `rgba(234, 88, 12, ${alpha})`;
  } else if (intensity > 0.35) {
    return `rgba(245, 158, 11, ${alpha})`;
  } else {
    return `rgba(217, 119, 6, ${alpha})`;
  }
}

function formatHourLabel(h) {
  if (h === 12) return "12 PM";
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

function setupHeatmapTooltips() {
  const tooltip = document.getElementById("heatmap-custom-tooltip");
  if (!tooltip) return;

  const cells = document.querySelectorAll(".heatmap-cell");
  cells.forEach(cell => {
    cell.addEventListener("mouseenter", (e) => {
      const day = cell.dataset.day;
      const hour = parseInt(cell.dataset.hour, 10);
      const orders = cell.dataset.orders;
      const rev = parseInt(cell.dataset.revenue, 10);

      if (parseInt(orders, 10) === 0) {
        tooltip.innerHTML = `<strong>${day} ${formatHourLabel(hour)}</strong><br/><span style="color:#94a3b8">No orders in this period</span>`;
      } else {
        tooltip.innerHTML = `<strong>${day} at ${formatHourLabel(hour)}</strong><br/>
                             Orders: <span style="color:#f59e0b;font-weight:700;">${orders} orders</span><br/>
                             Revenue: <span style="color:#10b981;font-weight:700;">₹${rev.toLocaleString("en-IN")}</span>`;
      }
      tooltip.style.display = "block";
    });

    cell.addEventListener("mousemove", (e) => {
      tooltip.style.left = `${e.clientX + 14}px`;
      tooltip.style.top = `${e.clientY + 14}px`;
    });

    cell.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });
  });
}

/**
 * Order Details Table & Pagination
 */
function getTableFilteredRows() {
  const q = state.table.search;
  if (!q) return state.filteredData;
  return state.filteredData.filter(r => 
    r.order_id.toLowerCase().includes(q) ||
    r.item_name.toLowerCase().includes(q) ||
    r.category.toLowerCase().includes(q) ||
    r.payment_method.toLowerCase().includes(q) ||
    r.order_date.includes(q)
  );
}

function renderOrderTable() {
  const tbody = document.getElementById("table-orders-body");
  if (!tbody) return;

  const rows = getTableFilteredRows();
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / state.table.pageSize));

  if (state.table.page > totalPages) {
    state.table.page = totalPages;
  }

  const startIdx = (state.table.page - 1) * state.table.pageSize;
  const pageRows = rows.slice(startIdx, startIdx + state.table.pageSize);

  if (pageRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted)">No matching order line items found.</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map(r => {
      const catClass = r.category.replace(/[^a-zA-Z0-9]/g, "-");
      return `
        <tr>
          <td><strong>${r.order_id}</strong></td>
          <td>${r.order_date}</td>
          <td>${r.order_time}</td>
          <td>${r.item_name}</td>
          <td><span class="cat-badge cat-${catClass}">${r.category}</span></td>
          <td style="text-align:center;">${r.quantity}</td>
          <td>₹${r.item_price.toFixed(2)}</td>
          <td><strong>₹${r.line_total.toFixed(2)}</strong></td>
          <td><span class="pay-badge">${r.payment_method}</span></td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("table-page-info").textContent = `Page ${state.table.page} of ${totalPages} (${totalRows} total items)`;
  document.getElementById("btn-prev-page").disabled = state.table.page <= 1;
  document.getElementById("btn-next-page").disabled = state.table.page >= totalPages;
}

/**
 * CSV Exporter
 */
function exportFilteredDataToCSV() {
  const rows = getTableFilteredRows();
  if (rows.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = ["Order ID", "Date", "Time", "Day", "Item Name", "Category", "Quantity", "Price (INR)", "Line Total (INR)", "Payment Method"];
  const csvLines = [headers.join(",")];

  rows.forEach(r => {
    const values = [
      `"${r.order_id}"`,
      `"${r.order_date}"`,
      `"${r.order_time}"`,
      `"${r.day_of_week}"`,
      `"${r.item_name.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      r.quantity,
      r.item_price.toFixed(2),
      r.line_total.toFixed(2),
      `"${r.payment_method}"`
    ];
    csvLines.push(values.join(","));
  });

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `restaurant_orders_inr_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Rupee Currency Formatter
 */
function formatCurrency(val) {
  return "₹" + Math.round(val).toLocaleString("en-IN");
}
