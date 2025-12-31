const stations = [
  { id: 'workbench', name: 'Workbench', icon: 'Workbench.webp', apiName: 'workbench' },
  { id: 'medstation', name: 'Medstation', icon: 'Medstation.webp', apiName: 'medstation' },
  { id: 'lavatory', name: 'Lavatory', icon: 'Lavatory.webp', apiName: 'lavatory' },
  { id: 'water-collector', name: 'Water Collector', icon: 'Water Collector.webp', apiName: 'water-collector' },
  { id: 'nutrition-unit', name: 'Nutrition Unit', icon: 'Nutrition Unit.webp', apiName: 'nutrition-unit' },
  { id: 'intelligence-center', name: 'Intelligence Center', icon: 'Intelligence Center.webp', apiName: 'intelligence-center' }
];

let crafts = {};
let currentStation = null;
let editingCraftId = null;
let filteredCrafts = [];
let sortDirection = {};
let currentFilter = 'all';
let compareMode = false;
let compareSelection = [];
let apiData = null;
let lastAPIUpdate = null;
let isLoadingAPI = false;
let priceHistory = {}; // Store historical price data

// ====== PRICE HISTORY TRACKING ======

function loadPriceHistory() {
  const saved = localStorage.getItem('priceHistory');
  if (saved) {
    priceHistory = JSON.parse(saved);
  }
}

function savePriceHistory() {
  localStorage.setItem('priceHistory', JSON.stringify(priceHistory));
}

function recordPriceSnapshot() {
  // Only record if we have API data
  if (!apiData || apiData.length === 0) return;
  
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Don't record multiple times per day
  if (priceHistory[today]) return;
  
  const snapshot = {};
  
  // Record all craft prices
  stations.forEach(station => {
    const stationCrafts = crafts[station.id] || [];
    stationCrafts.forEach(craft => {
      if (craft.priceSource === 'api') {
        const craftKey = `${station.id}:${craft.name}`;
        snapshot[craftKey] = {
          sellPrice: craft.sellPrice,
          materialCost: craft.materialCost,
          profit: craft.sellPrice - craft.materialCost,
          profitPerHour: craft.craftTime > 0 ? ((craft.sellPrice - craft.materialCost) / craft.craftTime) * 60 : 0
        };
      }
    });
  });
  
  priceHistory[today] = snapshot;
  savePriceHistory();
  
  // Keep only last 30 days
  const dates = Object.keys(priceHistory).sort();
  if (dates.length > 30) {
    const toDelete = dates.slice(0, dates.length - 30);
    toDelete.forEach(date => delete priceHistory[date]);
    savePriceHistory();
  }
  
  console.log(`📊 Price snapshot recorded for ${today}`);
}

function getPriceHistory(stationId, craftName, days = 7) {
  const craftKey = `${stationId}:${craftName}`;
  const allDates = Object.keys(priceHistory).sort();
  const recentDates = allDates.slice(-days);
  
  const history = [];
  recentDates.forEach(date => {
    const snapshot = priceHistory[date];
    if (snapshot && snapshot[craftKey]) {
      history.push({
        date: date,
        ...snapshot[craftKey]
      });
    }
  });
  
  return history;
}

function renderPriceChart(stationId, craftName) {
  const history = getPriceHistory(stationId, craftName, 7);
  
  if (history.length < 2) {
    return '<div style="padding: 15px; background: rgba(244, 164, 96, 0.1); border-radius: 6px; text-align: center; margin-top: 15px;"><p style="color: #888; font-size: 13px;">📊 Price history will appear here after 2+ days of tracking</p></div>';
  }
  
  // Calculate dimensions and scales
  const width = 500;
  const height = 200;
  const padding = 40;
  
  const maxProfit = Math.max(...history.map(h => h.profitPerHour));
  const minProfit = Math.min(...history.map(h => h.profitPerHour));
  const profitRange = maxProfit - minProfit || 1;
  
  // Create points for the line
  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((h.profitPerHour - minProfit) / profitRange) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  // Determine trend
  const firstProfit = history[0].profitPerHour;
  const lastProfit = history[history.length - 1].profitPerHour;
  const trend = lastProfit > firstProfit ? '📈 UP' : lastProfit < firstProfit ? '📉 DOWN' : '➡️ FLAT';
  const trendColor = lastProfit > firstProfit ? '#4ade80' : lastProfit < firstProfit ? '#f87171' : '#888';
  const changePercent = firstProfit > 0 ? (((lastProfit - firstProfit) / firstProfit) * 100).toFixed(1) : 0;
  
  // Format dates for X axis
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  return `
    <div style="margin-top: 20px; padding: 15px; background: rgba(244, 164, 96, 0.05); border-radius: 8px; border: 1px solid rgba(244, 164, 96, 0.2);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="color: #f4a460; margin: 0;">📊 ${history.length}-Day Price History</h4>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: bold; color: ${trendColor};">${trend} ${changePercent}%</div>
          <div style="font-size: 11px; color: #888;">₽${Math.round(firstProfit).toLocaleString()} → ₽${Math.round(lastProfit).toLocaleString()}/h</div>
        </div>
      </div>
      
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="background: rgba(0,0,0,0.2); border-radius: 6px;">
        <!-- Grid lines -->
        ${[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = height - padding - pct * (height - 2 * padding);
          const value = Math.round(minProfit + pct * profitRange);
          return `
            <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" 
                  stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <text x="${padding - 5}" y="${y + 4}" fill="#888" font-size="10" text-anchor="end">
              ₽${value.toLocaleString()}
            </text>
          `;
        }).join('')}
        
        <!-- X axis labels -->
        ${history.map((h, i) => {
          const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
          return `
            <text x="${x}" y="${height - 15}" fill="#888" font-size="10" text-anchor="middle">
              ${formatDate(h.date)}
            </text>
          `;
        }).join('')}
        
        <!-- Area under curve -->
        <polygon points="${padding},${height - padding} ${points} ${width - padding},${height - padding}" 
                 fill="url(#gradient)" opacity="0.3"/>
        
        <!-- Gradient definition -->
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#f4a460;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f4a460;stop-opacity:0" />
          </linearGradient>
        </defs>
        
        <!-- Main line -->
        <polyline points="${points}" fill="none" stroke="#f4a460" stroke-width="3"/>
        
        <!-- Data points -->
        ${history.map((h, i) => {
          const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((h.profitPerHour - minProfit) / profitRange) * (height - 2 * padding);
          return `
            <circle cx="${x}" cy="${y}" r="4" fill="#f4a460" stroke="white" stroke-width="2">
              <title>${formatDate(h.date)}: ₽${Math.round(h.profitPerHour).toLocaleString()}/h</title>
            </circle>
          `;
        }).join('')}
      </svg>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px; font-size: 12px;">
        <div style="text-align: center;">
          <div style="color: #888;">Highest</div>
          <div style="color: #4ade80; font-weight: bold;">₽${Math.round(maxProfit).toLocaleString()}/h</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #888;">Average</div>
          <div style="color: #f4a460; font-weight: bold;">₽${Math.round(history.reduce((sum, h) => sum + h.profitPerHour, 0) / history.length).toLocaleString()}/h</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #888;">Lowest</div>
          <div style="color: #f87171; font-weight: bold;">₽${Math.round(minProfit).toLocaleString()}/h</div>
        </div>
      </div>
    </div>
  `;
}

