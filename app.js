/* ===========================================================
   Bali Diagnostics — Shared behavior
   =========================================================== */

/* ---------- Booking notification config ----------
   Web3Forms sends an instant email to the lab whenever a booking is submitted.
   Get a free access key at https://web3forms.com (enter the lab's email).
   Paste the key below. Until a real key is set, email sending is skipped
   gracefully and the WhatsApp / on-screen confirmation still work. */
const WEB3FORMS_ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';

function sendBookingEmail(data) {
  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    return Promise.resolve({ skipped: true });
  }
  const payload = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `New Booking ${data.id} — ${data.name}`,
    from_name: 'Bali Diagnostics Website',
    // Labelled fields so the email is easy to read:
    'Booking ID': data.id,
    Patient: `${data.name} (${data.age}, ${data.gender})`,
    Phone: data.phone,
    Email: data.email || '—',
    'Collection Mode': data.mode === 'home' ? 'Home Collection' : 'Visit Lab',
    Address: data.address || 'N/A',
    'Preferred Date': data.date,
    'Time Slot': data.slot,
    Tests: data.items.join(', ') || 'To be advised',
    'Estimated Total': `₹${data.total}`,
    Notes: data.notes || '-',
    'Submitted At': new Date(data.createdAt).toLocaleString('en-IN'),
  };
  return fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .catch((err) => ({ success: false, error: String(err) }));
}

/* Light-first clinical interface: consistent contrast on patient devices. */
document.documentElement.removeAttribute('data-theme');
localStorage.removeItem('bcl_theme');

/* ---------- Language switching ---------- */
function setLang(lang){
  document.body.dataset.lang = lang;
  document.querySelectorAll('[lang-block]').forEach(el=>{
    el.classList.toggle('active-lang', el.dataset.lang === lang);
  });
  document.querySelectorAll('#langSwitch button').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  localStorage.setItem('bcl_lang', lang);
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('#langSwitch button').forEach(b=>{
    b.addEventListener('click', ()=>setLang(b.dataset.lang));
  });
  setLang(localStorage.getItem('bcl_lang') || 'en');

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  if(menuToggle && mobileNav){
    menuToggle.addEventListener('click', ()=> mobileNav.classList.toggle('open'));
    mobileNav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> mobileNav.classList.remove('open')));
  }

  /* ---------- Scroll progress bar ---------- */
  const bar = document.getElementById('scrollProgress');
  if(bar){
    window.addEventListener('scroll', ()=>{
      const h = document.documentElement;
      const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = pct + '%';
    });
  }

  /* ---------- Hero cursor glow ---------- */
  const hero = document.querySelector('.hero');
  if(hero){
    hero.addEventListener('mousemove', (e)=>{
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX - rect.left)/rect.width*100) + '%');
      hero.style.setProperty('--my', ((e.clientY - rect.top)/rect.height*100) + '%');
    });
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.12});
  revealEls.forEach(el=>io.observe(el));

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const dur = 1400;
        const start = performance.now();
        function tick(now){
          const p = Math.min((now-start)/dur, 1);
          const eased = 1 - Math.pow(1-p, 3);
          el.textContent = (target % 1 === 0 ? Math.round(target*eased) : (target*eased).toFixed(1)) + suffix;
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      }
    });
  },{threshold:.4});
  counters.forEach(el=>cio.observe(el));
});

/* =========================================================
   Booking system (catalog, packages, modal, staff view)
   Only runs where the relevant elements exist on the page.
   ========================================================= */

