// Maison Aura — shared behaviour for all pages
(() => {
  'use strict';
  const T = window.AURA_TEXT;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const WHATSAPP = '393334658601';
  document.documentElement.classList.remove('no-js');

  /* ---------- Language ---------- */
  const LANGS = ['it', 'en', 'sq'];
  const store = {
    get() { try { return localStorage.getItem('aura-lang'); } catch { return null; } },
    set(v) { try { localStorage.setItem('aura-lang', v); } catch { /* private mode */ } },
  };
  const fromUrl = new URLSearchParams(location.search).get('lang');
  let lang = LANGS.includes(fromUrl) ? fromUrl : LANGS.includes(store.get()) ? store.get() : 'en';
  const t = k => (T[lang] && T[lang][k]) ?? T.en[k] ?? '';

  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-t]').forEach(el => { el.innerHTML = t(el.dataset.t); });
    $$('[data-t-alt]').forEach(el => { el.alt = t(el.dataset.tAlt); });
    $$('[data-t-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.tAria)));
    $$('[data-terms]').forEach(a => { a.href = 'termini.html#' + lang; });
    $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    const title = document.body.dataset.title;
    if (title) document.title = t(title);
    document.dispatchEvent(new CustomEvent('aura:lang'));
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang; store.set(lang); applyLang();
  }));

  /* ---------- Header & menu ---------- */
  const bar = $('.site-header');
  const hero = $('.hero');
  if (bar && hero) {
    const onScroll = () => bar.classList.toggle('solid', scrollY > hero.offsetHeight * 0.6);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  } else if (bar) bar.classList.add('solid');
  const menuBtn = $('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', String(bar.classList.toggle('open'))));
    $$('nav a', bar).forEach(a => a.addEventListener('click', () => { bar.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }));
  }

  /* ---------- Fade sections in ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('in'));

  /* ---------- Hero slideshow: photos cross-fade with a slow zoom ---------- */
  // The photo list comes from data-slides on the hero, e.g. data-slides="4,8,1".
  const slideHost = $('.hero[data-slides]');
  let slidesStarted = false;
  function startSlides() {
    if (!slideHost || slidesStarted || reduced.matches) return;
    slidesStarted = true;
    const first = $('.hero-slide', slideHost);
    const before = $('#opening-video', slideHost) || $('.hero-copy', slideHost);
    const slides = [first];
    slideHost.dataset.slides.split(',').slice(1).forEach(n => {
      const img = new Image();
      img.className = 'hero-slide'; img.alt = ''; img.setAttribute('aria-hidden', 'true');
      img.dataset.src = 'assets/interior-' + n.trim() + '.jpg';
      slideHost.insertBefore(img, before);
      slides.push(img);
    });
    const load = img => { if (!img.src) img.src = img.dataset.src; return img.decode ? img.decode().catch(() => {}) : Promise.resolve(); };
    let cur = 0;
    first.classList.add('zoom');
    load(slides[1]);
    setInterval(async () => {
      if (document.hidden) return;
      const prev = slides[cur], next = slides[(cur + 1) % slides.length];
      await load(next);
      next.classList.remove('zoom'); void next.offsetWidth; // restart the zoom
      next.classList.add('is-active', 'zoom');
      prev.classList.remove('is-active');
      setTimeout(() => prev.classList.remove('zoom'), 2000);
      cur = (cur + 1) % slides.length;
      load(slides[(cur + 1) % slides.length]);
    }, 6000);
  }

  /* ---------- Opening film: plays once, then fades to the photo ---------- */
  const film = $('#opening-video');
  if (!film) setTimeout(startSlides, 4000);
  if (film) {
    let done = false, timer;
    const finish = () => {
      if (done) return; done = true; clearTimeout(timer);
      film.classList.remove('is-playing'); setTimeout(() => film.pause(), 1400);
      startSlides();
    };
    if (reduced.matches) { film.removeAttribute('autoplay'); film.pause(); }
    else {
      film.muted = true;
      film.addEventListener('playing', () => { film.classList.add('is-playing'); timer = setTimeout(finish, 6000); }, { once: true });
      film.addEventListener('ended', finish, { once: true });
      film.addEventListener('error', finish, { once: true });
      film.addEventListener('timeupdate', () => { if (film.currentTime >= 5.8) finish(); });
      const p = film.play(); if (p) p.catch(finish);
    }
  }

  /* ---------- Photo viewer (all 9 interiors) ---------- */
  const box = $('#lightbox');
  if (box) {
    const img = $('#lb-img');
    let cur = 1;
    const show = n => {
      cur = (n + 8) % 9 + 1;
      img.src = 'assets/interior-' + cur + '.jpg';
      img.alt = t('photo') + ' ' + cur;
      $('#lb-count').textContent = cur + ' / 9';
    };
    $$('[data-photo]').forEach(b => b.addEventListener('click', () => { show(+b.dataset.photo); box.showModal(); }));
    $('#lb-prev').onclick = () => show(cur - 1);
    $('#lb-next').onclick = () => show(cur + 1);
    $('#lb-close').onclick = () => box.close();
    box.addEventListener('click', e => { if (e.target === box) box.close(); });
    box.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
    let sx = null;
    box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- Request form → WhatsApp ---------- */
  const form = $('#request');
  const arr = $('#arrival'), dep = $('#departure'), kids = $('#children'), ages = $('#children-ages');
  function renderAges() {
    if (!ages) return;
    const old = $$('select', ages).map(s => s.value), n = Number(kids.value);
    ages.replaceChildren(); ages.hidden = n === 0; ages.disabled = n === 0;
    const legend = document.createElement('legend'); legend.textContent = t('agestitle'); ages.append(legend);
    for (let i = 0; i < n; i++) {
      const label = document.createElement('label'), span = document.createElement('span'), sel = document.createElement('select');
      span.textContent = t('agechild') + ' ' + (i + 1);
      sel.id = 'child-age-' + i; sel.name = sel.id; sel.required = true;
      const ph = document.createElement('option'); ph.value = ''; ph.textContent = t('agechoose'); sel.append(ph);
      for (let a = 0; a < 18; a++) {
        const o = document.createElement('option'); o.value = String(a);
        o.textContent = a === 0 ? t('agebaby') : a + ' ' + (a === 1 ? t('ageyear') : t('ageyears'));
        sel.append(o);
      }
      sel.value = old[i] ?? '';
      label.append(span, sel); ages.append(label);
    }
  }
  if (form) {
    const today = new Date().toLocaleDateString('en-CA');
    $$('input[type=date]').forEach(i => { i.min = today; });
    const syncDeparture = (a, d) => {
      if (!a.value) return;
      const next = new Date(a.value + 'T12:00:00'); next.setDate(next.getDate() + 1);
      d.min = next.toLocaleDateString('en-CA');
      if (d.value && d.value <= a.value) d.value = '';
    };
    arr.addEventListener('change', () => syncDeparture(arr, dep));
    dep.addEventListener('input', () => dep.setCustomValidity(''));
    kids.addEventListener('change', renderAges);
    document.addEventListener('aura:lang', () => { renderAges(); $('#result').hidden = true; });
    addEventListener('pageshow', renderAges);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (dep.value <= arr.value) { dep.setCustomValidity(t('waerr')); dep.reportValidity(); return; }
      dep.setCustomValidity('');
      const lines = [t('wahello')];
      const apt = $('#apartment').value;
      if (apt) lines.push(t('waapt') + ': ' + apt);
      lines.push(stripTags(t('arrival')) + ': ' + arr.value, stripTags(t('departure')) + ': ' + dep.value,
        stripTags(t('adults')) + ': ' + $('#adults').value, stripTags(t('children')) + ': ' + kids.value);
      if (Number(kids.value) > 0) lines.push(t('waages') + ': ' + $$('select', ages).map(s => s.selectedOptions[0].textContent).join(', '));
      const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
      const r = $('#result'); r.replaceChildren();
      const info = document.createElement('p'); info.textContent = t('wainfo');
      const link = document.createElement('a'); link.href = url; link.rel = 'noopener'; link.className = 'btn'; link.textContent = t('waopen');
      r.append(info, link); r.hidden = false;
      location.assign(url);
    });
  }
  function stripTags(s) { const d = document.createElement('div'); d.innerHTML = s; return d.textContent.trim(); }

  // Send visitors to the form with an apartment type (and dates) already filled in.
  function goToForm(type) {
    if (!form) return;
    if (type != null) $('#apartment').value = type;
    $('#soggiorno').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
    setTimeout(() => arr.focus({ preventScroll: true }), reduced.matches ? 0 : 700);
  }
  const quick = $('#quick-book');
  if (quick && form) quick.addEventListener('submit', e => {
    e.preventDefault();
    arr.value = $('#qb-in').value; syncDep();
    dep.value = $('#qb-out').value;
    $('#adults').value = $('#qb-ad').value;
    kids.value = $('#qb-ch').value; renderAges();
    goToForm();
  });
  function syncDep() { arr.dispatchEvent(new Event('change')); }
  if (quick) {
    const qi = $('#qb-in'), qo = $('#qb-out');
    qi.addEventListener('change', () => {
      if (!qi.value) return;
      const next = new Date(qi.value + 'T12:00:00'); next.setDate(next.getDate() + 1);
      qo.min = next.toLocaleDateString('en-CA');
      if (qo.value && qo.value <= qi.value) qo.value = '';
    });
  }
  $$('[data-choose]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); goToForm(b.dataset.choose); }));

  /* ---------- Apartment viewer (apartments page) ---------- */
  const viewer = $('#viewer');
  if (viewer) {
    const TYPES = {
      1: { name: 'One-Bedroom Residence', meta: 'm1', desc: 'd1', photos: [['one-bedroom-1.jpg', 'ph1a'], ['one-bedroom-2.jpg', 'ph1b']] },
      2: { name: 'Two-Bedroom Residence with Pool View', meta: 'm2', desc: 'd2', photos: [['pool-view.svg', 'ph2a']] },
      3: { name: 'Two-Bedroom Residence with Side View', meta: 'm3', desc: 'd3', photos: [['side-bedroom-1.jpg', 'ph3a'], ['side-bedroom-2.jpg', 'ph3b']] },
    };
    const photo = $('#viewer-img'), caption = $('#viewer-caption'), switcher = $('#photo-switch');
    let type = Number(new URLSearchParams(location.search).get('type'));
    if (!TYPES[type]) type = 1;
    let shot = 0;
    function render() {
      const d = TYPES[type];
      $$('.tabs button').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.type === type)));
      $('#viewer-num').textContent = t('reslabel') + ' 0' + type;
      $('#viewer-meta').textContent = t(d.meta);
      $('#viewer-name').textContent = d.name;
      $('#viewer-desc').textContent = t(d.desc);
      $('#viewer-choose').dataset.choose = d.name;
      const [file, label] = d.photos[shot];
      if (!photo.src.endsWith('/assets/' + file)) photo.src = 'assets/' + file;
      photo.alt = d.name + ' · ' + t(label);
      caption.textContent = t(label) + ' · ' + t('illustrative');
      switcher.replaceChildren();
      switcher.hidden = d.photos.length < 2;
      d.photos.forEach(([, l], i) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = t(l);
        b.setAttribute('aria-pressed', String(i === shot));
        b.onclick = () => { shot = i; render(); };
        switcher.append(b);
      });
    }
    $$('.tabs button').forEach(b => b.addEventListener('click', () => { type = +b.dataset.type; shot = 0; render(); }));
    $('#viewer-choose').addEventListener('click', e => { e.preventDefault(); goToForm(TYPES[type].name); });
    document.addEventListener('aura:lang', render);
    render();
  }

  applyLang();
})();
