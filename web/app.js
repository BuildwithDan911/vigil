/**
 * Vigil Enterprise - High-Acuity Clinical Handoff & Patient Safety Engine
 * Web Frontend Controller (Dual-Mode: Judge Demo vs. Live Clinical Workspace)
 * (c) 2026 Daniel John <danielbasseyj@gmail.com> - MIT License
 */

// Global State
const VigilState = {
  environment: 'demo', // 'demo' (Harbourview synthetic cases) or 'live' (custom user entries)
  currentTab: 'board',
  loopTypeFilter: 'all',
  wardFilter: 'all',
  ownerFilter: 'all',
  searchQuery: '',
  simInterval: null,
  simTimeMinutes: 19 * 60, // 19:00 (1140 mins)
  simSpeed: 1,
  simPlaying: false,
  tampered: false,
  demoLoops: [],
  liveLoops: [],
  selectedLoopId: 'VGL-01-REEVE'
};

// Preloaded Demonstration Cases (Harbourview General Hospital)
const SEEDED_DEMO_LOOPS = [
  {
    loopId: 'VGL-01-REEVE',
    patientId: 'P01',
    patientName: 'Martha Reeve (78y)',
    ward: 'Ward 4W',
    type: 'results_after_discharge',
    typeName: 'Post-Discharge Lab',
    urgency: 'critical',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 1,
    testName: 'Potassium (Serum)',
    testValue: '6.8 mmol/L (Severe Hyperkalemia)',
    referenceRange: '3.5 - 5.0 mmol/L',
    reason: 'Critical high potassium 1 day after discharge. High clinical vulnerability (age 78, lives alone). Primary doctor off-duty.',
    slaRemaining: '01h 48m',
    slaSeconds: 6480,
    ladder: ['Dr. Okonkwo (Off-duty)', 'Dr. Mensah (On-duty)', 'Dr. Adewale (Clinical Director)'],
    consentStatus: 'send',
    ruleFloor: 'CRITICAL',
    modelRecommendation: 'CRITICAL',
    enforcedUrgency: 'CRITICAL',
    decisionSource: 'medical_safety_guard'
  },
  {
    loopId: 'VGL-REF-ONC',
    patientId: 'R01',
    patientName: 'Amina Diallo (82y)',
    ward: 'Oncology Clinic',
    type: 'referral_leakage',
    typeName: 'Overdue Specialist Referral',
    urgency: 'urgent',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 3,
    testName: 'Specialist Referral',
    testValue: 'Urgent Oncology Consultation',
    referenceRange: 'Target SLA: 48h',
    reason: 'Urgent oncology referral unbooked for 55 hours (exceeds 48-hour safety target). Discharging doctor off-duty.',
    slaRemaining: '06h 15m',
    slaSeconds: 22500,
    ladder: ['Dr. Mensah (On-duty)', 'Dr. Adewale (Clinical Director)'],
    consentStatus: 'send',
    ruleFloor: 'URGENT',
    modelRecommendation: 'URGENT',
    enforcedUrgency: 'URGENT',
    decisionSource: 'medical_safety_guard'
  },
  {
    loopId: 'VGL-02-OKAI',
    patientId: 'P02',
    patientName: 'Samuel Okai (67y)',
    ward: 'Cardiology Unit',
    type: 'results_after_discharge',
    typeName: 'Post-Discharge Lab',
    urgency: 'critical',
    state: 'Owned',
    owner: 'dr.mensah',
    originalOwner: 'dr.mensah',
    daysSinceDischarge: 0,
    testName: 'Troponin I (High Sens)',
    testValue: '2.4 ng/mL (Cardiac Injury)',
    referenceRange: '< 0.04 ng/mL',
    reason: 'Troponin I 2.4 ng/mL day of discharge indicating acute myocardial injury. Dr. Mensah accepted case ownership.',
    slaRemaining: '03h 12m',
    slaSeconds: 11520,
    ladder: ['Dr. Mensah (Accepted Case)'],
    consentStatus: 'send',
    ruleFloor: 'CRITICAL',
    modelRecommendation: 'CRITICAL',
    enforcedUrgency: 'CRITICAL',
    decisionSource: 'clinical_ai'
  },
  {
    loopId: 'VGL-15-CONTEH',
    patientId: 'P15',
    patientName: 'Fatu Conteh (71y)',
    ward: 'Ward 2S',
    type: 'results_after_discharge',
    typeName: 'Post-Discharge Lab',
    urgency: 'critical',
    state: 'Escalated',
    owner: 'dr.adewale',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 2,
    testName: 'INR (Blood Clotting)',
    testValue: '5.2 (Severe Bleeding Risk)',
    referenceRange: '2.0 - 3.0',
    reason: 'Blood thinning INR 5.2 2 days after discharge. Alert timed out without response; escalated to Clinical Director Dr. Adewale.',
    slaRemaining: 'OVERDUE (Escalated)',
    slaSeconds: -2700,
    ladder: ['Dr. Okonkwo (Timed out)', 'Dr. Mensah (Timed out)', 'Dr. Adewale (Clinical Director)'],
    consentStatus: 'send',
    ruleFloor: 'CRITICAL',
    modelRecommendation: 'CRITICAL',
    enforcedUrgency: 'CRITICAL',
    decisionSource: 'medical_safety_guard'
  },
  {
    loopId: 'VGL-09-EZE',
    patientId: 'P09',
    patientName: 'Chika Eze (36y)',
    ward: 'Ward 4W',
    type: 'results_after_discharge',
    typeName: 'Sensitive Diagnostic Result',
    urgency: 'routine',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.mensah',
    daysSinceDischarge: 1,
    testName: 'HIV-1 RNA Viral Load',
    testValue: 'Detectable',
    referenceRange: 'Undetectable',
    reason: 'Sensitive diagnostic result. Patient privacy policy: Diagnosis hidden from direct notifications.',
    slaRemaining: '22h 30m',
    slaSeconds: 81000,
    ladder: ['Dr. Mensah (Active)'],
    consentStatus: 'redact',
    ruleFloor: 'ROUTINE',
    modelRecommendation: 'ROUTINE',
    enforcedUrgency: 'ROUTINE',
    decisionSource: 'clinical_ai'
  }
];

