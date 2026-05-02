/* ================================================================
   Pharmyx — Logique principale
   ================================================================ */

// ── Données régions ──────────────────────────────────────────────
const REGIONS = [
  { name: 'Dakar',       icon: 'fa-city',     cities: 'Dakar · Pikine · Guédiawaye · Rufisque' },
  { name: 'Thiès',       icon: 'fa-tree',     cities: 'Thiès · Mbour · Mékhé · Saly' },
  { name: 'Saint-Louis', icon: 'fa-water',    cities: 'Saint-Louis · Richard-Toll · Podor' },
  { name: 'Ziguinchor',  icon: 'fa-leaf',     cities: 'Ziguinchor · Bignona' },
  { name: 'Kaolack',     icon: 'fa-sun',      cities: 'Kaolack · Nioro du Rip' },
  { name: 'Tambacounda', icon: 'fa-mountain', cities: 'Tambacounda · Kolda · Kédougou · Bakel' },
];

// ── État global ──────────────────────────────────────────────────
const state = {
  pharmacies: [],
  filtered: [],
  markers: [],
  userMarker: null,
  selectedRegion: 'all',
  searchQuery: '',
  map: null,
  isSidebarVisible: false,
  userPosition: null,
  geoActive: false,
};

// ── Entrée ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateGuardStatus();
  initClock();
  initScrollShadow();
  renderUrgentChips();

  // Liste en priorité — indépendante de la carte
  renderList(state.filtered);
  initCounters();
  bindEvents();

  // Carte ensuite (CDN peut être lent)
  try {
    initMap();
    addMarkersToMap(state.filtered);
    updateMapStrip();
  } catch (err) {
    console.warn('Carte non disponible :', err);
    showRegionFallback();
  }
});

// ── Données ──────────────────────────────────────────────────────
function loadData() {
  try {
    const stored = localStorage.getItem('pharmagarde_data');
    state.pharmacies = stored ? JSON.parse(stored) : [...PHARMACIES_DATA];
  } catch {
    state.pharmacies = [...PHARMACIES_DATA];
  }
  if (!localStorage.getItem('pharmagarde_data')) {
    localStorage.setItem('pharmagarde_data', JSON.stringify(state.pharmacies));
  }
  state.filtered = [...state.pharmacies];
}

// ── Horloge vivante ──────────────────────────────────────────────
function initClock() {
  const JOURS   = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const MOIS    = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

  function tick() {
    const now  = new Date();
    const h    = String(now.getHours()).padStart(2, '0');
    const m    = String(now.getMinutes()).padStart(2, '0');
    const hour = now.getHours();

    const clockEl = document.getElementById('heroClock');
    if (clockEl) clockEl.textContent = `${h}:${m}`;

    const greetEl = document.getElementById('heroGreeting');
    if (greetEl) {
      if (hour >= 5 && hour < 12)      greetEl.textContent = 'Bonjour';
      else if (hour >= 12 && hour < 18) greetEl.textContent = 'Bon après-midi';
      else                              greetEl.textContent = 'Bonsoir';
    }

    const dateEl = document.getElementById('heroDate');
    if (dateEl) {
      dateEl.textContent = `${JOURS[now.getDay()]} ${now.getDate()} ${MOIS[now.getMonth()]}`;
    }
  }

  tick();
  setInterval(tick, 30000);
}

// ── Chips 24h/24 ─────────────────────────────────────────────────
function renderUrgentChips() {
  const container = document.getElementById('urgentChips');
  if (!container) return;
  const open24 = state.pharmacies.filter(p => p.schedule.includes('24h'));
  container.innerHTML = open24.map(p => `
    <button class="urgent-chip" onclick="openDetail(${p.id})" title="${p.address}">
      <i class="fas fa-plus-circle"></i>
      ${p.name.replace(/^Pharmacie (Centrale de |de (la |l'|le )?|du )?/i, '')}
    </button>
  `).join('');
  container.querySelectorAll('.urgent-chip').forEach(chip => {
    chip.addEventListener('click', addRipple);
  });
}

