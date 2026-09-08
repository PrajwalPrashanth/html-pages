/* Section tabs and reduced-motion media. */
(function () {
  'use strict';
  var tabs = Array.from(document.querySelectorAll('.tabs a'));
  var sections = tabs.map(function (tab) {
    return document.querySelector(tab.getAttribute('href'));
  }).filter(Boolean);

  function updateTabs() {
    var active = null;
    var readingLine = window.innerHeight * 0.35;
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= readingLine) active = section.id;
    });
    tabs.forEach(function (tab) {
      if (tab.getAttribute('href') === '#' + active) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
  }
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(updateTabs, {
      rootMargin: '0px 0px -65% 0px', threshold: 0
    });
    sections.forEach(function (section) { observer.observe(section); });
  }
  // Large work spreads can span many viewports; keep the current tab accurate
  // on direct anchor jumps, resize, and reverse scrolling between dividers.
  window.addEventListener('scroll', updateTabs, { passive: true });
  window.addEventListener('resize', updateTabs);
  window.addEventListener('hashchange', updateTabs);
  updateTabs();

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var videos = Array.from(document.querySelectorAll('video'));
  function updateMotion() {
    videos.forEach(function (video) {
      if (motion.matches) {
        video.autoplay = false;
        video.removeAttribute('autoplay');
        video.pause();
      } else {
        video.autoplay = true;
        var playing = video.play();
        if (playing) playing.catch(function () {});
      }
    });
  }
  motion.addEventListener('change', updateMotion);
  updateMotion();

  // Published versions are siblings of /versions/; local source versions
  // are nested inside it. Keep the specified deployment href in the HTML.
  var switcher = document.querySelector('.switcher');
  if (/\/versions\/scrapbook\/(?:index\.html)?$/.test(window.location.pathname)) {
    switcher.setAttribute('href', '../');
  }
}());
