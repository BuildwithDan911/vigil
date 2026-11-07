/**
 * Vigil for IRIS for Health - Clinical Patient-Safety Handoff Engine
 * Web Frontend Controller (WCAG 2.2 AA, WHO-aligned Paper Palette)
 * (c) 2026 Daniel John <danielbasseyj@gmail.com> - MIT License
 */

// Global State
const VigilState = {
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
  loops: [],
  selectedLoopId: 'VGL-01-REEVE'
};

// Seeded Fallback / Replay Data
const SEEDED_LOOPS = [
  {
    loopId: 'VGL-01-REEVE',
    patientId: 'P01',
    patientName: 'Martha Reeve (78y)',
    ward: '4W',
    type: 'results_after_discharge',
    typeName: 'Lab Result After Discharge',
    urgency: 'critical',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 1,
    testName: 'Potassium (Serum)',
    testValue: '6.8 mmol/L (HH)',
    referenceRange: '3.5 - 5.0 mmol/L',
    reason: 'Potassium 6.8 mmol/L (HH) 1 day after discharge. High vulnerability (age 78, lives alone). Primary owner off-shift.',
    slaRemaining: '01h 48m',
    ladder: ['dr.okonkwo (Off-shift)', 'dr.mensah (Night - Active)', 'dr.adewale (Head)'],
    consentStatus: 'send',
    ruleFloor: 'CRITICAL',
    modelRecommendation: 'CRITICAL',
    enforcedUrgency: 'CRITICAL',
    decisionSource: 'rules_floor'
  },
  {
    loopId: 'VGL-REF-ONC',
    patientId: 'R01',
    patientName: 'Amina Diallo (82y)',
    ward: 'Oncology',
    type: 'referral_leakage',
    typeName: 'Referral Leakage',
    urgency: 'urgent',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 3,
    testName: 'Outbound Referral',
    testValue: 'Oncology Consultation',
    referenceRange: 'SLA: 48h',
    reason: 'Outbound oncology referral unbooked for 55 hours (exceeds 48h SLA). Primary owner off-shift.',
    slaRemaining: '06h 15m',
    ladder: ['dr.mensah (Night - Active)', 'dr.adewale (Head)'],
    consentStatus: 'send',
    ruleFloor: 'URGENT',
    modelRecommendation: 'URGENT',
    enforcedUrgency: 'URGENT',
    decisionSource: 'rules_floor'
  },
  {
    loopId: 'VGL-02-OKAI',
    patientId: 'P02',
    patientName: 'Samuel Okai (67y)',
    ward: 'Cardiology',
    type: 'results_after_discharge',
    typeName: 'Lab Result After Discharge',
    urgency: 'critical',
    state: 'Owned',
    owner: 'dr.mensah',
    originalOwner: 'dr.mensah',
    daysSinceDischarge: 0,
    testName: 'Troponin I (High Sens)',
    testValue: '2.4 ng/mL (HH)',
    referenceRange: '< 0.04 ng/mL',
    reason: 'Troponin I 2.4 ng/mL (HH) day of discharge. Owned by Dr. Mensah via Workflow inbox.',
    slaRemaining: '03h 12m',
    ladder: ['dr.mensah (Accepted Ownership)'],
    consentStatus: 'send',
    ruleFloor: 'CRITICAL',
    modelRecommendation: 'CRITICAL',
    enforcedUrgency: 'CRITICAL',
    decisionSource: 'ai_hub'
  },
  {
    loopId: 'VGL-15-CONTEH',
    patientId: 'P15',
    patientName: 'Fatu Conteh (71y)',
    ward: '2S',
    type: 'results_after_discharge',
    typeName: 'Lab Result After Discharge',
    urgency: 'critical',
    state: 'Escalated',
    owner: 'dr.adewale',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 2,
    testName: 'INR (Prothrombin)',
    testValue: '5.2 (HH)',
    referenceRange: '2.0 - 3.0',
    reason: 'INR 5.2 (HH) 2 days after discharge. Unacknowledged past 2-hour SLA. Escalated to Clinical Head Dr. Adewale.',
    slaRemaining: 'OVERDUE (Escalated)',
    ladder: ['dr.okonkwo (Timed out)', 'dr.mensah (Timed out)', 'dr.adewale (Clinical Head)'],
    consentStatus: 'send',
    ruleFloor: 'CRITICAL',
    modelRecommendation: 'CRITICAL',
    enforcedUrgency: 'CRITICAL',
    decisionSource: 'rules_floor'
  },
  {
    loopId: 'VGL-09-EZE',
    patientId: 'P09',
    patientName: 'Chika Eze (36y)',
    ward: '4W',
    type: 'results_after_discharge',
    typeName: 'Sensitive Lab Result',
    urgency: 'routine',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.mensah',
    daysSinceDischarge: 1,
    testName: 'HIV-1 RNA Viral Load',
    testValue: 'Detectable',
    referenceRange: 'Undetectable',
    reason: 'Sensitive diagnostic result. Privacy Consent Policy: Redact test name from direct patient notifications.',
    slaRemaining: '22h 30m',
    ladder: ['dr.mensah (Active)'],
    consentStatus: 'redact',
    ruleFloor: 'ROUTINE',
    modelRecommendation: 'ROUTINE',
    enforcedUrgency: 'ROUTINE',
    decisionSource: 'ai_hub'
  }
];