const TESTS = [
  {id:'t1',name:'Complete Blood Count (CBC)',cat:'Hematology',sample:'Blood (EDTA)',fasting:false,tat:'Same day',price:299},
  {id:'t2',name:'Fasting Blood Sugar (FBS)',cat:'Diabetes',sample:'Blood, fasting 8-10 hrs',fasting:true,tat:'Same day',price:99},
  {id:'t3',name:'HbA1c (3-month sugar average)',cat:'Diabetes',sample:'Blood',fasting:false,tat:'Next day',price:449},
  {id:'t4',name:'Lipid Profile',cat:'Cardiac',sample:'Blood, fasting 10-12 hrs',fasting:true,tat:'Same day',price:499},
  {id:'t5',name:'Liver Function Test (LFT)',cat:'Organ Health',sample:'Blood',fasting:false,tat:'Same day',price:549},
  {id:'t6',name:'Kidney Function Test (KFT)',cat:'Organ Health',sample:'Blood',fasting:false,tat:'Same day',price:549},
  {id:'t7',name:'Thyroid Profile (T3, T4, TSH)',cat:'Hormone',sample:'Blood',fasting:false,tat:'Next day',price:499},
  {id:'t8',name:'Vitamin D (25-OH)',cat:'Vitamins',sample:'Blood',fasting:false,tat:'2-3 days',price:1199},
  {id:'t9',name:'Vitamin B12',cat:'Vitamins',sample:'Blood',fasting:false,tat:'2 days',price:699},
  {id:'t10',name:'hs-CRP (Inflammation marker)',cat:'Cardiac',sample:'Blood',fasting:false,tat:'Next day',price:649},
  {id:'t11',name:'Iron Studies',cat:'Hematology',sample:'Blood',fasting:true,tat:'Next day',price:899},
  {id:'t12',name:'Urine Routine & Microscopy',cat:'Organ Health',sample:'Urine (first morning preferred)',fasting:false,tat:'Same day',price:199},
  {id:'t13',name:'Widal Test (Typhoid)',cat:'Infection',sample:'Blood',fasting:false,tat:'Same day',price:249},
  {id:'t14',name:'Dengue NS1/IgM/IgG',cat:'Infection',sample:'Blood',fasting:false,tat:'Same day',price:899},
  {id:'t15',name:'CRP (Quantitative)',cat:'Infection',sample:'Blood',fasting:false,tat:'Same day',price:399},
  {id:'t16',name:'Testosterone (Total)',cat:'Hormone',sample:'Blood',fasting:false,tat:'2 days',price:899},
  {id:'t17',name:'Estradiol',cat:'Hormone',sample:'Blood',fasting:false,tat:'2 days',price:949},
];

const PACKAGES = [
  {id:'p1',name:'Essential Wellness Panel',desc:'A basic starter checkup for general health tracking.',includes:['CBC','Fasting Blood Sugar','Lipid Profile','LFT'],price:999,mrp:1450,popular:false},
  {id:'p2',name:'Complete Body Checkup',desc:'Broad coverage across major organ systems — our most comprehensive panel.',includes:['CBC','Thyroid Profile','FBS + HbA1c','Lipid Profile','LFT + KFT','Vitamin D & B12'],price:1999,mrp:3200,popular:true},
  {id:'p3',name:'Diabetes Care Panel',desc:'Focused monitoring for pre-diabetes and diabetes management.',includes:['FBS','HbA1c','Lipid Profile','KFT'],price:899,mrp:1350,popular:false},
  {id:'p4',name:"Women's Wellness Panel",desc:'Covers common concerns across hormonal and nutritional health.',includes:['CBC','Thyroid Profile','Vitamin D & B12','Iron Studies'],price:1799,mrp:2600,popular:false},
  {id:'p5',name:'Senior Citizen Care Panel',desc:'A wider panel for ongoing monitoring in adults 55+.',includes:['CBC','FBS + HbA1c','Lipid Profile','LFT + KFT','Thyroid Profile','Vitamin D & B12'],price:2499,mrp:3800,popular:false},
  {id:'p6',name:'Cardiac Risk Panel',desc:'Markers commonly used to assess cardiovascular risk.',includes:['Lipid Profile','hs-CRP','CBC'],price:1499,mrp:2100,popular:false},
  {id:'p7',name:'Monsoon Fever & Vector-Borne Screen',desc:'A seasonal awareness panel covering common monsoon-season illnesses. Not a diagnosis — for general screening only; consult your doctor if symptomatic.',includes:['CBC','Dengue NS1/IgM/IgG','Widal Test (Typhoid)','CRP'],price:1299,mrp:1900,popular:false},
  {id:'p8',name:'Respiratory Wellness Panel',desc:'A general respiratory awareness panel, useful year-round. For general screening only; consult your doctor if symptomatic.',includes:['CBC','CRP (Quantitative)','Vitamin D'],price:999,mrp:1500,popular:false},
  {id:'p9',name:'Summer Heat &amp; Hydration Panel',desc:'A seasonal awareness panel for the peak summer months (March–May), when published Indian clinical data shows heat-related illness rising in northwestern India. Not a diagnosis — seek immediate medical care for suspected heatstroke.',includes:['CBC','KFT','LFT','Urine Routine &amp; Microscopy'],price:1199,mrp:1750,popular:false},
];