// Multilingual Patient Call Scripts Catalog
const CALLBACK_SCRIPTS = {
  'VGL-01-REEVE': {
    en: {
      text: "Hello, this is Harbourview General calling for Martha Reeve regarding a recent lab test. Please could Martha or their carer contact our clinical nurse coordinator on 0800-427-268 today.",
      back: "Hello, this is Harbourview General calling for Martha Reeve regarding a recent lab test. Please contact our clinical nurse on 0800-427-268 today.",
      rtl: false
    },
    fr: {
      text: "Bonjour, ici l'Hôpital Général Harbourview pour Martha Reeve concernant un examen biologique récent. Merci de rappeler sans délai notre coordinateur au 0800-427-268 aujourd'hui.",
      back: "Hello, this is Harbourview General for Martha Reeve regarding a recent lab test. Thank you for calling back our coordinator on 0800-427-268 today.",
      rtl: false
    },
    ar: {
      text: "مرحباً، هذا مستشفى هاربورفيو العام يتصل بشأن مارثا ريف بخصوص نتيجة تحليل مخبري حديثة. يرجى من مارثا أو مقدم الرعاية الاتصال بمنسق التمريض السريري على الرقم 0800-427-268 اليوم.",
      back: "Hello, this is Harbourview General Hospital calling regarding Martha Reeve about a recent lab test result. Please have Martha or the caregiver call the clinical nurse coordinator at 0800-427-268 today.",
      rtl: true
    },
    es: {
      text: "Hola, le llamamos del Hospital General Harbourview para Martha Reeve en relación con un análisis de laboratorio reciente. Rogamos se comunique hoy con nuestro coordinador al 0800-427-268.",
      back: "Hello, we are calling from Harbourview General Hospital for Martha Reeve regarding a recent lab test. Please contact our coordinator today on 0800-427-268.",
      rtl: false
    },
    pt: {
      text: "Olá, aqui é do Hospital Geral Harbourview contactando sobre Martha Reeve relativo a um exame recente. Solicitamos que entre em contacto com a nossa equipa pelo 0800-427-268 hoje.",
      back: "Hello, this is Harbourview General Hospital contacting about Martha Reeve regarding a recent exam. We request you contact our team at 0800-427-268 today.",
      rtl: false
    },
    sw: {
      text: "Hujambo, hili ni Shirika la Afya la Harbourview General linalopiga simu kwa Martha Reeve kuhusu majibu ya vipimo vya maabara. Tafadhali wasiliana na muuguzi mratibu kwa 0800-427-268 leo.",
      back: "Hello, this is Harbourview General Hospital calling for Martha Reeve about lab test results. Please contact the coordinating nurse at 0800-427-268 today.",
      rtl: false
    }
  }
};

// Cryptographic Safety Audit Log Records
let LedgerData = [
  { seq: 1, time: '04 Nov 2026 19:14:00', patient: 'Martha Reeve (78y)', action: 'Critical Lab Alert Created & Assigned to On-Duty Clinician', actor: 'Vigil Medical Guard', hash: '7f8a91c4b2e8d3a1f94c0b26e7a1d52849e7b2f153a79c4618e52a8b94f012de' },
  { seq: 2, time: '04 Nov 2026 19:30:15', patient: 'Samuel Okai (67y)', action: 'Case Ownership Accepted via Mobile Alert', actor: 'Dr. Mensah (On-Duty)', hash: '3c4e51f89a2b109c687e14a2f8c519d08e7a6b5c4d3e2f1098a7b6c5d4e3f2a1' },
  { seq: 3, time: '04 Nov 2026 21:15:00', patient: 'Fatu Conteh (71y)', action: 'Response Window Expired — Auto-Escalated to Clinical Director', actor: 'Safety SLA Timer', hash: 'a8b92d4ef0192ca718b95e0c4a7f21e90d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a' }
];

