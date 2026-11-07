/**
 * Vigil for IRIS for Health - Clinical Patient-Safety Handoff Engine
 * Web Frontend Controller
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

// Seeded Fallback / Demonstration Data
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
    testValue: '6.8 mmol/L (Critically High)',
    referenceRange: '3.5 - 5.0 mmol/L',
    reason: 'Potassium 6.8 mmol/L 1 day after discharge. High vulnerability (age 78, lives alone). Discharging doctor went off-duty.',
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
    ward: 'Oncology',
    type: 'referral_leakage',
    typeName: 'Overdue Specialist Referral',
    urgency: 'urgent',
    state: 'Opened',
    owner: 'dr.mensah',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 3,
    testName: 'Specialist Referral',
    testValue: 'Oncology Consultation',
    referenceRange: 'Target SLA: 48h',
    reason: 'Urgent cancer referral unbooked for 55 hours (exceeds 48-hour safety target). Discharging doctor off-duty.',
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
    ward: 'Cardiology',
    type: 'results_after_discharge',
    typeName: 'Lab Result After Discharge',
    urgency: 'critical',
    state: 'Owned',
    owner: 'dr.mensah',
    originalOwner: 'dr.mensah',
    daysSinceDischarge: 0,
    testName: 'Troponin I (High Sens)',
    testValue: '2.4 ng/mL (High)',
    referenceRange: '< 0.04 ng/mL',
    reason: 'Troponin I 2.4 ng/mL day of discharge indicating cardiac injury. Dr. Mensah accepted case ownership.',
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
    ward: '2S',
    type: 'results_after_discharge',
    typeName: 'Lab Result After Discharge',
    urgency: 'critical',
    state: 'Escalated',
    owner: 'dr.adewale',
    originalOwner: 'dr.okonkwo',
    daysSinceDischarge: 2,
    testName: 'INR (Blood Clotting)',
    testValue: '5.2 (Critically High)',
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
    ward: '4W',
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

// Patient Safety Audit Log Records
let LedgerData = [
  { seq: 1, time: '04 Nov 2026 19:14:00', patient: 'Martha Reeve (78y)', action: 'Critical Lab Alert Created & Assigned to On-Duty Clinician', actor: 'Vigil Medical Guard', hash: '7f8a91c4b2e8d3a1f94c0b26e7a1d52849e7b2f153a79c4618e52a8b94f012de' },
  { seq: 2, time: '04 Nov 2026 19:30:15', patient: 'Samuel Okai (67y)', action: 'Case Ownership Accepted via Mobile Alert', actor: 'Dr. Mensah (On-Duty)', hash: '3c4e51f89a2b109c687e14a2f8c519d08e7a6b5c4d3e2f1098a7b6c5d4e3f2a1' },
  { seq: 3, time: '04 Nov 2026 21:15:00', patient: 'Fatu Conteh (71y)', action: 'Response Window Expired — Auto-Escalated to Clinical Director', actor: 'Safety SLA Timer', hash: 'a8b92d4ef0192ca718b95e0c4a7f21e90d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a' }
];

// Document Initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('Vigil for IRIS for Health - Client Initialized');
  VigilState.loops = SEEDED_LOOPS;
  checkHealth();
  renderBoard();
  renderLedger();
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
        VigilState.loops = loops;
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
    const splitCard = document.querySelector('.split-panel.standard-emr');
    if (splitCard) splitCard.scrollIntoView({ behavior: 'smooth' });
  }
}

// Filters & Search
function setLoopTypeFilter(type) {
  VigilState.loopTypeFilter = type;
  document.querySelectorAll('.filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
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

  const heroSummary = document.getElementById('heroSummary');
  if (heroSummary) {
    const unactedCount = lanes.Opened.length + lanes.Escalated.length;
    heroSummary.textContent = `${unactedCount} patient${unactedCount === 1 ? '' : 's'} have critical test results or pending referrals that require immediate clinician attention.`;
  }
}

function renderLane(container, loopList, countId) {
  const countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = loopList.length;

  if (loopList.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; margin-top: 40px;">No patients in this stage.</p>';
    return;
  }

  container.innerHTML = loopList.map(l => {
    const urgencyClass = l.urgency === 'critical' ? 'urgency-critical' : (l.urgency === 'urgent' ? 'urgency-urgent' : 'urgency-routine');
    const urgencyLabel = l.urgency === 'critical' ? 'Critical' : (l.urgency === 'urgent' ? 'Urgent' : 'Routine');

    let ladderHtml = '';
    if (l.ladder && l.ladder.length > 0) {
      ladderHtml = `
        <div class="clinician-flow">
          ${l.ladder.map((step, idx) => `<span class="flow-step ${idx === 0 ? 'active' : ''}">${step}</span>`).join(' &rarr; ')}
        </div>
      `;
    }

    return `
      <article class="patient-card" onclick="openCardDetail('${l.loopId}')" role="button" tabindex="0">
        <div class="card-header-row">
          <span class="urgency-tag ${urgencyClass}">${urgencyLabel}</span>
          <span class="sla-timer">Response Target: ${l.slaRemaining || '2h'}</span>
        </div>
        <div class="patient-name">${l.patientName}</div>
        <div class="test-summary"><strong>${l.testName}:</strong> ${l.testValue} &bull; ${l.reason}</div>
        ${ladderHtml}
        <div class="card-footer-row">
          <span>Ward: ${l.ward}</span>
          <span>${l.typeName || l.type}</span>
        </div>
      </article>
    `;
  }).join('');
}

// Patient Loop Detail Modal
function openCardDetail(loopId) {
  VigilState.selectedLoopId = loopId;
  const loop = VigilState.loops.find(l => l.loopId === loopId) || VigilState.loops[0];

  const modal = document.getElementById('detailModal');
  if (!modal) return;

  const urgencyTag = document.getElementById('modalUrgencyTag');
  const patientName = document.getElementById('modalPatientName');
  const reasonText = document.getElementById('modalReasonText');

  if (urgencyTag) {
    urgencyTag.className = `urgency-tag ${loop.urgency === 'critical' ? 'urgency-critical' : 'urgency-urgent'}`;
    urgencyTag.textContent = `${loop.urgency.toUpperCase()} FINDING`;
  }
  if (patientName) patientName.textContent = loop.patientName;
  if (reasonText) reasonText.textContent = `${loop.testName}: ${loop.testValue} — ${loop.reason}`;

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
  const entry = scriptData[lang] || scriptData['en'];

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
  const loop = VigilState.loops.find(l => l.loopId === VigilState.selectedLoopId);
  if (loop) {
    loop.state = 'Owned';
    loop.owner = 'dr.mensah';
    renderBoard();
    alert(`Case accepted by Dr. Mensah for ${loop.patientName}. Patient moved to 'Doctor Assigned'.`);
    closeDetailModal();
  }
}

function actSelectedLoop() {
  const loop = VigilState.loops.find(l => l.loopId === VigilState.selectedLoopId);
  if (loop) {
    loop.state = 'Acted';
    renderBoard();
    alert(`Patient contact confirmed for ${loop.patientName}. Safety loop successfully closed.`);
    closeDetailModal();
  }
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
  document.querySelectorAll('#tab-nightshift .pill-btn').forEach(b => b.classList.remove('active'));
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
      <td style="font-family: var(--font-mono); font-weight: 700;">#00${row.seq}</td>
      <td style="color: var(--text-secondary);">${row.time}</td>
      <td><strong>${row.patient}</strong></td>
      <td>${row.action}</td>
      <td><span class="urgency-tag" style="background:#F1F5F9; color:#334155;">${row.actor}</span></td>
      <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${row.hash.substring(0, 16)}...</td>
    </tr>
  `).join('');
}

function verifyLedger() {
  const badge = document.getElementById('ledgerBadge');
  if (VigilState.tampered) {
    if (badge) {
      badge.className = 'status-badge';
      badge.style.backgroundColor = '#FEE2E2';
      badge.style.color = '#991B1B';
      badge.textContent = '⚠️ Tamper Detected (Entry #002 Modified)';
    }
    alert('TAMPER DETECTED!\nAudit record #002 was modified. Cryptographic checksum does not match the chain.\nInterSystems Security Alert generated.');
  } else {
    if (badge) {
      badge.className = 'status-badge';
      badge.style.backgroundColor = '#D1FAE5';
      badge.style.color = '#065F46';
      badge.textContent = '✓ All Records Verified';
    }
    alert('Audit Log Verified:\nAll records match their cryptographic checksums. Chain integrity intact.');
  }
}

function simulateTamper() {
  VigilState.tampered = true;
  const tbody = document.getElementById('ledgerTableBody');
  if (tbody && tbody.children.length > 1) {
    tbody.children[1].children[4].innerHTML = '<span class="urgency-tag" style="background:#FEE2E2; color:#991B1B;">Modified by Adversary</span>';
    tbody.children[1].children[5].innerHTML = '<span style="color: #DC2626; font-weight: 700;">CORRUPTED_HASH_XX...</span>';
  }
  verifyLedger();
}
