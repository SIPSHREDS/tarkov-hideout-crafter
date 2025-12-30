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

// ====== API INTEGRATION ======

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
    
    crafts[stationId].push({
      id: `craft-${craftCount++}`,
      name: outputItem.item?.name || 'Unknown',
      materials: materials,
      materialCost: Math.round(materialCost),
      sellPrice: Math.round(sellPrice * outputQuantity),
      outputQuantity: outputQuantity,
      craftTime: craft.duration || 0,
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
  
  // Refresh display if viewing a station
  if (currentStation) {
    applyFilter();
  }
}

function getAPIStatus() {
  if (!lastAPIUpdate) {
    return '📋 No API data loaded';
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

function renderStations() {
  const grid = document.getElementById('stationsGrid');
  grid.innerHTML = '';
  
  stations.forEach(station => {
    const count = crafts[station.id] ? crafts[station.id].length : 0;
    const card = document.createElement('div');
    card.className = 'station-card';
    card.onclick = () => showCraftsView(station.id);
    card.innerHTML = `
      <img src="${station.icon}" class="station-icon" alt="${station.name}">
      <div class="station-name">${station.name}</div>
      <div class="station-crafts-count">${count} craft${count !== 1 ? 's' : ''}</div>
    `;
    grid.appendChild(card);
  });
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
    const profit = craft.sellPrice - craft.materialCost;
    const profitPerHour = Math.round((profit / craft.craftTime) * 60);
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
      <td>${craft.craftTime}min</td>
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
    <div style="padding: 20px;">
      <h3>${craft.name}</h3>
      <p><strong>Output:</strong> ${craft.outputQuantity}x ${craft.name}</p>
      <p><strong>Sell Price:</strong> ₽${craft.sellPrice.toLocaleString()}</p>
      <p><strong>Craft Time:</strong> ${craft.craftTime} minutes</p>
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
        <span ${craft1.craftTime < craft2.craftTime ? 'class="compare-winner"' : ''}>${craft1.craftTime}min</span>
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
