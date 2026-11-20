/* ELITEshop : catalogue en direct depuis la base Supabase de la boutique (lecture publique).
   La cle ci-dessous est la cle publique (anon), la meme que celle du site actuel ; elle ne donne
   acces qu'aux produits publies. Aucune cle secrete ici. */
const ES_URL = 'https://hbeblgibghwbllngmrjp.supabase.co';
const ES_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZWJsZ2liZ2h3YmxsbmdtcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NjU3MTIsImV4cCI6MjA4ODA0MTcxMn0.sa4lGGMvWgoJpLwIPQp4HOFWUJQEhab5iieES16_PkM';
const ES_WA = '212766963826';
const ES_SHOP = {phone:'+212 7 66 96 38 26', address:'1 rue Ain Al Aouda, Casablanca', hours:'Lun – Sam · 10h – 19h'};

let P = [], COLLS = [], THEME = null;

const esMoney = n => (Math.round(n * 100) / 100).toLocaleString('fr-FR', {maximumFractionDigits:2}).replace(/ | /g, ' ') + ' MAD';
const esCents = v => v == null || isNaN(v) ? 0 : Math.round(v) / 100;
const ES_SIZE_ORDER = ['XXS','XS','S','M','L','XL','XXL','Unique'];
const esSizeSort = a => [...new Set(a)].sort((x, y) => { const r = s => { const i = ES_SIZE_ORDER.indexOf(s); if (i >= 0) return i; const n = parseInt(s, 10); return isNaN(n) ? 500 + s.charCodeAt(0) : 100 + n }; return r(x) - r(y) });
const ES_TYPES = [
  ['Mocassins', /mocassin|loafer/i], ['Bottines', /bottine|boot/i], ['Baskets', /basket|sneaker/i],
  ['Escarpins', /escarpin/i], ['Sandales', /sandale|mule/i], ['Ballerines', /ballerine/i],
  ['Abayas', /abaya|kimono|caftan|kaftan/i], ['Ensembles', /ensemble|co-ord|tailleur/i], ['Robes', /\brobe/i],
  ['Vestes', /veste|blazer|blouson|manteau|trench|bomber|gilet/i], ['Jeans', /jean/i], ['Chemises', /chemise/i],
  ['Blouses', /blouse/i], ['Pantalons', /pantalon|jogging/i], ['Jupes', /jupe/i], ['Tops', /\btop\b|pull|t-shirt|tee|cardigan|maille|débardeur/i]
];
const ES_SHOE_T = ['Mocassins','Bottines','Baskets','Escarpins','Sandales','Ballerines'];
const ES_COLORS = [['noir',/noir/i,'#141414'],['brun',/brun|chocolat|marron|cognac/i,'#5a3a26'],['bordeaux',/bordeaux|prune/i,'#5c1a24'],['taupe',/taupe|grège|greige/i,'#8a7d70'],['camel',/camel|caramel|fauve/i,'#b0824f'],['marine',/marine|navy/i,'#1f2a44'],['beige',/beige|sable|crème|ivoire|écru/i,'#d9cbb2'],['blanc',/blanc/i,'#f2f0ec'],['rose',/rose/i,'#d8a1a8'],['vert',/vert|émeraude|olive|kaki/i,'#2f5d4a'],['bleu',/bleu/i,'#3a5a8c'],['gris',/gris/i,'#8c8c8c'],['rouge',/rouge/i,'#a3262a'],['violet',/violet|lilas|mauve/i,'#6b4a7f'],['doré',/doré|or\b|bronze|cuivre/i,'#b8954f']];