// ====== API INTEGRATION ======

function formatCraftTime(minutes) {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

async function fetchCraftDataFromAPI() {
  if (isLoadingAPI) return;
  isLoadingAPI = true;
  
  const query = `{
    crafts {
      station {
        name
      }
      level
      duration
      requiredItems {
        item {
          name
          avg24hPrice
          lastLowPrice
        }
        count
      }
      rewardItems {
        item {
          name
          avg24hPrice
          lastLowPrice
        }
        count
      }
    }
  }`;
  
  try {
    console.log('🔄 Fetching craft data from tarkov.dev API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch('https://api.tarkov.dev/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.data && data.data.crafts) {
      apiData = data.data.crafts;
      lastAPIUpdate = new Date();
      console.log(`✅ Successfully fetched ${apiData.length} crafts from API`);
      processCraftData();
      return true;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error('❌ API fetch failed:', error.message);
    console.log('📋 Using fallback mode - you can manually add crafts');
    apiData = null;
    return false;
  } finally {
    isLoadingAPI = false;
  }
}

function processCraftData() {
  if (!apiData) return;
  
  // Reset crafts object
  crafts = {};
  stations.forEach(station => {
    crafts[station.id] = [];
  });
  
  // Map API station names to our station IDs
  const stationMap = {
    'workbench': 'workbench',
    'medstation': 'medstation',
    'lavatory': 'lavatory',
    'water collector': 'water-collector',
    'nutrition unit': 'nutrition-unit',
    'intelligence center': 'intelligence-center'
  };
  
  let craftCount = 0;
  
  apiData.forEach((craft, index) => {
    const stationName = craft.station?.name?.toLowerCase();
    const stationId = stationMap[stationName];
    
    if (!stationId || !crafts[stationId]) return;
    
    // Calculate material cost
    let materialCost = 0;
    const materials = [];
    
    craft.requiredItems?.forEach(req => {
      const price = req.item?.avg24hPrice || req.item?.lastLowPrice || 0;
      const cost = price * req.count;
      materialCost += cost;
      
      materials.push({
        name: req.item?.name || 'Unknown',
        quantity: req.count,
        priceEach: price,
        totalCost: cost
      });
    });
    
    // Get output item
    const outputItem = craft.rewardItems?.[0];
    if (!outputItem) return;
    
    const sellPrice = outputItem.item?.avg24hPrice || outputItem.item?.lastLowPrice || 0;
    const outputQuantity = outputItem.count || 1;
    
    // Convert duration from seconds to minutes (API returns seconds)
    const craftTimeMinutes = Math.round((craft.duration || 0) / 60);
    
    crafts[stationId].push({
      id: `craft-${craftCount++}`,
      name: outputItem.item?.name || 'Unknown',
      materials: materials,
      materialCost: Math.round(materialCost),
      sellPrice: Math.round(sellPrice * outputQuantity),
      outputQuantity: outputQuantity,
      craftTime: craftTimeMinutes,
      stationLevel: craft.level || 1,
      favorite: false,
      priceSource: 'api'
    });
  });
  
  // Sort by profit/hour
  Object.keys(crafts).forEach(stationId => {
    crafts[stationId].sort((a, b) => {
      const profitA = ((a.sellPrice - a.materialCost) / a.craftTime) * 60;
      const profitB = ((b.sellPrice - b.materialCost) / b.craftTime) * 60;
      return profitB - profitA;
    });
  });
  
  saveCrafts();
  console.log(`✅ Processed ${craftCount} crafts across all stations`);
  
  // Calculate station rankings for hot/cold indicators
  calculateStationRankings();
  
  // Refresh display if viewing a station
  if (currentStation) {
    applyFilter();
  } else {
    // Update stations view to show new craft counts
    renderStations();
  }
}

function calculateStationRankings() {
  const rankings = [];
  
  stations.forEach(station => {
    const stationCrafts = crafts[station.id] || [];
    if (stationCrafts.length === 0) return;
    
    // Calculate average profit per hour for this station
    let totalProfitPerHour = 0;
    let profitableCrafts = 0;
    
    stationCrafts.forEach(craft => {
      const profit = craft.sellPrice - craft.materialCost;
      if (profit > 0 && craft.craftTime > 0) {
        const profitPerHour = (profit / craft.craftTime) * 60;
        totalProfitPerHour += profitPerHour;
        profitableCrafts++;
      }
    });
    
    const avgProfitPerHour = profitableCrafts > 0 ? Math.round(totalProfitPerHour / profitableCrafts) : 0;
    
    rankings.push({
      stationId: station.id,
      stationName: station.name,
      avgProfitPerHour: avgProfitPerHour,
      profitableCrafts: profitableCrafts,
      totalCrafts: stationCrafts.length
    });
  });
  
  // Sort by average profit per hour
  rankings.sort((a, b) => b.avgProfitPerHour - a.avgProfitPerHour);
  
  // Assign tiers
  rankings.forEach((rank, index) => {
    if (index === 0 && rank.avgProfitPerHour > 15000) {
      rank.tier = 'ultra-hot'; // 🔥🔥🔥 Top station
    } else if (rank.avgProfitPerHour > 15000) {
      rank.tier = 'hot'; // 🔥🔥
    } else if (rank.avgProfitPerHour > 8000) {
      rank.tier = 'warm'; // 🔥
    } else {
      rank.tier = 'cold'; // ❄️
    }
  });
  
  // Store rankings globally
  window.stationRankings = rankings;
}

function getStationTier(stationId) {
  if (!window.stationRankings) return 'cold';
  const ranking = window.stationRankings.find(r => r.stationId === stationId);
  return ranking ? ranking.tier : 'cold';
}

function getStationStats(stationId) {
  if (!window.stationRankings) return null;
  return window.stationRankings.find(r => r.stationId === stationId);
}

function getAPIStatus() {
  if (isLoadingAPI) {
    return '⏳ Loading API data...';
  }
  
  if (!apiData || apiData.length === 0) {
    return '⚠️ No API data loaded';
  }
  
  if (!lastAPIUpdate) {
    return '🟢 API data loaded';
  }
  
  const minutes = Math.floor((new Date() - lastAPIUpdate) / 60000);
  
  if (minutes < 1) {
    return '🟢 API data loaded just now';
  } else if (minutes < 60) {
    return `🟢 API data loaded ${minutes} min ago`;
  } else {
    const hours = Math.floor(minutes / 60);
    return `🟡 API data loaded ${hours}h ago`;
  }
}

// ====== CORE FUNCTIONS ======

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
}

function init() {
  loadTheme();
  loadCrafts();
  loadPriceHistory();
  loadCraftedHistory();
  renderStations();
  
  // Check if first-time user
  checkFirstTimeUser();
  
  // Fetch API data
  fetchCraftDataFromAPI().then(() => {
    // Record price snapshot after API loads
    recordPriceSnapshot();
  });
  
  // Add search listener
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
  }
  
  // Form submit
  const craftForm = document.getElementById('craftForm');
  if (craftForm) {
    craftForm.addEventListener('submit', saveCraft);
  }
}

