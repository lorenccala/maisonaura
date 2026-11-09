// Language comes from the link (#it, #en, #sq) or the visitor's earlier choice on the site.
function showLanguage(){
  let stored=null;try{stored=localStorage.getItem('aura-lang')}catch{}
  const requested=location.hash.slice(1)||stored;
  const lang=['it','en','sq'].includes(requested)?requested:'it';
  try{localStorage.setItem('aura-lang',lang)}catch{}
  const page=document.getElementById(lang);
  document.documentElement.lang=lang;
  document.title=page.querySelector('h1').textContent+' | Maison Aura';
  document.querySelectorAll('article').forEach(a=>a.hidden=a!==page);
  document.querySelectorAll('.lang a').forEach(a=>{if(a.hash==='#'+lang)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
}
addEventListener('hashchange',showLanguage);showLanguage();
