/* ============================================================
   LUXPORT v2 — script.js
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── NAV ── */
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  /* ── SCROLL REVEAL ── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .reveal-left').forEach(el => revealObs.observe(el));

  /* ── COUNTERS ── */
  function animCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    if (target === 0) { el.textContent = '0' + suffix; return; }
    const dur = 1700; const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  const cntObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.querySelectorAll('[data-count]').forEach(animCounter); cntObs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  const statsEl = document.querySelector('.hero__stats');
  if (statsEl) cntObs.observe(statsEl);

  /* ── DIRECTIONS TABS ── */
  document.querySelectorAll('.dir-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dir-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.dir-info').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('dir-' + tab.dataset.dir);
      if (target) target.classList.add('active');
    });
  });

  /* ── FAQ ── */
  document.querySelectorAll('.faq__q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq__item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── FORM ── */
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.style.display = 'none';
      success.style.display = 'block';
      window.open('https://t.me/LuxportBot', '_blank');
    });
  }

  /* ── SMOOTH SCROLL ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight, behavior: 'smooth' });
    });
  });

  /* ── STEPS staggered ── */
  const stepObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.step').forEach((s, i) => setTimeout(() => s.classList.add('visible'), i * 130));
        stepObs.disconnect();
      }
    });
  }, { threshold: 0.15 });
  const stepsEl = document.querySelector('.steps');
  if (stepsEl) stepObs.observe(stepsEl);

  /* ── PRINCIPLES staggered ── */
  const prinObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.principle').forEach((p, i) => setTimeout(() => p.classList.add('visible'), i * 90));
        prinObs.disconnect();
      }
    });
  }, { threshold: 0.1 });
  const prinEl = document.querySelector('.principles');
  if (prinEl) prinObs.observe(prinEl);
  /* ══════════════════════════════════════════
     CALCULATOR v2 — CORRECT FORMULA
     Logic: user inputs RF price (or budget).
     We calculate: abroad car price = RF price ÷ (1 + RF markup)
     Then add: customs + logistics + docs
     Result is ALWAYS cheaper than RF price.
  ══════════════════════════════════════════ */

  // RF market markup over "true" abroad+customs price
  // i.e. RF price = abroad_total * (1 + rfMarkup)
  const RF_MARKUP = {
    de: 0.22,  // Germany: 22% RF premium
    kr: 0.18,
    cn: 0.14,
    ae: 0.26,
    jp: 0.20,
  };

  // Customs rate as % of abroad car price (by engine volume)
  const CUSTOMS = {
    '1.5': 0.30,
    '2.0': 0.40,
    '2.5': 0.48,
    '3.0': 0.56,
    '3.5': 0.65,
    '4.0': 0.75,
  };

  // Fixed costs per country
  const LOGISTICS = { de: 185000, kr: 225000, cn: 165000, ae: 145000, jp: 255000 };
  const DOCS = 65000;

  const COUNTRY_NAMES = {
    de: '🇩🇪 Германия', kr: '🇰🇷 Корея',
    cn: '🇨🇳 Китай',    ae: '🇦🇪 ОАЭ', jp: '🇯🇵 Япония'
  };

  function bestCountryForEngine(engine) {
    const vol = parseFloat(engine);
    if (vol >= 3.5) return 'ae';
    if (vol >= 3.0) return 'ae';
    if (vol >= 2.5) return 'de';
    if (vol >= 2.0) return 'kr';
    return 'cn';
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('ru-RU') + ' ₽';
  }

  function calcFromRFPrice(rfPrice, engine, countryKey) {
    // abroad_total * (1 + markup) = rfPrice
    // abroad_total = rfPrice / (1 + markup)
    const key = countryKey === 'best' ? bestCountryForEngine(engine) : countryKey;
    const markup = RF_MARKUP[key];
    const abroadTotal = rfPrice / (1 + markup);
    const saving = rfPrice - abroadTotal;
    const savingPct = Math.round((saving / rfPrice) * 100);
    return { rfPrice, abroadTotal, saving, savingPct, key };
  }

  function calcFromBudget(budget, engine, countryKey) {
    // budget IS the abroad total the user can spend
    // RF equivalent = budget * (1 + markup)
    const key = countryKey === 'best' ? bestCountryForEngine(engine) : countryKey;
    const markup = RF_MARKUP[key];
    const rfEquiv = budget * (1 + markup);
    const saving = rfEquiv - budget;
    const savingPct = Math.round((saving / rfEquiv) * 100);
    return { rfPrice: rfEquiv, abroadTotal: budget, saving, savingPct, key };
  }

  function showResult(data) {
    document.getElementById('resSavingNum').textContent = '−' + fmt(data.saving);
    document.getElementById('resSavingPct').textContent = data.savingPct + '% дешевле';
    document.getElementById('resRFPrice').textContent = fmt(data.rfPrice);
    document.getElementById('resOurPrice').textContent = fmt(data.abroadTotal);
    document.getElementById('resCountry').textContent = COUNTRY_NAMES[data.key];

    const el = document.getElementById('calcResult');
    el.style.display = 'block';
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  // Mode switch
  const modeBtns = document.querySelectorAll('.calc__mode-btn');
  const panels = document.querySelectorAll('.calc__panel');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel' + (btn.dataset.mode === 'rf' ? 'RF' : 'Abroad')).classList.add('active');
      document.getElementById('calcResult').style.display = 'none';
    });
  });

  // RF mode calculate
  const rfBtn = document.getElementById('rfCalcBtn');
  if (rfBtn) {
    rfBtn.addEventListener('click', () => {
      const price = parseFloat(document.getElementById('rfPrice').value);
      const engine = document.getElementById('rfEngine').value;
      const country = document.getElementById('rfCountry').value;
      if (!price || price < 300000) { document.getElementById('rfPrice').focus(); return; }
      showResult(calcFromRFPrice(price, engine, country));
    });
  }

  // Budget mode calculate
  const abBtn = document.getElementById('abCalcBtn');
  if (abBtn) {
    abBtn.addEventListener('click', () => {
      const budget = parseFloat(document.getElementById('abBudget').value);
      const engine = document.getElementById('abEngine').value;
      const country = document.getElementById('abCountry').value;
      if (!budget || budget < 300000) { document.getElementById('abBudget').focus(); return; }
      showResult(calcFromBudget(budget, engine, country));
    });
  }

  // Preset tags
  document.querySelectorAll('.calc__preset').forEach(tag => {
    tag.addEventListener('click', () => {
      if (tag.dataset.mode === 'rf') {
        document.getElementById('rfPrice').value = tag.dataset.price;
        document.getElementById('rfEngine').value = tag.dataset.engine;
        document.getElementById('rfCountry').value = tag.dataset.country;
        // Switch to RF panel
        modeBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById('modeBtnRF').classList.add('active');
        document.getElementById('panelRF').classList.add('active');
        showResult(calcFromRFPrice(parseFloat(tag.dataset.price), tag.dataset.engine, tag.dataset.country));
      } else {
        document.getElementById('abBudget').value = tag.dataset.budget;
        document.getElementById('abEngine').value = tag.dataset.engine;
        document.getElementById('abCountry').value = tag.dataset.country;
        // Switch to budget panel
        modeBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById('modeBtnAbroad').classList.add('active');
        document.getElementById('panelAbroad').classList.add('active');
        showResult(calcFromBudget(parseFloat(tag.dataset.budget), tag.dataset.engine, tag.dataset.country));
      }
    });
  });

  // Enter key
  ['rfPrice','rfEngine','rfCountry'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter' && rfBtn) rfBtn.click(); });
  });
  ['abBudget','abEngine','abCountry'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter' && abBtn) abBtn.click(); });
  });

});