let selected = {};
let activeFilter = 'All';
const categories = ['All', ...new Set(TESTS.map(t=>t.cat))];

function renderPackages(){
  const grid = document.getElementById('pkgGrid');
  if(!grid) return;
  grid.innerHTML = PACKAGES.map(p => {
    const off = Math.round((1 - p.price/p.mrp)*100);
    const isAdded = !!selected[p.id];
    return `<div class="pkg-card ${p.popular?'popular':''}">
      ${p.popular?'<span class="pop-tag">Most booked</span>':''}
      <h3>${p.name}</h3>
      <p class="count">${p.includes.length} tests included</p>
      <div class="price-row"><span class="now">₹${p.price}</span><span class="was">₹${p.mrp}</span><span class="off">${off}% off</span></div>
      <ul class="pkg-includes">${p.includes.map(i=>`<li>${i}</li>`).join('')}</ul>
      <p style="font-size:.82rem;color:var(--muted);">${p.desc}</p>
      <div class="card-actions">
        <button class="add-btn ${isAdded?'added':''}" style="flex:1;" onclick="togglePackage('${p.id}')">${isAdded?'✓ Added':'Add to Booking'}</button>
      </div>
    </div>`;
  }).join('');
}

function togglePackage(id){
  const p = PACKAGES.find(x=>x.id===id);
  if(selected[id]){ delete selected[id]; }
  else { selected[id] = {name:p.name, price:p.price, type:'package'}; }
  renderPackages();
  updateBookingBar();
}

function renderChips(){
  const el = document.getElementById('filterChips');
  if(!el) return;
  el.innerHTML = categories.map(c =>
    `<button class="${c===activeFilter?'active':''}" onclick="setFilter('${c}')">${c}</button>`
  ).join('');
}
function setFilter(c){ activeFilter = c; renderChips(); renderCatalog(); }

function renderCatalog(){
  const searchInput = document.getElementById('catalogSearch');
  const body = document.getElementById('testTableBody');
  if(!searchInput || !body) return;
  const q = searchInput.value.trim().toLowerCase();
  const rows = TESTS.filter(t =>
    (activeFilter==='All' || t.cat===activeFilter) &&
    (q==='' || t.name.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q))
  );
  document.getElementById('emptyState').style.display = rows.length? 'none':'block';
  body.innerHTML = rows.map(t => {
    const isAdded = !!selected[t.id];
    return `<tr>
      <td><div class="test-name">${t.name}</div>${t.fasting?'<span class="tag-fasting">Fasting required</span>':''}</td>
      <td><span class="test-meta">${t.cat}</span></td>
      <td><span class="test-meta">${t.sample}</span></td>
      <td><span class="test-meta">${t.tat}</span></td>
      <td><strong>₹${t.price}</strong></td>
      <td><button class="add-btn ${isAdded?'added':''}" onclick="toggleTest('${t.id}')">${isAdded?'✓ Added':'Add'}</button></td>
    </tr>`;
  }).join('');
}

function toggleTest(id){
  const t = TESTS.find(x=>x.id===id);
  if(selected[id]){ delete selected[id]; }
  else { selected[id] = {name:t.name, price:t.price, type:'test'}; }
  renderCatalog();
  updateBookingBar();
}

function heroSearchGo(){
  const v = document.getElementById('heroSearch').value;
  const catalogSearch = document.getElementById('catalogSearch');
  if(catalogSearch){
    catalogSearch.value = v;
    activeFilter = 'All';
    renderChips();
    renderCatalog();
    document.getElementById('catalog').scrollIntoView({behavior:'smooth'});
  } else {
    window.location.href = 'index.html#catalog';
  }
}
function quickSearch(term){
  document.getElementById('heroSearch').value = term;
  heroSearchGo();
}

function updateBookingBar(){
  const items = Object.values(selected);
  const bar = document.getElementById('bookingBar');
  if(!bar) return;
  if(items.length===0){ bar.classList.remove('show'); return; }
  bar.classList.add('show');
  const total = items.reduce((s,i)=>s+i.price,0);
  document.getElementById('barCount').textContent = `${items.length} item${items.length>1?'s':''} selected`;
  document.getElementById('barTotal').textContent = `≈ ₹${total} estimated (final price confirmed at lab)`;
}
function clearSelection(){
  selected = {};
  renderPackages(); renderCatalog(); updateBookingBar();
}

