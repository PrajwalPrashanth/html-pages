/* Editorial: one headline entrance and viewport-aware media loops. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var videos = Array.from(document.querySelectorAll('video'));
  var visible = new Set();

  // The preview lives one level deeper than the deployed editorial route.
  var switcher = document.querySelector('.switcher');
  if (/\/versions\/editorial\/(?:index\.html)?$/.test(location.pathname)) {
    switcher.setAttribute('href', switcher.getAttribute('data-local-href'));
  }

  function updateVideo(video) {
    if (reduced.matches || document.hidden || !visible.has(video)) {
      video.pause();
      if (reduced.matches) video.removeAttribute('autoplay');
      return;
    }
    var play = video.play();
    if (play && play.catch) play.catch(function () {});
  }

  function updateMotion() {
    if (reduced.matches) document.body.classList.remove('ready');
    videos.forEach(updateVideo);
  }

  if (!reduced.matches) {
    requestAnimationFrame(function () { document.body.classList.add('ready'); });
  }

  // Set the accessible static state before observing: changing the preference
  // while scrolling must never restart a reduced-motion video.
  videos.forEach(function (video) { video.pause(); });
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
        updateVideo(entry.target);
      });
    }, { threshold: 0.15 });
    videos.forEach(function (video) { observer.observe(video); });
  }
  reduced.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
})();
