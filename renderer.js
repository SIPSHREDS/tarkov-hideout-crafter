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
  renderStations();
  
  // Fetch API data
  fetchCraftDataFromAPI();
  
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
  currentStation = null;
  currentFilter = 'all';
  compareMode = false;
  compareSelection = [];
}

function showCraftsView(stationId) {
  currentStation = stationId;
  document.getElementById('stationView').classList.add('hidden');
  document.getElementById('craftsView').classList.remove('hidden');
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

window.addEventListener('DOMContentLoaded', init);
