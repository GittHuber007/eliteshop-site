/* ELITEshop : fonctions communes a toutes les pages publiques (cartes, panier, commande WhatsApp,
   favoris, recherche, panneaux). Les produits viennent de assets/catalogue.js (base en direct). */
document.documentElement.classList.add('js');
const byId = id => P.find(p => p.id === id);
const bySlug = s => P.find(p => p.slug === s);
const Q = new URLSearchParams(location.search);
const colOf = p => p.color ? ', ' + p.color.toLowerCase() : '';
const tag = () => '';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store = {
  get(k, d){ try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v } catch(e){ return d } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)) } catch(e){} }
};
const pUrl = p => 'produit.html?p=' + encodeURIComponent(p.slug || p.id);
const priceHtml = p => p.oldPrice && p.oldPrice > p.price
  ? `<span class="pr"><s>${esMoney(p.oldPrice)}</s> ${esMoney(p.price)}</span>` : `<span class="pr">${esMoney(p.price)}</span>`;
/* produits epuises : liste fixe demandee par la boutique, plus tout produit a 1 MAD ou moins (prix pas encore saisi).
   Le stock de la base n'est pas utilise. */
const ES_OUT = new Set(['21c5e1ea-dfc4-41ac-a56d-173e0291f8f7', '23d552d6-f5b3-48d4-bd4b-7c96115f7bae', 'df5078ce-e0f3-4f70-ba0a-d8382bfe5a6b', '4092b7d5-e1b0-4e57-85fb-a7fa6dc0e9a5']);
const isOut = p => !!p && (ES_OUT.has(p.id) || p.price <= 1);
const HEART = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9.5C1 8 3 4.5 6.5 4.5c2 0 3.5 1 5.5 3 2-2 3.5-3 5.5-3C21 4.5 23 8 21.5 11.5 19 16.5 12 21 12 21z"/></svg>';

/* favoris */
const wish = () => store.get('es2-wish', []);
const isWish = id => wish().includes(id);
function toggleWish(id){
  const w = wish(), i = w.indexOf(id);
  i >= 0 ? w.splice(i, 1) : w.push(id); store.set('es2-wish', w);
  document.querySelectorAll(`[data-wish="${id}"]`).forEach(b => { b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0) });
  renderWishCount(); toast(i < 0 ? 'Ajouté aux favoris' : 'Retiré des favoris');
}
function renderWishCount(){
  const n = wish().filter(id => byId(id)).length;
  document.querySelectorAll('[data-wish-count]').forEach(e => { e.textContent = n; e.hidden = !n });
}

function card(p){
  const g = p.gallery, alt = g[1] ? g[1] : null, w = isWish(p.id);
  return `<div class="card rv"><a href="${pUrl(p)}">
    <div class="card__img"><img src="${esc(g[0][0])}" alt="${esc(p.name + colOf(p))}" loading="lazy" decoding="async">${alt ? `<img class="alt" src="${esc(alt[0])}" alt="" loading="lazy">` : ''}${isOut(p) ? '<span class="badge badge--out cap">Épuisé</span>' : p.oldPrice && p.oldPrice > p.price ? '<span class="badge cap">Promo</span>' : ''}</div>
    <div class="card__info"><span class="card__name">${esc(p.name)}</span><span class="card__sub">${p.color ? esc(p.color) + ' · ' : ''}${priceHtml(p)}</span></div></a>
    <button class="wbtn${w ? ' on' : ''}" data-wish="${p.id}" aria-pressed="${w}" aria-label="Ajouter ${esc(p.name)} aux favoris">${HEART}</button>
  </div>`;
}

/* petit message de confirmation */
function toast(msg){
  let t = document.querySelector('.toast');
  if (!t){ t = document.createElement('div'); t.className = 'toast cap'; t.setAttribute('role', 'status'); document.body.appendChild(t) }
  t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2400);
}