function esMap(r, vars, colls){
  const shoe = r.category === 'CHAUSSURES_FEMME' || r.category === 'CHAUSSURES_HOMME' || r.collection_slug === 'chaussures';
  const imgs = (Array.isArray(r.images) ? r.images : []).map(x => typeof x === 'string' ? x : x && x.url).filter(Boolean);
  const v = (vars || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const colors = []; const seen = new Set();
  v.forEach(x => { const k = (x.color_key || '') + '|' + (x.hex || ''); if (!seen.has(k)){ seen.add(k); colors.push({key:x.color_key, name:x.color_name_fr, hex:x.hex}) } });
  const sizes = esSizeSort(v.flatMap(x => { const s = String(x.size || '').trim(), k = s.split(/\s+/); return k.every(w => /^(XXS|XS|S|M|L|XL|XXL|\d{2})$/i.test(w)) ? k : [s] }).filter(Boolean));
  const realColor = colors.filter(c => c.name && !/^principal$/i.test(c.name));
  const colorName = realColor.map(c => c.name).join(', ');
  const ck = (ES_COLORS.find(c => c[1].test(colorName)) || [''])[0];
  const text = r.name + ' ' + (r.tags || []).join(' ');
  const cand = ES_TYPES.filter(x => shoe === ES_SHOE_T.includes(x[0]));
  const type = (cand.find(x => x[1].test(text)) || [shoe ? 'Chaussures' : 'Autres'])[0];
  const coll = colls.find(c => c.id === r.collection_slug);
  return {
    id: r.id, slug: r.slug, name: r.name, cat: shoe ? 'chaussures' : 'pap', type, coll: r.collection_slug || '', collName: coll ? coll.name_fr : '',
    color: colorName, ck, hex: ck ? ES_COLORS.find(c => c[0] === ck)[2] : '', mat: '',
    gallery: (imgs.length ? imgs : ['assets/img/fournie-produit-14.jpg']).map(u => [u, 'photo']),
    court: (r.short_desc || '').trim(), long: (r.long_desc || r.short_desc || '').trim(), matieres: '', entretien: '',
    sizes, colors, lines: v.map(x => ({colorKey:x.color_key, colorName:x.color_name_fr, hex:x.hex, size:x.size, stock:x.stock_quantity || 0})),
    price: esCents(r.price), oldPrice: r.compare_at_price != null ? esCents(r.compare_at_price) : null,
    rating: r.rating != null ? Number(r.rating) : 4.5, reviews: r.review_count || 0,
    featured: !!r.featured, order: r.sort_order || 0, d: r.created_at || '', stock: r.stock_quantity || 0, tags: (r.tags || []).map(t => String(t).toLowerCase())
  };
}

async function esGet(path){
  const res = await fetch(ES_URL + '/rest/v1/' + path, {headers:{apikey:ES_KEY, Authorization:'Bearer ' + ES_KEY}});
  if (!res.ok) throw new Error('Base indisponible (' + res.status + ')');
  return res.json();
}

const CATALOG = (async () => {
  const CK = 'es-cat-v2';
  try { const c = JSON.parse(sessionStorage.getItem(CK)); if (c && Date.now() - c.t < 120000){ P = c.P; COLLS = c.C; THEME = c.T; return } } catch(e){}
  const [prods, colls, theme] = await Promise.all([
    esGet('products?select=*&published=eq.true&order=sort_order.asc'),
    esGet('elite_collections?select=*&order=sort_order.asc').catch(() => []),
    esGet('site_theme?select=*&id=eq.1').catch(() => [])
  ]);
  let vars = [];
  if (prods.length){
    const ids = prods.map(p => p.id);
    for (let i = 0; i < ids.length; i += 60) vars = vars.concat(await esGet('product_variants?select=*&product_id=in.(' + ids.slice(i, i + 60).join(',') + ')&order=sort_order.asc'));
  }
  const byP = {}; vars.forEach(v => (byP[v.product_id] = byP[v.product_id] || []).push(v));
  COLLS = colls; THEME = theme[0] || null;
  P = prods.map(r => esMap(r, byP[r.id], colls));
  try { sessionStorage.setItem(CK, JSON.stringify({t:Date.now(), P, C:COLLS, T:THEME})) } catch(e){}
})();