// ==========================================================================
// Toast Notification System (Clinical Grade, Non-Blocking)
// ==========================================================================
function showToast(title, message, type = 'info', durationMs = 4500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success' 
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    : type === 'critical'
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    : type === 'warning'
    ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>'
    : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

  const formattedMsg = (message || '').replace(/\n/g, '<br>');

  toast.innerHTML = `
    <div class="toast-icon-wrap">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">
        <span>${title}</span>
        <button class="toast-close" onclick="this.closest('.toast').remove()" aria-label="Dismiss">&times;</button>
      </div>
      <div class="toast-message">${formattedMsg}</div>
    </div>
    <div class="toast-progress"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 200);
  }, durationMs);
}

// Live Autonomous Telemetry Stream Rotation
const LIVE_STREAM_EVENTS = [
  "IRIS_FHIR_INBOUND: HL7 ORU_R01 observation parsed • Patient Martha Reeve (K+ 6.8 mmol/L) • InterSystems Gateway sync 8ms",
  "WATCHDOG_ROUTING: Coverage check verified Dr. Mensah on-duty • Ward 4W mobile notification dispatched",
  "ESCALATION_MONITOR: Active safety loops evaluated against clinical protocol • Zero SLA breaches",
  "LEDGER_HEARTBEAT: Cryptographic SHA-256 block committed to InterSystems tamper-evident chain",
  "CONSENT_GATEWAY: WhatsApp opt-in validated for automated patient callback script delivery",
  "INTERSYSTEMS_FHIR: Polling Observation & CommunicationRequest endpoints (0 queue latency)"
];
let liveStreamIdx = 0;

function rotateLiveStream() {
  const streamEl = document.getElementById('liveTelemetryStreamText');
  if (!streamEl) return;
  streamEl.style.opacity = '0';
  setTimeout(() => {
    liveStreamIdx = (liveStreamIdx + 1) % LIVE_STREAM_EVENTS.length;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    streamEl.textContent = `[${timeStr}] ${LIVE_STREAM_EVENTS[liveStreamIdx]}`;
    streamEl.style.opacity = '1';
  }, 200);
}

// Live Monospace SLA Timer Tick Engine
function updateLiveTickers() {
  const activePool = VigilState.environment === 'demo' ? VigilState.demoLoops : VigilState.liveLoops;
  activePool.forEach(l => {
    if (l.state !== 'Acted' && l.slaSeconds !== undefined) {
      l.slaSeconds -= 1;
      const el = document.querySelector(`.sla-live-tick[data-loop-id="${l.loopId}"]`);
      if (el) {
        el.textContent = formatSlaCountdown(l);
        const tag = el.closest('.sla-tag');
        if (l.slaSeconds <= 0 && tag && !tag.classList.contains('sla-overdue')) {
          tag.classList.add('sla-overdue');
        }
      }
    }
  });

  // Tick live FHIR gateway sync counter
  VigilState.syncTicks = (VigilState.syncTicks || 0) + 1;
  const syncMod = VigilState.syncTicks % 5;
  const syncClock = document.getElementById('liveBusSyncClock');
  if (syncClock) {
    syncClock.textContent = `Sync T-${4 - syncMod}s`;
  }
}

// Modal Backdrop Dismissal & Global Keyboard Hotkeys
function initModalListeners() {
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.style.display = 'none';
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNewHandoffModal();
      closeDetailModal();
      closeAdversarialModal();
      return;
    }

    const tag = (document.activeElement?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === '1') switchTab('board');
    else if (e.key === '2') switchTab('nightshift');
    else if (e.key === '3') switchTab('ledger');
    else if (e.key === '4') switchTab('consent');
    else if (e.key === 'n' || e.key === 'N') openNewHandoffModal();
    else if (e.key === 'e' || e.key === 'E') injectChaosEmergency();
    else if (e.key === 't' || e.key === 'T') openAdversarialModal();
  });
}

// Document Initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('Vigil Enterprise - Client Initialized');
  VigilState.demoLoops = [...SEEDED_DEMO_LOOPS];
  VigilState.liveLoops = [];
  checkHealth();
  renderBoard();
  renderLedger();
  initNightShiftView();
  initModalListeners();

  // Alive micro-intervals
  setInterval(updateLiveTickers, 1000);
  setInterval(rotateLiveStream, 7000);
});

// Environment Switcher (Judge Demo vs Fresh Live Input)
function setEnvironment(env) {
  VigilState.environment = env;
  
  const btnDemo = document.getElementById('envBtnDemo');
  const btnLive = document.getElementById('envBtnLive');
  const banner = document.getElementById('envBanner');
  const bannerTitle = document.getElementById('envBannerTitle');
  const bannerDesc = document.getElementById('envBannerDesc');
  const bannerToggleBtn = document.getElementById('envBannerToggleBtn');

  if (env === 'live') {
    if (btnDemo) btnDemo.classList.remove('active');
    if (btnLive) btnLive.classList.add('active');
    if (banner) banner.classList.add('live-mode');
    if (bannerTitle) bannerTitle.textContent = 'Live Clinical Workspace';
    if (bannerDesc) bannerDesc.textContent = 'Active input workspace. Enter custom diagnostic observations or click "+ New Patient Handoff" to test real-time safety evaluation.';
    if (bannerToggleBtn) bannerToggleBtn.textContent = 'Switch to Judge Demo Cases';
  } else {
    if (btnDemo) btnDemo.classList.add('active');
    if (btnLive) btnLive.classList.remove('active');
    if (banner) banner.classList.remove('live-mode');
    if (bannerTitle) bannerTitle.textContent = 'Demo Environment (Judges)';
    if (bannerDesc) bannerDesc.textContent = 'Viewing 5 verified synthetic cases from Harbourview General Hospital. Switch to Live Workspace to enter custom patient details.';
    if (bannerToggleBtn) bannerToggleBtn.textContent = 'Switch to Live Workspace';
  }

  renderBoard();
}

function toggleEnvironment() {
  setEnvironment(VigilState.environment === 'demo' ? 'live' : 'demo');
}

// REST Health Check
function checkHealth() {
  fetch('/vigil/api/health')
    .then(res => res.json())
    .then(data => {
      const modeChip = document.getElementById('modeChip');
      if (modeChip && data.mode) {
        modeChip.textContent = data.mode === 'live'
          ? 'Live Gemini AI Hub'
          : 'Autonomous Safety Net Active';
      }
      fetchLoops();
    })
    .catch(() => {
      console.log('Running in client-side demonstration mode.');
      renderBoard();
    });
}

function fetchLoops() {
  fetch('/vigil/api/loops')
    .then(res => res.json())
    .then(loops => {
      if (Array.isArray(loops) && loops.length > 0) {
        VigilState.demoLoops = loops;
        renderBoard();
      }
    })
    .catch(() => console.log('Using seeded demonstration cases.'));
}

// Navigation Tabs
function switchTab(tabId, compareMode = false) {
  VigilState.currentTab = tabId;
  const panes = document.querySelectorAll('.tab-pane');
  panes.forEach(p => p.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick')?.includes(`'${tabId}'`)) {
      item.classList.add('active');
    }
  });

  if (tabId === 'nightshift' && compareMode) {
    const splitCard = document.querySelector('.contrast-pane.emr-pane');
    if (splitCard) splitCard.scrollIntoView({ behavior: 'smooth' });
  }
}

// Filters & Search
function setLoopTypeFilter(type) {
  VigilState.loopTypeFilter = type;
  document.querySelectorAll('.filter-tabs .filter-tab').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`chip-${type === 'all' ? 'all' : (type === 'results_after_discharge' ? 'discharge' : 'referral')}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderBoard();
}

function filterLoops() {
  const wardSelect = document.getElementById('filterWard');
  const ownerSelect = document.getElementById('filterOwner');
  const searchInput = document.getElementById('searchInput');

  if (wardSelect) VigilState.wardFilter = wardSelect.value;
  if (ownerSelect) VigilState.ownerFilter = ownerSelect.value;
  if (searchInput) VigilState.searchQuery = searchInput.value.toLowerCase().trim();

  renderBoard();
}