// ── Carte Leaflet ────────────────────────────────────────────────
function initMap() {
  state.map = L.map('map', {
    center: [14.4974, -14.4524],
    zoom: 6,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(state.map);

  state.map.zoomControl.setPosition('bottomright');

  // Zoom sur Dakar après le chargement initial
  setTimeout(() => state.map.flyTo([14.7167, -17.4677], 11, { duration: 1.6 }), 400);
}

function makeIcon(active = false, index = 0) {
  const delay = active ? 0 : Math.min(index, 20) * 28;
  return L.divIcon({
    className: 'pharmacy-marker-icon',
    html: `<div class="marker-pin ${active ? 'active' : ''}" style="animation-delay:${delay}ms"><i class="fas fa-plus"></i></div>`,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -44],
  });
}

function addMarkersToMap(pharmacies) {
  state.markers.forEach(({ marker }) => state.map.removeLayer(marker));
  state.markers = [];

  pharmacies.forEach((p, i) => {
    const is24h  = p.schedule.includes('24h');
    const marker = L.marker([p.lat, p.lng], { icon: makeIcon(false, i) }).addTo(state.map);

    marker.bindPopup(L.popup({ closeButton: false, maxWidth: 230 }).setContent(`
      <div class="map-popup">
        ${is24h ? '<div class="map-popup-24h"><i class="fas fa-circle"></i> Ouverte 24h/24</div>' : ''}
        <div class="map-popup-name">${p.name}</div>
        <div class="map-popup-location">
          <i class="fas fa-map-marker-alt"></i> ${p.commune}, ${p.city}
        </div>
        <button class="map-popup-btn" onclick="openDetail(${p.id})">
          <i class="fas fa-info-circle"></i> Voir les détails
        </button>
      </div>
    `));

    marker.on('click', () => highlightCard(p.id));
    state.markers.push({ id: p.id, marker });
  });
}

function updateMapStrip() {
  const totalEl = document.getElementById('mapTotalCount');
  const h24El   = document.getElementById('map24hCount');
  if (totalEl) totalEl.textContent = state.filtered.length;
  if (h24El)   h24El.textContent   = state.filtered.filter(p => p.schedule.includes('24h')).length;
}

// ── Rendu de la liste ────────────────────────────────────────────
function renderList(pharmacies) {
  const list  = document.getElementById('pharmacyList');
  const count = document.getElementById('resultCount');
  count.textContent = pharmacies.length;

  if (pharmacies.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search-minus"></i>
        <p>Aucune pharmacie trouvée</p>
        <small>Modifiez votre recherche ou sélectionnez une autre région.</small>
      </div>`;
    return;
  }

  list.innerHTML = pharmacies.map((p, i) => {
    const is24h      = p.schedule.includes('24h');
    const distBadge  = p._distance !== undefined
      ? formatWalkTime(p._distance)
      : '';

    return `
      <div
        class="pharmacy-card${is24h ? ' card-24h' : ''}"
        id="card-${p.id}"
        onclick="openDetail(${p.id})"
        role="listitem"
        tabindex="0"
        aria-label="${p.name}, ${p.city}"
        data-reveal-delay="${i < 8 ? i * 60 : 0}"
      >
        <div class="card-header">
          <div class="card-icon${is24h ? ' card-icon-24h' : ''}">
            <i class="fas fa-clinic-medical"></i>
          </div>
          <div class="card-info">
            <h3 class="card-name">${highlightText(p.name, state.searchQuery)}</h3>
            <p class="card-location">
              <i class="fas fa-map-marker-alt"></i>
              ${highlightText(p.commune + ', ' + p.city, state.searchQuery)}
            </p>
          </div>
          <div class="card-badges-col">
            ${is24h
              ? '<div class="card-badge badge-24h"><i class="fas fa-circle"></i> 24h/24</div>'
              : '<div class="card-badge open"><i class="fas fa-circle"></i> Garde</div>'}
            ${distBadge}
          </div>
        </div>

        <div class="card-body">
          <div class="card-detail">
            <i class="fas fa-map-pin"></i>
            <span>${p.address}</span>
          </div>
          <div class="card-detail">
            <i class="fas fa-clock"></i>
            <span>${p.schedule}</span>
          </div>
          ${p.phone ? `
          <div class="card-detail">
            <i class="fas fa-phone"></i>
            <span>${p.phone}</span>
          </div>` : ''}
        </div>

        <div class="card-footer">
          <span class="card-region">${p.region}</span>
          <span class="card-arrow"><i class="fas fa-chevron-right"></i></span>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.pharmacy-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  initScrollReveal();
}

// ── Filtrage ─────────────────────────────────────────────────────
function applyFilters() {
  let result = [...state.pharmacies];

  if (state.selectedRegion !== 'all') {
    result = result.filter(p => p.region === state.selectedRegion);
  }

  if (state.searchQuery) {
    const q = norm(state.searchQuery);
    result  = result.filter(p =>
      norm([p.name, p.city, p.commune, p.quartier, p.address, p.region].join(' ')).includes(q)
    );
  }

  state.filtered = result;
  renderList(result);
  updateMapStrip();

  if (!state.map) return;
  addMarkersToMap(result);

  if (state.selectedRegion !== 'all' && result.length > 0) {
    const bounds = L.latLngBounds(result.map(p => [p.lat, p.lng]));
    state.map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 1.4 });
  } else if (state.searchQuery && result.length === 1) {
    state.map.flyTo([result[0].lat, result[0].lng], 15, { duration: 1.2 });
  } else if (!state.searchQuery && state.selectedRegion === 'all') {
    state.map.flyTo([14.7167, -17.4677], 11, { duration: 1.4 });
  }
}