function loadCrafts() {
  const saved = localStorage.getItem('tarkovCrafts');
  if (saved) {
    crafts = JSON.parse(saved);
  } else {
    // Initialize empty
    stations.forEach(station => {
      crafts[station.id] = [];
    });
  }
}

function saveCrafts() {
  localStorage.setItem('tarkovCrafts', JSON.stringify(crafts));
}

function getHotDeals() {
  const allCrafts = [];
  
  // Collect all crafts from all stations
  stations.forEach(station => {
    const stationCrafts = crafts[station.id] || [];
    stationCrafts.forEach(craft => {
      const profit = craft.sellPrice - craft.materialCost;
      const profitPerHour = craft.craftTime > 0 ? (profit / craft.craftTime) * 60 : 0;
      
      allCrafts.push({
        ...craft,
        stationName: station.name,
        stationId: station.id,
        profit: profit,
        profitPerHour: profitPerHour
      });
    });
  });
  
  // Filter only profitable crafts
  const profitable = allCrafts.filter(c => c.profit > 0 && c.profitPerHour > 0);
  
  // Get top 3 by profit/hour
  const topProfitPerHour = [...profitable]
    .sort((a, b) => b.profitPerHour - a.profitPerHour)
    .slice(0, 3);
  
  // Get quick money (under 60 min, sorted by profit/hour)
  const quickMoney = [...profitable]
    .filter(c => c.craftTime < 60)
    .sort((a, b) => b.profitPerHour - a.profitPerHour)
    .slice(0, 3);
  
  // Get passive income (over 60 min, sorted by profit/hour)
  const passiveIncome = [...profitable]
    .filter(c => c.craftTime >= 60)
    .sort((a, b) => b.profitPerHour - a.profitPerHour)
    .slice(0, 3);
  
  return {
    topProfitPerHour,
    quickMoney,
    passiveIncome
  };
}

function renderHotDeals() {
  if (!apiData || apiData.length === 0) {
    return ''; // Don't show if no API data
  }
  
  const deals = getHotDeals();
  
  if (deals.topProfitPerHour.length === 0) {
    return ''; // No profitable crafts
  }
  
  const formatDeal = (craft) => {
    return `
      <div style="background: rgba(244, 164, 96, 0.1); padding: 12px; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(244, 164, 96, 0.3);" 
           onclick="showCraftsView('${craft.stationId}')"
           onmouseover="this.style.background='rgba(244, 164, 96, 0.2)'; this.style.borderColor='rgba(244, 164, 96, 0.5)';"
           onmouseout="this.style.background='rgba(244, 164, 96, 0.1)'; this.style.borderColor='rgba(244, 164, 96, 0.3)';">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; color: #f4a460; font-size: 14px;">${craft.name}</div>
            <div style="font-size: 12px; color: #888; margin-top: 2px;">${craft.stationName} • ${formatCraftTime(craft.craftTime)}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; color: #4caf50; font-size: 14px;">₽${Math.round(craft.profitPerHour).toLocaleString()}/h</div>
            <div style="font-size: 12px; color: #888;">₽${Math.round(craft.profit).toLocaleString()} profit</div>
          </div>
        </div>
      </div>
    `;
  };
  
  let html = `
    <div style="background: linear-gradient(135deg, #2c2c2c 0%, #1f1f1f 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 2px solid #f4a460; box-shadow: 0 4px 8px rgba(244, 164, 96, 0.3);" class="hot-deals-widget">
      <style>
        body.light-theme .hot-deals-widget {
          background: linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%) !important;
          border-color: #d4844a !important;
        }
      </style>
      <h2 style="color: #f4a460; margin-bottom: 20px; font-size: 22px; text-align: center;">
        🔥 HOTTEST CRAFTS RIGHT NOW
      </h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
  `;
  
  // Top Profit/Hour section
  if (deals.topProfitPerHour.length > 0) {
    html += `
      <div>
        <h3 style="color: #f4a460; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">💰</span> BEST PROFIT/HOUR
        </h3>
        ${deals.topProfitPerHour.map(formatDeal).join('')}
      </div>
    `;
  }
  
  // Quick Money section
  if (deals.quickMoney.length > 0) {
    html += `
      <div>
        <h3 style="color: #f4a460; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">⚡</span> QUICK MONEY (Under 1h)
        </h3>
        ${deals.quickMoney.map(formatDeal).join('')}
      </div>
    `;
  }
  
  // Passive Income section
  if (deals.passiveIncome.length > 0) {
    html += `
      <div>
        <h3 style="color: #f4a460; font-size: 16px; margin-bottom: 12px; display: flex; align-items: center;">
          <span style="margin-right: 8px;">💎</span> PASSIVE INCOME (Long Crafts)
        </h3>
        ${deals.passiveIncome.map(formatDeal).join('')}
      </div>
    `;
  }
  
  html += `
      </div>
      <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #888;">
        Updated with live API prices • Click any craft to view details
      </div>
    </div>
  `;
  
  return html;
}

