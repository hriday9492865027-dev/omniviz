# OmniViz | Enterprise E-Commerce Analytics & Executive Intelligence

[![Hackathon Edition](https://img.shields.io/badge/Edition-University_Hackathon-6366f1.svg)](#)
[![Dataset](https://img.shields.io/badge/Dataset-10%2C000_Transactions-10b981.svg)](#)
[![Data Integrity](https://img.shields.io/badge/Data_Integrity-100%25_Verified-06b6d4.svg)](#)
[![Charts](https://img.shields.io/badge/Charts-Chart.js_4.4-f59e0b.svg)](#)

> **OmniViz** is an interactive, enterprise-grade e-commerce analytics dashboard and strategic audit engine. Engineered from the ground up to evaluate 10,000 real-world e-commerce transactions across four years (2021–2024), OmniViz delivers automated executive insights, profitability diagnostics, risk discovery, and interactive what-if simulation.

---

## 🌟 Executive Summary & Verified KPI Baseline

All numbers and visual charts are computed dynamically from `ecommerce_sales_dataset.csv`. Zero hardcoded or mock figures.

| KPI Metric | Value | Technical Context |
| :--- | :--- | :--- |
| **Total Revenue** | **$5,284,387.70** | Combined topline portfolio volume |
| **Total Direct Cost** | **$3,846,749.39** | Product and procurement expense |
| **Total Net Profit** | **$1,437,638.31** | Operating bottom-line profit |
| **Overall Profit Margin** | **27.21%** | Benchmark healthy rate (>25.0%) |
| **Total Transactions** | **10,000** | Verified orders from 2021 through 2024 |
| **Total Units Fulfilled** | **29,915** | Items sold across 5 major categories |
| **Average Order Value (AOV)** | **$528.44** | Revenue per individual customer order |
| **Loss-Making Orders** | **1,338 (13.38%)** | -$54,847.48 cumulative margin deficit |

---

## 🔍 Key Strategic Discoveries (Automated Insights)

1. **The 30%+ Discount Cliff (Margin Erosion Risk)**:
   - Transactions discounted between **0% and 25%** demonstrate a **0.0% loss rate** and healthy margins.
   - At **30% discount**, loss transactions emerge (14.9% loss rate).
   - At **40% to 50% discount**, transactions become net loss-making, accumulating **-$54,847.48** in profit destruction.
2. **Category Dominance**:
   - **Electronics** serves as the company's core engine, contributing **64.0% of total revenue** ($3,382,028.46) and **64.4% of total profit** ($925,448.15).
3. **Regional Profitability Champion**:
   - **Middle East** leads globally with a **28.51% profit margin** ($384,522.85 profit), accompanied by a 4.9-day average delivery speed.
4. **Fulfillment Friction & Capital Lock**:
   - Returned (18.57%) and Cancelled (9.08%) orders represent **$1,438,776.62** in at-risk revenue.

---

## 🚀 Key Dashboard Features

- **Interactive Multi-Dimensional Filtering**:
  - Filter simultaneously by **Year (2021–2024)**, **Region**, **Category**, **Customer Segment (VIP, Premium, Regular, New)**, and **Order Status**.
  - Instant live search matching Product Name, Order ID, Country, or Customer ID.
  - Active filter chips with 1-click removal and live record counters.
- **Visual Analytics Suite (Chart.js 4.4)**:
  - **Revenue & Profit Trajectory Over Time**: Area/line trajectory with **Monthly**, **Quarterly**, and **Yearly** toggles and secondary margin axis.
  - **Order Status Breakdown**: Interactive donut chart analyzing fulfillment distribution.
  - **Revenue & Profit by Category**: Comparative volume and profitability bars.
  - **Revenue & Profit by Region**: Geographic performance benchmark.
  - **Discount vs Profit Erosion Curve**: Strategic audit mapping discount tiers to loss-making transactions.
  - **Customer Segment Matrix**: Performance across customer tiers.
  - **Top 10 Products Leaderboard**: Interactive rankings with **By Revenue**, **By Profit**, and **By Units** toggles.
  - **Shipping Logistics Matrix**: Speed, freight cost, and net margin after shipping.
- **What-If Strategy Simulator**:
  - Interactive sliders to model discount caps and return mitigation, projecting real-time bottom-line profit recapture.
- **Data Explorer Table**:
  - Searchable transaction viewer with pagination, formatted metrics, and **Export CSV** download.
- **Design System & Theme Engine**:
  - Modern glassmorphic dark theme (Executive Midnight) with high-contrast light mode toggle.
  - Fully responsive design from mobile to 4K displays.
  - Print-ready executive PDF report export.

---

## 📁 Repository Structure

```
├── index.html                  # Main application structure and responsive layout
├── style.css                   # Enterprise modern design system and styling
├── app.js                      # Core reactive application and charting engine
├── data.js                     # High-performance pre-parsed dataset (10k rows)
├── ecommerce_sales_dataset.csv # Raw source transactions dataset
├── run_eda_complete.py         # Complete Python exploratory data analysis script
├── generate_eda_excel.py       # Excel report generator script
├── EDA_RESULTS.csv             # Exported summary metrics
├── EDA_RESULTS.xlsx            # Formatted Excel workbook
└── README.md                   # Project documentation
```

---

## 💻 Quick Start & Running Locally

### Option 1: Direct File Launch (No dependencies needed)
Simply double-click `index.html` in your file explorer to open the dashboard in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server
Run the built-in Python HTTP server from the project directory:

```bash
# Start server on port 8080
python -m http.server 8080
```

Open [http://localhost:8080/index.html](http://localhost:8080/index.html) in your browser.

---

## 🛠️ Built With

- **HTML5 / Vanilla CSS3**: Modern design tokens, CSS variables, glassmorphism, responsive CSS Grid and Flexbox.
- **JavaScript (ES6+)**: Sub-millisecond filtering, in-memory data aggregation, What-If simulation engine.
- **Chart.js 4.4.1**: Professional canvas charting, curved gradients, custom tooltips, dual-axis scaling.
- **Lucide Icons**: Vector iconography.
- **Python & Pandas**: Exploratory data audit and verification scripts.

---

**Developed for University Hackathon Competition** &bull; 100% Calculated from Source Data
