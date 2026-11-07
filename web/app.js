// Vigil Clinical Web Application Router & Interactions

document.addEventListener('DOMContentLoaded', () => {
  console.log('Vigil Clinical Interface initialized.');
  checkHealth();
  initClock();
});

function checkHealth() {
  fetch('/vigil/api/health')
    .then(res => res.json())
    .then(data => {
      console.log('Backend health status:', data);
      const modeChip = document.getElementById('modeChip');
      if (modeChip && data.mode) {
        modeChip.textContent = data.mode === 'live' 
          ? 'Live Gemini AI Hub' 
          : 'Recorded Replay — No Live AI Calls';
      }
    })
    .catch(err => {
      console.log('Running in local static mode; backend mock active.');
    });
}

function initClock() {
  const clockEl = document.getElementById('hospitalClock');
  if (!clockEl) return;
  let simulatedHour = 19;
  let simulatedMin = 0;
  setInterval(() => {
    simulatedMin += 1;
    if (simulatedMin >= 60) {
      simulatedMin = 0;
      simulatedHour = (simulatedHour + 1) % 24;
    }
    const hStr = simulatedHour.toString().padStart(2, '0');
    const mStr = simulatedMin.toString().padStart(2, '0');
    clockEl.textContent = `04 Nov 2026 ${hStr}:${mStr}`;
  }, 1000);
}

function switchTab(tabId) {
  const links = document.querySelectorAll('.nav-link');
  links.forEach(l => l.classList.remove('active'));
  event.target.classList.add('active');
  console.log('Switched to tab:', tabId);
}

function startNightShift() {
  alert('Starting 90-second Night Shift simulation. Compressing 24 hours of hospital events...');
}

function openWithoutVigil() {
  alert('Displaying "Without Vigil" comparison: Standard hospital systems result in 3 patients lost to follow-up.');
}

function openAdversarialModal() {
  const modal = document.getElementById('adversarialModal');
  if (modal) modal.style.display = 'flex';
}

function closeAdversarialModal() {
  const modal = document.getElementById('adversarialModal');
  if (modal) modal.style.display = 'none';
}

function openCardDetail(cardId) {
  console.log('Opening card detail for:', cardId);
}