function norm(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ── Géolocalisation ──────────────────────────────────────────────
function startGeolocation() {
  if (!navigator.geolocation) {
    showToast("La géolocalisation n'est pas disponible sur cet appareil.");
    return;
  }
  const btn = document.getElementById('geolocateBtn');
  btn.classList.add('geo-loading');
  btn.innerHTML = `<i class="fas fa-crosshairs fa-spin"></i><span>Localisation en cours…</span>`;

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      state.userPosition = { lat: coords.latitude, lng: coords.longitude };
      state.geoActive    = true;

      if (state.map) {
        if (state.userMarker) state.map.removeLayer(state.userMarker);
        state.userMarker = L.marker([state.userPosition.lat, state.userPosition.lng], {
          icon: L.divIcon({
            className: 'user-marker-icon',
            html: '<div class="user-dot"><div class="user-dot-inner"></div></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          zIndexOffset: 1000,
        }).addTo(state.map)
          .bindPopup('<div class="map-popup"><b style="color:#1565C0">📍 Vous êtes ici</b></div>');
        state.map.flyTo([state.userPosition.lat, state.userPosition.lng], 13, { duration: 1.5 });
      }

      sortByDistance();
      btn.classList.remove('geo-loading');
      btn.classList.add('geo-active');
      btn.innerHTML = `<i class="fas fa-crosshairs"></i><span>Triées par distance</span><span class="geo-cancel" onclick="resetGeolocation(event)">✕</span>`;
      showToast('Pharmacies triées par distance de vous');
    },
    () => {
      btn.classList.remove('geo-loading');
      btn.innerHTML = `<i class="fas fa-crosshairs"></i><span>Trouver la plus proche</span>`;
      showToast("Impossible d'obtenir votre position. Vérifiez vos autorisations.");
    },
    { timeout: 10000, enableHighAccuracy: false }
  );
}

function resetGeolocation(e) {
  if (e) e.stopPropagation();
  state.userPosition = null;
  state.geoActive    = false;

  if (state.userMarker && state.map) {
    state.map.removeLayer(state.userMarker);
    state.userMarker = null;
  }

  // Retirer les distances calculées
  state.pharmacies = state.pharmacies.map(({ _distance, ...p }) => p);
  state.filtered   = [...state.pharmacies];

  const btn = document.getElementById('geolocateBtn');
  btn.classList.remove('geo-active', 'geo-loading');
  btn.innerHTML = `<i class="fas fa-crosshairs"></i><span>Trouver la plus proche</span>`;

  renderList(state.filtered);
  updateMapStrip();
  if (state.map) addMarkersToMap(state.filtered);
}

function sortByDistance() {
  if (!state.userPosition) return;
  const { lat, lng } = state.userPosition;
  state.pharmacies = state.pharmacies.map(p => ({
    ...p,
    _distance: calcDistance(lat, lng, p.lat, p.lng),
  })).sort((a, b) => a._distance - b._distance);
  state.filtered = [...state.pharmacies];
  renderList(state.filtered);
  updateMapStrip();
  if (state.map) addMarkersToMap(state.filtered);
}

function calcDistance(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a    = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ── Fallback : grille des régions ────────────────────────────────
function showRegionFallback() {
  const fallback = document.getElementById('regionFallback');
  if (!fallback) return;

  document.getElementById('regionGrid').innerHTML = REGIONS.map(r => {
    const count = state.pharmacies.filter(p => p.region === r.name).length;
    return `
      <button class="region-tile" onclick="selectRegionTile('${r.name}')">
        <div class="region-tile-icon"><i class="fas ${r.icon}"></i></div>
        <div class="region-tile-name">${r.name}</div>
        <div class="region-tile-count">${count} pharmacie${count > 1 ? 's' : ''}</div>
        <div class="region-tile-cities">${r.cities}</div>
      </button>
    `;
  }).join('');

  fallback.hidden = false;
}

function selectRegionTile(region) {
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.region === region);
  });
  state.selectedRegion = region;
  document.getElementById('regionFallback').hidden = true;
  applyFilters();
}