function renderStations() {
  const grid = document.getElementById('stationsGrid');
  grid.innerHTML = '';
  
  const stationView = document.getElementById('stationView');
  
  // Remove old hot deals if exists
  const oldHotDeals = stationView.querySelector('.hot-deals-container');
  if (oldHotDeals) {
    oldHotDeals.remove();
  }
  
  // Add update notification banner if not dismissed
  const updateDismissed = localStorage.getItem('updateNotificationDismissed');
  if (!updateDismissed) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      background: linear-gradient(135deg, #f4a460 0%, #d2691e 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      position: relative;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
      <button onclick="dismissUpdateNotification()" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.3); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold;">✕</button>
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">🎉 V2.0 UPDATE - Live Pricing Now Available!</div>
      <div style="font-size: 14px; line-height: 1.5;">
        - Live API integration for real-time flea market prices<br>
        - Click any craft to see full material breakdowns<br>
        - 100+ crafts added across all hideout stations<br>
        - No more manual updates needed!
      </div>
    `;
    stationView.insertBefore(banner, grid);
  }
  
  // Add Hot Deals Dashboard BEFORE the grid
  const hotDealsHTML = renderHotDeals();
  if (hotDealsHTML) {
    const hotDealsContainer = document.createElement('div');
    hotDealsContainer.className = 'hot-deals-container';
    hotDealsContainer.innerHTML = hotDealsHTML;
    stationView.insertBefore(hotDealsContainer, grid);
  }
  
  // Now render station cards in the grid
  stations.forEach(station => {
    const count = crafts[station.id] ? crafts[station.id].length : 0;
    const tier = getStationTier(station.id);
    const stats = getStationStats(station.id);
    
    const card = document.createElement('div');
    card.className = 'station-card';
    card.onclick = () => showCraftsView(station.id);
    
    // Add tier class for styling
    if (tier !== 'cold') {
      card.classList.add(`station-${tier}`);
    }
    
    // Fire indicator based on tier
    let fireIndicator = '';
    if (tier === 'ultra-hot') {
      fireIndicator = '<div class="fire-indicator ultra">🔥🔥🔥</div>';
    } else if (tier === 'hot') {
      fireIndicator = '<div class="fire-indicator hot">🔥🔥</div>';
    } else if (tier === 'warm') {
      fireIndicator = '<div class="fire-indicator warm">🔥</div>';
    }
    
    // Profit info
    let profitInfo = '';
    if (stats && stats.avgProfitPerHour > 0) {
      profitInfo = `<div class="station-profit">Avg: ₽${stats.avgProfitPerHour.toLocaleString()}/h</div>`;
    }
    
    card.innerHTML = `
      ${fireIndicator}
      <img src="${station.icon}" class="station-icon" alt="${station.name}">
      <div class="station-name">${station.name}</div>
      <div class="station-crafts-count">${count} craft${count !== 1 ? 's' : ''}</div>
      ${profitInfo}
    `;
    grid.appendChild(card);
  });
}

function dismissUpdateNotification() {
  localStorage.setItem('updateNotificationDismissed', 'true');
  renderStations();
}

function showStationView() {
  document.getElementById('stationView').classList.remove('hidden');
  document.getElementById('craftsView').classList.add('hidden');
  document.getElementById('calculatorView').classList.add('hidden');
  document.getElementById('statsView').classList.add('hidden');
  currentStation = null;
  currentFilter = 'all';
  compareMode = false;
  compareSelection = [];
}

function showCraftsView(stationId) {
  currentStation = stationId;
  document.getElementById('stationView').classList.add('hidden');
  document.getElementById('craftsView').classList.remove('hidden');
  document.getElementById('calculatorView').classList.add('hidden');
  document.getElementById('statsView').classList.add('hidden');
  currentFilter = 'all';
  
  // Reset filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.filter-btn').classList.add('active');
  
  applyFilter();
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  applyFilter();
}

function applyFilter() {
  let allCrafts = crafts[currentStation] || [];
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  // Apply search
  if (searchTerm) {
    allCrafts = allCrafts.filter(c => c.name.toLowerCase().includes(searchTerm));
  }
  
  // Apply category filter
  switch(currentFilter) {
    case 'profitable':
      filteredCrafts = allCrafts.filter(c => c.sellPrice > c.materialCost);
      break;
    case 'losses':
      filteredCrafts = allCrafts.filter(c => c.sellPrice <= c.materialCost);
      break;
    case 'favorites':
      filteredCrafts = allCrafts.filter(c => c.favorite);
      break;
    default:
      filteredCrafts = allCrafts;
  }
  
  displayCrafts();
}

function displayCrafts() {
  const tbody = document.getElementById('craftsTable');
  const noCrafts = document.getElementById('noCrafts');
  
  if (filteredCrafts.length === 0) {
    tbody.innerHTML = '';
    noCrafts.classList.remove('hidden');
    return;
  }
  
  noCrafts.classList.add('hidden');
  tbody.innerHTML = '';
  
  // Add API status header
  const statusRow = document.createElement('tr');
  statusRow.innerHTML = `
    <td colspan="8" style="text-align: center; background: #1f1f1f; font-size: 12px; color: #888; padding: 8px;">
      ${getAPIStatus()} | 
      <button onclick="fetchCraftDataFromAPI()" ${isLoadingAPI ? 'disabled' : ''} style="background: none; border: none; color: #f4a460; cursor: pointer; text-decoration: underline;">
        ${isLoadingAPI ? '⏳ Loading...' : '🔄 Refresh Data'}
      </button>
      <br>
      <span style="font-size: 11px; color: #666; margin-top: 5px; display: inline-block;">
        🟢 = Live API Price | Click any craft to see material breakdown
      </span>
    </td>
  `;
  tbody.appendChild(statusRow);
  
  filteredCrafts.forEach(craft => {
    // Safety check: if craftTime is > 1000, it's likely in seconds, convert it
    let craftTime = craft.craftTime;
    if (craftTime > 1000) {
      craftTime = Math.round(craftTime / 60);
      craft.craftTime = craftTime; // Update the craft object
    }
    
    const profit = craft.sellPrice - craft.materialCost;
    const profitPerHour = Math.round((profit / craftTime) * 60);
    const row = document.createElement('tr');
    
    const isSelected = compareSelection.includes(craft.id);
    const priceIndicator = craft.priceSource === 'api' ? '🟢' : '🟡';
    
    row.innerHTML = `
      <td>
        <button class="star-btn" onclick="toggleFavorite('${craft.id}')">
          ${craft.favorite ? '⭐' : '☆'}
        </button>
      </td>
      <td class="item-name" onclick="showCraftDetails('${craft.id}')" style="cursor: pointer; text-decoration: underline;">
        ${craft.name}${craft.outputQuantity > 1 ? ` x${craft.outputQuantity}` : ''}
      </td>
      <td class="price" title="Total materials cost">
        ${priceIndicator} ₽${craft.materialCost.toLocaleString()}
      </td>
      <td class="price" title="${craft.priceSource === 'api' ? 'Live API price' : 'Manual price'}">
        ${priceIndicator} ₽${craft.sellPrice.toLocaleString()}
      </td>
      <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
        ₽${profit.toLocaleString()}
      </td>
      <td>${formatCraftTime(craftTime)}</td>
      <td class="${profitPerHour >= 0 ? 'profit-positive' : 'profit-negative'}">
        ₽${profitPerHour.toLocaleString()}/h
      </td>
      <td>
        ${compareMode ? 
          `<button class="compare-select-btn ${isSelected ? 'selected' : ''}" 
                   onclick="selectForCompare('${craft.id}')">
            ${isSelected ? '✓ Selected' : 'Select'}
          </button>` :
          `<button class="edit-btn" onclick="showCraftDetails('${craft.id}')">Details</button>
           <button style="background: #4ade80; color: #1a1a1a; padding: 6px 12px; margin-right: 5px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;" 
                   onclick="markAsCrafted('${craft.id}')">✓ Crafted</button>
           <button class="delete-btn" onclick="deleteCraft('${craft.id}')">Delete</button>`
        }
      </td>
    `;
    tbody.appendChild(row);
  });
  
  // Save any converted times
  saveCrafts();
}

function showCraftDetails(craftId) {
  const craft = crafts[currentStation].find(c => c.id === craftId);
  if (!craft) return;
  
  let materialsHTML = '';
  if (craft.materials && craft.materials.length > 0) {
    materialsHTML = '<div style="margin-top: 15px;"><strong>Required Materials:</strong><ul style="margin: 10px 0; padding-left: 20px;">';
    craft.materials.forEach(mat => {
      materialsHTML += `<li>${mat.name} x${mat.quantity} - ₽${mat.priceEach.toLocaleString()} each (₽${mat.totalCost.toLocaleString()} total)</li>`;
    });
    materialsHTML += '</ul></div>';
  }
  
  const profit = craft.sellPrice - craft.materialCost;
  const profitPerHour = Math.round((profit / craft.craftTime) * 60);
  
  // Get price chart HTML
  const priceChartHTML = renderPriceChart(currentStation, craft.name);
  
  const detailsHTML = `
    <div style="padding: 20px; position: relative;">
      <button onclick="closeModal()" style="position: absolute; top: 10px; right: 10px; background: #dc2626; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; font-size: 18px; cursor: pointer; font-weight: bold;">✕</button>
      <h3>${craft.name}</h3>
      <p><strong>Output:</strong> ${craft.outputQuantity}x ${craft.name}</p>
      <p><strong>Sell Price:</strong> ₽${craft.sellPrice.toLocaleString()}</p>
      <p><strong>Craft Time:</strong> ${formatCraftTime(craft.craftTime)}</p>
      ${materialsHTML}
      <div style="margin-top: 15px; padding: 10px; background: ${profit >= 0 ? '#1a4d2e' : '#4d1a1a'}; border-radius: 5px;">
        <p><strong>Total Material Cost:</strong> ₽${craft.materialCost.toLocaleString()}</p>
        <p><strong>Profit:</strong> <span style="color: ${profit >= 0 ? '#4ade80' : '#f87171'}">₽${profit.toLocaleString()}</span></p>
        <p><strong>Profit per Hour:</strong> <span style="color: ${profitPerHour >= 0 ? '#4ade80' : '#f87171'}">₽${profitPerHour.toLocaleString()}/h</span></p>
      </div>
      ${priceChartHTML}
    </div>
  `;
  
  // Show in modal (reuse craft modal)
  document.getElementById('modalTitle').textContent = 'Craft Details';
  document.getElementById('craftForm').style.display = 'none';
  const modalBody = document.getElementById('craftModal');
  
  // Add details container if it doesn't exist
  let detailsContainer = document.getElementById('craftDetails');
  if (!detailsContainer) {
    detailsContainer = document.createElement('div');
    detailsContainer.id = 'craftDetails';
    modalBody.querySelector('.modal-content').appendChild(detailsContainer);
  }
  
  detailsContainer.innerHTML = detailsHTML;
  detailsContainer.style.display = 'block';
  
  modalBody.classList.add('active');
}

function toggleFavorite(craftId) {
  const craft = crafts[currentStation].find(c => c.id === craftId);
  if (craft) {
    craft.favorite = !craft.favorite;
    saveCrafts();
    applyFilter();
  }
}

function sortCrafts(column) {
  const key = sortDirection[column] || 'desc';
  sortDirection[column] = key === 'desc' ? 'asc' : 'desc';
  
  filteredCrafts.sort((a, b) => {
    let valA, valB;
    
    switch(column) {
      case 0:
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 1:
        valA = a.materialCost;
        valB = b.materialCost;
        break;
      case 2:
        valA = a.sellPrice;
        valB = b.sellPrice;
        break;
      case 3:
        valA = a.sellPrice - a.materialCost;
        valB = b.sellPrice - b.materialCost;
        break;
      case 4:
        valA = a.craftTime;
        valB = b.craftTime;
        break;
      case 5:
        valA = ((a.sellPrice - a.materialCost) / a.craftTime) * 60;
        valB = ((b.sellPrice - b.materialCost) / b.craftTime) * 60;
        break;
    }
    
    if (sortDirection[column] === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });
  
  displayCrafts();
}

function exportToCSV() {
  const station = stations.find(s => s.id === currentStation);
  const stationName = station ? station.name : 'Unknown';
  
  let csv = 'Craft Name,Material Cost,Sell Price,Profit,Time (min),Profit/Hour,Favorite,Materials\n';
  
  (crafts[currentStation] || []).forEach(craft => {
    const profit = craft.sellPrice - craft.materialCost;
    const profitPerHour = Math.round((profit / craft.craftTime) * 60);
    const materials = craft.materials ? craft.materials.map(m => `${m.name} x${m.quantity}`).join('; ') : 'N/A';
    csv += `"${craft.name}",${craft.materialCost},${craft.sellPrice},${profit},${craft.craftTime},${profitPerHour},${craft.favorite ? 'Yes' : 'No'},"${materials}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stationName}_Crafts.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function toggleCompareMode() {
  compareMode = !compareMode;
  compareSelection = [];
  
  if (compareMode) {
    document.querySelector('.compare-btn').textContent = '❌ Exit Compare';
  } else {
    document.querySelector('.compare-btn').textContent = '⚖️ Compare';
    document.getElementById('compareContainer').classList.add('hidden');
    document.getElementById('craftsContainer').classList.remove('hidden');
  }
  
  displayCrafts();
}

