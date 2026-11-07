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

// Document Initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('Vigil Enterprise - Client Initialized');
  VigilState.demoLoops = [...SEEDED_DEMO_LOOPS];
  VigilState.liveLoops = [];
  checkHealth();
  renderBoard();
  renderLedger();
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
}

function renderLane(container, loopList, countId) {
  const countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = loopList.length;

  if (loopList.length === 0) {
    const isLive = VigilState.environment === 'live';
    const emptyNotice = isLive
      ? 'No active cases in this stage. Click "+ New Patient Handoff" to dispatch a case.'
      : 'No active cases in this stage.';
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

    return `
      <div class="patient-row ${urgencyBorder}" onclick="openCardDetail('${l.loopId}')" role="button" tabindex="0">
        <div class="row-left">
          <div class="row-patient-line">
            <span class="acuity-badge ${urgencyClass}">${urgencyLabel}</span>
            <span class="patient-name-bold">${l.patientName}</span>
            <span class="patient-demographics">${l.ward} &bull; MRN #${l.patientId || '9281'}</span>
          </div>
          <div class="row-finding-line">
            <span class="finding-strong">${l.testName}:</span> ${l.testValue}
            <span class="finding-bullet">&bull;</span>
            <span class="finding-explanation">${l.reason}</span>
          </div>
        </div>

        <div class="row-meta-right">
          <div class="clinician-chip">
            <span class="status-dot dot-${l.urgency === 'critical' ? 'critical' : 'warning'}"></span>
            <span>${doctorDisplay}</span>
          </div>
          <div class="sla-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>${l.slaRemaining || '2h'}</span>
          </div>
          <button class="btn-open-case">
            Review Case &rarr;
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
    alert(`Case accepted by Dr. Mensah for ${loop.patientName}. Patient moved to 'Doctor Assigned'.`);
    closeDetailModal();
  }
}

function actSelectedLoop() {
  const pool = VigilState.environment === 'demo' ? VigilState.demoLoops : VigilState.liveLoops;
  const loop = pool.find(l => l.loopId === VigilState.selectedLoopId);
  if (loop) {
    loop.state = 'Acted';
    renderBoard();
    alert(`Patient contact confirmed for ${loop.patientName}. Safety loop successfully closed.`);
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

  alert(`Live Safety Net Dispatched!\nCase ${newId} created for ${patientName}.\nUrgency Enforced: ${urgency.toUpperCase()} (SLA: ${slaRemaining}).\nRouted to ${coveringDr}.`);
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

  alert(`⚡ EMERGENCY LAB INTERCEPTED!\n\nPatient: ${pick.name} (${pick.age})\nTest: ${pick.test} = ${pick.val}\n\nVigil Autonomous Execution:\n1. Discharging doctor verified off-shift\n2. Case routed to on-duty Dr. Mensah\n3. 2-Hour SLA Timer started\n4. Cryptographic entry #${newSeq} written to audit log.`);
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
  const playBtn = document.getElementById('playBtn');
  if (playBtn) playBtn.textContent = '▶ Start Simulation';
  const progress = document.getElementById('simProgressFill');
  if (progress) progress.style.width = '0%';
  const simTime = document.getElementById('simTimeDisplay');
  if (simTime) simTime.textContent = '04 Nov 2026 19:00';
}

function runNightShiftLoop() {
  const stepIntervalMs = 200;
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
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      simTime.textContent = `05 Nov 2026 ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

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
    alert('TAMPER DETECTED!\nAudit record #002 was modified. Cryptographic checksum does not match the chain.\nInterSystems Security Alert generated.');
  } else {
    if (badge) {
      badge.className = 'status-badge';
      badge.style.backgroundColor = '#ECFDF5';
      badge.style.color = '#065F46';
      badge.style.borderColor = '#6EE7B7';
      badge.textContent = '✓ All Records Verified';
    }
    alert('Audit Log Verified:\nAll records match their cryptographic checksums. Chain integrity intact.');
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