// ── Détail d'une pharmacie ────────────────────────────────────────
function openDetail(id) {
  const p = state.pharmacies.find(x => x.id === id);
  if (!p) return;

  const mapsUrl     = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
  const mapsViewUrl = `https://www.google.com/maps?q=${p.lat},${p.lng}`;
  const is24h       = p.schedule.includes('24h');
  const distInfo    = p._distance
    ? `<div class="modal-distance"><i class="fas fa-route"></i> À <strong>${formatDistance(p._distance)}</strong> de vous</div>`
    : '';

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-header">
      <div class="modal-header-icon${is24h ? ' icon-24h' : ''}">
        <i class="fas fa-clinic-medical"></i>
      </div>
      <div>
        <h2 id="modalTitle">${p.name}</h2>
        <p class="modal-region">Région de ${p.region}</p>
      </div>
    </div>

    <div class="modal-badge-row">
      ${is24h
        ? '<span class="badge-open badge-24h"><i class="fas fa-circle"></i> Ouverte 24h/24 · 7j/7</span>'
        : '<span class="badge-open"><i class="fas fa-circle"></i> En garde actuellement</span>'}
      ${distInfo}
    </div>

    <div class="modal-details">
      <div class="modal-detail-item">
        <div class="detail-icon"><i class="fas fa-city"></i></div>
        <div class="detail-content">
          <span class="detail-label">Localité</span>
          <span class="detail-value">${p.quartier}, ${p.commune} — ${p.city}</span>
        </div>
      </div>
      <div class="modal-detail-item">
        <div class="detail-icon"><i class="fas fa-map-pin"></i></div>
        <div class="detail-content">
          <span class="detail-label">Adresse</span>
          <span class="detail-value">${p.address}</span>
        </div>
      </div>
      ${p.phone ? `
      <div class="modal-detail-item">
        <div class="detail-icon"><i class="fas fa-phone"></i></div>
        <div class="detail-content">
          <span class="detail-label">Téléphone</span>
          <a href="tel:${p.phone}" class="detail-value detail-link">${p.phone}</a>
        </div>
      </div>` : ''}
      <div class="modal-detail-item">
        <div class="detail-icon"><i class="fas fa-clock"></i></div>
        <div class="detail-content">
          <span class="detail-label">Horaires de garde</span>
          <span class="detail-value">${p.schedule}</span>
        </div>
      </div>
      <div class="modal-detail-item">
        <div class="detail-icon"><i class="fas fa-map"></i></div>
        <div class="detail-content">
          <span class="detail-label">Coordonnées GPS</span>
          <a href="${mapsViewUrl}" target="_blank" rel="noopener" class="detail-value detail-link">
            ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}
          </a>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <a href="tel:${p.phone || '#'}" class="btn btn-outline ${!p.phone ? 'disabled' : ''}">
        <i class="fas fa-phone"></i> Appeler
      </a>
      <a href="${mapsUrl}" target="_blank" rel="noopener" class="btn btn-primary">
        <i class="fas fa-directions"></i> Itinéraire
      </a>
    </div>
  `;

  const overlay = document.getElementById('modalOverlay');
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('active'));

  highlightCard(id);
  if (state.map) state.map.flyTo([p.lat, p.lng], 16, { duration: 1.2 });
  if (window.innerWidth < 768) toggleSidebar(false);
}

function closeDetail() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('active');
  setTimeout(() => { overlay.hidden = true; }, 300);
  if (state.map) state.markers.forEach(m => m.marker.setIcon(makeIcon(false)));
  document.querySelectorAll('.pharmacy-card').forEach(c => c.classList.remove('selected'));
}

function highlightCard(id) {
  document.querySelectorAll('.pharmacy-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`card-${id}`);
  if (card) {
    card.classList.add('selected');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (state.map) state.markers.forEach(m => m.marker.setIcon(makeIcon(m.id === id)));
}

// ── Toast notification ────────────────────────────────────────────
function showToast(msg) {
  let t = document.getElementById('pg-toast');
  if (!t) {
    t = Object.assign(document.createElement('div'), { id: 'pg-toast', className: 'toast' });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Ombre sticky au défilement ───────────────────────────────────
function initScrollShadow() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.addEventListener('scroll', () => {
    sidebar.classList.toggle('is-scrolled', sidebar.scrollTop > 8);
  }, { passive: true });
}

// ── Mobile sidebar ────────────────────────────────────────────────
function toggleSidebar(force) {
  const sidebar = document.getElementById('sidebar');
  state.isSidebarVisible = force !== undefined ? force : !state.isSidebarVisible;
  sidebar.classList.toggle('mobile-visible', state.isSidebarVisible);
  document.getElementById('fabIcon').className  = state.isSidebarVisible ? 'fas fa-map' : 'fas fa-list';
  document.getElementById('fabLabel').textContent = state.isSidebarVisible ? 'Carte' : 'Liste';
}

// ── Statut de garde jour/nuit ────────────────────────────────────
function updateGuardStatus() {
  const el = document.getElementById('guardStatus');
  if (!el) return;
  const hour    = new Date().getHours();
  const isNight = hour < 6 || hour >= 21;
  el.className  = `guard-status ${isNight ? 'night' : 'day'}`;
  el.innerHTML  = isNight
    ? `<span class="guard-status-dot"></span><i class="fas fa-moon"></i> Garde de nuit active`
    : `<span class="guard-status-dot"></span><i class="fas fa-sun"></i> Garde du jour active`;
}

// ── Compteurs animés ─────────────────────────────────────────────
function animateCounter(el, target) {
  const duration  = 1100;
  const startTime = performance.now();
  function update(now) {
    const p = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCounters() {
  const h24count = state.pharmacies.filter(p => p.schedule.includes('24h')).length;
  [
    { id: 'statTotal',   target: state.pharmacies.length },
    { id: 'statRegions', target: REGIONS.length },
    { id: 'stat24h',     target: h24count },
  ].forEach(({ id, target }) => {
    const el = document.getElementById(id);
    if (el) animateCounter(el, target);
  });
}

// ── Scroll reveal (Intersection Observer) ────────────────────────
function initScrollReveal() {
  const sidebar = document.getElementById('sidebar');
  const cards   = document.querySelectorAll('.pharmacy-card');

  if (!window.IntersectionObserver) {
    cards.forEach(c => c.classList.add('card-visible'));
    return;
  }

  if (state._revealObserver) state._revealObserver.disconnect();

  state._revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card  = entry.target;
      const delay = parseInt(card.dataset.revealDelay || '0', 10);
      setTimeout(() => card.classList.add('card-visible'), delay);
      state._revealObserver.unobserve(card);
    });
  }, { root: sidebar, rootMargin: '40px', threshold: 0.01 });

  cards.forEach(card => state._revealObserver.observe(card));
}

// ── Surbrillance de texte ────────────────────────────────────────
function highlightText(text, query) {
  const safe = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (!query) return safe;
  const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escapedQ})`, 'gi'), '<mark class="search-hl">$1</mark>');
}

