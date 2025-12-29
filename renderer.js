const stations = [
  { id: 'workbench', name: 'Workbench', icon: 'Workbench.webp' },
  { id: 'medstation', name: 'Medstation', icon: 'Medstation.webp' },
  { id: 'lavatory', name: 'Lavatory', icon: 'Lavatory.webp' },
  { id: 'water-collector', name: 'Water Collector', icon: 'Water Collector.webp' },
  { id: 'nutrition-unit', name: 'Nutrition Unit', icon: 'Nutrition Unit.webp' },
  { id: 'intelligence-center', name: 'Intelligence Center', icon: 'Intelligence Center.webp' }
];

// Pre-loaded craft data - ALL 114 CRAFTS
const defaultCrafts = {
  'medstation': [
    { id: 'med1', name: 'Salewa first aid kit', materialCost: 23272, sellPrice: 16666, craftTime: 36, favorite: false },
    { id: 'med2', name: 'CMS surgical kit', materialCost: 28447, sellPrice: 18000, craftTime: 45, favorite: false },
    { id: 'med3', name: 'AI-2 medkit', materialCost: 23000, sellPrice: 5000, craftTime: 20, favorite: false },
    { id: 'med4', name: 'Disposable syringe', materialCost: 82895, sellPrice: 72000, craftTime: 82, favorite: false },
    { id: 'med5', name: 'Morphine injector', materialCost: 46799, sellPrice: 10000, craftTime: 67, favorite: false },
    { id: 'med6', name: 'Portable defibrillator', materialCost: 295940, sellPrice: 133333, craftTime: 291, favorite: false },
    { id: 'med7', name: 'Medical bloodset', materialCost: 46959, sellPrice: 16000, craftTime: 25, favorite: false },
    { id: 'med8', name: 'Aluminum splint', materialCost: 29326, sellPrice: 26000, craftTime: 49, favorite: false },
    { id: 'med9', name: 'M.U.L.E. stimulant injector', materialCost: 143009, sellPrice: 82000, craftTime: 84, favorite: false },
    { id: 'med10', name: 'IFAK individual first aid kit', materialCost: 45685, sellPrice: 28220, craftTime: 46, favorite: false },
    { id: 'med11', name: 'PNB (Product 16) stimulant injector', materialCost: 129888, sellPrice: 82000, craftTime: 58, favorite: false },
    { id: 'med12', name: 'AHF1-M stimulant injector', materialCost: 175000, sellPrice: 52000, craftTime: 43, favorite: false },
    { id: 'med13', name: 'eTG-change regenerative stimulant injector', materialCost: 148126, sellPrice: 70000, craftTime: 74, favorite: false },
    { id: 'med14', name: 'Pile of meds', materialCost: 42158, sellPrice: 69999, craftTime: 44, favorite: false },
    { id: 'med15', name: 'Vaseline balm', materialCost: 65323, sellPrice: 40000, craftTime: 50, favorite: false },
    { id: 'med16', name: 'SJ1 TGLabs combat stimulant injector', materialCost: 373754, sellPrice: 225000, craftTime: 76, favorite: false },
    { id: 'med17', name: '2A2-(b-TG) stimulant injector', materialCost: 89331, sellPrice: 54000, craftTime: 74, favorite: false },
    { id: 'med18', name: 'Grizzly medical kit', materialCost: 123778, sellPrice: 66000, craftTime: 69, favorite: false },
    { id: 'med19', name: 'SJ6 TGLabs combat stimulant injector', materialCost: 101200, sellPrice: 178000, craftTime: 78, favorite: false },
    { id: 'med20', name: 'Propital regenerative stimulant injector', materialCost: 161953, sellPrice: 172000, craftTime: 106, favorite: false },
    { id: 'med21', name: 'Perfotoran (Blue Blood) stimulant injector', materialCost: 108000, sellPrice: 45000, craftTime: 69, favorite: false },
    { id: 'med22', name: 'AFAK tactical individual first aid kit', materialCost: 21000, sellPrice: 19000, craftTime: 55, favorite: false },
    { id: 'med23', name: 'Surv12 field surgical kit', materialCost: 89275, sellPrice: 88000, craftTime: 70, favorite: false },
    { id: 'med24', name: 'Zagustin hemostatic drug injector', materialCost: 77000, sellPrice: 30000, craftTime: 103, favorite: false }
  ],
  'workbench': [
    { id: 'work1', name: 'Broken GPhone smartphone', materialCost: 63811, sellPrice: 10000, craftTime: 23, favorite: false },
    { id: 'work2', name: 'PM 9x18PM 84-round makeshift drum magazine', materialCost: 69000, sellPrice: 42000, craftTime: 18, favorite: false },
    { id: 'work3', name: 'Bundle of wires', materialCost: 59555, sellPrice: 168000, craftTime: 109, favorite: false },
    { id: 'work4', name: 'Kalashnikov AK-74N 5.45x39 assault rifle', materialCost: 44108, sellPrice: 25000, craftTime: 75, favorite: false },
    { id: 'work5', name: 'Magnet', materialCost: 93000, sellPrice: 37000, craftTime: 40, favorite: false },
    { id: 'work6', name: 'Gunpowder "KITE"', materialCost: 28582, sellPrice: 20000, craftTime: 13, favorite: false },
    { id: 'work7', name: 'Printed circuit board', materialCost: 29332, sellPrice: 21000, craftTime: 44, favorite: false },
    { id: 'work8', name: 'Power cord', materialCost: 103887, sellPrice: 80000, craftTime: 32, favorite: false },
    { id: 'work9', name: 'Round pliers', materialCost: 44000, sellPrice: 15000, craftTime: 13, favorite: false },
    { id: 'work10', name: 'Weapon parts', materialCost: 51676, sellPrice: 65000, craftTime: 72, favorite: false },
    { id: 'work11', name: 'T-shaped plug', materialCost: 66777, sellPrice: 51000, craftTime: 52, favorite: false },
    { id: 'work12', name: 'Broken LCD', materialCost: 110000, sellPrice: 148000, craftTime: 20, favorite: false },
    { id: 'work13', name: 'Zarya stun grenade', materialCost: 87664, sellPrice: 45000, craftTime: 71, favorite: false },
    { id: 'work14', name: 'Gas analyzer', materialCost: 123800, sellPrice: 20000, craftTime: 101, favorite: false },
    { id: 'work15', name: 'Gunpowder "HAWK"', materialCost: 50876, sellPrice: 84000, craftTime: 33, favorite: false },
    { id: 'work16', name: 'Light bulb', materialCost: 107554, sellPrice: 32000, craftTime: 55, favorite: false },
    { id: 'work17', name: 'Toolset', materialCost: 70109, sellPrice: 19000, craftTime: 7, favorite: false },
    { id: 'work18', name: 'Piece of plexiglass', materialCost: 63000, sellPrice: 40000, craftTime: 23, favorite: false },
    { id: 'work19', name: 'RGD-5 hand grenade', materialCost: 79000, sellPrice: 78000, craftTime: 282, favorite: false },
    { id: 'work20', name: 'Capacitors', materialCost: 84500, sellPrice: 120000, craftTime: 114, favorite: false },
    { id: 'work21', name: 'Kalashnikov AKM 7.62x39 assault rifle', materialCost: 42676, sellPrice: 41000, craftTime: 5, favorite: false },
    { id: 'work22', name: 'Hand drill', materialCost: 179000, sellPrice: 180000, craftTime: 138, favorite: false },
    { id: 'work23', name: 'Car battery', materialCost: 228685, sellPrice: 210000, craftTime: 154, favorite: false },
    { id: 'work24', name: 'VOG-17 Khattabka improvised hand grenade', materialCost: 92777, sellPrice: 96000, craftTime: 74, favorite: false },
    { id: 'work25', name: 'NIXXOR lens', materialCost: 94000, sellPrice: 66000, craftTime: 140, favorite: false },
    { id: 'work26', name: 'Working LCD', materialCost: 104000, sellPrice: 25000, craftTime: 29, favorite: false },
    { id: 'work27', name: 'GreenBat lithium battery', materialCost: 152533, sellPrice: 138000, craftTime: 133, favorite: false },
    { id: 'work28', name: 'Spark plug', materialCost: 108000, sellPrice: 18000, craftTime: 107, favorite: false },
    { id: 'work29', name: 'Kalashnikov AK-74M 5.45x39 assault rifle', materialCost: 38887, sellPrice: 20000, craftTime: 77, favorite: false },
    { id: 'work30', name: 'Electric motor', materialCost: 147428, sellPrice: 91000, craftTime: 74, favorite: false },
    { id: 'work31', name: 'Geiger-Muller counter', materialCost: 93387, sellPrice: 17000, craftTime: 84, favorite: false },
    { id: 'work32', name: 'Can of thermite', materialCost: 318300, sellPrice: 262000, craftTime: 154, favorite: false },
    { id: 'work33', name: 'Gunpowder "EAGLE"', materialCost: 33000, sellPrice: 90000, craftTime: 90, favorite: false },
    { id: 'work34', name: 'Bulbex cable cutter', materialCost: 366774, sellPrice: 64000, craftTime: 385, favorite: false },
    { id: 'work35', name: 'Rechargeable battery', materialCost: 36000, sellPrice: 20000, craftTime: 67, favorite: false },
    { id: 'work36', name: 'OFZ 30x165mm shell', materialCost: 437111, sellPrice: 70000, craftTime: 601, favorite: false }
  ],
  'lavatory': [
    { id: 'lav1', name: 'Schaman shampoo', materialCost: 28000, sellPrice: 30000, craftTime: 32, favorite: false },
    { id: 'lav2', name: 'Toilet paper', materialCost: 43000, sellPrice: 34000, craftTime: 24, favorite: false },
    { id: 'lav3', name: 'BNTI Module-3M body armor', materialCost: 18000, sellPrice: 16000, craftTime: 50, favorite: false },
    { id: 'lav4', name: 'Gas mask air filter', materialCost: 89000, sellPrice: 20000, craftTime: 1, favorite: false },
    { id: 'lav5', name: 'BNTI Zhuk body armor', materialCost: 31000, sellPrice: 16000, craftTime: 61, favorite: false },
    { id: 'lav6', name: 'Soap', materialCost: 31000, sellPrice: 42000, craftTime: 46, favorite: false },
    { id: 'lav7', name: 'Army bandage', materialCost: 32000, sellPrice: 17000, craftTime: 15, favorite: false },
    { id: 'lav8', name: 'Cordura polyamide fabric', materialCost: 36320, sellPrice: 16000, craftTime: 44, favorite: false },
    { id: 'lav9', name: '6B47 Ratnik-BSh helmet (EMR cover)', materialCost: 54000, sellPrice: 21000, craftTime: 18, favorite: false },
    { id: 'lav10', name: 'Aramid fiber fabric', materialCost: 40646, sellPrice: 30000, craftTime: 30, favorite: false },
    { id: 'lav11', name: 'Ripstop fabric', materialCost: 36000, sellPrice: 15000, craftTime: 33, favorite: false },
    { id: 'lav12', name: 'Aseptic bandage', materialCost: 18000, sellPrice: 10470, craftTime: 29, favorite: false },
    { id: 'lav13', name: '6B23-2 body armor (Mountain Flora)', materialCost: 39000, sellPrice: 22000, craftTime: 107, favorite: false },
    { id: 'lav14', name: 'Corrugated hose', materialCost: 183499, sellPrice: 54000, craftTime: 186, favorite: false },
    { id: 'lav15', name: 'Scav backpack', materialCost: 43000, sellPrice: 15000, craftTime: 18, favorite: false },
    { id: 'lav16', name: 'Fleece fabric', materialCost: 28000, sellPrice: 13000, craftTime: 40, favorite: false },
    { id: 'lav17', name: 'BlackRock chest rig (Gray)', materialCost: 55000, sellPrice: 36000, craftTime: 55, favorite: false },
    { id: 'lav18', name: 'BlackHawk! Commando chest harness (Black)', materialCost: 49000, sellPrice: 20000, craftTime: 43, favorite: false },
    { id: 'lav19', name: 'First Spear Strandhogg plate carrier (Ranger Green)', materialCost: 64000, sellPrice: 21000, craftTime: 30, favorite: false },
    { id: 'lav20', name: 'Water filter', materialCost: 432665, sellPrice: 320000, craftTime: 123, favorite: false },
    { id: 'lav21', name: 'Clin window cleaner', materialCost: 51765, sellPrice: 9000, craftTime: 37, favorite: false },
    { id: 'lav22', name: 'Grenade case', materialCost: 558000, sellPrice: 288000, craftTime: 462, favorite: false },
    { id: 'lav23', name: 'Ars Arma A18 Skanda plate carrier (MultiCam)', materialCost: 120000, sellPrice: 40000, craftTime: 138, favorite: false },
    { id: 'lav24', name: 'Ox bleach', materialCost: 30000, sellPrice: 18000, craftTime: 35, favorite: false },
    { id: 'lav25', name: 'AK-74 5.45x39 6L31 60-round magazine', materialCost: 55000, sellPrice: 10000, craftTime: 77, favorite: false },
    { id: 'lav26', name: 'Expeditionary fuel tank', materialCost: 87000, sellPrice: 64000, craftTime: 57, favorite: false },
    { id: 'lav27', name: 'Lucky Scav Junk box', materialCost: 1125000, sellPrice: 1106138, craftTime: 277, favorite: false },
    { id: 'lav28', name: 'Eberlestock F5 Switchblade backpack (Dry Earth)', materialCost: 57000, sellPrice: 40000, craftTime: 38, favorite: false }
  ],
  'water-collector': [
    { id: 'water1', name: 'Emergency Water Ration', materialCost: 51000, sellPrice: 30000, craftTime: 27, favorite: false },
    { id: 'water2', name: 'Aquamari water bottle with filter', materialCost: 81000, sellPrice: 95000, craftTime: 55, favorite: false }
  ],
  'nutrition-unit': [
    { id: 'food1', name: 'Salty Dog beef sausage', materialCost: 61000, sellPrice: 60000, craftTime: 30, favorite: false },
    { id: 'food2', name: 'Can of Max Energy energy drink', materialCost: 107000, sellPrice: 64000, craftTime: 100, favorite: false },
    { id: 'food3', name: 'Bottle of Norvinsk Yadreniy premium kvass (0.6L)', materialCost: 46000, sellPrice: 40000, craftTime: 58, favorite: false },
    { id: 'food4', name: 'MRE ration pack', materialCost: 65000, sellPrice: 24000, craftTime: 37, favorite: false },
    { id: 'food5', name: 'Iskra ration pack', materialCost: 57000, sellPrice: 40000, craftTime: 44, favorite: false },
    { id: 'food6', name: 'Can of beef stew (Small)', materialCost: 54000, sellPrice: 36000, craftTime: 72, favorite: false },
    { id: 'food7', name: 'Can of Majaica coffee beans', materialCost: 53000, sellPrice: 64000, craftTime: 41, favorite: false },
    { id: 'food8', name: 'Pack of sugar', materialCost: 44000, sellPrice: 42000, craftTime: 77, favorite: false },
    { id: 'food9', name: 'Slickers chocolate bar', materialCost: 41000, sellPrice: 8000, craftTime: 19, favorite: false },
    { id: 'food10', name: 'Wilston cigarettes', materialCost: 17000, sellPrice: 25000, craftTime: 94, favorite: false },
    { id: 'food11', name: 'Can of condensed milk', materialCost: 55000, sellPrice: 51000, craftTime: 75, favorite: false },
    { id: 'food12', name: 'Pack of Russian Army pineapple juice', materialCost: 49000, sellPrice: 42000, craftTime: 65, favorite: false },
    { id: 'food13', name: 'Bottle of Dan Jackiel whiskey', materialCost: 128000, sellPrice: 96000, craftTime: 98, favorite: false },
    { id: 'food14', name: 'Bottle of Pevko Light beer', materialCost: 250000, sellPrice: 230000, craftTime: 555, favorite: false },
    { id: 'food15', name: 'Can of Hot Rod energy drink', materialCost: 259000, sellPrice: 180000, craftTime: 666, favorite: false },
    { id: 'food16', name: 'Bottle of Tarkovskaya vodka', materialCost: 241000, sellPrice: 210000, craftTime: 88, favorite: false },
    { id: 'food17', name: 'Bottle of water (0.6L)', materialCost: 141000, sellPrice: 120000, craftTime: 102, favorite: false }
  ],
  'intelligence-center': [
    { id: 'intel1', name: 'TerraGroup Labs access keycard', materialCost: 435000, sellPrice: 408000, craftTime: 37, favorite: false },
    { id: 'intel2', name: 'Secure magnetic tape cassette', materialCost: 183000, sellPrice: 88000, craftTime: 222, favorite: false },
    { id: 'intel3', name: 'SAS drive', materialCost: 166000, sellPrice: 70000, craftTime: 166, favorite: false },
    { id: 'intel4', name: 'Secure flash drive', materialCost: 115000, sellPrice: 54000, craftTime: 444, favorite: false },
    { id: 'intel5', name: 'Topographic survey maps', materialCost: 103000, sellPrice: 34000, craftTime: 111, favorite: false },
    { id: 'intel6', name: 'TerraGroup "Blue Folders" materials', materialCost: 868000, sellPrice: 400000, craftTime: 610, favorite: false },
    { id: 'intel7', name: 'Object #11SR keycard', materialCost: 409000, sellPrice: 79000, craftTime: 3638, favorite: false }
  ]
};

