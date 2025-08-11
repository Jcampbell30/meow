(() => {
  // ---- Elements
  const $ = (s) => document.querySelector(s);
  const catBtn   = $('#catBtn');
  const myCount  = $('#myCount');
  const muteBtn  = $('#muteBtn');
  const resetBtn = $('#resetBtn');
  const audioEl  = $('#meowAudio');

  // ---- Storage keys
  const LS = {
    COUNT: 'cat.meow.myClicks',
    MUTED: 'cat.meow.muted'
  };

  // ---- State
  let clicks = toNum(localStorage.getItem(LS.COUNT), 0);
  let muted  = localStorage.getItem(LS.MUTED) === '1';

  // ---- Init
  renderCount();
  renderMute();

  // Pre-warm audio on first pointer (helps iOS)
  window.addEventListener('pointerdown', unlockAudioOnce, { once: true });

  // ---- Events
  catBtn.addEventListener('click', (e) => doMeow(e.clientX, e.clientY));

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      const r = catBtn.getBoundingClientRect();
      doMeow(r.left + r.width / 2, r.top + r.height / 2);
      e.preventDefault();
    }
  });

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem(LS.MUTED, muted ? '1' : '0');
    renderMute();
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset your meows?')) return;
    clicks = 0;
    localStorage.setItem(LS.COUNT, '0');
    renderCount();
  });

  // Keep multiple tabs in sync
  window.addEventListener('storage', (e) => {
    if (e.key === LS.COUNT) {
      clicks = toNum(e.newValue, 0);
      renderCount();
    } else if (e.key === LS.MUTED) {
      muted = e.newValue === '1';
      renderMute();
    }
  });

  // ---- Actions
  async function doMeow(x, y) {
    clicks++;
    localStorage.setItem(LS.COUNT, String(clicks));
    renderCount();
    popPlusOne(x, y);

    if (!muted) {
      try {
        audioEl.currentTime = 0;
        await audioEl.play();              // try real audio on user gesture
      } catch {
        fallbackBeep();                    // if blocked/missing, beep
      }
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }

  function renderCount() {
    myCount.textContent = clicks.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function renderMute() {
    muteBtn.setAttribute('aria-pressed', String(!muted));
    muteBtn.textContent = muted ? '🔇 Sound Off' : '🔊 Sound On';
  }

  function toNum(v, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }

  // ---- Audio helpers
  function unlockAudioOnce() {
    // Best-effort unlock; ignore errors until real click
    audioEl.play().then(() => {
      audioEl.pause();
      audioEl.currentTime = 0;
    }).catch(() => {});
  }

  let audioCtx;
  function fallbackBeep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain).connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.value = 550;
      gain.gain.value = 0.05;
      osc.start();
      setTimeout(() => osc.stop(), 120);
    } catch {}
  }

  // ---- UI flourish
  function popPlusOne(x, y) {
    const el = document.createElement('div');
    el.className = 'click-pop';
    el.textContent = '+1';
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }
})();