function selectForCompare(craftId) {
  const index = compareSelection.indexOf(craftId);
  
  if (index > -1) {
    compareSelection.splice(index, 1);
  } else {
    if (compareSelection.length >= 2) {
      compareSelection.shift();
    }
    compareSelection.push(craftId);
  }
  
  if (compareSelection.length === 2) {
    showComparison();
  } else {
    displayCrafts();
  }
}

function showComparison() {
  const container = document.getElementById('compareContainer');
  const craft1 = crafts[currentStation].find(c => c.id === compareSelection[0]);
  const craft2 = crafts[currentStation].find(c => c.id === compareSelection[1]);
  
  if (!craft1 || !craft2) return;
  
  const profit1 = craft1.sellPrice - craft1.materialCost;
  const profit2 = craft2.sellPrice - craft2.materialCost;
  const profitPerHour1 = (profit1 / craft1.craftTime) * 60;
  const profitPerHour2 = (profit2 / craft2.craftTime) * 60;
  
  container.innerHTML = `
    <div class="compare-card">
      <h3>${craft1.name}</h3>
      <div class="compare-stat">
        <span>Material Cost:</span>
        <span ${craft1.materialCost < craft2.materialCost ? 'class="compare-winner"' : ''}>₽${craft1.materialCost.toLocaleString()}</span>
      </div>
      <div class="compare-stat">
        <span>Sell Price:</span>
        <span ${craft1.sellPrice > craft2.sellPrice ? 'class="compare-winner"' : ''}>₽${craft1.sellPrice.toLocaleString()}</span>
      </div>
      <div class="compare-stat">
        <span>Profit:</span>
        <span ${profit1 > profit2 ? 'class="compare-winner"' : ''}>₽${profit1.toLocaleString()}</span>
      </div>
      <div class="compare-stat">
        <span>Time:</span>
        <span ${craft1.craftTime < craft2.craftTime ? 'class="compare-winner"' : ''}>${formatCraftTime(craft1.craftTime)}</span>
      </div>
      <div class="compare-stat">
        <span>Profit/Hour:</span>
        <span ${profitPerHour1 > profitPerHour2 ? 'class="compare-winner"' : ''}>₽${Math.round(profitPerHour1).toLocaleString()}/h</span>
      </div>
    </div>
    <div class="compare-card">
      <h3>${craft2.name}</h3>
      <div class="compare-stat">
        <span>Material Cost:</span>
        <span ${craft2.materialCost < craft1.materialCost ? 'class="compare-winner"' : ''}>₽${craft2.materialCost.toLocaleString()}</span>
      </div>
      <div class="compare-stat">
        <span>Sell Price:</span>
        <span ${craft2.sellPrice > craft1.sellPrice ? 'class="compare-winner"' : ''}>₽${craft2.sellPrice.toLocaleString()}</span>
      </div>
      <div class="compare-stat">
        <span>Profit:</span>
        <span ${profit2 > profit1 ? 'class="compare-winner"' : ''}>₽${profit2.toLocaleString()}</span>
      </div>
      <div class="compare-stat">
        <span>Time:</span>
        <span ${craft2.craftTime < craft1.craftTime ? 'class="compare-winner"' : ''}>${craft2.craftTime}min</span>
      </div>
      <div class="compare-stat">
        <span>Profit/Hour:</span>
        <span ${profitPerHour2 > profitPerHour1 ? 'class="compare-winner"' : ''}>₽${Math.round(profitPerHour2).toLocaleString()}/h</span>
      </div>
    </div>
  `;
  
  document.getElementById('compareContainer').classList.remove('hidden');
  document.getElementById('craftsContainer').classList.add('hidden');
}

