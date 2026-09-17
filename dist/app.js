const story=document.querySelector('.story'), hero=document.querySelector('.hero-image'), copy=document.querySelector('.hero-copy'), chapter=document.querySelector('.chapter-copy'), progress=document.querySelector('.progress-track span');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let queued=false;
function paint(){
  queued=false;
  const p=reduced.matches?0:Math.max(0,Math.min(1,-story.getBoundingClientRect().top/(story.offsetHeight-innerHeight)));
  const openingOpacity=1-Math.min(1,p*2.7);
  const chapterOpacity=Math.max(0,Math.min(1,(p-.4)*3));
  hero.style.transform=`scale(${1+p*.18})`;
  copy.style.opacity=openingOpacity;
  copy.style.visibility=openingOpacity>0?'visible':'hidden';
  copy.inert=openingOpacity===0;
  copy.style.transform=`translateY(${-p*65}px)`;
  chapter.style.opacity=chapterOpacity;
  chapter.style.visibility=chapterOpacity>0?'visible':'hidden';
  progress.style.width=`${p*100}%`;
  document.querySelector('.chapter-number').textContent=p<.35?'01 / 03':p<.65?'02 / 03':'03 / 03';
}
function schedule(){if(!queued){queued=true;requestAnimationFrame(paint)}}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);paint();
const header=document.querySelector('.header'), menu=document.querySelector('.menu-toggle'), nav=document.querySelector('nav');
function headerState(){header.classList.toggle('scrolled',scrollY>80)}addEventListener('scroll',headerState,{passive:true});headerState();
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';menu.setAttribute('aria-label',open?'Close menu':'Open menu')});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu'}));
const enquiry='https://wa.me/393334658601?text='+encodeURIComponent('Hello Maison Aura, I would like to enquire about a stay. My dates are: __. Number of guests: __.');document.querySelectorAll('[data-reserve]').forEach(a=>a.href=enquiry);
if(!reduced.matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('pending');observer.observe(el)})}
const dialog=document.querySelector('.lightbox'), items=[...document.querySelectorAll('[data-gallery]')];let current=0;function showPhoto(i){current=(i+items.length)%items.length;const source=items[current].querySelector('img');dialog.querySelector('img').src=items[current].href;dialog.querySelector('img').alt=source.alt;dialog.querySelector('figcaption').textContent=`${current+1} / ${items.length} — ${source.alt}`;}
items.forEach((a,i)=>a.addEventListener('click',e=>{e.preventDefault();showPhoto(i);dialog.showModal();document.body.style.overflow='hidden'}));document.querySelector('.close-gallery').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.style.overflow='');document.querySelector('.gallery-prev').addEventListener('click',()=>showPhoto(current-1));document.querySelector('.gallery-next').addEventListener('click',()=>showPhoto(current+1));dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(current-1)}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(current+1)}});

reduced.addEventListener('change',()=>{copy.inert=false;paint()});