// ── Temps de trajet humain ───────────────────────────────────────
function formatWalkTime(km) {
  if (km < 0.12) {
    return `<span class="walk-badge"><i class="fas fa-walking"></i> ${Math.round(km * 1000)} m</span>`;
  }
  const walkMin = Math.round(km / 0.083);
  if (walkMin <= 18) {
    return `<span class="walk-badge"><i class="fas fa-walking"></i> ${walkMin} min à pied</span>`;
  }
  const carMin = Math.round(km / 0.5);
  return `<span class="walk-badge"><i class="fas fa-car"></i> ${carMin} min en voiture</span>`;
}

// ── Effet ripple ─────────────────────────────────────────────────
function addRipple(e) {
  const btn = e.currentTarget;
  if (!btn) return;
  const wave     = document.createElement('span');
  const diameter = Math.max(btn.clientWidth, btn.clientHeight);
  const radius   = diameter / 2;
  const rect     = btn.getBoundingClientRect();
  wave.className = 'ripple-wave';
  wave.style.cssText = `width:${diameter}px;height:${diameter}px;left:${e.clientX - rect.left - radius}px;top:${e.clientY - rect.top - radius}px`;
  btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(wave);
  wave.addEventListener('animationend', () => wave.remove(), { once: true });
}

// ── Événements ───────────────────────────────────────────────────
function bindEvents() {
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');

  searchInput.addEventListener('input', e => {
    state.searchQuery = e.target.value.trim();
    searchClear.hidden = !state.searchQuery;
    applyFilters();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    searchClear.hidden = true;
    applyFilters();
    searchInput.focus();
  });

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedRegion = chip.dataset.region;
      applyFilters();
    });
  });

  document.getElementById('modalClose').addEventListener('click', closeDetail);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDetail();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

  document.getElementById('fabToggle').addEventListener('click', () => toggleSidebar());

  // Géolocalisation — bouton sidebar
  document.getElementById('geolocateBtn').addEventListener('click', e => {
    if (e.target.classList.contains('geo-cancel')) return;
    if (!state.geoActive) startGeolocation();
  });

  // Géolocalisation — bouton sur la carte
  const mapGeoBtn = document.getElementById('mapGeoBtn');
  if (mapGeoBtn) mapGeoBtn.addEventListener('click', startGeolocation);

  // Ripple sur les boutons interactifs statiques
  document.querySelectorAll('.filter-chip, .fab-toggle').forEach(btn => {
    btn.addEventListener('click', addRipple);
  });
  const geoBtn = document.getElementById('geolocateBtn');
  if (geoBtn) geoBtn.addEventListener('click', addRipple);
}