function openAddCraftModal() {
  editingCraftId = null;
  document.getElementById('modalTitle').textContent = 'Add New Craft';
  document.getElementById('craftForm').reset();
  document.getElementById('craftForm').style.display = 'block';
  const detailsContainer = document.getElementById('craftDetails');
  if (detailsContainer) detailsContainer.style.display = 'none';
  document.getElementById('craftModal').classList.add('active');
}

function openEditCraftModal(craftId) {
  const craft = crafts[currentStation].find(c => c.id === craftId);
  if (!craft) return;
  
  editingCraftId = craftId;
  document.getElementById('modalTitle').textContent = 'Edit Craft';
  document.getElementById('craftName').value = craft.name;
  document.getElementById('materialCost').value = craft.materialCost;
  document.getElementById('sellPrice').value = craft.sellPrice;
  document.getElementById('craftTime').value = craft.craftTime;
  document.getElementById('craftForm').style.display = 'block';
  const detailsContainer = document.getElementById('craftDetails');
  if (detailsContainer) detailsContainer.style.display = 'none';
  document.getElementById('craftModal').classList.add('active');
}

function closeModal() {
  document.getElementById('craftModal').classList.remove('active');
  editingCraftId = null;
}

function saveCraft(e) {
  e.preventDefault();
  
  const craftData = {
    name: document.getElementById('craftName').value,
    materials: [],
    materialCost: parseInt(document.getElementById('materialCost').value),
    sellPrice: parseInt(document.getElementById('sellPrice').value),
    outputQuantity: 1,
    craftTime: parseInt(document.getElementById('craftTime').value),
    favorite: false,
    priceSource: 'manual'
  };
  
  if (editingCraftId) {
    const craft = crafts[currentStation].find(c => c.id === editingCraftId);
    if (craft) {
      Object.assign(craft, craftData);
      craft.priceSource = 'manual';
    }
  } else {
    craftData.id = `custom-${Date.now()}`;
    if (!crafts[currentStation]) {
      crafts[currentStation] = [];
    }
    crafts[currentStation].push(craftData);
  }
  
  saveCrafts();
  closeModal();
  applyFilter();
}

function deleteCraft(craftId) {
  if (!confirm('Are you sure you want to delete this craft?')) return;
  
  crafts[currentStation] = crafts[currentStation].filter(c => c.id !== craftId);
  saveCrafts();
  applyFilter();
}

// ====== CALCULATOR FUNCTIONS ======

function showCalculatorView() {
  document.getElementById('stationView').classList.add('hidden');
  document.getElementById('craftsView').classList.add('hidden');
  document.getElementById('calculatorView').classList.remove('hidden');
  document.getElementById('statsView').classList.add('hidden');
  
  // Auto-calculate on view
  calculateOptimalCrafts();
}

function calculateOptimalCrafts() {
  const hours = parseFloat(document.getElementById('hoursInput').value) || 3;
  const totalMinutes = hours * 60;
  
  const results = [];
  let bestOverall = null;
  
  stations.forEach(station => {
    const stationCrafts = crafts[station.id] || [];
    if (stationCrafts.length === 0) return;
    
    // Get all profitable crafts
    const profitable = stationCrafts.filter(craft => {
      const profit = craft.sellPrice - craft.materialCost;
      return profit > 0 && craft.craftTime > 0;
    });
    
    if (profitable.length === 0) return;
    
    // Sort by profit per hour (descending)
    profitable.sort((a, b) => {
      const profitPerHourA = ((a.sellPrice - a.materialCost) / a.craftTime) * 60;
      const profitPerHourB = ((b.sellPrice - b.materialCraft) / b.craftTime) * 60;
      return profitPerHourB - profitPerHourA;
    });
    
    // Best craft for this station
    const bestCraft = profitable[0];
    const timesCanCraft = Math.floor(totalMinutes / bestCraft.craftTime);
    
    if (timesCanCraft === 0) return; // Can't even craft once
    
    const totalTime = timesCanCraft * bestCraft.craftTime;
    const profitPerCraft = bestCraft.sellPrice - bestCraft.materialCost;
    const totalProfit = profitPerCraft * timesCanCraft;
    const profitPerHour = (totalProfit / totalTime) * 60;
    
    const result = {
      station: station,
      craft: bestCraft,
      quantity: timesCanCraft,
      totalTime: totalTime,
      totalProfit: totalProfit,
      profitPerHour: profitPerHour
    };
    
    results.push(result);
    
    // Track best overall
    if (!bestOverall || profitPerHour > bestOverall.profitPerHour) {
      bestOverall = result;
    }
  });
  
  // Render results
  renderCalculatorResults(results, bestOverall, hours);
}