/* panier : lignes {id, size, color, qty} */
const cart = () => store.get('es2-cart', []).filter(x => byId(x.id) && !isOut(byId(x.id)));
function saveCart(c){ store.set('es2-cart', c); renderCart() }
function addToCart(id, size, color){
  if (isOut(byId(id))){ toast('Ce modèle est épuisé'); return }
  const c = cart(), it = c.find(x => x.id === id && x.size === size && (x.color || '') === (color || ''));
  if (it) it.qty++; else c.push({id, size, color: color || '', qty:1});
  saveCart(c); openPanel('cart');
}
const cartTotal = c => c.reduce((a, x) => a + byId(x.id).price * x.qty, 0);
function renderCart(){
  const c = cart(), n = c.reduce((a, x) => a + x.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach(e => { e.textContent = n; e.hidden = !n });
  const tot = document.querySelector('[data-cart-total]'); if (tot) tot.textContent = esMoney(cartTotal(c));
  const ck = document.querySelector('[data-checkout]'); if (ck) ck.disabled = !c.length;
  const b = document.querySelector('[data-cart-body]'); if (!b) return;
  b.innerHTML = c.length ? c.map((x, i) => { const p = byId(x.id); return `<div class="ci">
      <a href="${pUrl(p)}"><img src="${esc(p.gallery[0][0])}" alt=""></a>
      <div><h3>${esc(p.name)}</h3><p>${x.color ? esc(x.color) : ''}${x.size ? (x.color ? ' · ' : '') + (p.cat === 'chaussures' ? 'Pointure' : 'Taille') + ' ' + esc(x.size) : ''}</p><p>${esMoney(p.price)}</p>
      <div class="ci__row"><div class="qty"><button data-q="${i}" data-d="-1" aria-label="Retirer un">−</button><span>${x.qty}</span><button data-q="${i}" data-d="1" aria-label="Ajouter un">+</button></div>
      <button class="rm" data-rm="${i}">Retirer</button></div></div></div>` }).join('')
    : `<div class="empty"><p class="disp" style="font-size:22px;color:var(--ink);margin-bottom:14px">Panier vide</p><a class="btn-line btn-line--d" style="margin-top:20px" href="collection.html?cat=tout">Découvrir</a></div>`;
}
/* message de commande : meme format que le site actuel */
function orderMessage(c){
  const L = c.map((x, i) => { const p = byId(x.id);
    return `${i + 1}. ${p.name}\n   Réf: ${p.slug} | Couleur: ${x.color || (p.color || 'Principal')} | Taille: ${x.size || 'à préciser'}\n   Qté: ${x.qty} | Prix: ${p.price} MAD | Sous-total: ${Math.round(p.price * x.qty * 100) / 100} MAD` });
  return ['Bonjour, je souhaite commander :', '', ...L, '', `Total: ${Math.round(cartTotal(c) * 100) / 100} MAD`].join('\n');
}
const waUrl = text => `https://wa.me/${ES_WA}?text=${encodeURIComponent(text)}`;
function checkout(){ const c = cart(); if (!c.length) return; window.open(waUrl(orderMessage(c)), '_blank', 'noopener') }

/* panneaux */
let openId = null;
function openPanel(id){
  closePanel(); const el = document.getElementById(id); if (!el) return;
  el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); openId = id;
  if (id === 'cart') document.querySelector('[data-ov]').classList.add('on');
  if (id === 'fm' || id === 'search') document.body.style.overflow = 'hidden';
  if (id === 'search') setTimeout(() => document.getElementById('q').focus(), 400);
}
function closePanel(){
  const ov = document.querySelector('[data-ov]'); if (ov) ov.classList.remove('on'); document.body.style.overflow = '';
  if (!openId) return; const el = document.getElementById(openId);
  el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); openId = null;
}
document.addEventListener('click', e => {
  const w = e.target.closest('[data-wish]'); if (w){ e.preventDefault(); toggleWish(w.dataset.wish); return }
  const t = e.target.closest('[data-open],[data-close],[data-ov],[data-q],[data-rm],[data-checkout]');
  if (!t) return;
  if (t.dataset.open){ e.preventDefault(); openPanel(t.dataset.open) }
  else if (t.hasAttribute('data-close') || t.hasAttribute('data-ov')) closePanel();
  else if (t.dataset.q){ const c = cart(), i = +t.dataset.q; c[i].qty += +t.dataset.d; if (c[i].qty < 1) c.splice(i, 1); saveCart(c) }
  else if (t.dataset.rm){ const c = cart(); c.splice(+t.dataset.rm, 1); saveCart(c) }
  else if (t.hasAttribute('data-checkout')) checkout();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel() });