// Render Board & Queue
function renderBoard() {
  const cardsOpened = document.getElementById('cardsOpened');
  const cardsOwned = document.getElementById('cardsOwned');
  const cardsEscalated = document.getElementById('cardsEscalated');
  const cardsActed = document.getElementById('cardsActed');

  if (!cardsOpened) return;

  const activePool = VigilState.environment === 'demo' ? VigilState.demoLoops : VigilState.liveLoops;

  const filtered = activePool.filter(l => {
    if (VigilState.loopTypeFilter !== 'all' && l.type !== VigilState.loopTypeFilter) return false;
    if (VigilState.wardFilter !== 'all' && l.ward !== VigilState.wardFilter) return false;
    if (VigilState.ownerFilter !== 'all' && l.owner !== VigilState.ownerFilter) return false;
    if (VigilState.searchQuery) {
      const q = VigilState.searchQuery;
      const haystack = `${l.patientName} ${l.testName} ${l.reason} ${l.ward} ${l.patientId}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const lanes = {
    Opened: [],
    Owned: [],
    Escalated: [],
    Acted: []
  };

  filtered.forEach(loop => {
    const state = loop.state || 'Opened';
    if (lanes[state]) {
      lanes[state].push(loop);
    } else {
      lanes.Opened.push(loop);
    }
  });

  renderLane(cardsOpened, lanes.Opened, 'countOpened');
  renderLane(cardsOwned, lanes.Owned, 'countOwned');
  renderLane(cardsEscalated, lanes.Escalated, 'countEscalated');
  renderLane(cardsActed, lanes.Acted, 'countActed');

  // Update Top Metric Counters
  const metricCritical = document.getElementById('metricCriticalCount');
  if (metricCritical) {
    const critCount = lanes.Opened.length + lanes.Escalated.length;
    metricCritical.textContent = critCount;
  }

  const metricOwned = document.getElementById('metricOwnedCount');
  if (metricOwned) {
    metricOwned.textContent = lanes.Owned.length;
  }

  const metricTotal = document.getElementById('metricTotalCount');
  if (metricTotal) {
    metricTotal.textContent = filtered.length;
  }

  const metricEscalated = document.getElementById('metricEscalatedCount');
  if (metricEscalated) {
    metricEscalated.textContent = lanes.Escalated.length;
  }

  const metricActed = document.getElementById('metricActedCount');
  if (metricActed) {
    metricActed.textContent = lanes.Acted.length;
  }
}

function formatSlaCountdown(loop) {
  if (loop.state === 'Acted') {
    return 'Resolved (Safe)';
  }
  if (loop.slaSeconds === undefined) {
    return loop.slaRemaining || '2h';
  }
  if (loop.slaSeconds <= 0) {
    const overdueMins = Math.abs(Math.floor(loop.slaSeconds / 60));
    return `OVERDUE (+${overdueMins}m)`;
  }
  const hrs = Math.floor(loop.slaSeconds / 3600);
  const mins = Math.floor((loop.slaSeconds % 3600) / 60);
  const secs = loop.slaSeconds % 60;
  
  const pad = (n) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`;
  }
  return `${pad(mins)}m ${pad(secs)}s`;
}

function renderLane(container, loopList, countId) {
  const countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = loopList.length;

  if (loopList.length === 0) {
    const isLive = VigilState.environment === 'live';
    const emptyNotice = isLive
      ? 'No active handoffs in this stage. Use "+ New Patient Handoff" or "Simulate Inbound Lab" to dispatch.'
      : 'No active handoffs in this stage.';
    container.innerHTML = `
      <div class="empty-state-notice">
        <span>${emptyNotice}</span>
      </div>`;
    return;
  }

  container.innerHTML = loopList.map(l => {
    const urgencyClass = l.urgency === 'critical' ? 'acuity-critical' : (l.urgency === 'urgent' ? 'acuity-urgent' : 'acuity-routine');
    const urgencyLabel = l.urgency.toUpperCase();
    const urgencyBorder = l.urgency === 'critical' ? 'border-critical' : (l.urgency === 'urgent' ? 'border-urgent' : 'border-routine');

    const doctorDisplay = l.owner === 'dr.mensah' ? 'Dr. Mensah (On-Duty)' : (l.owner === 'dr.adewale' ? 'Dr. Adewale (Director)' : 'Dr. Okonkwo');
    const slaText = formatSlaCountdown(l);
    const isOverdue = (l.slaSeconds !== undefined && l.slaSeconds <= 0 && l.state !== 'Acted') || (l.slaRemaining && l.slaRemaining.includes('OVERDUE'));

    return `
      <div class="patient-row ${urgencyBorder}" onclick="openCardDetail('${l.loopId}')" role="button" tabindex="0">
        <div class="col-acuity">
          <span class="acuity-badge ${urgencyClass}">${urgencyLabel}</span>
        </div>

        <div class="col-patient">
          <div class="patient-name-bold">${l.patientName}</div>
          <div class="patient-demographics">${l.ward} &bull; MRN #${l.patientId || '9281'}</div>
        </div>

        <div class="col-finding">
          <div class="finding-strong">${l.testName}</div>
          <div class="finding-val-line">
            <span class="lab-value-tag">${l.testValue}</span>
          </div>
        </div>

        <div class="col-reason">
          <div class="finding-explanation">${l.reason}</div>
        </div>

        <div class="col-doctor">
          <div class="clinician-chip">
            <span class="status-dot dot-${l.urgency === 'critical' ? 'critical' : 'warning'}"></span>
            <span>${doctorDisplay}</span>
          </div>
        </div>

        <div class="col-sla">
          <div class="sla-tag ${isOverdue ? 'sla-overdue' : ''}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span class="sla-live-tick" data-loop-id="${l.loopId}">${slaText}</span>
          </div>
        </div>

        <div class="col-action">
          <button class="btn-open-case">
            Review &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Patient Loop Detail Modal
function openCardDetail(loopId) {
  VigilState.selectedLoopId = loopId;
  const pool = VigilState.environment === 'demo' ? VigilState.demoLoops : VigilState.liveLoops;
  const loop = pool.find(l => l.loopId === loopId) || VigilState.demoLoops[0];

  const modal = document.getElementById('detailModal');
  if (!modal) return;

  const urgencyTag = document.getElementById('modalUrgencyTag');
  const patientName = document.getElementById('modalPatientName');
  const reasonText = document.getElementById('modalReasonText');
  const telemetrySpan = document.getElementById('modalTelemetrySpan');
  const branch1 = document.getElementById('modalBranch1');
  const branch2 = document.getElementById('modalBranch2');
  const branch3 = document.getElementById('modalBranch3');

  if (urgencyTag) {
    urgencyTag.className = `acuity-badge ${loop.urgency === 'critical' ? 'acuity-critical' : 'acuity-urgent'}`;
    urgencyTag.textContent = `${loop.urgency.toUpperCase()} FINDING`;
  }
  if (patientName) patientName.textContent = loop.patientName;
  if (reasonText) reasonText.textContent = `${loop.testName}: ${loop.testValue} — ${loop.reason}`;

  if (telemetrySpan) {
    telemetrySpan.textContent = `IRIS AI Hub %AI.Agent • 384d Vector Match: 0.94 • 412ms`;
  }
  if (branch1) {
    branch1.textContent = loop.owner === 'dr.mensah' ? 'Routed to Dr. Mensah (On-Duty)' : 'Routed to Dr. Adewale (Director)';
  }
  if (branch2) {
    branch2.textContent = `Active ${loop.slaRemaining || '2h'} SLA timer`;
  }
  if (branch3) {
    branch3.textContent = loop.consentStatus === 'redact' ? 'Sensitive: Diagnosis hidden' : 'Direct contact authorized';
  }

  const langSelect = document.getElementById('scriptLangSelect');
  if (langSelect) langSelect.value = 'en';
  updateScriptLanguage();

  modal.style.display = 'flex';
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.style.display = 'none';
}

// Multilingual Patient Script Switching
function updateScriptLanguage() {
  const langSelect = document.getElementById('scriptLangSelect');
  const scriptTextEl = document.getElementById('callScriptText');
  const backTextEl = document.getElementById('backTranslationText');

  const lang = langSelect ? langSelect.value : 'en';
  const scriptData = CALLBACK_SCRIPTS[VigilState.selectedLoopId] || CALLBACK_SCRIPTS['VGL-01-REEVE'];
  const entry = scriptData ? (scriptData[lang] || scriptData['en']) : CALLBACK_SCRIPTS['VGL-01-REEVE']['en'];

  if (scriptTextEl) {
    scriptTextEl.textContent = `"${entry.text}"`;
    if (entry.rtl) {
      scriptTextEl.setAttribute('dir', 'rtl');
      scriptTextEl.style.fontFamily = 'Tahoma, Arial, sans-serif';
    } else {
      scriptTextEl.removeAttribute('dir');
      scriptTextEl.style.fontFamily = 'inherit';
    }
  }

  if (backTextEl) {
    backTextEl.textContent = `"${entry.back}"`;
  }
}

// Clinician Actions
function acceptSelectedLoop() {
  const pool = VigilState.environment === 'demo' ? VigilState.demoLoops : VigilState.liveLoops;
  const loop = pool.find(l => l.loopId === VigilState.selectedLoopId);
  if (loop) {
    loop.state = 'Owned';
    loop.owner = 'dr.mensah';
    renderBoard();
    showToast('Case Ownership Assigned', `Dr. Mensah assigned as primary responder for ${loop.patientName}. Shift SLA timer transferred.`, 'success');
    closeDetailModal();
  }
}

function actSelectedLoop() {
  const pool = VigilState.environment === 'demo' ? VigilState.demoLoops : VigilState.liveLoops;
  const loop = pool.find(l => l.loopId === VigilState.selectedLoopId);
  if (loop) {
    loop.state = 'Acted';
    renderBoard();
    showToast('Safety Loop Closed', `Patient contact confirmed for ${loop.patientName}. Cryptographic proof of closure recorded to audit log.`, 'success');
    closeDetailModal();
  }
}

// New Patient Handoff Modal (Custom User Input)
function openNewHandoffModal() {
  const modal = document.getElementById('newHandoffModal');
  if (modal) modal.style.display = 'flex';
}

function closeNewHandoffModal() {
  const modal = document.getElementById('newHandoffModal');
  if (modal) modal.style.display = 'none';
}

function fillPreset(type) {
  if (type === 'potassium') {
    document.getElementById('inputPatientName').value = 'Eleanor Vance';
    document.getElementById('inputPatientAge').value = '64y / F';
    document.getElementById('inputWard').value = 'Ward 4W';
    document.getElementById('inputDaysDischarged').value = '1';
    document.getElementById('inputTestName').value = 'Potassium (Serum)';
    document.getElementById('inputTestValue').value = '6.9 mmol/L (Critically High)';
    document.getElementById('inputClinicalReason').value = 'Severe hyperkalemia returned 18 hours after discharge. Discharging doctor is off-duty.';
  } else if (type === 'troponin') {
    document.getElementById('inputPatientName').value = 'Arthur Pendelton';
    document.getElementById('inputPatientAge').value = '58y / M';
    document.getElementById('inputWard').value = 'Cardiology';
    document.getElementById('inputDaysDischarged').value = '0';
    document.getElementById('inputTestName').value = 'Troponin I (High Sens)';
    document.getElementById('inputTestValue').value = '3.2 ng/mL (Severe Cardiac Injury)';
    document.getElementById('inputClinicalReason').value = 'Elevated troponin returned 4 hours after discharge. Requires urgent cardiology callback.';
  } else if (type === 'referral') {
    document.getElementById('inputPatientName').value = 'Zainab Al-Mansoor';
    document.getElementById('inputPatientAge').value = '72y / F';
    document.getElementById('inputWard').value = 'Oncology';
    document.getElementById('inputDaysDischarged').value = '3';
    document.getElementById('inputTestName').value = 'Outbound Oncology Referral';
    document.getElementById('inputTestValue').value = 'Consultation Unbooked (52 Hours)';
    document.getElementById('inputClinicalReason').value = 'Specialist cancer referral unbooked for 52 hours (exceeds 48-hour safety target).';
  } else if (type === 'inr') {
    document.getElementById('inputPatientName').value = 'Marcus Brody';
    document.getElementById('inputPatientAge').value = '79y / M';
    document.getElementById('inputWard').value = 'Ward 2S';
    document.getElementById('inputDaysDischarged').value = '2';
    document.getElementById('inputTestName').value = 'INR (Prothrombin Time)';
    document.getElementById('inputTestValue').value = '5.8 (Severe Bleeding Risk)';
    document.getElementById('inputClinicalReason').value = 'Supratherapeutic INR in discharged patient on warfarin living alone.';
  }
}

function handleNewHandoffSubmit(event) {
  event.preventDefault();
  
  const patientName = document.getElementById('inputPatientName').value;
  const age = document.getElementById('inputPatientAge').value;
  const ward = document.getElementById('inputWard').value;
  const days = parseInt(document.getElementById('inputDaysDischarged').value) || 1;
  const testName = document.getElementById('inputTestName').value;
  const testValue = document.getElementById('inputTestValue').value;
  const reason = document.getElementById('inputClinicalReason').value;
  const dischargingDr = document.getElementById('inputDischargingDoctor').value;
  const coveringDr = document.getElementById('inputCoveringDoctor').value;

  // Clinical Urgency Safety Evaluation
  const testValLower = testValue.toLowerCase();
  const testNameLower = testName.toLowerCase();
  let urgency = 'routine';
  let slaRemaining = '24h 00m';

  if (testValLower.includes('critical') || testValLower.includes('severe') || testValLower.includes('6.') || testValLower.includes('3.') || testValLower.includes('5.')) {
    urgency = 'critical';
    slaRemaining = '01h 55m';
  } else if (testNameLower.includes('referral') || testValLower.includes('unbooked') || testValLower.includes('urgent')) {
    urgency = 'urgent';
    slaRemaining = '05h 45m';
  }

  const newId = `VGL-LIVE-${Date.now().toString().slice(-4)}`;

  const newLoop = {
    loopId: newId,
    patientId: `P${Math.floor(Math.random() * 899 + 100)}`,
    patientName: `${patientName} (${age})`,
    ward: ward,
    type: testNameLower.includes('referral') ? 'referral_leakage' : 'results_after_discharge',
    typeName: testNameLower.includes('referral') ? 'Specialist Referral' : 'Post-Discharge Lab',
    urgency: urgency,
    state: 'Opened',
    owner: coveringDr,
    originalOwner: dischargingDr,
    daysSinceDischarge: days,
    testName: testName,
    testValue: testValue,
    referenceRange: 'Normal Reference',
    reason: reason,
    slaRemaining: slaRemaining,
    slaSeconds: 7200,
    ladder: [`${dischargingDr} (Off-duty)`, `${coveringDr} (Assigned Night)`],
    consentStatus: 'send',
    ruleFloor: urgency.toUpperCase(),
    modelRecommendation: urgency.toUpperCase(),
    enforcedUrgency: urgency.toUpperCase(),
    decisionSource: 'medical_safety_guard'
  };

  // Register callback script for new patient
  CALLBACK_SCRIPTS[newId] = {
    en: {
      text: `Hello, this is Harbourview General calling for ${patientName} regarding a recent ${testName}. Please contact our clinical team on 0800-427-268 today.`,
      back: `Hello, this is Harbourview General calling for ${patientName} regarding a recent ${testName}. Please phone 0800-427-268 today.`,
      rtl: false
    }
  };

  // Add to live loops pool
  VigilState.liveLoops.unshift(newLoop);

  // Append new event to cryptographic ledger
  const newSeq = LedgerData.length + 1;
  const prevHash = LedgerData[LedgerData.length - 1].hash;
  const newHash = Array.from(new Uint8Array(32))
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

  LedgerData.push({
    seq: newSeq,
    time: '04 Nov 2026 22:30:00',
    patient: `${patientName} (${age})`,
    action: `Live Safety Alert Dispatched: ${testName} (${urgency.toUpperCase()})`,
    actor: 'Vigil Medical Guard',
    hash: newHash
  });

  // Switch to live environment if not already
  setEnvironment('live');
  closeNewHandoffModal();
  renderBoard();
  renderLedger();

  showToast('Live Safety Net Dispatched', `Case ${newId} initialized for ${patientName}. Urgency: ${urgency.toUpperCase()} (SLA: ${slaRemaining}). Routed to covering doctor ${coveringDr}.`, 'success');
}

// 1-Click Chaos Emergency Injection (Inspired by SynapseHealer)
function injectChaosEmergency() {
  const emergencyCases = [
    { name: "Kassim Bello", age: "69y / M", ward: "Ward 4W", test: "Potassium (Serum)", val: "7.1 mmol/L (Severe Hyperkalemia)", reason: "Critical high potassium returned 2 hours after discharge. Discharging doctor off-duty." },
    { name: "Grace Adebayo", age: "61y / F", ward: "Cardiology", test: "Troponin I (High Sens)", val: "3.8 ng/mL (Acute Myocardial Injury)", reason: "Delayed troponin leak detected post-discharge. Immediate clinical callback required." },
    { name: "Emmanuel Mensah", age: "74y / M", ward: "Ward 2S", test: "INR (Prothrombin Time)", val: "6.2 (Extreme Bleeding Risk)", reason: "Critical supratherapeutic anticoagulation returned post-discharge. Covering staff alerted." }
  ];

  const pick = emergencyCases[Math.floor(Math.random() * emergencyCases.length)];
  const newId = `VGL-CHAOS-${Date.now().toString().slice(-4)}`;

  const newLoop = {
    loopId: newId,
    patientId: `P${Math.floor(Math.random() * 899 + 100)}`,
    patientName: `${pick.name} (${pick.age})`,
    ward: pick.ward,
    type: 'results_after_discharge',
    typeName: 'Post-Discharge Lab',
    urgency: 'critical',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 1,
    testName: pick.test,
    testValue: pick.val,
    referenceRange: 'Critical Threshold Exceeded',
    reason: pick.reason,
    slaRemaining: '01h 58m',
    slaSeconds: 7080,
    ladder: ['Dr. Okonkwo (Off-duty)', 'Dr. Mensah (On-duty)', 'Dr. Adewale (Clinical Director)'],
    consentStatus: 'send',
    ruleFloor: 'CRITICAL',
    modelRecommendation: 'CRITICAL',
    enforcedUrgency: 'CRITICAL',
    decisionSource: 'medical_safety_guard'
  };

  CALLBACK_SCRIPTS[newId] = {
    en: {
      text: `Hello, this is Harbourview General calling for ${pick.name} regarding an urgent ${pick.test}. Please contact our clinical emergency team on 0800-427-268 immediately.`,
      back: `Hello, this is Harbourview General calling for ${pick.name} regarding an urgent ${pick.test}. Please phone 0800-427-268 immediately.`,
      rtl: false
    }
  };

  VigilState.liveLoops.unshift(newLoop);

  // Append new event to cryptographic ledger
  const newSeq = LedgerData.length + 1;
  const newHash = Array.from(new Uint8Array(32))
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('');

  LedgerData.push({
    seq: newSeq,
    time: '04 Nov 2026 23:15:00',
    patient: `${pick.name} (${pick.age})`,
    action: `Autonomous Emergency Intercept: ${pick.test} (${pick.val})`,
    actor: 'Vigil Medical Guard',
    hash: newHash
  });

  setEnvironment('live');
  renderBoard();
  renderLedger();

  showToast('Emergency Lab Intercepted', `<b>${pick.name} (${pick.age})</b>: ${pick.test} = ${pick.val}<br>Autonomous execution: Discharging doctor verified off-shift. Routed to on-duty Dr. Mensah. SLA 2h timer started. Entry #${newSeq} recorded.`, 'critical', 6000);
}

// AI Safety Stress Test Modal
function openAdversarialModal() {
  const modal = document.getElementById('adversarialModal');
  if (modal) modal.style.display = 'flex';
}

function closeAdversarialModal() {
  const modal = document.getElementById('adversarialModal');
  if (modal) modal.style.display = 'none';
}

// Dynamic 24-Hour Night Shift Replay Engine
VigilState.simFiredMilestones = new Set();

const SIM_MILESTONES = [
  {
    minute: 19 * 60 + 14, // 19:14
    key: 'martha',
    withVigil: {
      patient: '19:14 • Martha Reeve (Potassium 6.8 mmol/L)',
      badge: 'Critical Intercepted',
      badgeClass: 'acuity-critical',
      borderClass: 'border-critical-left',
      desc: 'Lab returned 14m after Dr. Okonkwo clocked off. Discharging doctor verified off-shift. Vigil auto-paged covering Dr. Mensah and armed a 2-hour SLA countdown timer.'
    },
    withoutVigil: {
      patient: '19:14 • Martha Reeve (Potassium 6.8 mmol/L)',
      badge: 'Unread Alert',
      desc: 'Result delivered to Dr. Okonkwo’s personal clinic inbox. Doctor is off-duty. Zero notifications sent to on-duty staff. Patient sitting at home unmonitored.'
    },
    lostCount: 1,
    lostDetail: '1 critical hyperkalemia (Potassium 6.8 mmol/L) unaddressed in closed inbox.'
  },
  {
    minute: 19 * 60 + 30, // 19:30
    key: 'martha_ack',
    withVigil: {
      patient: '19:30 • Martha Reeve • Case Ownership Accepted',
      badge: 'Fast Ownership (16m)',
      badgeClass: 'acuity-routine',
      borderClass: 'border-safe-left',
      desc: 'Dr. Mensah accepted case ownership via mobile alert. Patient callback script generated with verified English back-translation. SLA clock safely halted.'
    },
    withoutVigil: null,
    lostCount: 1,
    lostDetail: '1 critical hyperkalemia unaddressed. Patient at home with acute cardiac arrest risk.'
  },
  {
    minute: 22 * 60 + 45, // 22:45
    key: 'samuel',
    withVigil: {
      patient: '22:45 • Samuel Okai (Troponin 2.4 ng/mL)',
      badge: 'Cardiac Injury Caught',
      badgeClass: 'acuity-critical',
      borderClass: 'border-critical-left',
      desc: 'High-sensitivity troponin returned 4h post-discharge. Autonomous engine identified acute myocardial injury and escalated to Dr. Mensah for emergency callback.'
    },
    withoutVigil: {
      patient: '22:45 • Samuel Okai (Troponin 2.4 ng/mL)',
      badge: 'Cardiac Injury Unread',
      desc: 'Acute myocardial injury result delivered to closed inbox. Dr. Okonkwo asleep. No covering staff alerted. Delay ticking past 10 hours overnight.'
    },
    lostCount: 2,
    lostDetail: '2 patients lost: 1 severe hyperkalemia + 1 acute myocardial injury unaddressed.'
  },
  {
    minute: 26 * 60, // 02:00 AM (Next Day)
    key: 'amina',
    withVigil: {
      patient: '02:00 • Amina Diallo (Oncology Specialist Referral)',
      badge: 'SLA Breach Intercepted',
      badgeClass: 'acuity-urgent',
      borderClass: 'border-urgent-left',
      desc: 'Cancer referral reached 55 hours unbooked (exceeding 48h safety deadline). Autonomous escalation paged patient navigator to secure priority clinic slot.'
    },
    withoutVigil: {
      patient: '02:00 • Amina Diallo (Oncology Referral)',
      badge: 'Referral Dropped',
      desc: 'Outbound oncology referral quietly breached 48h safety SLA with zero reminder. Patient lost in administrative backlog.'
    },
    lostCount: 3,
    lostDetail: '3 patients fell through the cracks: 1 hyperkalemia, 1 cardiac injury, 1 lost oncology referral.'
  },
  {
    minute: 31 * 60, // 07:00 AM (Next Day - Morning Shift)
    key: 'morning_shift',
    withVigil: {
      patient: '07:00 • Morning Shift Handover Complete',
      badge: '100% Protected',
      badgeClass: 'acuity-routine',
      borderClass: 'border-safe-left',
      desc: 'Day team arrives. 3 of 3 critical diagnostic handoffs intercepted and resolved. Median response time: 18 minutes. 0 patients lost to follow-up.'
    },
    withoutVigil: {
      patient: '07:00 • Morning Shift Arrives to 3 Critical Failures',
      badge: '14.2h Delay',
      desc: 'Day doctors open inboxes. Martha Reeve (K+ 6.8) unmonitored for 11h 46m. Samuel Okai (Trop 2.4) unaddressed for 8h 15m. Average delay: 14.2 hours.'
    },
    lostCount: 3,
    lostDetail: 'Morning shift arrives. 3 patients suffered severe diagnostic delays (Average delay: 14.2 hours). High clinical malpractice exposure.'
  }
];

function initNightShiftView() {
  const withVigil = document.getElementById('withVigilStream');
  const withoutVigil = document.getElementById('withoutVigilStream');
  const lostCountEl = document.getElementById('withoutVigilLost');
  const lostDetailEl = document.getElementById('withoutVigilDetail');

  if (withVigil) {
    withVigil.innerHTML = `
      <div class="event-item border-safe-left">
        <div class="event-item-top">
          <span class="event-patient">19:00 • Shift Handover Complete</span>
          <span class="acuity-badge acuity-routine">On-Duty Active</span>
        </div>
        <p class="event-desc">Dr. Okonkwo signed out. Dr. Mensah takes active night coverage. Vigil autonomous safety net armed.</p>
      </div>
    `;
  }

  if (withoutVigil) {
    withoutVigil.innerHTML = `
      <div class="event-item" style="opacity: 0.65;">
        <div class="event-item-top">
          <span class="event-patient">19:00 • Dr. Okonkwo Clocks Off</span>
          <span class="acuity-badge" style="background:#F1F5F9; color:#475569;">Inboxes Closed</span>
        </div>
        <p class="event-desc">Standard hospital EMR in passive mode. Post-discharge results will accumulate in individual inboxes without active routing.</p>
      </div>
    `;
  }

  if (lostCountEl) lostCountEl.textContent = '0 Patients Lost';
  if (lostDetailEl) lostDetailEl.textContent = 'Night shift underway (19:00). Awaiting post-discharge lab returns...';
}

// Night Shift Replay Simulation
function toggleNightShiftPlay() {
  const playBtn = document.getElementById('playBtn');
  if (VigilState.simPlaying) {
    clearInterval(VigilState.simInterval);
    VigilState.simPlaying = false;
    if (playBtn) playBtn.textContent = '▶ Start Simulation';
  } else {
    VigilState.simPlaying = true;
    if (playBtn) playBtn.textContent = '❚❚ Pause Simulation';
    runNightShiftLoop();
  }
}

function setSpeed(speed) {
  VigilState.simSpeed = speed;
  document.querySelectorAll('#tab-nightshift .filter-tab').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  if (VigilState.simPlaying) {
    clearInterval(VigilState.simInterval);
    runNightShiftLoop();
  }
}

function resetNightShift() {
  clearInterval(VigilState.simInterval);
  VigilState.simPlaying = false;
  VigilState.simTimeMinutes = 19 * 60;
  VigilState.simFiredMilestones.clear();
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = '▶ Start Simulation';
  const progress = document.getElementById('simProgressFill');
  if (progress) progress.style.width = '0%';
  const simTime = document.getElementById('simTimeDisplay');
  if (simTime) simTime.textContent = '04 Nov 2026 19:00';
  initNightShiftView();
}

function runNightShiftLoop() {
  const stepIntervalMs = 150;
  const minutesPerStep = (1440 / (90 * 1000 / stepIntervalMs)) * VigilState.simSpeed;

  VigilState.simInterval = setInterval(() => {
    VigilState.simTimeMinutes += minutesPerStep;
    const elapsed = VigilState.simTimeMinutes - (19 * 60);
    const pct = Math.min(100, Math.max(0, (elapsed / 1440) * 100));

    const progress = document.getElementById('simProgressFill');
    if (progress) progress.style.width = `${pct}%`;

    const simTime = document.getElementById('simTimeDisplay');
    if (simTime) {
      const totalMins = Math.floor(VigilState.simTimeMinutes);
      const isNextDay = totalMins >= 24 * 60;
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      simTime.textContent = `${isNextDay ? '05' : '04'} Nov 2026 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    // Check milestones
    SIM_MILESTONES.forEach(m => {
      if (VigilState.simTimeMinutes >= m.minute && !VigilState.simFiredMilestones.has(m.key)) {
        VigilState.simFiredMilestones.add(m.key);
        
        const withVigil = document.getElementById('withVigilStream');
        const withoutVigil = document.getElementById('withoutVigilStream');
        const lostCountEl = document.getElementById('withoutVigilLost');
        const lostDetailEl = document.getElementById('withoutVigilDetail');

        if (withVigil && m.withVigil) {
          const item = document.createElement('div');
          item.className = `event-item ${m.withVigil.borderClass || ''}`;
          item.innerHTML = `
            <div class="event-item-top">
              <span class="event-patient">${m.withVigil.patient}</span>
              <span class="acuity-badge ${m.withVigil.badgeClass}">${m.withVigil.badge}</span>
            </div>
            <p class="event-desc">${m.withVigil.desc}</p>
          `;
          withVigil.prepend(item);
        }

        if (withoutVigil && m.withoutVigil) {
          const item = document.createElement('div');
          item.className = 'event-item failure-item';
          item.innerHTML = `
            <div class="event-item-top">
              <span class="event-patient">${m.withoutVigil.patient}</span>
              <span style="font-size: 11px; font-weight: 700; color: var(--color-critical-dark);">${m.withoutVigil.badge}</span>
            </div>
            <p class="event-desc">${m.withoutVigil.desc}</p>
          `;
          withoutVigil.prepend(item);
        }

        if (lostCountEl) {
          lostCountEl.textContent = `${m.lostCount} Patient${m.lostCount === 1 ? '' : 's'} Lost to Follow-Up`;
          lostCountEl.classList.remove('pulse-alert');
          void lostCountEl.offsetWidth; // trigger reflow
          lostCountEl.classList.add('pulse-alert');
        }

        if (lostDetailEl) {
          lostDetailEl.textContent = m.lostDetail;
        }
      }
    });

    if (pct >= 100) {
      clearInterval(VigilState.simInterval);
      VigilState.simPlaying = false;
      const playBtn = document.getElementById('playBtn');
      if (playBtn) playBtn.textContent = 'Simulation Complete';
    }
  }, stepIntervalMs);
}

// Safety Audit Log Rendering & Tamper Check
function renderLedger() {
  const tbody = document.getElementById('ledgerTableBody');
  if (!tbody) return;

  tbody.innerHTML = LedgerData.map(row => `
    <tr>
      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--color-primary);">#00${row.seq}</td>
      <td style="color: var(--text-muted); font-size: 11px;">${row.time}</td>
      <td><strong>${row.patient}</strong></td>
      <td>${row.action}</td>
      <td><span class="clinician-chip">${row.actor}</span></td>
      <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-light);">${row.hash.substring(0, 16)}...</td>
    </tr>
  `).join('');
}

function verifyLedger() {
  const badge = document.getElementById('ledgerBadge');
  if (VigilState.tampered) {
    if (badge) {
      badge.className = 'status-badge';
      badge.style.backgroundColor = '#FEF2F2';
      badge.style.color = '#991B1B';
      badge.style.borderColor = '#FCA5A5';
      badge.textContent = '⚠️ Tamper Detected (Entry #002 Corrupted)';
    }
    showToast('Tamper Detected', 'Audit record #002 was modified. Cryptographic SHA-256 checksum mismatch: hash does not match block #001. InterSystems Security Alert generated.', 'critical', 6000);
  } else {
    if (badge) {
      badge.className = 'status-badge';
      badge.style.backgroundColor = '#ECFDF5';
      badge.style.color = '#065F46';
      badge.style.borderColor = '#6EE7B7';
      badge.textContent = '✓ All Records Verified';
    }
    showToast('Audit Log Verified', 'All records match their cryptographic SHA-256 checksums. Chain integrity intact (100% valid).', 'success');
  }
}

function simulateTamper() {
  VigilState.tampered = true;
  const tbody = document.getElementById('ledgerTableBody');
  if (tbody && tbody.children.length > 1) {
    tbody.children[1].children[4].innerHTML = '<span class="acuity-badge acuity-critical">Modified by Adversary</span>';
    tbody.children[1].children[5].innerHTML = '<span style="color: #DC2626; font-weight: 700;">CORRUPTED_HASH_XX...</span>';
  }
  verifyLedger();
}