function openBookingModal(){
  const items = Object.values(selected);
  const overlay = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  if(!overlay || !body) return;

  const listHtml = items.length
    ? `<div class="selected-list">${items.map(i=>`<div><span>${i.name}</span><span>₹${i.price}</span></div>`).join('')}</div>`
    : `<div class="selected-list" style="color:var(--muted);">No tests selected yet — you can still submit and our team will help you choose.</div>`;
  const total = items.reduce((s,i)=>s+i.price,0);

  body.innerHTML = `
    <h3>Book an appointment</h3>
    <p style="color:var(--muted);font-size:.85rem;margin-top:-8px;">Estimated total: <strong>₹${total}</strong> (confirmed at lab; prototype pricing is illustrative)</p>
    ${listHtml}
    <form id="bookingForm">
      <div class="form-grid">
        <div class="full">
          <label>Full name *</label>
          <input required name="pname" placeholder="Patient's full name">
        </div>
        <div>
          <label>Age *</label>
          <input required type="number" min="0" max="120" name="page" placeholder="Age">
        </div>
        <div>
          <label>Gender *</label>
          <select required name="pgender">
            <option value="">Select</option>
            <option>Female</option><option>Male</option><option>Other</option>
          </select>
        </div>
        <div>
          <label>Phone number *</label>
          <input required type="tel" name="pphone" placeholder="10-digit mobile">
        </div>
        <div>
          <label>Email (optional)</label>
          <input type="email" name="pemail" placeholder="you@example.com">
        </div>
        <div class="full">
          <label>Collection mode *</label>
          <div class="mode-toggle">
            <label><input type="radio" name="mode" value="home" checked onchange="toggleAddressField()"><span>🏠 Home Collection</span></label>
            <label><input type="radio" name="mode" value="lab" onchange="toggleAddressField()"><span>🏥 Visit Lab</span></label>
          </div>
        </div>
        <div class="full" id="addressWrap">
          <label>Address for sample pickup *</label>
          <textarea name="paddress" placeholder="House no, street, area, landmark"></textarea>
        </div>
        <div>
          <label>Preferred date *</label>
          <input required type="date" name="pdate" min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div>
          <label>Preferred time slot *</label>
          <select required name="pslot">
            <option value="">Select slot</option>
            <option>7:00 AM – 9:00 AM</option>
            <option>9:00 AM – 11:00 AM</option>
            <option>11:00 AM – 1:00 PM</option>
            <option>4:00 PM – 6:00 PM</option>
            <option>6:00 PM – 8:00 PM</option>
          </select>
        </div>
        <div class="full">
          <label>Notes (optional)</label>
          <textarea name="pnotes" placeholder="Any specific instructions, doctor referral, etc."></textarea>
        </div>
      </div>
      <button type="submit" class="btn btn-primary modal-submit">Confirm Booking Request</button>
      <p style="font-size:.74rem;color:var(--muted);text-align:center;margin-top:10px;">This prototype does not process real payments. Your request will be summarized to send via WhatsApp/message to the lab team.</p>
    </form>
  `;
  overlay.classList.add('open');
  document.getElementById('bookingForm').addEventListener('submit', (e)=>submitBooking(e, items, total));
}

function toggleAddressField(){
  const mode = document.querySelector('input[name="mode"]:checked').value;
  document.getElementById('addressWrap').style.display = mode==='home' ? 'block':'none';
}

function closeModal(){ document.getElementById('modalOverlay').classList.remove('open'); }

