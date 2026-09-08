/* Collage: cut-outs settle, tape fades, squiggles draw.
   Videos play in view and stop whenever reduced motion is requested. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  root.classList.replace('no-js', 'js');

  document.addEventListener('DOMContentLoaded', function () {
    // Local previews have an extra /versions/ directory; deployment does not.
    var switcher = document.querySelector('.switcher');
    if (/\/versions\/collage\/(?:index\.html)?$/.test(window.location.pathname)) {
      switcher.setAttribute('href', '../');
    }

    var pages = Array.from(document.querySelectorAll('[data-in]'));
    var cuts = Array.from(document.querySelectorAll('.cut'));
    cuts.forEach(function (cut, index) {
      cut.style.setProperty('--kick', (index % 2 ? 6 : -6) + 'deg');
    });
    pages.forEach(function (page) {
      page.querySelectorAll('.cut, .tape').forEach(function (el, index) {
        el.style.setProperty('--i', Math.min(index, 8));
      });
    });
    document.querySelectorAll('.scribble path').forEach(function (path) {
      path.style.setProperty('--len', Math.ceil(path.getTotalLength()) + 4);
    });

    var observer;
    function finishEntrance() {
      pages.forEach(function (page) { page.classList.add('is-in'); });
      if (observer) observer.disconnect();
    }
    if (reduced.matches || !('IntersectionObserver' in window)) {
      finishEntrance();
    } else {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
      pages.forEach(function (page) { observer.observe(page); });
    }

    var videos = Array.from(document.querySelectorAll('video'));
    var visible = new Set();
    function updateVideos() {
      videos.forEach(function (video) {
        if (reduced.matches || document.hidden || !visible.has(video)) {
          video.pause();
        } else {
          var play = video.play();
          if (play && play.catch) play.catch(function () {});
        }
      });
    }
    videos.forEach(function (video) {
      video.removeAttribute('autoplay');
      video.pause();
    });
    if ('IntersectionObserver' in window) {
      var videoObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        updateVideos();
      }, { threshold: 0.15 });
      videos.forEach(function (video) { videoObserver.observe(video); });
    }
    function motionChanged() {
      if (reduced.matches) finishEntrance();
      updateVideos();
    }
    if (reduced.addEventListener) reduced.addEventListener('change', motionChanged);
    else reduced.addListener(motionChanged);
    document.addEventListener('visibilitychange', updateVideos);
  });
})();