let crafts = {};
let currentStation = null;
let editingCraftId = null;
let filteredCrafts = [];
let sortDirection = {};
let currentFilter = 'all';
let compareMode = false;
let compareSelection = [];

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle('light-theme');
  localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

// Load theme on init
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
}

// Initialize app
function init() {
  loadTheme();
  loadCrafts();
  renderStations();
  
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

// Load crafts from storage or use defaults
function loadCrafts() {
  const saved = localStorage.getItem('tarkovCrafts');
  if (saved) {
    crafts = JSON.parse(saved);
  } else {
    crafts = JSON.parse(JSON.stringify(defaultCrafts));
    Object.keys(crafts).forEach(stationId => {
      crafts[stationId].sort((a, b) => {
        const profitA = ((a.sellPrice - a.materialCost) / a.craftTime) * 60;
        const profitB = ((b.sellPrice - b.materialCost) / b.craftTime) * 60;
        return profitB - profitA;
      });
    });
    saveCrafts();
  }
}

// Save crafts to storage
function saveCrafts() {
  localStorage.setItem('tarkovCrafts', JSON.stringify(crafts));
}

// Render station selection
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

// Show station view
function showStationView() {
  document.getElementById('stationView').classList.remove('hidden');
  document.getElementById('craftsView').classList.add('hidden');
  currentStation = null;
  currentFilter = 'all';
  compareMode = false;
  compareSelection = [];
}

// Show crafts view for a station
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

// Set filter
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  applyFilter();
}