function submitBooking(e, items, total){
  e.preventDefault();
  const f = e.target;
  const data = {
    id: 'BCL' + Date.now().toString().slice(-6),
    name: f.pname.value, age: f.page.value, gender: f.pgender.value,
    phone: f.pphone.value, email: f.pemail.value,
    mode: f.mode.value, address: f.paddress.value,
    date: f.pdate.value, slot: f.pslot.value, notes: f.pnotes.value,
    items: items.map(i=>i.name), total, status:'Booked',
    createdAt: new Date().toISOString()
  };
  const bookings = JSON.parse(localStorage.getItem('bcl_bookings')||'[]');
  bookings.unshift(data);
  localStorage.setItem('bcl_bookings', JSON.stringify(bookings));

  // Fire off the instant email notification to the lab (non-blocking).
  sendBookingEmail(data);

  const waMsg = encodeURIComponent(
    `New booking request — ${data.id}\nPatient: ${data.name}, ${data.age}, ${data.gender}\nPhone: ${data.phone}\nMode: ${data.mode}\nDate/Slot: ${data.date} ${data.slot}\nTests: ${data.items.join(', ') || 'To be advised'}\nEstimated total: ₹${data.total}\nAddress: ${data.address||'N/A'}\nNotes: ${data.notes||'-'}`
  );

  document.getElementById('modalBody').innerHTML = `
    <div class="confirm-box">
      <div class="tick">✓</div>
      <h3>Booking request received</h3>
      <p>Your reference ID:</p>
      <p class="confirm-id">${data.id}</p>
      <p style="color:var(--muted);font-size:.88rem;">We'll confirm your slot shortly. You can also send this request directly to our team on WhatsApp so it's actioned faster.</p>
      <a class="btn btn-primary" style="margin-top:8px;" href="https://wa.me/918437166210?text=${waMsg}" target="_blank" rel="noopener">Send via WhatsApp</a>
      <div style="margin-top:14px;">
        <button class="btn btn-ghost btn-small" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;
  selected = {};
  renderPackages(); renderCatalog(); updateBookingBar();
}

/* ---------- Staff demo view ---------- */
function renderStaffView(){
  const bookings = JSON.parse(localStorage.getItem('bcl_bookings')||'[]');
  const body = document.getElementById('staffTableBody');
  if(!body) return;
  if(bookings.length===0){
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:26px;">No bookings yet. Submit a booking from the site to see it appear here.</td></tr>`;
    return;
  }
  body.innerHTML = bookings.map((b,idx) => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${b.name}<br><span class="test-meta">${b.phone}</span></td>
      <td><span class="test-meta">${b.items.join(', ')||'—'}</span></td>
      <td><span class="test-meta">${b.mode}</span></td>
      <td><span class="test-meta">${b.date} · ${b.slot}</span></td>
      <td>
        <select class="status-select" onchange="updateStatus(${idx}, this.value)">
          ${['Booked','Sample Collected','Report Ready','Completed'].map(s=>`<option ${b.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>
  `).join('');
}
function updateStatus(idx, val){
  const bookings = JSON.parse(localStorage.getItem('bcl_bookings')||'[]');
  bookings[idx].status = val;
  localStorage.setItem('bcl_bookings', JSON.stringify(bookings));
}
function openStaffView(){
  const staffView = document.getElementById('staffView');
  if(!staffView) return;
  staffView.classList.add('open');
  document.getElementById('home').style.display='none';
  document.querySelector('footer').style.display='none';
  const bar = document.getElementById('bookingBar');
  if(bar) bar.style.display='none';
  renderStaffView();
  window.scrollTo(0,0);
}
function closeStaffView(){
  document.getElementById('staffView').classList.remove('open');
  document.getElementById('home').style.display='block';
  document.querySelector('footer').style.display='block';
  updateBookingBar();
}

document.addEventListener('DOMContentLoaded', ()=>{
  ['staffLink','staffLink2','staffLinkMobile'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('click', e=>{
      e.preventDefault();
      const mobileNav = document.getElementById('mobileNav');
      if(mobileNav) mobileNav.classList.remove('open');
      openStaffView();
    });
  });
  const closeStaffBtn = document.getElementById('closeStaffBtn');
  if(closeStaffBtn) closeStaffBtn.addEventListener('click', closeStaffView);

  // If the staff view is open and a user clicks any in-page nav link (or the
  // brand logo), close the staff view first so navigation actually works.
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    if(['staffLink','staffLink2','staffLinkMobile'].includes(a.id)) return;
    a.addEventListener('click', ()=>{
      const sv = document.getElementById('staffView');
      if(sv && sv.classList.contains('open')) closeStaffView();
      const mobileNav = document.getElementById('mobileNav');
      if(mobileNav) mobileNav.classList.remove('open');
    });
  });

  const catalogSearchEl = document.getElementById('catalogSearch');
  if(catalogSearchEl) catalogSearchEl.addEventListener('input', renderCatalog);

  const heroSearchBtn = document.getElementById('heroSearchBtn');
  if(heroSearchBtn) heroSearchBtn.addEventListener('click', heroSearchGo);

  renderPackages();
  renderChips();
  renderCatalog();

  /* ---------- Research page: season tabs ---------- */
  const seasonTabs = document.querySelectorAll('.season-tabs button');
  if(seasonTabs.length){
    seasonTabs.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        seasonTabs.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.season-panel').forEach(p=>{
          p.classList.toggle('active', p.dataset.season === btn.dataset.season);
        });
      });
    });
  }
});
