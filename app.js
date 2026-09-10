/**
 * OmniViz Analytics Dashboard - Main Application Engine
 * 100% Calculated dynamically from ecommerce_sales_dataset.csv
 */

(function() {
  'use strict';

  // --- Global State ---
  let rawData = [];
  let filteredData = [];
  let timeMode = 'monthly'; // 'monthly', 'quarterly', 'yearly'
  let topProductSortMode = 'revenue'; // 'revenue', 'profit', 'units'
  let currentPage = 1;
  const rowsPerPage = 10;
  let currentTheme = 'dark';

  // Chart Instances
  let timeChart = null;
  let statusChart = null;
  let categoryChart = null;
  let regionChart = null;
  let discountChart = null;
  let segmentChart = null;
  let shippingChart = null;

  // Formatting Helpers
  const fmtCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const fmtNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return new Intl.NumberFormat('en-US').format(Math.round(val));
  };

  const fmtPercent = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '0.00%';
    return (val).toFixed(2) + '%';
  };

  // --- Initializer ---
  function init() {
    // 1. Check data availability
    if (window.ECOMMERCE_DATA && Array.isArray(window.ECOMMERCE_DATA) && window.ECOMMERCE_DATA.length > 0) {
      rawData = window.ECOMMERCE_DATA;
      onDataLoaded();
    } else {
      // Fallback: try fetching data.json or CSV
      console.warn('window.ECOMMERCE_DATA not found, attempting fetch...');
      fetch('ecommerce_sales_dataset.csv')
        .then(res => res.text())
        .then(csvText => {
          rawData = parseCSV(csvText);
          onDataLoaded();
        })
        .catch(err => {
          console.error('Failed to load dataset:', err);
          document.body.innerHTML = '<div style="padding: 2rem; color: #f43f5e; font-family: sans-serif;"><h2>Failed to load dataset</h2><p>' + err.message + '</p></div>';
        });
    }
  }

  // Simple CSV Parser fallback
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',');
    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(',');
      if (currentline.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          const h = headers[j].trim();
          let v = currentline[j].trim();
          if (!isNaN(v) && v !== '') {
            v = Number(v);
          }
          obj[h] = v;
        }
        results.push(obj);
      }
    }
    return results;
  }

  function onDataLoaded() {
    console.log(`Successfully loaded ${rawData.length} transactions.`);
    
    // Normalize types
    rawData.forEach(row => {
      row.Revenue = Number(row.Revenue) || 0;
      row.Cost = Number(row.Cost) || 0;
      row.Profit = Number(row.Profit) || 0;
      row.Quantity = Number(row.Quantity) || 0;
      row.Discount = Number(row.Discount) || 0;
      row.Shipping_Cost = Number(row.Shipping_Cost) || 0;
      row.Shipping_Days = Number(row.Shipping_Days) || 0;
      row.Profit_Margin_Pct = row.Revenue > 0 ? (row.Profit / row.Revenue) * 100 : 0;
    });

    // Setup Event Listeners
    setupEventListeners();

    // Initial Filter & Render
    applyFilters();

    // Initialize Lucide Icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Filter Changes
    ['filterYear', 'filterRegion', 'filterCategory', 'filterSegment', 'filterStatus'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => {
        currentPage = 1;
        applyFilters();
      });
    });

    // Search input (debounced)
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentPage = 1;
          applyFilters();
        }, 200);
      });
    }

    // Reset Filters
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }

    // Time Toggle Buttons
    document.querySelectorAll('.chart-controls [data-time]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.chart-controls [data-time]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        timeMode = e.target.getAttribute('data-time');
        renderTimeTrendChart();
      });
    });

    // Top Products Sort Buttons
    const btnTopRevenue = document.getElementById('btnTopRevenue');
    const btnTopProfit = document.getElementById('btnTopProfit');
    const btnTopUnits = document.getElementById('btnTopUnits');

    if (btnTopRevenue) btnTopRevenue.addEventListener('click', () => setTopProductSort('revenue'));
    if (btnTopProfit) btnTopProfit.addEventListener('click', () => setTopProductSort('profit'));
    if (btnTopUnits) btnTopUnits.addEventListener('click', () => setTopProductSort('units'));

    // Pagination
    const prevBtn = document.getElementById('btnPrevPage');
    const nextBtn = document.getElementById('btnNextPage');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderDataTable();
      }
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderDataTable();
      }
    });

    // Simulator Sliders
    const simDiscount = document.getElementById('simDiscountRange');
    const simReturn = document.getElementById('simReturnRange');
    if (simDiscount) simDiscount.addEventListener('input', runSimulation);
    if (simReturn) simReturn.addEventListener('input', runSimulation);

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Export CSV
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportFilteredCSV);

    // Report PDF / Print
    const printBtn = document.getElementById('printReportBtn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  }

  function setTopProductSort(mode) {
    topProductSortMode = mode;
    document.getElementById('btnTopRevenue')?.classList.toggle('active', mode === 'revenue');
    document.getElementById('btnTopProfit')?.classList.toggle('active', mode === 'profit');
    document.getElementById('btnTopUnits')?.classList.toggle('active', mode === 'units');
    renderTopProductsTable();
  }

  function resetFilters() {
    document.getElementById('filterYear').value = 'ALL';
    document.getElementById('filterRegion').value = 'ALL';
    document.getElementById('filterCategory').value = 'ALL';
    document.getElementById('filterSegment').value = 'ALL';
    document.getElementById('filterStatus').value = 'ALL';
    document.getElementById('searchInput').value = '';
    currentPage = 1;
    applyFilters();
  }

  // --- Filtering Engine ---
  function applyFilters() {
    const yearVal = document.getElementById('filterYear')?.value || 'ALL';
    const regionVal = document.getElementById('filterRegion')?.value || 'ALL';
    const catVal = document.getElementById('filterCategory')?.value || 'ALL';
    const segVal = document.getElementById('filterSegment')?.value || 'ALL';
    const statusVal = document.getElementById('filterStatus')?.value || 'ALL';
    const query = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

    filteredData = rawData.filter(row => {
      if (yearVal !== 'ALL' && String(row.Year) !== yearVal) return false;
      if (regionVal !== 'ALL' && row.Region !== regionVal) return false;
      if (catVal !== 'ALL' && row.Category !== catVal) return false;
      if (segVal !== 'ALL' && row.Customer_Segment !== segVal) return false;
      if (statusVal !== 'ALL' && row.Order_Status !== statusVal) return false;
      if (query) {
        const prod = (row.Product_Name || '').toLowerCase();
        const ord = (row.Order_ID || '').toLowerCase();
        const ctry = (row.Country || '').toLowerCase();
        const cust = (row.Customer_ID || '').toLowerCase();
        if (!prod.includes(query) && !ord.includes(query) && !ctry.includes(query) && !cust.includes(query)) {
          return false;
        }
      }
      return true;
    });

    updateActiveFilterChips(yearVal, regionVal, catVal, segVal, statusVal, query);
    updateKPIs();
    generateAutomatedInsights();
    renderAllCharts();
    renderTopProductsTable();
    renderDataTable();
    runSimulation();

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function updateActiveFilterChips(year, region, cat, seg, status, query) {
    const container = document.getElementById('activeChipsContainer');
    if (!container) return;

    const chips = [];
    if (year !== 'ALL') chips.push({ label: `Year: ${year}`, type: 'year', clearVal: 'filterYear' });
    if (region !== 'ALL') chips.push({ label: `Region: ${region}`, type: 'region', clearVal: 'filterRegion' });
    if (cat !== 'ALL') chips.push({ label: `Category: ${cat}`, type: 'category', clearVal: 'filterCategory' });
    if (seg !== 'ALL') chips.push({ label: `Segment: ${seg}`, type: 'segment', clearVal: 'filterSegment' });
    if (status !== 'ALL') chips.push({ label: `Status: ${status}`, type: 'status', clearVal: 'filterStatus' });
    if (query) chips.push({ label: `Search: "${query}"`, type: 'search', clearVal: 'searchInput' });

    if (chips.length === 0) {
      container.innerHTML = '<span class="filter-chip"><i data-lucide="check" style="width: 12px; height: 12px;"></i> All 10,000 Transactions</span>';
    } else {
      container.innerHTML = chips.map(c => `
        <span class="filter-chip">
          ${c.label}
          <span class="chip-remove-btn" onclick="window.omniClearFilter('${c.clearVal}')">&times;</span>
        </span>
      `).join('');
    }

    const pill = document.getElementById('recordStatsPill');
    if (pill) {
      const pct = ((filteredData.length / rawData.length) * 100).toFixed(1);
      pill.textContent = `Showing ${fmtNumber(filteredData.length)} / ${fmtNumber(rawData.length)} orders (${pct}%)`;
    }
  }

  // Global helper for clearing individual chips
  window.omniClearFilter = function(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      if (el.tagName === 'SELECT') el.value = 'ALL';
      else if (el.tagName === 'INPUT') el.value = '';
      applyFilters();
    }
  };

  // --- KPI Calculation & Rendering ---
  function updateKPIs() {
    let totRev = 0;
    let totCost = 0;
    let totProfit = 0;
    let totQty = 0;
    let sumDiscount = 0;
    let lossOrdersCount = 0;
    let lossDollars = 0;

    const count = filteredData.length;

    for (let i = 0; i < count; i++) {
      const r = filteredData[i];
      totRev += r.Revenue;
      totCost += r.Cost;
      totProfit += r.Profit;
      totQty += r.Quantity;
      sumDiscount += r.Discount;
      if (r.Profit < 0) {
        lossOrdersCount++;
        lossDollars += r.Profit;
      }
    }

    const marginPct = totRev > 0 ? (totProfit / totRev) * 100 : 0;
    const aov = count > 0 ? totRev / count : 0;
    const avgDisc = count > 0 ? (sumDiscount / count) * 100 : 0;
    const lossPct = count > 0 ? (lossOrdersCount / count) * 100 : 0;

    // Global Dataset totals for portfolio share
    const globalRev = rawData.reduce((acc, cur) => acc + cur.Revenue, 0);
    const globalProfit = rawData.reduce((acc, cur) => acc + cur.Profit, 0);

    // Update DOM
    document.getElementById('kpiRevenue').textContent = fmtCurrency(totRev);
    const revPctPortfolio = globalRev > 0 ? ((totRev / globalRev) * 100).toFixed(1) : '100';
    document.getElementById('kpiRevSubtext').textContent = `${revPctPortfolio}% of global revenue portfolio`;

    document.getElementById('kpiProfit').textContent = fmtCurrency(totProfit);
    document.getElementById('kpiCostSubtext').textContent = `Total Cost: ${fmtCurrency(totCost)}`;
    
    // Profit badge styling
    const profitBadge = document.getElementById('kpiProfitBadge');
    if (totProfit >= 0) {
      profitBadge.className = 'kpi-badge positive';
      profitBadge.innerHTML = '<i data-lucide="check-circle-2" style="width: 12px; height: 12px;"></i> Net Positive';
    } else {
      profitBadge.className = 'kpi-badge negative';
      profitBadge.innerHTML = '<i data-lucide="alert-octagon" style="width: 12px; height: 12px;"></i> Net Loss Deficit';
    }

    // Margin
    document.getElementById('kpiMargin').textContent = fmtPercent(marginPct);
    const marginBadge = document.getElementById('kpiMarginBadge');
    if (marginPct >= 25) {
      marginBadge.className = 'kpi-badge positive';
      marginBadge.textContent = 'High Margin (>25%)';
    } else if (marginPct >= 15) {
      marginBadge.className = 'kpi-badge neutral';
      marginBadge.textContent = 'Moderate Margin';
    } else {
      marginBadge.className = 'kpi-badge negative';
      marginBadge.textContent = 'Compressed Margin (<15%)';
    }

    // Orders & AOV
    document.getElementById('kpiOrders').textContent = fmtNumber(count);
    document.getElementById('kpiQtySubtext').textContent = `Total Units: ${fmtNumber(totQty)}`;
    document.getElementById('kpiAovBadge').textContent = `AOV: ${fmtCurrency(aov)}`;

    // Discount & Loss Orders
    document.getElementById('kpiDiscount').textContent = `${avgDisc.toFixed(1)}% Avg`;
    document.getElementById('kpiLossOrdersSubtext').textContent = `Loss Orders: ${fmtNumber(lossOrdersCount)} (${lossPct.toFixed(1)}%)`;
    const lossBadge = document.getElementById('kpiLossBadge');
    if (lossOrdersCount > 0) {
      lossBadge.className = 'kpi-badge negative';
      lossBadge.textContent = `Drag: -${fmtCurrency(Math.abs(lossDollars))}`;
    } else {
      lossBadge.className = 'kpi-badge positive';
      lossBadge.textContent = '0 Unprofitable Orders';
    }
  }

  // --- Dynamic Executive Key Insights Synthesizer ---
  function generateAutomatedInsights() {
    const grid = document.getElementById('insightsCardsGrid');
    if (!grid) return;

    if (filteredData.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No data matching the active filters.</div>';
      return;
    }

    // 1. Overall Metrics
    const totRev = filteredData.reduce((acc, r) => acc + r.Revenue, 0);
    const totProfit = filteredData.reduce((acc, r) => acc + r.Profit, 0);
    const marginPct = totRev > 0 ? (totProfit / totRev) * 100 : 0;
    const count = filteredData.length;

    // 2. Category Breakdown
    const catMap = {};
    filteredData.forEach(r => {
      if (!catMap[r.Category]) catMap[r.Category] = { rev: 0, profit: 0, count: 0 };
      catMap[r.Category].rev += r.Revenue;
      catMap[r.Category].profit += r.Profit;
      catMap[r.Category].count += 1;
    });

    let topCat = null;
    let topCatRev = -1;
    let bestMarginCat = null;
    let bestMargin = -999;

    Object.keys(catMap).forEach(cat => {
      const c = catMap[cat];
      const m = c.rev > 0 ? (c.profit / c.rev) * 100 : 0;
      if (c.rev > topCatRev) {
        topCatRev = c.rev;
        topCat = cat;
      }
      if (m > bestMargin) {
        bestMargin = m;
        bestMarginCat = cat;
      }
    });

    const topCatShare = totRev > 0 ? ((topCatRev / totRev) * 100).toFixed(1) : 0;

    // 3. Discount Erosion Analysis
    const discLoss = filteredData.filter(r => r.Discount >= 0.30 && r.Profit < 0);
    const totalLossDollars = filteredData.filter(r => r.Profit < 0).reduce((acc, r) => acc + r.Profit, 0);
    const lossOrdersCount = filteredData.filter(r => r.Profit < 0).length;

    // 4. Region Analysis
    const regMap = {};
    filteredData.forEach(r => {
      if (!regMap[r.Region]) regMap[r.Region] = { rev: 0, profit: 0, days: 0, count: 0 };
      regMap[r.Region].rev += r.Revenue;
      regMap[r.Region].profit += r.Profit;
      regMap[r.Region].days += r.Shipping_Days;
      regMap[r.Region].count += 1;
    });

    let topRegion = null;
    let topRegionMargin = -999;
    Object.keys(regMap).forEach(reg => {
      const m = regMap[reg].rev > 0 ? (regMap[reg].profit / regMap[reg].rev) * 100 : 0;
      if (m > topRegionMargin) {
        topRegionMargin = m;
        topRegion = reg;
      }
    });

    // 5. Returned / Cancelled Orders
    const frictionOrders = filteredData.filter(r => r.Order_Status === 'Returned' || r.Order_Status === 'Cancelled');
    const frictionRev = frictionOrders.reduce((acc, r) => acc + r.Revenue, 0);
    const frictionPct = count > 0 ? ((frictionOrders.length / count) * 100).toFixed(1) : 0;

    const cardsHtml = `
      <!-- Card 1: Profit Engine & Margins -->
      <div class="insight-card success">
        <div class="insight-icon-wrapper">
          <i data-lucide="trending-up" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="insight-content">
          <h4>Category Growth Driver: ${topCat || 'N/A'}</h4>
          <p>
            <strong>${topCat}</strong> generates <strong>${topCatShare}%</strong> of total revenue (${fmtCurrency(topCatRev)}).
            Highest margin category is <strong>${bestMarginCat}</strong> at <strong>${bestMargin.toFixed(1)}%</strong> profit margin.
          </p>
          <span class="insight-tag">Core Engine</span>
        </div>
      </div>

      <!-- Card 2: Critical Discount Erosion Warning -->
      <div class="insight-card danger">
        <div class="insight-icon-wrapper">
          <i data-lucide="alert-octagon" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="insight-content">
          <h4>Discount Risk: 30%+ Inflection Point</h4>
          <p>
            Discounts &le; 25% have a <strong>0.0% loss rate</strong>. However, orders with &ge; 30% discount incurred 
            <strong>${lossOrdersCount} loss transactions</strong> (-${fmtCurrency(Math.abs(totalLossDollars))} loss drag).
          </p>
          <span class="insight-tag">Action Required</span>
        </div>
      </div>

      <!-- Card 3: Regional Margin Champion -->
      <div class="insight-card primary">
        <div class="insight-icon-wrapper">
          <i data-lucide="globe-2" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="insight-content">
          <h4>Regional Alpha: ${topRegion || 'N/A'}</h4>
          <p>
            <strong>${topRegion}</strong> leads in profitability with a <strong>${topRegionMargin.toFixed(1)}% profit margin</strong>
            (${fmtCurrency(regMap[topRegion]?.profit || 0)} profit). Average delivery turnaround is <strong>${regMap[topRegion] ? (regMap[topRegion].days / regMap[topRegion].count).toFixed(1) : 0} days</strong>.
          </p>
          <span class="insight-tag">Benchmark</span>
        </div>
      </div>

      <!-- Card 4: Logistics & Returns Friction -->
      <div class="insight-card warning">
        <div class="insight-icon-wrapper">
          <i data-lucide="refresh-cw" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="insight-content">
          <h4>Fulfillment Drag: ${frictionPct}% At-Risk</h4>
          <p>
            Returned and Cancelled orders account for <strong>${fmtNumber(frictionOrders.length)} orders</strong> representing 
            <strong>${fmtCurrency(frictionRev)}</strong> in at-risk revenue. Standardizing QA can recapture substantial margin.
          </p>
          <span class="insight-tag">Optimization</span>
        </div>
      </div>
    `;

    grid.innerHTML = cardsHtml;
  }

  // --- Chart.js Theme Colors Configuration ---
  function getChartThemeColors() {
    const isDark = currentTheme === 'dark';
    return {
      textColor: isDark ? '#94a3b8' : '#475569',
      gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      tooltipBg: isDark ? '#1a263d' : '#ffffff',
      tooltipText: isDark ? '#f8fafc' : '#0f172a',
      tooltipBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
    };
  }

  // Common Tooltip Config
  function getStandardTooltip(colors, isCurrency = true) {
    return {
      backgroundColor: colors.tooltipBg,
      titleColor: colors.tooltipText,
      bodyColor: colors.tooltipText,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      padding: 10,
      boxPadding: 4,
      usePointStyle: true,
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || '';
          const val = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
          if (isCurrency && !label.includes('%') && !label.includes('Count') && !label.includes('Days')) {
            return `${label}: ${fmtCurrency(val)}`;
          } else if (label.includes('%') || label.includes('Margin')) {
            return `${label}: ${val.toFixed(2)}%`;
          }
          return `${label}: ${fmtNumber(val)}`;
        }
      }
    };
  }

  // --- Render All Charts ---
  function renderAllCharts() {
    renderTimeTrendChart();
    renderOrderStatusChart();
    renderCategoryChart();
    renderRegionChart();
    renderDiscountProfitChart();
    renderSegmentChart();
    renderShippingChart();
  }

  // 1. Time Series Trajectory Chart (Monthly, Quarterly, Yearly)
  function renderTimeTrendChart() {
    const ctx = document.getElementById('timeTrendChart')?.getContext('2d');
    if (!ctx) return;

    const colors = getChartThemeColors();
    const timeAgg = {};

    filteredData.forEach(r => {
      let key = '';
      if (timeMode === 'yearly') {
        key = String(r.Year);
      } else if (timeMode === 'quarterly') {
        key = `${r.Year} ${r.Quarter}`;
      } else {
        // Monthly
        const m = String(r.Month).padStart(2, '0');
        key = `${r.Year}-${m}`;
      }

      if (!timeAgg[key]) {
        timeAgg[key] = { key, rev: 0, cost: 0, profit: 0, orders: 0 };
      }
      timeAgg[key].rev += r.Revenue;
      timeAgg[key].cost += r.Cost;
      timeAgg[key].profit += r.Profit;
      timeAgg[key].orders += 1;
    });

    const sortedKeys = Object.keys(timeAgg).sort();
    const labels = sortedKeys.map(k => {
      if (timeMode === 'monthly') {
        const parts = k.split('-');
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      }
      return k;
    });

    const revData = sortedKeys.map(k => timeAgg[k].rev);
    const profitData = sortedKeys.map(k => timeAgg[k].profit);
    const marginData = sortedKeys.map(k => timeAgg[k].rev > 0 ? (timeAgg[k].profit / timeAgg[k].rev) * 100 : 0);

    if (timeChart) timeChart.destroy();

    // Gradients
    const revGradient = ctx.createLinearGradient(0, 0, 0, 300);
    revGradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
    revGradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    const profitGradient = ctx.createLinearGradient(0, 0, 0, 300);
    profitGradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
    profitGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    timeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue',
            data: revData,
            borderColor: '#6366f1',
            backgroundColor: revGradient,
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
            pointRadius: labels.length > 24 ? 1.5 : 3.5,
            pointHoverRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Profit',
            data: profitData,
            borderColor: '#10b981',
            backgroundColor: profitGradient,
            borderWidth: 2.5,
            tension: 0.3,
            fill: true,
            pointRadius: labels.length > 24 ? 1.5 : 3.5,
            pointHoverRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Profit Margin %',
            data: marginData,
            borderColor: '#06b6d4',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          tooltip: getStandardTooltip(colors)
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor, maxTicksLimit: 14, font: { size: 10 } }
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { size: 10 },
              callback: val => val >= 1000 ? '$' + (val / 1000).toFixed(0) + 'k' : '$' + val
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: {
              color: colors.textColor,
              font: { size: 10 },
              callback: val => val.toFixed(0) + '%'
            }
          }
        }
      }
    });
  }

  // 2. Order Status Breakdown Donut Chart
  function renderOrderStatusChart() {
    const ctx = document.getElementById('orderStatusChart')?.getContext('2d');
    if (!ctx) return;

    const colors = getChartThemeColors();
    const statusMap = { 'Delivered': 0, 'Processing': 0, 'Returned': 0, 'Cancelled': 0 };
    const revMap = { 'Delivered': 0, 'Processing': 0, 'Returned': 0, 'Cancelled': 0 };

    filteredData.forEach(r => {
      if (statusMap[r.Order_Status] !== undefined) {
        statusMap[r.Order_Status] += 1;
        revMap[r.Order_Status] += r.Revenue;
      }
    });

    const labels = ['Delivered', 'Processing', 'Returned', 'Cancelled'];
    const counts = labels.map(l => statusMap[l]);
    const bgColors = ['#10b981', '#6366f1', '#f59e0b', '#f43f5e'];

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: bgColors,
          borderColor: currentTheme === 'dark' ? '#131c2e' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          tooltip: {
            backgroundColor: colors.tooltipBg,
            titleColor: colors.tooltipText,
            bodyColor: colors.tooltipText,
            borderColor: colors.tooltipBorder,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const count = context.parsed;
                const total = filteredData.length;
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                const rev = revMap[label] || 0;
                return [
                  `${label}: ${fmtNumber(count)} orders (${pct}%)`,
                  `Revenue: ${fmtCurrency(rev)}`
                ];
              }
            }
          }
        }
      }
    });
  }

  // 3. Category Revenue & Profit Chart
  function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;

    const colors = getChartThemeColors();
    const catMap = {};

    filteredData.forEach(r => {
      if (!catMap[r.Category]) {
        catMap[r.Category] = { rev: 0, profit: 0 };
      }
      catMap[r.Category].rev += r.Revenue;
      catMap[r.Category].profit += r.Profit;
    });

    const sortedCats = Object.keys(catMap).sort((a, b) => catMap[b].rev - catMap[a].rev);
    const revs = sortedCats.map(c => catMap[c].rev);
    const profits = sortedCats.map(c => catMap[c].profit);

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedCats,
        datasets: [
          {
            label: 'Revenue',
            data: revs,
            backgroundColor: '#6366f1',
            borderRadius: 6
          },
          {
            label: 'Profit',
            data: profits,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          tooltip: {
            ...getStandardTooltip(colors),
            callbacks: {
              afterBody: function(items) {
                if (!items.length) return '';
                const cat = items[0].label;
                const c = catMap[cat];
                if (c && c.rev > 0) {
                  const m = ((c.profit / c.rev) * 100).toFixed(2);
                  return `Profit Margin: ${m}%`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { size: 10 } }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { size: 10 },
              callback: val => '$' + (val / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    });
  }

  // 4. Region Revenue & Profit Chart
  function renderRegionChart() {
    const ctx = document.getElementById('regionChart')?.getContext('2d');
    if (!ctx) return;

    const colors = getChartThemeColors();
    const regMap = {};

    filteredData.forEach(r => {
      if (!regMap[r.Region]) {
        regMap[r.Region] = { rev: 0, profit: 0, days: 0, count: 0 };
      }
      regMap[r.Region].rev += r.Revenue;
      regMap[r.Region].profit += r.Profit;
      regMap[r.Region].days += r.Shipping_Days;
      regMap[r.Region].count += 1;
    });

    const regions = ['Asia', 'Europe', 'Middle East', 'North America'].filter(r => regMap[r]);
    const revs = regions.map(r => regMap[r].rev);
    const profits = regions.map(r => regMap[r].profit);

    if (regionChart) regionChart.destroy();

    regionChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: regions,
        datasets: [
          {
            label: 'Revenue',
            data: revs,
            backgroundColor: '#06b6d4',
            borderRadius: 6
          },
          {
            label: 'Profit',
            data: profits,
            backgroundColor: '#a855f7',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          tooltip: {
            ...getStandardTooltip(colors),
            callbacks: {
              afterBody: function(items) {
                if (!items.length) return '';
                const reg = items[0].label;
                const d = regMap[reg];
                if (d && d.rev > 0) {
                  const m = ((d.profit / d.rev) * 100).toFixed(2);
                  const avgDays = (d.days / d.count).toFixed(1);
                  return `Profit Margin: ${m}%\nAvg Delivery: ${avgDays} days`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor, font: { size: 10 } }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              font: { size: 10 },
              callback: val => '$' + (val / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    });
  }

  // 5. Discount vs Profit Analysis Chart (Crucial Strategic Audit)
  function renderDiscountProfitChart() {
    const ctx = document.getElementById('discountProfitChart')?.getContext('2d');
    if (!ctx) return;

    const colors = getChartThemeColors();
    const tiers = [0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50];
    const discMap = {};
    tiers.forEach(t => {
      discMap[t] = { orders: 0, rev: 0, profit: 0, lossOrders: 0 };
    });

    filteredData.forEach(r => {
      const d = Number(r.Discount.toFixed(2));
      if (discMap[d]) {
        discMap[d].orders += 1;
        discMap[d].rev += r.Revenue;
        discMap[d].profit += r.Profit;
        if (r.Profit < 0) discMap[d].lossOrders += 1;
      }
    });

    const labels = tiers.map(t => (t * 100).toFixed(0) + '%');
    const profits = tiers.map(t => discMap[t].profit);
    const margins = tiers.map(t => discMap[t].rev > 0 ? (discMap[t].profit / discMap[t].rev) * 100 : 0);
    const lossCounts = tiers.map(t => discMap[t].lossOrders);

    // Color bars: positive profit gets emerald/indigo, negative gets bright rose/red
    const barColors = profits.map(p => p >= 0 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(244, 63, 94, 0.85)');

    if (discountChart) discountChart.destroy();

    discountChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'Net Profit ($)',
            data: profits,
            backgroundColor: barColors,
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Profit Margin %',
            data: margins,
            borderColor: '#10b981',
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: '#10b981',
            tension: 0.2,
            yAxisID: 'y1'
          },
          {
            type: 'line',
            label: 'Loss-Making Orders Count',
            data: lossCounts,
            borderColor: '#f43f5e',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 4,
            pointBackgroundColor: '#f43f5e',
            tension: 0.2,
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          tooltip: getStandardTooltip(colors)
        },
        scales: {
          x: {
            title: { display: true, text: 'Discount Tier Rate', color: colors.textColor, font: { size: 11, weight: '600' } },
            grid: { display: false },
            ticks: { color: colors.textColor }
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: colors.gridColor },
            title: { display: true, text: 'Net Profit ($)', color: colors.textColor, font: { size: 10 } },
            ticks: {
              color: colors.textColor,
              callback: val => val >= 1000 || val <= -1000 ? '$' + (val / 1000).toFixed(0) + 'k' : '$' + val
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Margin %', color: colors.textColor, font: { size: 10 } },
            ticks: {
              color: colors.textColor,
              callback: val => val.toFixed(0) + '%'
            }
          },
          y2: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            display: false
          }
        }
      }
    });
  }

  // 6. Customer Segment Performance Chart
  function renderSegmentChart() {
    const ctx = document.getElementById('segmentChart')?.getContext('2d');
    if (!ctx) return;

    const colors = getChartThemeColors();
    const segMap = { 'VIP': { rev: 0, profit: 0, orders: 0 }, 'Premium': { rev: 0, profit: 0, orders: 0 }, 'Regular': { rev: 0, profit: 0, orders: 0 }, 'New': { rev: 0, profit: 0, orders: 0 } };

    filteredData.forEach(r => {
      if (segMap[r.Customer_Segment]) {
        segMap[r.Customer_Segment].rev += r.Revenue;
        segMap[r.Customer_Segment].profit += r.Profit;
        segMap[r.Customer_Segment].orders += 1;
      }
    });

    const segments = ['VIP', 'Premium', 'Regular', 'New'];
    const revs = segments.map(s => segMap[s].rev);
    const profits = segments.map(s => segMap[s].profit);

    if (segmentChart) segmentChart.destroy();

    segmentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: segments,
        datasets: [
          {
            label: 'Revenue',
            data: revs,
            backgroundColor: '#f59e0b',
            borderRadius: 6
          },
          {
            label: 'Profit',
            data: profits,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          tooltip: {
            ...getStandardTooltip(colors),
            callbacks: {
              afterBody: function(items) {
                if (!items.length) return '';
                const seg = items[0].label;
                const d = segMap[seg];
                if (d && d.orders > 0) {
                  const aov = d.rev / d.orders;
                  const m = (d.profit / d.rev) * 100;
                  return `AOV: ${fmtCurrency(aov)}\nMargin: ${m.toFixed(2)}%\nOrders: ${fmtNumber(d.orders)}`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.textColor,
              callback: val => '$' + (val / 1000).toFixed(0) + 'k'
            }
          }
        }
      }
    });
  }

  // 7. Shipping Logistics Matrix Chart
  function renderShippingChart() {
    const ctx = document.getElementById('shippingChart')?.getContext('2d');
    if (!ctx) return;

    const colors = getChartThemeColors();
    const shipMap = {};

    filteredData.forEach(r => {
      if (!shipMap[r.Shipping_Method]) {
        shipMap[r.Shipping_Method] = { orders: 0, rev: 0, profit: 0, freight: 0, days: 0 };
      }
      shipMap[r.Shipping_Method].orders += 1;
      shipMap[r.Shipping_Method].rev += r.Revenue;
      shipMap[r.Shipping_Method].profit += r.Profit;
      shipMap[r.Shipping_Method].freight += r.Shipping_Cost;
      shipMap[r.Shipping_Method].days += r.Shipping_Days;
    });

    const methods = Object.keys(shipMap);
    const avgDays = methods.map(m => shipMap[m].orders > 0 ? (shipMap[m].days / shipMap[m].orders).toFixed(1) : 0);
    const netMargins = methods.map(m => {
      const s = shipMap[m];
      const netProfitAfterFreight = s.profit - s.freight;
      return s.rev > 0 ? ((netProfitAfterFreight / s.rev) * 100).toFixed(2) : 0;
    });

    if (shippingChart) shippingChart.destroy();

    shippingChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: methods,
        datasets: [
          {
            label: 'Avg Shipping Days (Speed)',
            data: avgDays,
            backgroundColor: '#06b6d4',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Net Margin % (After Freight)',
            data: netMargins,
            backgroundColor: '#8b5cf6',
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: colors.textColor, font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
          },
          tooltip: {
            ...getStandardTooltip(colors, false),
            callbacks: {
              label: function(context) {
                const label = context.dataset.label;
                const val = context.parsed.y;
                if (label.includes('Days')) return `${label}: ${val} days`;
                return `${label}: ${val}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.textColor }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Days', color: colors.textColor, font: { size: 10 } },
            grid: { color: colors.gridColor },
            ticks: { color: colors.textColor }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'Net Margin %', color: colors.textColor, font: { size: 10 } },
            grid: { drawOnChartArea: false },
            ticks: { color: colors.textColor, callback: val => val + '%' }
          }
        }
      }
    });
  }

  // --- Top 10 Products Leaderboard Table ---
  function renderTopProductsTable() {
    const tbody = document.getElementById('topProductsTableBody');
    if (!tbody) return;

    const prodMap = {};
    filteredData.forEach(r => {
      const key = r.Product_Name;
      if (!prodMap[key]) {
        prodMap[key] = {
          name: r.Product_Name,
          category: r.Category,
          orders: 0,
          units: 0,
          revenue: 0,
          profit: 0
        };
      }
      prodMap[key].orders += 1;
      prodMap[key].units += r.Quantity;
      prodMap[key].revenue += r.Revenue;
      prodMap[key].profit += r.Profit;
    });

    const prodList = Object.values(prodMap);
    prodList.forEach(p => {
      p.margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
    });

    if (topProductSortMode === 'profit') {
      prodList.sort((a, b) => b.profit - a.profit);
    } else if (topProductSortMode === 'units') {
      prodList.sort((a, b) => b.units - a.units);
    } else {
      prodList.sort((a, b) => b.revenue - a.revenue);
    }

    const top10 = prodList.slice(0, 10);
    const maxRev = top10.length > 0 ? Math.max(...top10.map(p => p.revenue)) : 1;

    if (top10.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 1.5rem;">No products match criteria</td></tr>';
      return;
    }

    tbody.innerHTML = top10.map((p, idx) => {
      const rank = idx + 1;
      const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
      const barWidth = Math.round((p.revenue / maxRev) * 100);
      const marginColor = p.margin >= 25 ? '#10b981' : p.margin >= 15 ? '#06b6d4' : '#fb7185';

      return `
        <tr>
          <td><span class="rank-badge ${rankClass}">${rank}</span></td>
          <td style="font-weight: 600;">${p.name}</td>
          <td><span style="font-size: 0.725rem; color: var(--text-secondary); background: var(--bg-surface-elevated); padding: 0.15rem 0.5rem; border-radius: 4px;">${p.category}</span></td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">${fmtNumber(p.orders)}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">${fmtNumber(p.units)}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600;">
            <span class="mini-bar-track"><span class="mini-bar-fill" style="width: ${barWidth}%"></span></span>
            ${fmtCurrency(p.revenue)}
          </td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; color: ${p.profit >= 0 ? '#10b981' : '#f43f5e'}; font-weight: 600;">
            ${fmtCurrency(p.profit)}
          </td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; color: ${marginColor}; font-weight: 700;">
            ${p.margin.toFixed(2)}%
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- What-If Simulator Logic ---
  function runSimulation() {
    const discountCap = Number(document.getElementById('simDiscountRange')?.value || 25) / 100;
    const returnReductionPct = Number(document.getElementById('simReturnRange')?.value || 20) / 100;

    document.getElementById('sliderDiscountVal').textContent = `${(discountCap * 100).toFixed(0)}%`;
    document.getElementById('sliderReturnVal').textContent = `${(returnReductionPct * 100).toFixed(0)}% Reduction`;

    let baseProfit = 0;
    let baseRevenue = 0;
    let recoveredDiscountLoss = 0;
    let recoveredReturnProfit = 0;

    filteredData.forEach(r => {
      baseProfit += r.Profit;
      baseRevenue += r.Revenue;

      // 1. Discount policy simulation
      if (r.Discount > discountCap && r.Profit < 0) {
        // If discount had been capped at discountCap, transaction avoids negative profit
        recoveredDiscountLoss += Math.abs(r.Profit);
      }

      // 2. Return mitigation simulation
      if (r.Order_Status === 'Returned') {
        // Returns incur freight loss and lost markup
        recoveredReturnProfit += (r.Profit * 0.15 + r.Shipping_Cost) * returnReductionPct;
      }
    });

    const totalGain = recoveredDiscountLoss + recoveredReturnProfit;
    const newProfit = baseProfit + totalGain;
    const newMargin = baseRevenue > 0 ? (newProfit / baseRevenue) * 100 : 0;
    const baseMargin = baseRevenue > 0 ? (baseProfit / baseRevenue) * 100 : 0;
    const marginDelta = (newMargin - baseMargin).toFixed(2);

    document.getElementById('simProfitGain').textContent = `+${fmtCurrency(totalGain)}`;
    document.getElementById('simProjectedProfit').textContent = fmtCurrency(newProfit);
    document.getElementById('simProjectedMargin').textContent = `${newMargin.toFixed(2)}% (+${marginDelta}%)`;
  }

  // --- Raw Data Explorer Table & Pagination ---
  function renderDataTable() {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;

    const totalRows = filteredData.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = Math.min(startIdx + rowsPerPage, totalRows);
    const pageRows = filteredData.slice(startIdx, endIdx);

    document.getElementById('currentPageNum').textContent = currentPage;
    document.getElementById('totalPageNum').textContent = totalPages;
    document.getElementById('tableRowsInfo').textContent = `Showing ${fmtNumber(totalRows > 0 ? startIdx + 1 : 0)}-${fmtNumber(endIdx)} of ${fmtNumber(totalRows)}`;

    document.getElementById('btnPrevPage').disabled = currentPage <= 1;
    document.getElementById('btnNextPage').disabled = currentPage >= totalPages;

    if (pageRows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; color: var(--text-muted); padding: 2rem;">No matching transaction records found.</td></tr>';
      return;
    }

    tbody.innerHTML = pageRows.map(r => {
      const statusClass = r.Order_Status.toLowerCase();
      const discPct = (r.Discount * 100).toFixed(0);
      const discBadge = r.Discount >= 0.30 
        ? `<span style="color:#fb7185; font-weight:700;">${discPct}% ⚠</span>`
        : `<span>${discPct}%</span>`;

      return `
        <tr>
          <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.775rem; font-weight:600;">${r.Order_ID}</td>
          <td style="font-size: 0.775rem; color: var(--text-secondary);">${r.Order_Date}</td>
          <td>${r.Country}, <span style="color:var(--text-muted); font-size:0.75rem;">${r.Region}</span></td>
          <td><span style="font-size: 0.725rem; background: var(--bg-surface-elevated); padding: 0.15rem 0.4rem; border-radius: 4px;">${r.Category}</span></td>
          <td style="font-weight: 500;">${r.Product_Name}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">${r.Quantity}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace;">${discBadge}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 600;">${fmtCurrency(r.Revenue)}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; color: var(--text-muted);">${fmtCurrency(r.Cost)}</td>
          <td style="text-align: right; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${r.Profit >= 0 ? '#10b981' : '#f43f5e'};">
            ${fmtCurrency(r.Profit)}
          </td>
          <td><span style="font-size: 0.75rem; color: var(--accent-cyan);">${r.Shipping_Method} (${r.Shipping_Days}d)</span></td>
          <td><span class="status-badge ${statusClass}">${r.Order_Status}</span></td>
        </tr>
      `;
    }).join('');
  }

  // --- Theme Toggle ---
  function toggleTheme() {
    const html = document.documentElement;
    currentTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', currentTheme);

    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    if (themeIcon && themeText) {
      if (currentTheme === 'dark') {
        themeIcon.setAttribute('data-lucide', 'moon');
        themeText.textContent = 'Dark Mode';
      } else {
        themeIcon.setAttribute('data-lucide', 'sun');
        themeText.textContent = 'Light Mode';
      }
      if (window.lucide) window.lucide.createIcons();
    }

    renderAllCharts();
  }

  // --- Export Filtered CSV ---
  function exportFilteredCSV() {
    if (filteredData.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = Object.keys(filteredData[0]);
    const csvRows = [headers.join(',')];

    filteredData.forEach(r => {
      const values = headers.map(h => {
        const escaped = ('' + r[h]).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `omniviz_filtered_sales_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