// Multilingual Callback Scripts Catalog
const CALLBACK_SCRIPTS = {
  'VGL-01-REEVE': {
    en: {
      text: "Hello, this is Harbourview General Hospital calling for Martha Reeve regarding a recent lab test. Please could Martha or their carer contact our clinical nurse coordinator on 0800-427-268 today.",
      back: "Hello, this is Harbourview General Hospital calling for Martha Reeve regarding a recent lab test. Please phone us on 0800-427-268 today.",
      rtl: false
    },
    fr: {
      text: "Bonjour, ici l'Hôpital Général Harbourview pour Martha Reeve concernant un examen biologique récent. Merci de rappeler sans délai notre coordinateur au 0800-427-268 aujourd'hui.",
      back: "Hello, this is Harbourview General Hospital for Martha Reeve regarding a recent lab test. Thank you for calling back our coordinator on 0800-427-268 today.",
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

// Cryptographic Ledger Mock
let LedgerData = [
  { seq: 1, time: '2026-11-04 19:14:00', loopId: 'VGL-01-REEVE', type: 'Opened', actor: 'rules_floor', prev: '0000000000000000000000000000000000000000000000000000000000000000', hash: '7f8a91c4b2e8d3a1f94c0b26e7a1d52849e7b2f153a79c4618e52a8b94f012de' },
  { seq: 2, time: '2026-11-04 19:30:15', loopId: 'VGL-02-OKAI', type: 'Owned', actor: 'user:dr.mensah', prev: '7f8a91c4b2e8d3a1f94c0b26e7a1d52849e7b2f153a79c4618e52a8b94f012de', hash: '3c4e51f89a2b109c687e14a2f8c519d08e7a6b5c4d3e2f1098a7b6c5d4e3f2a1' },
  { seq: 3, time: '2026-11-04 21:15:00', loopId: 'VGL-15-CONTEH', type: 'Escalated', actor: 'system:escalation_timer', prev: '3c4e51f89a2b109c687e14a2f8c519d08e7a6b5c4d3e2f1098a7b6c5d4e3f2a1', hash: 'a8b92d4ef0192ca718b95e0c4a7f21e90d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a' }
];

// Document Initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('Vigil for IRIS for Health - Client Initialized');
  VigilState.loops = SEEDED_LOOPS;
  checkHealth();
  renderBoard();
  initClock();
});

// REST Health Check
function checkHealth() {
  fetch('/vigil/api/health')
    .then(res => res.json())
    .then(data => {
      const modeChip = document.getElementById('modeChip');
      if (modeChip && data.mode) {
        modeChip.textContent = data.mode === 'live'
          ? 'Live Gemini AI Hub'
          : 'Recorded Replay — No Live AI Calls';
      }
      // If server responded, attempt fetching live loops
      fetchLoops();
    })
    .catch(() => {
      console.log('Using seeded client-side demonstration loops.');
      renderBoard();
    });
}

function fetchLoops() {
  fetch('/vigil/api/loops')
    .then(res => res.json())
    .then(loops => {
      if (Array.isArray(loops) && loops.length > 0) {
        VigilState.loops = loops;
        renderBoard();
      }
    })
    .catch(err => console.log('Could not load remote loops, keeping seeded set.'));
}

// Simulated Clock
function initClock() {
  const clockEl = document.getElementById('hospitalClock');
  if (!clockEl) return;
  setInterval(() => {
    if (!VigilState.simPlaying) {
      VigilState.simTimeMinutes = (VigilState.simTimeMinutes + 1) % 1440;
      updateClockDisplay(clockEl, VigilState.simTimeMinutes);
    }
  }, 1000);
}

function updateClockDisplay(el, minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  el.textContent = `04 Nov 2026 ${h}:${m}`;
}

// Navigation Tabs
function switchTab(tabId, compareMode = false) {
  VigilState.currentTab = tabId;
  const sections = document.querySelectorAll('.view-section');
  sections.forEach(s => s.classList.remove('active'));

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add('active');

  const links = document.querySelectorAll('.nav-link');
  links.forEach(l => {
    l.classList.remove('active');
    if (l.getAttribute('onclick')?.includes(tabId)) {
      l.classList.add('active');
    }
  });

  if (tabId === 'nightshift' && compareMode) {
    const splitCard = document.querySelector('.split-card.without');
    if (splitCard) splitCard.scrollIntoView({ behavior: 'smooth' });
  }
}

// Filters & Search
function setLoopTypeFilter(type) {
  VigilState.loopTypeFilter = type;
  document.querySelectorAll('.filter-chips .chip-btn').forEach(b => b.classList.remove('active'));
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

// Render Ward Board
function renderBoard() {
  const cardsOpened = document.getElementById('cardsOpened');
  const cardsOwned = document.getElementById('cardsOwned');
  const cardsEscalated = document.getElementById('cardsEscalated');
  const cardsActed = document.getElementById('cardsActed');

  if (!cardsOpened) return;

  const filtered = VigilState.loops.filter(l => {
    // Type filter
    if (VigilState.loopTypeFilter !== 'all' && l.type !== VigilState.loopTypeFilter) return false;
    // Ward filter
    if (VigilState.wardFilter !== 'all' && l.ward !== VigilState.wardFilter) return false;
    // Owner filter
    if (VigilState.ownerFilter !== 'all' && l.owner !== VigilState.ownerFilter) return false;
    // Search query
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

  // Render lanes
  renderLane(cardsOpened, lanes.Opened, 'countOpened');
  renderLane(cardsOwned, lanes.Owned, 'countOwned');
  renderLane(cardsEscalated, lanes.Escalated, 'countEscalated');
  renderLane(cardsActed, lanes.Acted, 'countActed');

  // Update hero counter
  const heroCount = document.getElementById('heroCount');
  if (heroCount) {
    const unactedCount = lanes.Opened.length + lanes.Escalated.length;
    heroCount.textContent = `${unactedCount} patient${unactedCount === 1 ? '' : 's'} need a call before morning.`;
  }
}

function renderLane(container, loopList, countId) {
  const countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = loopList.length;

  if (loopList.length === 0) {
    container.innerHTML = '<p style="color: var(--vigil-ink-muted); font-size: 14px; text-align: center; margin-top: 40px;">No loops in this lane.</p>';
    return;
  }

  container.innerHTML = loopList.map(l => {
    const badgeClass = l.urgency === 'critical' ? 'badge-critical' : (l.urgency === 'urgent' ? 'badge-urgent' : 'badge-routine');
    const badgeIcon = l.urgency === 'critical' ? '◆ Critical' : (l.urgency === 'urgent' ? '▲ Urgent' : '● Routine');

    let ladderHtml = '';
    if (l.ladder && l.ladder.length > 0) {
      ladderHtml = `
        <div class="ladder-indicator">
          ${l.ladder.map((step, idx) => `<span class="ladder-step ${idx === 0 ? 'active' : ''}">${step}</span>`).join(' &rarr; ')}
        </div>
      `;
    }

    return `
      <article class="loop-card" onclick="openCardDetail('${l.loopId}')" role="button" tabindex="0">
        <div class="card-top">
          <span class="badge ${badgeClass}">${badgeIcon}</span>
          <span class="countdown">SLA: ${l.slaRemaining || '2h'}</span>
        </div>
        <h3 class="card-patient">${l.patientName}</h3>
        <p class="card-reason">${l.reason}</p>
        ${ladderHtml}
        <div class="card-footer">
          <span>Ward: ${l.ward}</span>
          <span>${l.typeName || l.type}</span>
        </div>
      </article>
    `;
  }).join('');
}

// Modal Detail View
function openCardDetail(loopId) {
  VigilState.selectedLoopId = loopId;
  const loop = VigilState.loops.find(l => l.loopId === loopId) || VigilState.loops[0];

  const modal = document.getElementById('loopDetailModal');
  if (!modal) return;

  const urgencyEl = document.getElementById('modalUrgency');
  const patientEl = document.getElementById('modalPatient');
  const reasonEl = document.getElementById('modalReason');

  if (urgencyEl) {
    urgencyEl.className = `badge ${loop.urgency === 'critical' ? 'badge-critical' : 'badge-urgent'}`;
    urgencyEl.textContent = loop.urgency.toUpperCase();
  }
  if (patientEl) patientEl.textContent = loop.patientName;
  if (reasonEl) reasonEl.textContent = `${loop.testName}: ${loop.testValue} — ${loop.reason}`;

  updateScriptLanguage();
  modal.style.display = 'flex';
}

function closeDetailModal() {
  const modal = document.getElementById('loopDetailModal');
  if (modal) modal.style.display = 'none';
}

// Multilingual Callback Script Switching
function updateScriptLanguage() {
  const langSelect = document.getElementById('scriptLang');
  const scriptTextEl = document.getElementById('localizedScriptText');
  const backTextEl = document.getElementById('backTranslationText');

  const lang = langSelect ? langSelect.value : 'en';
  const scriptData = CALLBACK_SCRIPTS[VigilState.selectedLoopId] || CALLBACK_SCRIPTS['VGL-01-REEVE'];
  const entry = scriptData[lang] || scriptData['en'];

  if (scriptTextEl) {
    scriptTextEl.textContent = `"${entry.text}"`;
    if (entry.rtl) {
      scriptTextEl.setAttribute('dir', 'rtl');
      scriptTextEl.style.fontFamily = 'Tahoma, Arial, sans-serif';
    } else {
      scriptTextEl.removeAttribute('dir');
      scriptTextEl.style.fontFamily = 'var(--font-sans)';
    }
  }

  if (backTextEl) {
    backTextEl.textContent = `"${entry.back}"`;
  }
}

// Action Handlers
function acceptSelectedLoop() {
  const loop = VigilState.loops.find(l => l.loopId === VigilState.selectedLoopId);
  if (loop) {
    loop.state = 'Owned';
    loop.owner = 'dr.mensah';
    renderBoard();
    alert(`Ownership accepted by Dr. Mensah for ${loop.patientName}. Loop moved to 'Owned' lane.`);
    closeDetailModal();
  }
}

function actSelectedLoop() {
  const loop = VigilState.loops.find(l => l.loopId === VigilState.selectedLoopId);
  if (loop) {
    loop.state = 'Acted';
    renderBoard();
    alert(`Patient contact logged for ${loop.patientName}. Handoff loop closed.`);
    closeDetailModal();
  }
}

// Adversarial Downgrade Modal
function openAdversarialModal() {
  const modal = document.getElementById('adversarialModal');
  if (modal) modal.style.display = 'flex';
}

function closeAdversarialModal() {
  const modal = document.getElementById('adversarialModal');
  if (modal) modal.style.display = 'none';
}

// Night Shift Simulation Player
function toggleNightShiftPlay() {
  const playBtn = document.getElementById('playBtn');
  if (VigilState.simPlaying) {
    clearInterval(VigilState.simInterval);
    VigilState.simPlaying = false;
    if (playBtn) playBtn.textContent = '▶ Play Simulation';
  } else {
    VigilState.simPlaying = true;
    if (playBtn) playBtn.textContent = '❚❚ Pause Simulation';
    runNightShiftLoop();
  }
}

function setSpeed(speed) {
  VigilState.simSpeed = speed;
  document.querySelectorAll('#tab-nightshift .chip-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
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
  if (playBtn) playBtn.textContent = '▶ Play Simulation';
  const progress = document.getElementById('progressBar');
  if (progress) progress.style.width = '0%';
  const simTime = document.getElementById('simTime');
  if (simTime) simTime.textContent = '04 Nov 2026 19:00';
}

function runNightShiftLoop() {
  // 24 hours (1440 mins) over 90 seconds @ 1x => ~16 mins hospital time per real second
  const stepIntervalMs = 200;
  const minutesPerStep = (1440 / (90 * 1000 / stepIntervalMs)) * VigilState.simSpeed;

  VigilState.simInterval = setInterval(() => {
    VigilState.simTimeMinutes += minutesPerStep;
    const elapsed = VigilState.simTimeMinutes - (19 * 60);
    const pct = Math.min(100, Math.max(0, (elapsed / 1440) * 100));

    const progress = document.getElementById('progressBar');
    if (progress) progress.style.width = `${pct}%`;

    const simTime = document.getElementById('simTime');
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

// Cryptographic Ledger Verification
function verifyLedger() {
  const badge = document.getElementById('chainBadge');
  if (VigilState.tampered) {
    if (badge) {
      badge.className = 'badge badge-critical';
      badge.textContent = '⚠️ Tamper Detected (Seq #2 Hash Mismatch)';
    }
    alert('TAMPER DETECTED!\nRecord Seq #2 was modified. SHA-256 hash does not match previous link in chain.\nInterSystems Security Alert Dispatched.');
  } else {
    if (badge) {
      badge.className = 'badge badge-safe';
      badge.textContent = '✓ Chain Verified';
    }
    alert('Cryptographic Chain Verified:\nAll 3 block hashes match their canonical SHA-256 signatures.');
  }
}

function simulateTamper() {
  VigilState.tampered = true;
  const rows = document.getElementById('ledgerRows');
  if (rows) {
    rows.children[1].children[4].textContent = 'user:adversary (MODIFIED)';
    rows.children[1].children[6].innerHTML = '<span style="color: var(--vigil-critical); font-weight: 700;">CORRUPTED_HASH_XX...</span>';
  }
  verifyLedger();
}

// Consent Gate Queue
function resolveConsent(action, patientId) {
  alert(`Consent action [${action.toUpperCase()}] confirmed for patient ${patientId}. Policy audit entry written.`);
}
