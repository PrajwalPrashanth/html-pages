/* Diner shelf navigation and the four motions specified in the brief. */
(function () {
  'use strict';
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var paused = false;
  var row = document.getElementById('canrow');
  var cans = Array.from(row.children);
  var dots = Array.from(document.querySelectorAll('[data-episode]'));
  var val = document.getElementById('qtyVal');
  var previous = [document.getElementById('qtyDown'), document.getElementById('canPrev')];
  var next = [document.getElementById('qtyUp'), document.getElementById('canNext')];
  var active = 0;

  function position(i) {
    return cans[i].offsetLeft - cans[0].offsetLeft;
  }
  function paint() {
    val.textContent = String(active + 1);
    previous.forEach(function (button) { button.disabled = active === 0; });
    next.forEach(function (button) { button.disabled = active === cans.length - 1; });
    dots.forEach(function (dot, i) { dot.setAttribute('aria-current', String(i === active)); });
  }
  function go(i) {
    active = Math.max(0, Math.min(cans.length - 1, i));
    row.scrollTo({ left: position(active), behavior: 'auto' });
    paint();
  }
  previous.forEach(function (button) { button.addEventListener('click', function () { go(active - 1); }); });
  next.forEach(function (button) { button.addEventListener('click', function () { go(active + 1); }); });
  dots.forEach(function (dot, i) { dot.addEventListener('click', function () { go(i); }); });
  function sync() {
    var end = row.scrollWidth - row.clientWidth;
    if (end > 0 && row.scrollLeft >= end - 2) active = cans.length - 1;
    else active = cans.reduce(function (best, can, i) {
      return Math.abs(position(i) - row.scrollLeft) < Math.abs(position(best) - row.scrollLeft) ? i : best;
    }, 0);
    paint();
  }
  row.addEventListener('scroll', sync, { passive: true });
  row.addEventListener('keydown', function (event) {
    if (event.target !== row) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  // Tabbing to an episode keeps its whole card in the shelf viewport.
  cans.forEach(function (can, i) {
    can.querySelector('a').addEventListener('focus', function () { go(i); });
  });
  window.addEventListener('resize', function () { go(active); });
  paint();

  document.getElementById('cartPill').addEventListener('click', function () {
    location.hash = 'contact';
  });

  var video = document.querySelector('video');
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'motion-control';
  toggle.textContent = 'Pause motion';
  toggle.setAttribute('aria-pressed', 'false');
  document.querySelector('.tablet__screen').appendChild(toggle);
  function syncMotion() {
    var stop = motion.matches || paused;
    document.body.classList.toggle('motion-paused', stop);
    toggle.textContent = paused ? 'Resume motion' : 'Pause motion';
    toggle.setAttribute('aria-pressed', String(paused));
    if (stop) {
      video.pause();
      video.removeAttribute('autoplay');
      if (motion.matches) {
        video.removeAttribute('loop');
        video.load();
      }
    } else {
      video.loop = true;
      video.play().catch(function () {});
    }
  }
  toggle.addEventListener('click', function () { paused = !paused; syncMotion(); });
  motion.addEventListener('change', syncMotion);
  syncMotion();

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (!motion.matches) entry.target.classList.add('spun');
        observer.unobserve(entry.target);
      });
    }, { threshold: .5 });
    document.querySelectorAll('[data-spin]').forEach(function (badge) { observer.observe(badge); });
  }
  // The development route is nested one level deeper than the published route.
  if (/\/versions\/diner\/(?:index\.html)?$/.test(location.pathname)) {
    document.querySelector('.verpill').setAttribute('href', '../');
  }
})();