document.querySelectorAll('.fm__nav [data-img]').forEach(a => a.addEventListener('mouseenter', () => {
  document.querySelectorAll('.fm__r img').forEach((im, k) => im.classList.toggle('on', k === +a.dataset.img));
}));

/* recherche */
const qi = document.getElementById('q');
qi && qi.addEventListener('input', () => {
  const v = qi.value.trim().toLowerCase(), r = document.querySelector('[data-search-res]');
  r.innerHTML = v.length < 2 ? '' : P.filter(p => (p.name + ' ' + p.color + ' ' + p.type + ' ' + p.collName + ' ' + p.tags.join(' ') + ' ' + p.court).toLowerCase().includes(v)).slice(0, 12).map(card).join('')
    || '<p class="none">Aucun résultat.</p>';
  r.querySelectorAll('.rv').forEach(x => x.classList.add('in'));
});

/* lettre d'information : pas de base d'abonnes, on oriente vers WhatsApp */
const nf = document.querySelector('[data-news]');
nf && nf.addEventListener('submit', e => { e.preventDefault(); window.open(waUrl('Bonjour ELITEshop, je souhaite recevoir les nouveautés.'), '_blank', 'noopener') });

/* rails */
function initRails(){
  document.querySelectorAll('.rail').forEach(r => {
    if (r.dataset.ok) return; r.dataset.ok = 1;
    const t = r.querySelector('.rail__track'), bar = r.querySelector('.rail__bar i');
    r.querySelectorAll('[data-dir]').forEach(b => b.addEventListener('click', () => t.scrollBy({left: +b.dataset.dir * t.clientWidth * .7, behavior:'smooth'})));
    const upd = () => { if (!bar) return; const w = Math.max(.08, t.clientWidth / Math.max(1, t.scrollWidth)), m = t.scrollWidth - t.clientWidth;
      bar.style.width = (w * 100) + '%'; bar.style.transform = `translateX(${m ? (t.scrollLeft / m) * (1 / w - 1) * 100 : 0}%)` };
    t.addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
  });
}

function initReveal(){
  const els = document.querySelectorAll('.rv:not(.in)');
  if (!('IntersectionObserver' in window)){ els.forEach(e => e.classList.add('in')); return }
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target) } }), {rootMargin:'0px 0px -8% 0px'});
  els.forEach(e => io.observe(e));
}

const hd = document.getElementById('hd');
if (hd && hd.classList.contains('is-over')){ const f = () => hd.classList.toggle('is-solid', scrollY > 60); f(); addEventListener('scroll', f, {passive:true}) }

/* liste de produits dans un rail : data-list="nouveautes|pap|chaussures|vedette|coll:<id>" */
function listFor(key, n){
  const recent = (a, b) => (b.d || '').localeCompare(a.d || '') || a.order - b.order;
  let L = P.slice();
  if (key === 'pap' || key === 'chaussures') L = L.filter(p => p.cat === key);
  else if (key === 'vedette') L = L.filter(p => p.featured);
  else if (key && key.startsWith('coll:')) L = L.filter(p => p.coll === key.slice(5));
  L.sort(key === 'nouveautes' ? recent : (a, b) => a.order - b.order);
  return L.slice(0, n || 15);
}
function fillLists(){ document.querySelectorAll('[data-list]').forEach(t => { t.innerHTML = listFor(t.dataset.list, +t.dataset.n || 15).map(card).join('') }) }

function boot(){
  initRails(); renderCart(); renderWishCount(); initReveal();
  if (Q.get('menu') === '1') openPanel('fm');
  if (Q.get('tout') === '1') document.querySelectorAll('.rv').forEach(e => e.classList.add('in'));
}

/* demarrage : chaque page definit window.pageInit(), appele une fois le catalogue charge */
document.body.classList.add('loading');
CATALOG.then(() => {
  document.body.classList.remove('loading');
  if (typeof window.pageInit === 'function') window.pageInit();
  fillLists(); boot(); initRails();
}).catch(err => {
  console.error(err); document.body.classList.remove('loading');
  const m = document.querySelector('main');
  if (m) m.insertAdjacentHTML('afterbegin', '<p class="loaderr">Le catalogue est momentanément indisponible. Rechargez la page dans un instant, ou écrivez-nous sur <a class="ul" href="' + waUrl('Bonjour ELITEshop, j’ai une question sur vos produits.') + '">WhatsApp</a>.</p>');
  boot();
});