function renderCalculatorResults(results, bestOverall, hours) {
  const container = document.getElementById('calculatorResults');
  
  if (results.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #888;">
        <p>No profitable crafts found. Make sure API data is loaded!</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  // Best Overall Section
  if (bestOverall) {
    html += `
      <div style="background: linear-gradient(135deg, #f4a460 0%, #d4844a 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; color: #1a1a1a; box-shadow: 0 6px 12px rgba(244, 164, 96, 0.4);">
        <h3 style="margin: 0 0 15px 0; font-size: 24px; display: flex; align-items: center;">
          🏆 BEST OVERALL CHOICE
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
          <div>
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Station</div>
            <div style="font-size: 18px; font-weight: bold;">${bestOverall.station.name}</div>
          </div>
          <div>
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Craft</div>
            <div style="font-size: 18px; font-weight: bold;">${bestOverall.craft.name} x${bestOverall.quantity}</div>
          </div>
          <div>
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Total Profit</div>
            <div style="font-size: 20px; font-weight: bold;">₽${Math.round(bestOverall.totalProfit).toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">Profit/Hour</div>
            <div style="font-size: 20px; font-weight: bold;">₽${Math.round(bestOverall.profitPerHour).toLocaleString()}/h</div>
          </div>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid rgba(0,0,0,0.2); font-size: 14px;">
          ⏰ Takes ${formatCraftTime(bestOverall.totalTime)} out of your ${hours} hour${hours !== 1 ? 's' : ''}
        </div>
      </div>
    `;
  }
  
  // All Stations Section
  html += `
    <div style="background: linear-gradient(135deg, #2c2c2c 0%, #1f1f1f 100%); padding: 25px; border-radius: 12px; border: 1px solid #3a3a3a;">
      <h3 style="color: #f4a460; margin: 0 0 20px 0; font-size: 20px;">📋 BEST CRAFT PER STATION</h3>
      <div style="display: grid; gap: 15px;">
  `;
  
  results.forEach(result => {
    const isBest = bestOverall && result.station.id === bestOverall.station.id;
    html += `
      <div style="padding: 20px; background: ${isBest ? 'rgba(244, 164, 96, 0.1)' : 'rgba(0,0,0,0.3)'}; border-radius: 8px; border: 2px solid ${isBest ? '#f4a460' : '#3a3a3a'}; position: relative;">
        ${isBest ? '<div style="position: absolute; top: 10px; right: 10px; background: #f4a460; color: #1a1a1a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">🏆 BEST</div>' : ''}
        <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap: 15px; align-items: center;">
          <div>
            <div style="font-size: 18px; font-weight: bold; color: #f4a460;">${result.station.name}</div>
          </div>
          <div>
            <div style="font-weight: bold; color: #e0e0e0; font-size: 16px;">${result.craft.name} x${result.quantity}</div>
            <div style="font-size: 13px; color: #888; margin-top: 4px;">
              ${formatCraftTime(result.craft.craftTime)} each • ${formatCraftTime(result.totalTime)} total
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 11px; color: #888;">Total Profit</div>
            <div style="font-size: 18px; font-weight: bold; color: #4ade80;">₽${Math.round(result.totalProfit).toLocaleString()}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 11px; color: #888;">Profit/Hour</div>
            <div style="font-size: 18px; font-weight: bold; color: #4ade80;">₽${Math.round(result.profitPerHour).toLocaleString()}/h</div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

function calculateOfflineCrafts() {
  const hours = parseFloat(document.getElementById('offlineHoursInput').value) || 8;
  const totalMinutes = hours * 60;
  
  const results = [];
  
  stations.forEach(station => {
    const stationCrafts = crafts[station.id] || [];
    if (stationCrafts.length === 0) return;
    
    // Get crafts that are 1+ hours and profitable
    const longCrafts = stationCrafts.filter(craft => {
      const profit = craft.sellPrice - craft.materialCost;
      return profit > 0 && craft.craftTime >= 60; // 1+ hour crafts
    });
    
    if (longCrafts.length === 0) return;
    
    // Sort by profit per hour (descending)
    longCrafts.sort((a, b) => {
      const profitPerHourA = ((a.sellPrice - a.materialCost) / a.craftTime) * 60;
      const profitPerHourB = ((b.sellPrice - b.materialCost) / b.craftTime) * 60;
      return profitPerHourB - profitPerHourA;
    });
    
    // Best long craft for this station
    const bestCraft = longCrafts[0];
    const timesCanCraft = Math.floor(totalMinutes / bestCraft.craftTime);
    
    if (timesCanCraft === 0) return; // Can't even craft once
    
    const totalTime = timesCanCraft * bestCraft.craftTime;
    const profitPerCraft = bestCraft.sellPrice - bestCraft.materialCost;
    const totalProfit = profitPerCraft * timesCanCraft;
    const profitPerHour = (totalProfit / totalTime) * 60;
    
    results.push({
      station: station,
      craft: bestCraft,
      quantity: timesCanCraft,
      totalTime: totalTime,
      totalProfit: totalProfit,
      profitPerHour: profitPerHour
    });
  });
  
  // Sort by total profit (descending)
  results.sort((a, b) => b.totalProfit - a.totalProfit);
  
  // Render results
  renderOfflineResults(results, hours);
}

function renderOfflineResults(results, hours) {
  const container = document.getElementById('offlineResults');
  
  if (results.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #888;">
        <p>No long crafts (1+ hour) found. Try checking back when API data loads!</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 25px; border-radius: 12px; border: 1px solid #6366f1; margin-top: 30px;">
      <h3 style="color: #818cf8; margin: 0 0 20px 0; font-size: 20px;">💤 BEST OFFLINE CRAFTS (${hours} hours AFK)</h3>
      <div style="display: grid; gap: 15px;">
  `;
  
  results.forEach((result, index) => {
    const isTop = index < 3; // Highlight top 3
    html += `
      <div style="padding: 20px; background: ${isTop ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0,0,0,0.3)'}; border-radius: 8px; border: 2px solid ${isTop ? '#6366f1' : '#374151'}; position: relative;">
        ${index === 0 ? '<div style="position: absolute; top: 10px; right: 10px; background: #6366f1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">👑 TOP PICK</div>' : ''}
        <div style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr; gap: 15px; align-items: center;">
          <div>
            <div style="font-size: 18px; font-weight: bold; color: #818cf8;">${result.station.name}</div>
          </div>
          <div>
            <div style="font-weight: bold; color: #e0e0e0; font-size: 16px;">${result.craft.name} x${result.quantity}</div>
            <div style="font-size: 13px; color: #888; margin-top: 4px;">
              ${formatCraftTime(result.craft.craftTime)} each • ${formatCraftTime(result.totalTime)} total
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 11px; color: #888;">Total Profit</div>
            <div style="font-size: 18px; font-weight: bold; color: #4ade80;">₽${Math.round(result.totalProfit).toLocaleString()}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 11px; color: #888;">Profit/Hour</div>
            <div style="font-size: 18px; font-weight: bold; color: #818cf8;">₽${Math.round(result.profitPerHour).toLocaleString()}/h</div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
      <div style="margin-top: 20px; padding: 15px; background: rgba(99, 102, 241, 0.1); border-radius: 6px; text-align: center;">
        <div style="color: #818cf8; font-size: 14px; font-weight: bold; margin-bottom: 5px;">😴 Perfect for sleeping or being away from the game</div>
        <div style="color: #888; font-size: 12px;">Set these up before you log off for maximum passive profit!</div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// ====== STATS TRACKING FUNCTIONS ======

let craftedHistory = []; // Array of completed crafts

function loadCraftedHistory() {
  const saved = localStorage.getItem('craftedHistory');
  if (saved) {
    craftedHistory = JSON.parse(saved);
  }
}

function saveCraftedHistory() {
  localStorage.setItem('craftedHistory', JSON.stringify(craftedHistory));
}

function markAsCrafted(craftId) {
  const craft = crafts[currentStation].find(c => c.id === craftId);
  if (!craft) return;
  
  const profit = craft.sellPrice - craft.materialCost;
  const profitPerHour = (profit / craft.craftTime) * 60;
  
  const completedCraft = {
    id: `completed-${Date.now()}`,
    craftId: craft.id,
    name: craft.name,
    station: currentStation,
    stationName: stations.find(s => s.id === currentStation)?.name || 'Unknown',
    profit: profit,
    profitPerHour: profitPerHour,
    craftTime: craft.craftTime,
    materialCost: craft.materialCost,
    sellPrice: craft.sellPrice,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
  };
  
  craftedHistory.push(completedCraft);
  saveCraftedHistory();
  
  // Show success message
  alert(`✓ ${craft.name} marked as crafted!\nProfit: ₽${profit.toLocaleString()}\n\nView your stats in "My Stats" tab!`);
}

function showStatsView() {
  document.getElementById('stationView').classList.add('hidden');
  document.getElementById('craftsView').classList.add('hidden');
  document.getElementById('calculatorView').classList.add('hidden');
  document.getElementById('statsView').classList.remove('hidden');
  
  renderStats();
}

function renderStats() {
  const container = document.getElementById('statsContent');
  
  if (craftedHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #2c2c2c 0%, #1f1f1f 100%); border-radius: 12px; border: 2px solid #3a3a3a;">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <h3 style="color: #f4a460; margin-bottom: 15px;">No Crafts Tracked Yet</h3>
        <p style="color: #888; margin-bottom: 25px;">Start tracking your profits by clicking "✓ Crafted" on any craft!</p>
        <button onclick="showStationView()" style="padding: 12px 25px; background: linear-gradient(135deg, #f4a460 0%, #d4844a 100%); border: none; border-radius: 6px; color: #1a1a1a; font-weight: bold; cursor: pointer;">
          Go to Stations
        </button>
      </div>
    `;
    return;
  }
  
  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const todayProfit = craftedHistory.filter(c => c.date === today).reduce((sum, c) => sum + c.profit, 0);
  const weekProfit = craftedHistory.filter(c => c.date >= weekAgo).reduce((sum, c) => sum + c.profit, 0);
  const monthProfit = craftedHistory.filter(c => c.date >= monthAgo).reduce((sum, c) => sum + c.profit, 0);
  const allTimeProfit = craftedHistory.reduce((sum, c) => sum + c.profit, 0);
  
  // Top crafts
  const craftCounts = {};
  craftedHistory.forEach(c => {
    if (!craftCounts[c.name]) {
      craftCounts[c.name] = { count: 0, profit: 0, name: c.name };
    }
    craftCounts[c.name].count++;
    craftCounts[c.name].profit += c.profit;
  });
  
  const topCrafts = Object.values(craftCounts)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);
  
  // Recent activity (last 10)
  const recentCrafts = [...craftedHistory].reverse().slice(0, 10);
  
  let html = `
    <!-- Summary Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #f4a460 0%, #d4844a 100%); padding: 25px; border-radius: 12px; color: #1a1a1a;">
        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">Today</div>
        <div style="font-size: 32px; font-weight: bold;">₽${todayProfit.toLocaleString()}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${craftedHistory.filter(c => c.date === today).length} crafts</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); padding: 25px; border-radius: 12px; color: #1a1a1a;">
        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">This Week</div>
        <div style="font-size: 32px; font-weight: bold;">₽${weekProfit.toLocaleString()}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${craftedHistory.filter(c => c.date >= weekAgo).length} crafts</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); padding: 25px; border-radius: 12px; color: white;">
        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">This Month</div>
        <div style="font-size: 32px; font-weight: bold;">₽${monthProfit.toLocaleString()}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${craftedHistory.filter(c => c.date >= monthAgo).length} crafts</div>
      </div>
      
      <div style="background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); padding: 25px; border-radius: 12px; color: white;">
        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">All Time</div>
        <div style="font-size: 32px; font-weight: bold;">₽${allTimeProfit.toLocaleString()}</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">${craftedHistory.length} crafts</div>
      </div>
    </div>

    <!-- Top Crafts -->
    <div style="background: linear-gradient(135deg, #2c2c2c 0%, #1f1f1f 100%); padding: 25px; border-radius: 12px; border: 1px solid #3a3a3a; margin-bottom: 30px;">
      <h3 style="color: #f4a460; margin: 0 0 20px 0;">🏆 Top Money Makers</h3>
      <div style="display: grid; gap: 12px;">
        ${topCrafts.map((craft, index) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(244, 164, 96, 0.05); border-radius: 8px; border: 1px solid rgba(244, 164, 96, 0.2);">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="font-size: 24px;">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}</div>
              <div>
                <div style="font-weight: bold; color: #e0e0e0;">${craft.name}</div>
                <div style="font-size: 13px; color: #888;">Crafted ${craft.count}x</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: bold; color: #4ade80;">₽${craft.profit.toLocaleString()}</div>
              <div style="font-size: 12px; color: #888;">total profit</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Recent Activity -->
    <div style="background: linear-gradient(135deg, #2c2c2c 0%, #1f1f1f 100%); padding: 25px; border-radius: 12px; border: 1px solid #3a3a3a;">
      <h3 style="color: #f4a460; margin: 0 0 20px 0;">📋 Recent Activity</h3>
      <div style="display: grid; gap: 10px;">
        ${recentCrafts.map(craft => {
          const date = new Date(craft.timestamp);
          const timeAgo = getTimeAgo(date);
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 6px;">
              <div>
                <div style="font-weight: bold; color: #e0e0e0;">${craft.name}</div>
                <div style="font-size: 12px; color: #888;">${craft.stationName} • ${timeAgo}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; color: ${craft.profit >= 0 ? '#4ade80' : '#f87171'}">
                  ${craft.profit >= 0 ? '+' : ''}₽${craft.profit.toLocaleString()}
                </div>
                <div style="font-size: 11px; color: #888;">${formatCraftTime(craft.craftTime)}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function clearAllStats() {
  if (!confirm('Are you sure you want to delete ALL tracked crafts? This cannot be undone!')) return;
  
  craftedHistory = [];
  saveCraftedHistory();
  renderStats();
}

// ====== HELP MODAL FUNCTIONS ======

function showHelpModal() {
  document.getElementById('helpModal').classList.add('active');
}

function closeHelpModal() {
  const dontShow = document.getElementById('dontShowHelpAgain').checked;
  if (dontShow) {
    localStorage.setItem('hideHelpModal', 'true');
  }
  document.getElementById('helpModal').classList.remove('active');
}

function checkFirstTimeUser() {
  const hideHelp = localStorage.getItem('hideHelpModal');
  const hasVisited = localStorage.getItem('hasVisitedBefore');
  
  // Show help modal on first visit
  if (!hideHelp && !hasVisited) {
    setTimeout(() => {
      showHelpModal();
      localStorage.setItem('hasVisitedBefore', 'true');
    }, 1000); // Show after 1 second delay
  }
}

window.addEventListener('DOMContentLoaded', init);
