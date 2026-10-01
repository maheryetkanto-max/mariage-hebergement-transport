import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const SUPABASE_URL = 'https://jcioqgwrgtwryysqxkmp.supabase.co'
const SUPABASE_KEY = 'sb_publishable_yLg60Ip0nX-WUxj8fCMBQg_v_7-tIsy'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const state = {
  accommodations: [], vehicles: [], people: [], links: [], departments: {},
  route: 'home', loading: true,
  housingFilters: { city:'', arrival:'', departure:'', people:1, children:false, pets:false },
  transportFilters: { destination:'all', date:'', returnOnly:false, department:'all', people:1, owner:'all', pets:false },
}

const app = document.querySelector('#app')
const modalRoot = document.querySelector('#modalRoot')
const toastEl = document.querySelector('#toast')
const musicBtn = document.querySelector('#musicBtn')
const musicHost = document.querySelector('#musicHost')
let musicPlaying = false

function toast(message){
  toastEl.textContent = message
  toastEl.classList.add('show')
  clearTimeout(toastEl._t)
  toastEl._t = setTimeout(()=>toastEl.classList.remove('show'), 2600)
}
function esc(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function num(value){return Number(value ?? 0) || 0}
function money(value){return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(num(value))+' €'}
function dateFr(value){if(!value)return ''; const d=new Date(value+'T12:00:00'); return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}
function normalize(v=''){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function firstName(v=''){return v.trim().split(/\s+/)[0] || v}
function ownerName(v){
  const main=firstName(v.conducteur||'')
  if(v.genre_conducteur!=='homme_et_femme'||!v.compagnons_prenoms)return main
  const other=v.compagnons_prenoms.split(',')[0].replace(/\s*\([^)]*\)\s*$/,'').trim()
  return other?`${main} & ${firstName(other)}`:main
}
function phoneDigits(phone=''){
  let d=phone.replace(/\D/g,'')
  if(d.startsWith('00'))d=d.slice(2)
  if(d.startsWith('0'))d='33'+d.slice(1)
  return d
}
function contactButtons(phone, message){
  if(!phone)return ''
  const p=phone.replace(/\s/g,'')
  const wa=`https://wa.me/${phoneDigits(phone)}?text=${encodeURIComponent(message)}`
  return `<div class="actions">
    <a class="contact wa" target="_blank" rel="noopener" href="${wa}">WhatsApp</a>
    <a class="contact" href="tel:${esc(p)}">Appeler</a>
    <a class="contact" href="sms:${esc(p)}">Envoyer un message</a>
  </div>`
}
function availability(places){
  places=num(places)
  if(places<=0)return '<span class="badge no"><span class="dot"></span>Victime de son succès ✨</span>'
  const text=places===1?'Disponible · 1 place restante':`Disponible · ${places} places`
  return `<span class="badge ok"><span class="dot pulse"></span>${text}</span>`
}
function extractUrl(text=''){const m=String(text||'').match(/https?:\/\/[^\s]+/);return m?m[0]:null}
function cleanComment(text=''){return String(text||'').replace(/(?:Lien\s*:\s*)?https?:\/\/[^\s]+/g,'').trim()}
function getPeople(type,id,leg){return state.people.find(g=>g.type===type&&g.id===id&&(leg?g.leg===leg:true))?.people||[]}
function interestList(p){return Array.isArray(p.interests)?p.interests:[]}
function peopleHtml(title, people, seen=new Set()){
  if(!people.length)return `<div class="people-box"><h4>${title}</h4><div class="small">Personne pour le moment.</div></div>`
  return `<div class="people-box"><h4>${title}</h4>${people.map(p=>{
    const key=normalize(p.name||''); const duplicate=seen.has(key); if(key)seen.add(key)
    const ints=duplicate?[]:interestList(p)
    return `<div class="person"><b>${esc(p.name||'Invité')}</b>${p.origin?` · ${esc(p.origin)}`:''}${ints.length?`<em>${ints.map(esc).join(' · ')}</em>`:''}</div>`
  }).join('')}</div>`
}

const fallbackDept={'paris':'75','boulogne-billancourt':'92','clamart':'92','versailles':'78','morsang-sur-orge':'91','creteil':'94','créteil':'94','palaiseau':'91','massy':'91','antony':'92','nanterre':'92','saint-denis':'93','montreuil':'93','evry-courcouronnes':'91','évry-courcouronnes':'91','melun':'77','cergy':'95'}
async function hydrateDepartments(){
  const cities=[...new Set(state.vehicles.flatMap(v=>[v.ville_depart,v.retour_ville_arrivee]).filter(Boolean))]
  await Promise.all(cities.map(async city=>{
    const key=normalize(city)
    if(state.departments[key])return
    if(fallbackDept[key]){state.departments[key]=fallbackDept[key];return}
    try{
      const r=await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(city)}&fields=nom,codeDepartement&boost=population&limit=5`)
      const arr=await r.json()
      const exact=arr.find(x=>normalize(x.nom)===key)||arr[0]
      if(exact?.codeDepartement && ['75','77','78','91','92','93','94','95'].includes(exact.codeDepartement)) state.departments[key]=exact.codeDepartement
    }catch{}
  }))
}
function cityDept(city){if(!city)return 'À préciser';const d=state.departments[normalize(city)]||fallbackDept[normalize(city)];return d?`${city} (${d})`:city}

async function loadCitiesAroundTroyes(){
  const list=document.querySelector('#troyesCities'); if(!list)return
  const cached=sessionStorage.getItem('mk_troyes_cities')
  if(cached){try{fillCityList(JSON.parse(cached));return}catch{}}
  const deps=['10','51','52','89','21','77','55']
  try{
    const groups=await Promise.all(deps.map(async dep=>{const r=await fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${dep}&fields=nom,code,centre&format=json`);return r.json()}))
    const t={lat:48.2973,lon:4.0744};const rad=x=>x*Math.PI/180
    const km=(lat,lon)=>{const a=rad(lat-t.lat),b=rad(lon-t.lon);const h=Math.sin(a/2)**2+Math.cos(rad(t.lat))*Math.cos(rad(lat))*Math.sin(b/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
    const cities=groups.flat().filter(c=>c.centre?.coordinates&&km(c.centre.coordinates[1],c.centre.coordinates[0])<=155).map(c=>c.nom).sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'}))
    sessionStorage.setItem('mk_troyes_cities',JSON.stringify(cities));fillCityList(cities)
  }catch{fillCityList(['Barberey-Saint-Sulpice','Saint-Benoît-sur-Seine','Troyes'])}
}
function fillCityList(cities){const list=document.querySelector('#troyesCities');if(list)list.innerHTML=cities.map(c=>`<option value="${esc(c)}"></option>`).join('')}

async function loadData(){
  state.loading=true; render()
  const accCols='id,nom,type,ville_logement,capacite,commentaires,propose_par,genre_proposant,telephone_proposant,compagnons_prenoms,centres_interet,places_disponibles,minutes_salle,date_entree,date_sortie,prix_personne_nuit,prix_mode,nuits_minimum,enfants_acceptes,animaux_acceptes,actif,source,reservation_active,external_url,created_at'
  const vehCols='id,conducteur,telephone,compagnons_prenoms,centres_interet,heure_depart,places,commentaires,genre_conducteur,type_trajet,ville_depart,destination,date_depart,date_retour,heure_retour,retour_lieu_depart,retour_ville_arrivee,places_disponibles,places_retour_disponibles,gratuit,participation,animaux_acceptes,actif,source,reservation_active,external_url,created_at'
  try{
    const [a,v,p,l]=await Promise.all([
      supabase.from('accommodations').select(accCols).eq('actif',true).order('created_at'),
      supabase.from('vehicles').select(vehCols).eq('actif',true).order('created_at'),
      supabase.rpc('public_offer_people'),
      supabase.rpc('public_offer_links')
    ])
    if(a.error)throw a.error;if(v.error)throw v.error
    state.accommodations=a.data||[];state.vehicles=v.data||[]
    const pd=p.data||[]
    state.people=Array.isArray(pd)&&pd.length===1&&pd[0]?.public_offer_people?pd[0].public_offer_people:pd
    state.links=Array.isArray(l.data)?l.data:[]
    await hydrateDepartments()
  }catch(e){console.error(e);toast('Impossible de charger les offres pour le moment.')}
  state.loading=false; render(); loadCitiesAroundTroyes()
}

function setRoute(route){state.route=route;location.hash=route;render();window.scrollTo({top:0,behavior:'smooth'});loadCitiesAroundTroyes()}
function syncRoute(){const r=(location.hash||'#home').slice(1);state.route=['home','hebergement','transport'].includes(r)?r:'home';render();loadCitiesAroundTroyes()}
window.addEventListener('hashchange',syncRoute)
document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>setRoute(b.dataset.route)))
function navActive(){document.querySelectorAll('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===state.route))}
function render(){navActive();if(state.loading){app.innerHTML='<div class="loading">Chargement des offres…</div>';return}if(state.route==='hebergement')renderHousing();else if(state.route==='transport')renderTransport();else renderHome()}

function renderHome(){
  const h=state.accommodations.reduce((s,a)=>s+num(a.places_disponibles),0)
  const t=state.vehicles.reduce((s,v)=>s+Math.max(num(v.places_disponibles),num(v.places_retour_disponibles)),0)
  app.innerHTML=`<section class="hero"><div class="eyebrow">31 décembre 2026 · Mahery & Kanto</div><h1>On s’organise<br>ensemble.</h1><p>Un seul espace pour retrouver les hébergements et les transports proposés entre invités, réserver une place et contacter directement la personne concernée.</p><div class="summary"><span>🏠 ${h} places logement disponibles</span><span>🚗 ${t} places transport affichées</span></div></section>
  <section class="home-grid"><button class="choice" id="homeHousing"><strong>Je cherche un hébergement</strong><p>Voir les logements autour de Troyes et réserver une place.</p></button><button class="choice" id="homeTransport"><strong>Je cherche un transport</strong><p>Covoiturage, aller, retour et navettes locales.</p></button></section><div class="footer-note">Mariage Mahery & Kanto · 31 décembre 2026</div>`
  document.querySelector('#homeHousing').onclick=()=>setRoute('hebergement');document.querySelector('#homeTransport').onclick=()=>setRoute('transport')
}

function housingFiltered(){
  const f=state.housingFilters
  return state.accommodations.filter(a=>{
    if(f.city&&!normalize(a.ville_logement||'').includes(normalize(f.city)))return false
    if(num(a.places_disponibles)<num(f.people))return false
    if(f.children&&!a.enfants_acceptes)return false
    if(f.pets&&!a.animaux_acceptes)return false
    if(f.arrival&&a.date_entree&&f.arrival<a.date_entree)return false
    if(f.departure&&a.date_sortie&&f.departure>a.date_sortie)return false
    return true
  })
}
function accommodationLink(a){return a.external_url||state.links.find(x=>x.offer_type==='accommodation'&&x.offer_id===a.id)?.external_url||extractUrl(a.commentaires)}
function housingCard(a){
  const places=num(a.places_disponibles),fixed=a.prix_mode==='fixed_stay',link=accommodationLink(a),comment=cleanComment(a.commentaires),people=getPeople('accommodation',a.id)
  return `<article class="card"><div class="card-head"><div><h2 class="card-title">${esc(a.nom)}</h2><div class="owner">Proposé par <b>${esc(a.propose_par||'Un invité')}</b></div></div><div>${availability(places)}<div class="seatbox"><b>${places}</b><span>${places} place${places>1?'s':''}</span></div></div></div><div class="card-body">
  <div class="info-row"><div class="info">📅 ${dateFr(a.date_entree)} → ${dateFr(a.date_sortie)}</div><div class="info">◷ ${a.minutes_salle!=null?`${a.minutes_salle} min de la salle`:'Distance non précisée'}</div></div>
  <div class="chips"><span class="chip">📍 ${esc(a.ville_logement||'Ville à préciser')}</span><span class="chip">${a.enfants_acceptes?'👶 Enfants OK':'🚫 Sans enfants'}</span><span class="chip">${a.animaux_acceptes?'🐶 Animaux OK':'🚫 Sans animaux'}</span></div>
  <div class="price"><div class="price-label">${fixed?`Prix par personne pour les ${num(a.nuits_minimum)} nuits`:'Prix par personne / nuit'}</div><strong>${money(a.prix_personne_nuit)}</strong>${fixed&&num(a.nuits_minimum)>1?`<div><b>${num(a.nuits_minimum)} nuits minimum</b></div>`:''}</div>
  <div class="question"><b>Une question avant de réserver ?</b><div class="small">Contactez directement ${esc(a.propose_par||'l’hôte')}. Le numéro n’est pas affiché.</div>${contactButtons(a.telephone_proposant,`Bonjour ${a.propose_par||''}, j’ai une question concernant votre offre d’hébergement “${a.nom||''}” pour le mariage de Mahery & Kanto.`)}</div>
  <details class="details"><summary>Voir les personnes et les détails</summary><div class="details-inner">${comment?`<p class="small">${esc(comment)}</p>`:''}<div class="people-grid">${peopleHtml('Personnes confirmées',people)}</div>${link?`<a class="offer-link" target="_blank" rel="noopener" href="${esc(link)}">↗ Voir l’hébergement</a>`:''}</div></details>
  <button class="primary reserve" ${places<=0||!a.reservation_active?'disabled':''} data-book-housing="${a.id}">${places<=0?'Victime de son succès ✨':'Réserver ce logement'}</button></div></article>`
}
function renderHousing(){
  const list=housingFiltered(),f=state.housingFilters
  app.innerHTML=`<div class="page-head"><div><h1 class="page-title">Hébergement</h1><p class="page-sub">Trouvez ce qui vous convient autour de Troyes, jusqu’à environ 2 h de route.</p></div><button class="secondary" id="proposeHousing">+ Proposer un logement</button></div>
  <div class="filters"><div class="field" style="grid-column:span 2"><label>Ville du logement</label><input id="hfCity" list="troyesCities" placeholder="Troyes, Saint-Benoît-sur-Seine…" value="${esc(f.city)}"></div><div class="field"><label>Arrivée</label><input id="hfArrival" type="date" value="${esc(f.arrival)}"></div><div class="field"><label>Départ</label><input id="hfDeparture" type="date" value="${esc(f.departure)}"></div><div class="field"><label>Places adultes</label><select id="hfPeople">${[1,2,3,4,5,6,7,8,9,10,11,12].map(n=>`<option ${n==f.people?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>Préférences</label><label class="check"><input id="hfChildren" type="checkbox" ${f.children?'checked':''}> Enfants</label><label class="check"><input id="hfPets" type="checkbox" ${f.pets?'checked':''}> Animaux</label></div></div>
  <div class="cards">${list.map(housingCard).join('')}</div>${!list.length?'<div class="empty">Aucun hébergement pour ces critères.</div>':''}<div class="footer-note">${list.length} hébergement${list.length>1?'s':''} affiché${list.length>1?'s':''}</div>`
  const bind=(id,key,evt='input')=>document.querySelector(id)?.addEventListener(evt,e=>{state.housingFilters[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;renderHousing();loadCitiesAroundTroyes()})
  bind('#hfCity','city');bind('#hfArrival','arrival','change');bind('#hfDeparture','departure','change');bind('#hfPeople','people','change');bind('#hfChildren','children','change');bind('#hfPets','pets','change')
  document.querySelector('#proposeHousing').onclick=()=>openOfferModal('housing')
  document.querySelectorAll('[data-book-housing]').forEach(b=>b.onclick=()=>openReservation('housing',b.dataset.bookHousing))
}

function tripDestination(v){
  const d=normalize(v.destination||'')
  if(v.type_trajet==='navette'||d.includes('gare'))return 'Navette locale'
  if(d.includes('eglise')||d.includes('église'))return 'Église'
  if(d.includes('clos belair')||d.includes('salle')||d.includes('troyes'))return 'Salle de réception'
  return v.destination||'Destination à préciser'
}
function transportFiltered(){
  const f=state.transportFilters
  return state.vehicles.filter(v=>{
    if(f.destination!=='all'){const dest=tripDestination(v);if(f.destination==='church'&&dest!=='Église')return false;if(f.destination==='venue'&&dest!=='Salle de réception')return false;if(f.destination==='shuttle'&&dest!=='Navette locale')return false}
    if(f.date&&v.date_depart!==f.date)return false
    if(f.returnOnly&&!v.date_retour)return false
    const dep=state.departments[normalize(v.ville_depart||'')]||fallbackDept[normalize(v.ville_depart||'')]
    if(f.department!=='all'&&dep!==f.department)return false
    if(f.owner!=='all'&&v.genre_conducteur!==f.owner)return false
    if(f.pets&&!v.animaux_acceptes)return false
    const best=Math.max(num(v.places_disponibles),num(v.places_retour_disponibles))
    if(best<num(f.people)&&best!==0)return false
    return true
  })
}
function transportCard(v){
  const aller=num(v.places_disponibles),retour=v.date_retour?num(v.places_retour_disponibles ?? v.places):0,owner=ownerName(v),seen=new Set(),outP=getPeople('vehicle',v.id,'aller'),retP=getPeople('vehicle',v.id,'retour'),comment=cleanComment(v.commentaires),link=v.external_url||extractUrl(v.commentaires)
  return `<article class="card"><div class="card-head"><div><h2 class="card-title">${esc(owner||v.conducteur)}</h2><div class="small">🚗 Covoiturage</div></div><div class="chip">${money(v.participation)} / personne</div></div><div class="card-body">
  <div class="legs"><div class="leg"><h4>Aller</h4><strong>${dateFr(v.date_depart)}${v.heure_depart?` · ${esc(v.heure_depart.slice(0,5))}`:''}</strong><p>${esc(cityDept(v.ville_depart))} → ${esc(tripDestination(v))}</p>${availability(aller)}<button class="primary" ${aller<=0||!v.reservation_active?'disabled':''} data-book-transport="${v.id}" data-leg="aller">${aller<=0?'Victime de son succès ✨':'Réserver l’aller'}</button></div>
  <div class="leg"><h4>Retour</h4>${v.date_retour?`<strong>${dateFr(v.date_retour)}${v.heure_retour?` · ${esc(v.heure_retour.slice(0,5))}`:''}</strong><p>${esc(v.retour_lieu_depart||'Lieu communiqué après réservation')} → ${esc(cityDept(v.retour_ville_arrivee))}</p>${availability(retour)}<button class="primary" ${retour<=0||!v.reservation_active?'disabled':''} data-book-transport="${v.id}" data-leg="retour">${retour<=0?'Victime de son succès ✨':'Réserver le retour'}</button>`:'<p>Pas de retour proposé</p>'}</div></div>
  <div class="price"><div class="price-label">Montant / personne</div><strong>${money(v.participation)}</strong></div>
  <details class="details"><summary>Voir les détails</summary><div class="details-inner"><div class="people-grid">${peopleHtml('Personnes confirmées · Aller',outP,seen)}${v.date_retour?peopleHtml('Personnes confirmées · Retour',retP,seen):''}</div>${comment?`<p class="small" style="margin-top:10px">${esc(comment)}</p>`:''}<div class="question"><b>Une question avant de réserver ?</b><div class="small">Vous pouvez contacter ${esc(owner||'le conducteur')} sans afficher son numéro.</div>${contactButtons(v.telephone,`Bonjour ${owner||v.conducteur}, j’ai une question concernant votre offre de transport pour le mariage de Mahery & Kanto.`)}</div>${link?`<a class="offer-link" target="_blank" rel="noopener" href="${esc(link)}">↗ Ouvrir le lien de l’offre</a>`:''}</div></details></div></article>`
}
function renderTransport(){
  const list=transportFiltered(),f=state.transportFilters
  app.innerHTML=`<div class="page-head"><div><h1 class="page-title">Transport</h1><p class="page-sub">Aller et retour se réservent séparément, pour que chacun compose son trajet.</p></div><button class="secondary" id="proposeTransport">+ Proposer un transport</button></div>
  <div class="filters"><div class="field" style="grid-column:span 2"><label>Destination de l’aller</label><select id="tfDest"><option value="all">Toutes</option><option value="church">Île-de-France → Église</option><option value="venue">Île-de-France → Salle de réception</option><option value="shuttle">Navette locale depuis une gare autour de Troyes</option></select></div><div class="field"><label>Date de départ</label><input id="tfDate" type="date" value="${esc(f.date)}"></div><div class="field"><label>Département de départ</label><select id="tfDept"><option value="all">Tous</option>${['75','77','78','91','92','93','94','95'].map(d=>`<option ${f.department===d?'selected':''}>${d}</option>`).join('')}</select></div><div class="field"><label>Places nécessaires</label><select id="tfPeople">${[1,2,3,4,5,6].map(n=>`<option ${n==f.people?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label>Propriétaire</label><select id="tfOwner"><option value="all">Peu importe</option><option value="femme">Femme</option><option value="homme">Homme</option><option value="homme_et_femme">Homme et femme</option></select></div><label class="check"><input id="tfReturn" type="checkbox" ${f.returnOnly?'checked':''}> Avec retour</label><label class="check"><input id="tfPets" type="checkbox" ${f.pets?'checked':''}> 🐶 Animaux acceptés</label></div>
  <div class="cards">${list.map(transportCard).join('')}</div>${!list.length?'<div class="empty">Aucun transport pour ces critères.</div>':''}<div class="footer-note">${list.length} transport${list.length>1?'s':''} affiché${list.length>1?'s':''}</div>`
  document.querySelector('#tfDest').value=f.destination;document.querySelector('#tfOwner').value=f.owner
  const bind=(id,key,evt='change')=>document.querySelector(id)?.addEventListener(evt,e=>{state.transportFilters[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;renderTransport()})
  bind('#tfDest','destination');bind('#tfDate','date');bind('#tfDept','department');bind('#tfPeople','people');bind('#tfOwner','owner');bind('#tfReturn','returnOnly');bind('#tfPets','pets')
  document.querySelector('#proposeTransport').onclick=()=>openOfferModal('transport')
  document.querySelectorAll('[data-book-transport]').forEach(b=>b.onclick=()=>openReservation('transport',b.dataset.bookTransport,b.dataset.leg))
}

function closeModal(){modalRoot.innerHTML=''}
function modal(html){modalRoot.innerHTML=`<div class="modal-wrap" id="modalBg"><div class="modal">${html}</div></div>`;document.querySelector('#modalBg').onclick=e=>{if(e.target.id==='modalBg')closeModal()};document.querySelector('.close')?.addEventListener('click',closeModal)}

function openReservation(type,id,leg=null){
  const offer=type==='housing'?state.accommodations.find(x=>x.id===id):state.vehicles.find(x=>x.id===id);if(!offer)return
  const max=type==='housing'?num(offer.places_disponibles):(leg==='retour'?num(offer.places_retour_disponibles??offer.places):num(offer.places_disponibles))
  const title=type==='housing'?`Réserver ${offer.nom}`:`Réserver ${leg==='aller'?'l’aller':'le retour'} avec ${ownerName(offer)}`
  modal(`<div class="modal-head"><h2>${esc(title)}</h2><button class="close">×</button></div><form id="reservationForm" class="form-grid">
    <div class="field"><label>Nom et prénom *</label><input name="nom" required></div><div class="field"><label>Email *</label><input name="email" type="email" required></div><div class="field"><label>Téléphone *</label><input name="telephone" value="+33" required></div><div class="field"><label>Genre</label><select name="genre"><option value="femme">Femme</option><option value="homme">Homme</option></select></div><div class="field"><label>Nombre de personnes</label><select name="nb">${Array.from({length:Math.max(1,max)},(_,i)=>`<option>${i+1}</option>`).join('')}</select></div><div class="field"><label>Ville d’origine</label><input name="origin" placeholder="Ex. Créteil"></div>
    ${type==='housing'?`<div class="field"><label>Arrivée</label><input name="entree" type="date" value="${esc(offer.date_entree||'')}"></div><div class="field"><label>Départ</label><input name="sortie" type="date" value="${esc(offer.date_sortie||'')}"></div>`:''}
    <div class="field wide"><label>Centres d’intérêt (facultatif)</label><input name="interests" placeholder="Musique, lecture, voyages…"></div><label class="check wide"><input name="consent" type="checkbox" required> J’accepte que mes coordonnées soient échangées avec la personne qui propose cette offre.</label><button class="primary wide" type="submit">Confirmer ma réservation</button></form>`)
  document.querySelector('#reservationForm').onsubmit=async e=>{
    e.preventDefault();const form=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Confirmation…'
    const profile={origin:String(form.get('origin')||''),interests:String(form.get('interests')||'').split(',').map(s=>s.trim()).filter(Boolean),companions:[]}
    try{
      let result
      if(type==='housing'){
        const {data,error}=await supabase.rpc('reserve_accommodation_with_profile',{p_accommodation_id:id,p_reserver_nom:String(form.get('nom')),p_reserver_email:String(form.get('email')),p_reserver_telephone:String(form.get('telephone')),p_reserver_genre:String(form.get('genre')),p_nb_personnes:Number(form.get('nb')),p_date_entree:String(form.get('entree')),p_date_sortie:String(form.get('sortie')),p_consentement_coordonnees:true,p_profile:profile});if(error)throw error;result=data
      }else{
        const {data,error}=await supabase.rpc('reserve_vehicle_leg_with_profile',{p_vehicle_id:id,p_reserver_nom:String(form.get('nom')),p_reserver_email:String(form.get('email')),p_reserver_telephone:String(form.get('telephone')),p_reserver_genre:String(form.get('genre')),p_nb_personnes:Number(form.get('nb')),p_consentement_coordonnees:true,p_profile:profile,p_trajet_sens:leg});if(error)throw error;result=data
      }
      const reservationId=result?.reservation_id,emailToken=result?.email_token
      let contact=null
      if(reservationId&&emailToken){const {data}=await supabase.rpc('reservation_provider_contact',{p_reservation_id:reservationId,p_email_token:String(emailToken)});contact=data;supabase.functions.invoke('send-reservation-emails',{body:{reservation_id:reservationId,email_token:String(emailToken)}}).catch(()=>{})}
      await loadData();showSuccess(type,contact,offer,leg)
    }catch(err){console.error(err);btn.disabled=false;btn.textContent='Confirmer ma réservation';toast(err.message?.includes('not_enough_places')?'Il n’y a plus assez de places disponibles.':'La réservation n’a pas pu être confirmée. Vérifiez les informations.')}
  }
}
function showSuccess(type,contact,offer,leg){
  const fallback=type==='housing'?offer.telephone_proposant:offer.telephone,phone=contact?.phone||fallback,address=contact?.address,who=type==='housing'?'l’hôte':'le conducteur'
  modal(`<div class="modal-head"><h2>Réservation confirmée ✓</h2><button class="close">×</button></div><div class="success"><h3>Vous pouvez maintenant contacter ${who}</h3><p>${type==='housing'?'Finalisez tranquillement votre séjour avec la personne qui propose le logement.':'Finalisez les détails du trajet directement avec le conducteur.'}</p>${contactButtons(phone,`Bonjour, je viens de confirmer ma réservation ${type==='housing'?'pour le logement':'pour le trajet'} du mariage de Mahery & Kanto.`)}${address?`<a class="maps" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}">📍 Ouvrir le lieu exact dans Google Maps</a>`:''}</div>`)
}

function openOfferModal(type){
  if(type==='housing'){
    modal(`<div class="modal-head"><h2>Proposer un logement</h2><button class="close">×</button></div><form id="offerForm" class="form-grid">
      <div class="field"><label>Votre prénom et nom *</label><input name="owner" required></div><div class="field"><label>Genre</label><select name="gender"><option value="femme">Femme</option><option value="homme">Homme</option></select></div><div class="field"><label>Téléphone *</label><input name="phone" value="+33" required></div><div class="field"><label>Email *</label><input name="email" type="email" required></div><div class="field"><label>Nom du logement *</label><input name="name" required placeholder="Ex. Maison à Saint-Benoît"></div><div class="field"><label>Type</label><select name="type"><option>Airbnb</option><option>Maison</option><option>Hôtel</option><option>Autre</option></select></div><div class="field"><label>Ville *</label><input name="city" list="troyesCities" required></div><div class="field"><label>Adresse précise *</label><input name="address" required><span class="small">Elle restera privée avant réservation.</span></div><div class="field"><label>Places *</label><input name="places" type="number" min="1" value="1" required></div><div class="field"><label>Minutes de la salle</label><input name="minutes" type="number" min="0"></div><div class="field"><label>Disponible à partir du</label><input name="entry" type="date" value="2026-12-30"></div><div class="field"><label>Jusqu’au</label><input name="exit" type="date" value="2027-01-01"></div><div class="field"><label>Montant / personne (€)</label><input name="price" inputmode="decimal" value="0"></div><div class="field"><label>Tarification</label><select name="priceMode"><option value="fixed_stay">Montant pour le séjour</option><option value="per_night">Par nuit</option></select></div><div class="field"><label>Nuits minimum</label><input name="minNights" type="number" min="1" value="1"></div><div class="field"><label>Lien vers le logement</label><input name="url" type="url" placeholder="https://..."></div><label class="check"><input name="children" type="checkbox" checked> Enfants acceptés</label><label class="check"><input name="pets" type="checkbox"> Animaux acceptés</label><div class="field wide"><label>Commentaire</label><textarea name="comment"></textarea></div><button class="primary wide" type="submit">Publier mon logement</button></form>`)
  }else{
    modal(`<div class="modal-head"><h2>Proposer un transport</h2><button class="close">×</button></div><form id="offerForm" class="form-grid">
      <div class="field"><label>Conducteur *</label><input name="owner" required></div><div class="field"><label>Propriétaire</label><select name="gender"><option value="femme">Femme</option><option value="homme">Homme</option><option value="homme_et_femme">Homme et femme</option></select></div><div class="field wide"><label>Autre prénom si homme et femme</label><input name="companion" placeholder="Ex. Neria HOUESSOU (femme)"></div><div class="field"><label>Téléphone *</label><input name="phone" value="+33" required></div><div class="field"><label>Email *</label><input name="email" type="email" required></div><div class="field"><label>Ville de départ *</label><input name="city" required></div><div class="field"><label>Adresse précise de départ *</label><input name="address" required><span class="small">Privée avant réservation.</span></div><div class="field"><label>Destination</label><select name="destination"><option value="Église protestante Unie de Troyes">Église</option><option value="Clos Belair">Salle de réception</option><option value="Navette locale depuis une gare">Navette locale depuis une gare</option></select></div><div class="field"><label>Places *</label><input name="places" type="number" min="1" max="9" value="1"></div><div class="field"><label>Date aller</label><input name="date" type="date" value="2026-12-31"></div><div class="field"><label>Heure aller</label><input name="time" type="time"></div><div class="field"><label>Date retour</label><input name="rdate" type="date"></div><div class="field"><label>Heure retour</label><input name="rtime" type="time"></div><div class="field"><label>Ville / lieu départ retour</label><input name="rplace"></div><div class="field"><label>Adresse précise retour</label><input name="raddress"></div><div class="field"><label>Ville d’arrivée retour</label><input name="rcity"></div><div class="field"><label>Montant / personne (€)</label><input name="price" inputmode="decimal" value="0"></div><label class="check"><input name="pets" type="checkbox"> Animaux acceptés</label><div class="field wide"><label>Commentaire</label><textarea name="comment"></textarea></div><button class="primary wide" type="submit">Publier mon transport</button></form>`)
  }
  loadCitiesAroundTroyes()
  document.querySelector('#offerForm').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.currentTarget),btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Publication…'
    try{
      if(type==='housing'){
        const places=Number(f.get('places'))||1,price=Number(String(f.get('price')).replace(',','.'))||0
        const payload={nom:String(f.get('name')),type:String(f.get('type')),ville_logement:String(f.get('city')),adresse:String(f.get('address')),capacite:places,places_disponibles:places,minutes_salle:f.get('minutes')?Number(f.get('minutes')):null,date_entree:String(f.get('entry')||'')||null,date_sortie:String(f.get('exit')||'')||null,prix_personne_nuit:price,prix_mode:String(f.get('priceMode')),nuits_minimum:Number(f.get('minNights'))||1,enfants_acceptes:f.get('children')==='on',animaux_acceptes:f.get('pets')==='on',propose_par:String(f.get('owner')),genre_proposant:String(f.get('gender')),telephone_proposant:String(f.get('phone')),email_proposant:String(f.get('email')),commentaires:String(f.get('comment')||''),external_url:String(f.get('url')||'')||null,actif:true,source:'invite',reservation_active:true}
        const {error}=await supabase.from('accommodations').insert(payload);if(error)throw error
      }else{
        const places=Number(f.get('places'))||1,price=Number(String(f.get('price')).replace(',','.'))||0,dateRetour=String(f.get('rdate')||'')||null
        const payload={conducteur:String(f.get('owner')),genre_conducteur:String(f.get('gender')),compagnons_prenoms:String(f.get('companion')||'')||null,telephone:String(f.get('phone')),email_conducteur:String(f.get('email')),ville_depart:String(f.get('city')),lieu_depart:String(f.get('address')),destination:String(f.get('destination')),type_trajet:String(f.get('destination')).includes('Navette')?'navette':'trajet',date_depart:String(f.get('date')||'')||null,heure_depart:String(f.get('time')||'')||null,date_retour:dateRetour,heure_retour:String(f.get('rtime')||'')||null,retour_lieu_depart:String(f.get('rplace')||'')||null,retour_adresse_depart:String(f.get('raddress')||'')||null,retour_ville_arrivee:String(f.get('rcity')||'')||null,places,places_disponibles:places,places_retour_disponibles:dateRetour?places:null,gratuit:false,participation:price,animaux_acceptes:f.get('pets')==='on',commentaires:String(f.get('comment')||''),actif:true,source:'invite',reservation_active:true}
        const {error}=await supabase.from('vehicles').insert(payload);if(error)throw error
      }
      closeModal();toast('Votre offre a bien été publiée.');await loadData()
    }catch(err){console.error(err);btn.disabled=false;btn.textContent=type==='housing'?'Publier mon logement':'Publier mon transport';toast('Impossible de publier l’offre. Vérifiez les informations.')}
  }
}

musicBtn.onclick=()=>{
  if(!musicPlaying){musicHost.innerHTML='<iframe id="songFrame" width="1" height="1" src="https://www.youtube.com/embed/w0NEOVbU3hQ?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&loop=1&playlist=w0NEOVbU3hQ" allow="autoplay; encrypted-media"></iframe>';musicPlaying=true;musicBtn.innerHTML='Ⅱ <span>Pause</span>'}
  else{musicHost.innerHTML='';musicPlaying=false;musicBtn.innerHTML='▶ <span>Play</span>'}
}

syncRoute();loadData();