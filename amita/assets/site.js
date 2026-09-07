(function(){
  var h=document.documentElement, k='amita-calm';
  var still=window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- the six-second loops: never autoplay in calm / reduced-motion ---- */
  var loops=[].slice.call(document.querySelectorAll('video.loop'));
  function motionOff(){ return h.classList.contains('calm') || still.matches; }
  function stop(v){
    v.autoplay=false;
    try{ v.pause(); }catch(e){}
    try{ v.currentTime=0; v.load(); }catch(e){}   /* load() restores the poster frame */
  }
  function start(v){
    v.autoplay=true;
    var p=v.play(); if(p && p.catch) p.catch(function(){});
  }
  /* only the loops near the viewport are allowed to download and run — 21 of them on the page */
  var near={}, io=null;
  if('IntersectionObserver' in window){
    io=new IntersectionObserver(function(es){
      es.forEach(function(e){
        near[e.target.dataset.loopId]=e.isIntersecting;
        if(motionOff()) return;
        if(e.isIntersecting) start(e.target); else stop(e.target);
      });
    },{rootMargin:'320px 0px'});
    loops.forEach(function(v,i){ v.dataset.loopId=i; near[i]=false; io.observe(v); });
  }
  function syncLoops(){
    var off=motionOff();
    loops.forEach(function(v,i){
      if(off) stop(v);
      else if(!io || near[v.dataset.loopId]) start(v);
    });
  }

  /* ---- calm the cartoon ---- */
  var b=document.querySelector('.calm-btn'), lbl=b.querySelector('.lbl');
  function paint(on){
    b.setAttribute('aria-pressed',on?'true':'false');
    lbl.textContent = on ? 'Bring back the chaos' : 'Calm the cartoon';
    b.setAttribute('data-short', on ? 'Chaos' : 'Calm');
  }
  try{ if(localStorage.getItem(k)==='1'){ h.classList.add('calm'); paint(true); } }catch(e){}
  syncLoops();
  if(still.addEventListener) still.addEventListener('change',syncLoops);
  b.addEventListener('click',function(){
    var on=h.classList.toggle('calm'); paint(on);
    try{localStorage.setItem(k,on?'1':'0')}catch(e){}
    syncLoops();
  });

  /* ---- click-to-enlarge lightbox (images and loops) ---- */
  var dlg=document.getElementById('lightbox'), img=document.getElementById('lb-img'),
      vid=document.getElementById('lb-vid'), cap=document.getElementById('lb-cap');
  if(dlg && typeof dlg.showModal==='function'){
    document.addEventListener('click',function(e){
      var a=e.target.closest ? e.target.closest('a.zoom') : null;
      if(!a) return;
      e.preventDefault();
      var fig=a.closest('figure'), fc=fig?fig.querySelector('figcaption'):null;
      var media=a.querySelector('img,video');
      var label=media ? (media.getAttribute('alt')||media.getAttribute('aria-label')||'') : '';
      if(fc){ var cc=fc.cloneNode(true), bd=cc.querySelector('.badge');
              if(bd && bd.parentNode) bd.parentNode.removeChild(bd);
              cap.textContent=cc.textContent.replace(/\s+/g,' ').trim(); }
      else { cap.textContent=label; }
      if(a.hasAttribute('data-video')){
        img.hidden=true; img.removeAttribute('src'); img.alt='';
        vid.hidden=false;
        vid.setAttribute('poster',a.getAttribute('data-poster')||'');
        vid.setAttribute('aria-label',label);
        vid.src=a.getAttribute('href');
        vid.load();
        if(!motionOff()){ var p=vid.play(); if(p&&p.catch) p.catch(function(){}); }
      }else{
        try{ vid.pause(); }catch(err){}
        vid.hidden=true; vid.removeAttribute('src');
        img.hidden=false; img.src=a.getAttribute('href'); img.alt=label;
      }
      dlg.showModal();
    });
    dlg.querySelector('.lb-close').addEventListener('click',function(){dlg.close()});
    dlg.addEventListener('click',function(e){ if(e.target===dlg) dlg.close(); });
    dlg.addEventListener('close',function(){
      img.removeAttribute('src');
      try{ vid.pause(); }catch(err){}
      vid.removeAttribute('src');
    });
  }

  /* ---- the cat's eyes follow the cursor (fine pointers only) ---- */
  var cat=document.querySelector('.hero-cat');
  var fine=window.matchMedia('(any-hover:hover) and (pointer:fine)');
  if(cat && fine.matches && !still.matches){
    var raf=0, mx=0, my=0;
    window.addEventListener('mousemove',function(e){
      mx=e.clientX; my=e.clientY;
      if(raf) return;
      raf=requestAnimationFrame(function(){
        raf=0;
        if(h.classList.contains('calm')){cat.style.setProperty('--px','0px');cat.style.setProperty('--py','0px');return}
        var r=cat.getBoundingClientRect();
        if(r.bottom<0||r.top>window.innerHeight) return;
        var cx=r.left+r.width*0.5, cy=r.top+r.height*0.46;
        var dx=mx-cx, dy=my-cy, d=Math.sqrt(dx*dx+dy*dy)||1, m=Math.min(1,d/260);
        cat.style.setProperty('--px',(dx/d*6*m).toFixed(2)+'px');
        cat.style.setProperty('--py',(dy/d*6*m).toFixed(2)+'px');
      });
    },{passive:true});
  }
})();
