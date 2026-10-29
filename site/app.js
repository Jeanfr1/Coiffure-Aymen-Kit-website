/* AYMEN · Modèle 3. Plans HTML/SVG/CSS, sans vidéo ni bibliothèque externe. */
(() => {
  'use strict';
  if (!window.AYMEN) return;
  const root=document.documentElement;
  root.classList.add('has-js');
  const hero=document.getElementById('accueil');
  const stage=hero.querySelector('.hero-stage');
  const header=document.getElementById('hero-header');
  const copy=document.getElementById('hero-copy');
  const slits=[...hero.querySelectorAll('[data-comb]')];
  const photos=[...document.querySelectorAll('[data-parallax]')];
  const toggle=document.getElementById('motion-toggle');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFine=window.matchMedia('(hover: hover) and (pointer: fine)');
  let paused=false,enabled=false,frame=0,pointer=0,introTimer;
  try { paused=localStorage.getItem('aymen.motion.paused')==='1'; } catch (_) { /* Facultatif. */ }
  const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
  const smooth=(a,b,n)=>{const p=clamp((n-a)/(b-a));return p*p*(3-2*p);};
  function accessible(element,visible) {
    element.inert=!visible;
    if(visible)element.removeAttribute('aria-hidden');else element.setAttribute('aria-hidden','true');
  }
  function draw() {
    frame=0;
    if(!enabled||document.hidden)return;
    const box=hero.getBoundingClientRect();
    const p=clamp(-box.top/Math.max(1,hero.offsetHeight-stage.offsetHeight));
    const out=smooth(.3,.92,p);
    const opacity=1-smooth(.18,.57,p);
    stage.style.setProperty('--copy-opacity',opacity.toFixed(4));
    stage.style.setProperty('--copy-y',`${(-p*25).toFixed(2)}px`);
    stage.style.setProperty('--chair-x',`${(-p*Math.min(window.innerWidth*.045,74)).toFixed(2)}px`);
    stage.style.setProperty('--chair-y',`${(-p*12).toFixed(2)}px`);
    stage.style.setProperty('--chair-scale',(1+p*.025).toFixed(5));
    stage.style.setProperty('--chair-opacity',(1-out).toFixed(4));
    stage.style.setProperty('--signature-x',`${(p*window.innerWidth*.035).toFixed(2)}px`);
    stage.style.setProperty('--signature-opacity',(1-smooth(.18,.72,p)).toFixed(4));
    stage.style.setProperty('--pointer-x',`${pointer.toFixed(2)}px`);
    slits.forEach((slit,index)=>slit.setAttribute('height',smooth(.34+index*.055,.78+index*.055,p).toFixed(5)));
    accessible(header,opacity>.15);accessible(copy,opacity>.15);
    if(p>.02)root.classList.remove('intro-ready');
    const view=window.innerHeight;
    const multiplier=window.innerWidth<=760?10:18;
    const moves=photos.map(photo=>{
      const rect=photo.getBoundingClientRect();
      const active=rect.bottom>-80&&rect.top<view+80;
      const ratio=clamp((view*.5-rect.top-rect.height*.5)/view,-.8,.8);
      return [photo,active?ratio*multiplier:0];
    });
    moves.forEach(([photo,y])=>photo.style.setProperty('--photo-y',`${y.toFixed(2)}px`));
  }
  function schedule(){if(enabled&&!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
  function setMotion(){
    const systemOff=reduce.matches||!!navigator.connection?.saveData;
    enabled=!paused&&!systemOff;
    root.classList.toggle('motion-on',enabled);root.classList.toggle('motion-off',!enabled);
    toggle.disabled=systemOff;
    toggle.setAttribute('aria-pressed',String(!enabled));
    toggle.setAttribute('aria-label',systemOff?'Animations désactivées selon vos préférences':enabled?'Mettre en pause les animations':'Reprendre les animations');
    toggle.querySelector('span').textContent=enabled?'Ⅱ':'▷';
    if(enabled)schedule();else{
      if(frame)cancelAnimationFrame(frame);frame=0;clearTimeout(introTimer);root.classList.remove('intro-ready');
      stage.removeAttribute('style');slits.forEach(slit=>slit.setAttribute('height','0'));
      photos.forEach(photo=>photo.style.removeProperty('--photo-y'));accessible(header,true);accessible(copy,true);
    }
  }
  toggle.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('aymen.motion.paused',paused?'1':'0');}catch(_){}setMotion();});
  if(reduce.addEventListener)reduce.addEventListener('change',setMotion);else reduce.addListener(setMotion);
  navigator.connection?.addEventListener?.('change',setMotion);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',()=>{pointer=0;schedule();},{passive:true});
  document.addEventListener('visibilitychange',schedule);
  stage.addEventListener('pointermove',event=>{if(enabled&&pointerFine.matches){pointer=clamp(event.clientX/Math.max(1,window.innerWidth)-.5,-.5,.5)*8;schedule();}},{passive:true});
  stage.addEventListener('pointerleave',()=>{pointer=0;schedule();});
  setMotion();
  const chair=hero.querySelector('.hero-chair img');
  Promise.all([document.fonts?.ready||Promise.resolve(),chair.decode?chair.decode().catch(()=>{}):Promise.resolve()]).then(()=>{
    if(enabled&&window.scrollY<24){root.classList.add('intro-ready');introTimer=setTimeout(()=>root.classList.remove('intro-ready'),1350);}schedule();
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12,rootMargin:'0px 0px -20px 0px'});
    document.querySelectorAll('.reveal').forEach(item=>{item.classList.add('will-reveal');observer.observe(item);});
  }
  document.querySelectorAll('.mobile-nav a').forEach(link=>link.addEventListener('click',()=>link.closest('details').removeAttribute('open')));

  const dialog=document.getElementById('service-dialog');
  const tabs=[...dialog.querySelectorAll('[data-tab]')];
  let opener=null;
  function choose(key,focus=false){
    const service=window.AYMEN.services[key];if(!service)return;
    document.getElementById('service-dialog-title').textContent=service.title;
    document.getElementById('service-description').textContent=service.description;
    tabs.forEach(tab=>{const selected=tab.dataset.tab===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;if(selected&&focus)tab.focus();});
    document.getElementById('service-panel').setAttribute('aria-labelledby',`tab-${key}`);
  }
  document.querySelectorAll('[data-service]').forEach(link=>link.addEventListener('click',event=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0||typeof dialog.showModal!=='function')return;
    event.preventDefault();opener=link;choose(link.dataset.service);if(!dialog.open)dialog.showModal();document.getElementById('service-close').focus();
  }));
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>choose(tab.dataset.tab,true));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
      if(next!==undefined){event.preventDefault();choose(tabs[next].dataset.tab,true);}
    });
  });
  document.getElementById('service-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close();});
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});});
  choose('homme');
})();