// Apply filter
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

// Display crafts in table
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
  
  filteredCrafts.forEach(craft => {
    const profit = craft.sellPrice - craft.materialCost;
    const profitPerHour = Math.round((profit / craft.craftTime) * 60);
    const row = document.createElement('tr');
    
    const isSelected = compareSelection.includes(craft.id);
    
    row.innerHTML = `
      <td>
        <button class="star-btn" onclick="toggleFavorite('${craft.id}')">
          ${craft.favorite ? '⭐' : '☆'}
        </button>
      </td>
      <td class="item-name">${craft.name}</td>
      <td class="price">₽${craft.materialCost.toLocaleString()}</td>
      <td class="price">₽${craft.sellPrice.toLocaleString()}</td>
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
          `<button class="edit-btn" onclick="openEditCraftModal('${craft.id}')">Edit</button>
           <button class="delete-btn" onclick="deleteCraft('${craft.id}')">Delete</button>`
        }
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Toggle favorite
function toggleFavorite(craftId) {
  const craft = crafts[currentStation].find(c => c.id === craftId);
  if (craft) {
    craft.favorite = !craft.favorite;
    saveCrafts();
    applyFilter();
  }
}

// Sort crafts
function sortCrafts(column) {
  const key = sortDirection[column] || 'desc';
  sortDirection[column] = key === 'desc' ? 'asc' : 'desc';
  
  filteredCrafts.sort((a, b) => {
    let valA, valB;
    
    switch(column) {
      case 0: // Name
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 1: // Material Cost
        valA = a.materialCost;
        valB = b.materialCost;
        break;
      case 2: // Sell Price
        valA = a.sellPrice;
        valB = b.sellPrice;
        break;
      case 3: // Profit
        valA = a.sellPrice - a.materialCost;
        valB = b.sellPrice - b.materialCost;
        break;
      case 4: // Time
        valA = a.craftTime;
        valB = b.craftTime;
        break;
      case 5: // Profit/Hour
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

// Export to CSV
function exportToCSV() {
  const station = stations.find(s => s.id === currentStation);
  const stationName = station ? station.name : 'Unknown';
  
  let csv = 'Craft Name,Material Cost,Sell Price,Profit,Time (min),Profit/Hour,Favorite\n';
  
  (crafts[currentStation] || []).forEach(craft => {
    const profit = craft.sellPrice - craft.materialCost;
    const profitPerHour = Math.round((profit / craft.craftTime) * 60);
    csv += `"${craft.name}",${craft.materialCost},${craft.sellPrice},${profit},${craft.craftTime},${profitPerHour},${craft.favorite ? 'Yes' : 'No'}\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stationName}_Crafts.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Toggle compare mode
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

// Select craft for comparison
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

// Show comparison
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

// Open add craft modal
function openAddCraftModal() {
  editingCraftId = null;
  document.getElementById('modalTitle').textContent = 'Add New Craft';
  document.getElementById('craftForm').reset();
  document.getElementById('craftModal').classList.add('active');
}

// Open edit craft modal
function openEditCraftModal(craftId) {
  const craft = crafts[currentStation].find(c => c.id === craftId);
  if (!craft) return;
  
  editingCraftId = craftId;
  document.getElementById('modalTitle').textContent = 'Edit Craft';
  document.getElementById('craftName').value = craft.name;
  document.getElementById('materialCost').value = craft.materialCost;
  document.getElementById('sellPrice').value = craft.sellPrice;
  document.getElementById('craftTime').value = craft.craftTime;
  document.getElementById('craftModal').classList.add('active');
}

// Close modal
function closeModal() {
  document.getElementById('craftModal').classList.remove('active');
  editingCraftId = null;
}

// Save craft
function saveCraft(e) {
  e.preventDefault();
  
  const craftData = {
    name: document.getElementById('craftName').value,
    materialCost: parseInt(document.getElementById('materialCost').value),
    sellPrice: parseInt(document.getElementById('sellPrice').value),
    craftTime: parseInt(document.getElementById('craftTime').value),
    favorite: false
  };
  
  if (editingCraftId) {
    // Edit existing
    const craft = crafts[currentStation].find(c => c.id === editingCraftId);
    if (craft) {
      Object.assign(craft, craftData);
    }
  } else {
    // Add new
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

// Delete craft
function deleteCraft(craftId) {
  if (!confirm('Are you sure you want to delete this craft?')) return;
  
  crafts[currentStation] = crafts[currentStation].filter(c => c.id !== craftId);
  saveCrafts();
  applyFilter();
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);