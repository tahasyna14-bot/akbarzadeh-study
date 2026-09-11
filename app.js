
(() => {
  "use strict";

  const KEY = "ak_report_v3";
  const PROFILE = "ak_report_profile_v3";
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const subjects = ["ریاضی","فیزیک","شیمی","زیست‌شناسی","ادبیات فارسی","عربی","دین و زندگی","زبان انگلیسی","هندسه","حسابان","آمار و احتمال","گسسته","سایر"];
  const peers = [
    {name:"آرمان رضایی",hours:31.5,tests:642,eff:91},
    {name:"پارسا محمدی",hours:29.75,tests:588,eff:88},
    {name:"کیان احمدی",hours:28.25,tests:605,eff:90},
    {name:"امیرحسین کریمی",hours:26.5,tests:540,eff:86},
    {name:"سینا نادری",hours:24.75,tests:492,eff:84},
    {name:"محمدطاها مرادی",hours:23.5,tests:455,eff:82},
    {name:"علی شریفی",hours:21.25,tests:410,eff:80}
  ];

  const load = (k, fallback=[]) => { try{return JSON.parse(localStorage.getItem(k)) ?? fallback}catch{return fallback} };
  const save = (k,v) => localStorage.setItem(k,JSON.stringify(v));
  let reports = load(KEY, []);
  let profile = load(PROFILE, {firstName:"",lastName:"",grade:"",field:"",about:"",avatar:""});

  const today = () => {
    const d = new Date();
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{year:"numeric",month:"2-digit",day:"2-digit",weekday:"long"}).format(d);
  };
  const isoDay = () => new Date().toISOString().slice(0,10);
  const fmt = n => new Intl.NumberFormat("fa-IR").format(n);
  const hoursText = h => {
    const mins = Math.round(Number(h)*60), hh=Math.floor(mins/60), mm=mins%60;
    return `${fmt(hh)} ساعت${mm?` و ${fmt(mm)} دقیقه`:""}`;
  };
  const toast = (msg) => {
    let w=$(".toast-wrap"); if(!w){w=document.createElement("div");w.className="toast-wrap";document.body.appendChild(w)}
    const t=document.createElement("div");t.className="toast";t.textContent=msg;w.appendChild(t);
    requestAnimationFrame(()=>t.classList.add("show"));setTimeout(()=>{t.classList.remove("show");setTimeout(()=>t.remove(),250)},2500);
  };
  const initials = n => (n||"کاربر").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("");
  const currentName = () => [profile.firstName,profile.lastName].filter(Boolean).join(" ") || "دانش‌آموز";

  function subjectOptions(selected=""){
    return subjects.map(s=>`<option value="${s}" ${s===selected?"selected":""}>${s}</option>`).join("");
  }

  function renderLesson(i, data={}) {
    return `<article class="lesson" data-lesson>
      <div class="lesson-title">
        <div class="lesson-number"><span class="number">${fmt(i+1)}</span>گزارش درس</div>
        ${i?`<button type="button" class="lesson-remove" data-remove-lesson>حذف این درس</button>`:""}
      </div>
      <div class="form-grid">
        <div class="field">
          <label>نام درس</label>
          <select data-subject required>${subjectOptions(data.subject||"")}</select>
        </div>
        <div class="field">
          <label>ساعت مطالعه</label>
          <div class="range-row">
            <input type="range" min="0.5" max="12" step="0.5" value="${data.hours||1}" data-hours>
            <div class="range-value" data-hours-value>${hoursText(data.hours||1)}</div>
          </div>
        </div>
        <div class="field">
          <label>تعداد تست</label>
          <div class="range-row">
            <input type="range" min="0" max="200" step="5" value="${data.tests||0}" data-tests>
            <div class="range-value" data-tests-value>${fmt(data.tests||0)}</div>
          </div>
        </div>
        <div class="field">
          <label>میزان بازدهی</label>
          <div class="range-row">
            <input type="range" min="0" max="100" step="5" value="${data.eff||70}" data-eff>
            <div class="range-value" data-eff-value>${fmt(data.eff||70)}٪</div>
          </div>
        </div>
        <div class="field full">
          <label>توضیحات</label>
          <textarea data-desc placeholder="مثلاً: مرور فصل دوم، حل تست‌های زمان‌دار و تحلیل غلط‌ها...">${data.desc||""}</textarea>
        </div>
      </div>
    </article>`;
  }

  function renderReportBuilder() {
    const box=$("[data-lessons]");
    if(!box) return;
    const savedToday=reports.find(r=>r.date===isoDay());
    const lessons=savedToday?.lessons?.length?savedToday.lessons:[{}];
    box.innerHTML=lessons.map((x,i)=>renderLesson(i,x)).join("");
    bindLessons();
  }

  function bindLessons(){
    $$("[data-hours]").forEach(x=>x.addEventListener("input",e=>e.target.closest(".lesson").querySelector("[data-hours-value]").textContent=hoursText(e.target.value)));
    $$("[data-tests]").forEach(x=>x.addEventListener("input",e=>e.target.closest(".lesson").querySelector("[data-tests-value]").textContent=fmt(e.target.value)));
    $$("[data-eff]").forEach(x=>x.addEventListener("input",e=>e.target.closest(".lesson").querySelector("[data-eff-value]").textContent=fmt(e.target.value)+"٪"));
    $$("[data-remove-lesson]").forEach(x=>x.addEventListener("click",()=>{x.closest(".lesson").remove();renumber();}));
  }
  function renumber(){ $$(".lesson").forEach((x,i)=>{const n=$(".number",x);if(n)n.textContent=fmt(i+1)}); }

  function readLessons(){
    return $$("[data-lesson]").map(l=>({
      subject:$("[data-subject]",l).value,
      hours:Number($("[data-hours]",l).value),
      tests:Number($("[data-tests]",l).value),
      eff:Number($("[data-eff]",l).value),
      desc:$("[data-desc]",l).value.trim()
    })).filter(x=>x.subject && x.hours>0);
  }

  function saveReport(){
    const lessons=readLessons();
    if(!lessons.length){toast("حداقل یک درس را ثبت کنید");return}
    const report={date:isoDay(),label:today(),lessons,updatedAt:new Date().toISOString()};
    reports=reports.filter(r=>r.date!==isoDay());reports.push(report);save(KEY,reports);
    toast("گزارش امروز با موفقیت ثبت شد");
    setTimeout(()=>location.href="dashboard.html",450);
  }

  function totals(list=reports){
    const all=list.flatMap(r=>r.lessons||[]);
    return {
      hours:all.reduce((s,x)=>s+x.hours,0),
      tests:all.reduce((s,x)=>s+x.tests,0),
      eff:all.length?Math.round(all.reduce((s,x)=>s+x.eff,0)/all.length):0
    };
  }
  function weekReports(){
    const now=new Date(); const start=new Date(now); start.setDate(now.getDate()-6); start.setHours(0,0,0,0);
    return reports.filter(r=>{const d=new Date(r.date+"T00:00:00");return d>=start&&d<=now});
  }
  function weekly(){return totals(weekReports())}

  function renderDashboard(){
    const t=weekly();
    $$("[data-today]").forEach(x=>x.textContent=today());
    $$("[data-name]").forEach(x=>x.textContent=currentName());
    $$("[data-week-hours]").forEach(x=>x.textContent=hoursText(t.hours));
    $$("[data-week-tests]").forEach(x=>x.textContent=fmt(t.tests));
    $$("[data-week-eff]").forEach(x=>x.textContent=fmt(t.eff)+"٪");
    const days=weekReports().length;
    $$("[data-days]").forEach(x=>x.textContent=fmt(days)+" روز");
    const recent=reports.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
    const tbody=$("[data-recent]");
    if(tbody) tbody.innerHTML=recent.length?recent.map(r=>{
      const z=totals([r]);return `<tr><td>${r.label}</td><td>${fmt(r.lessons.length)} درس</td><td>${hoursText(z.hours)}</td><td>${fmt(z.tests)}</td><td><span class="badge">${fmt(z.eff)}٪</span></td></tr>`
    }).join(""):`<tr><td colspan="5" class="empty">هنوز گزارشی ثبت نشده است.</td></tr>`;
    renderBars();
    renderRank();
  }

  function renderBars(){
    const el=$("[data-bars]"); if(!el)return;
    const names=["ش","ی","د","س","چ","پ","ج"];
    const now=new Date(); const vals=[];
    for(let i=6;i>=0;i--){
      const d=new Date(now);d.setDate(now.getDate()-i);
      const key=d.toISOString().slice(0,10);
      vals.push(totals(reports.filter(r=>r.date===key)).hours);
    }
    const max=Math.max(1,...vals);
    el.innerHTML=vals.map((v,i)=>`<div class="bar-col"><strong>${fmt(v.toFixed(1))}</strong><div class="bar" style="height:${Math.max(3,v/max*145)}px"></div><span>${names[i]}</span></div>`).join("");
  }

  function renderRank(){
    const me=weekly(); const meRow={name:currentName(),hours:me.hours,tests:me.tests,eff:me.eff,me:true};
    const rows=[...peers,meRow].sort((a,b)=>b.hours-a.hours);
    const myRank=rows.findIndex(x=>x.me)+1;
    $$("[data-rank]").forEach(x=>x.textContent=fmt(myRank));
    const box=$("[data-leaderboard-preview]"); if(!box)return;
    box.innerHTML=rows.slice(0,7).map((x,i)=>`<div class="rank ${x.me?"me":""}">
      <div class="rank-no">${fmt(i+1)}</div><div class="avatar">${initials(x.name)}</div>
      <div class="rank-main"><b>${x.name}${x.me?" (شما)":""}</b><small>${hoursText(x.hours)} · ${fmt(x.tests)} تست</small></div>
      <div class="rank-score">${fmt(Math.round(x.hours*10))}</div>
    </div>`).join("");
  }

  function renderHistory(){
    const tbody=$("[data-history]"); if(!tbody)return;
    const rows=reports.slice().sort((a,b)=>b.date.localeCompare(a.date));
    tbody.innerHTML=rows.length?rows.map(r=>{
      const z=totals([r]);
      return `<tr><td>${r.label}</td><td>${fmt(r.lessons.length)}</td><td>${hoursText(z.hours)}</td><td>${fmt(z.tests)}</td><td>${fmt(z.eff)}٪</td><td><button class="btn" data-view-report="${r.date}">مشاهده</button></td></tr>`;
    }).join(""):`<tr><td colspan="6" class="empty">هنوز سابقه‌ای ثبت نشده است.</td></tr>`;
    $$("[data-view-report]").forEach(b=>b.addEventListener("click",()=>showReport(b.dataset.viewReport)));
  }

  function showReport(date){
    const r=reports.find(x=>x.date===date); if(!r)return;
    const z=totals([r]);
    const html=`<div class="panel" style="margin-top:15px" data-report-detail>
      <div class="report-head"><div><span class="kicker">جزئیات گزارش</span><h3>${r.label}</h3></div><div class="badge">${fmt(z.eff)}٪ بازدهی</div></div>
      ${r.lessons.map((x,i)=>`<div class="lesson"><div class="lesson-title"><div class="lesson-number"><span class="number">${fmt(i+1)}</span>${x.subject}</div><span class="muted small">${hoursText(x.hours)} · ${fmt(x.tests)} تست</span></div><p class="small muted">${x.desc||"توضیحی ثبت نشده است."}</p></div>`).join("")}
    </div>`;
    const old=$("[data-report-detail]"); if(old)old.remove();
    $(".page-head")?.insertAdjacentHTML("afterend",html);
  }

  function renderLeaderboard(){
    const w=weekly(); const rows=[...peers,{name:currentName(),hours:w.hours,tests:w.tests,eff:w.eff,me:true}].sort((a,b)=>b.hours-a.hours);
    const box=$("[data-leaderboard]"); if(!box)return;
    box.innerHTML=rows.map((x,i)=>`<div class="rank ${x.me?"me":""}">
      <div class="rank-no">${fmt(i+1)}</div><div class="avatar">${initials(x.name)}</div>
      <div class="rank-main"><b>${x.name}${x.me?" (شما)":""}</b><small>${hoursText(x.hours)} مطالعه · ${fmt(x.tests)} تست · ${fmt(x.eff)}٪ بازدهی</small></div>
      <div class="rank-score">${fmt(Math.round(x.hours*10))} امتیاز</div>
    </div>`).join("");
    const rank=rows.findIndex(x=>x.me)+1;
    $$("[data-rank]").forEach(x=>x.textContent=fmt(rank));
  }

  function bindProfile(){
    const f=$("[data-profile-form]"); if(!f)return;
    ["firstName","lastName","grade","field","about"].forEach(n=>{const el=f.elements[n];if(el)el.value=profile[n]||""});
    $$("[data-profile-name]").forEach(x=>x.textContent=currentName());
    const photo=$("[data-profile-photo]");
    if(photo) photo.innerHTML=profile.avatar?`<img src="${profile.avatar}" alt="تصویر پروفایل">`:`<span>${initials(currentName())}</span>`;
    const file=$("[data-avatar]");
    if(file)file.addEventListener("change",()=>{
      const f=file.files?.[0];if(!f)return;
      if(f.size>2*1024*1024){toast("حجم تصویر باید کمتر از ۲ مگابایت باشد");return}
      const rd=new FileReader();rd.onload=()=>{profile.avatar=rd.result;save(PROFILE,profile);bindProfile();toast("تصویر پروفایل به‌روزرسانی شد")};rd.readAsDataURL(f);
    });
    f.addEventListener("submit",e=>{
      e.preventDefault();["firstName","lastName","grade","field","about"].forEach(n=>profile[n]=f.elements[n].value.trim());
      save(PROFILE,profile);toast("اطلاعات پروفایل ذخیره شد");setTimeout(()=>location.href="dashboard.html",400);
    });
  }

  function bindNav(){
    const cur=location.pathname.split("/").pop()||"dashboard.html";
    $$(".nav-links a").forEach(a=>{if(a.getAttribute("href")===cur)a.classList.add("active")});
    const toggle=$("[data-mobile]");
    if(toggle)toggle.addEventListener("click",()=>$(".nav-links").classList.toggle("open"));
    const theme=$("[data-theme]");
    if(theme)theme.addEventListener("click",()=>{document.body.classList.toggle("night");save("ak_theme",document.body.classList.contains("night")?"night":"light")});
    if(load("ak_theme","light")==="night")document.body.classList.add("night");
  }

  function bindReport(){
    const date=$("[data-fixed-date]");if(date)date.value=today();
    renderReportBuilder();
    const add=$("[data-add-lesson]");if(add)add.addEventListener("click",()=>{const box=$("[data-lessons]");const i=$$(".lesson",box).length;box.insertAdjacentHTML("beforeend",renderLesson(i,{}));bindLessons();renumber()});
    const form=$("[data-report-form]");if(form)form.addEventListener("submit",e=>{e.preventDefault();saveReport()});
  }

  function bindLogin(){
    const f=$("[data-login]");if(!f)return;
    f.addEventListener("submit",e=>{e.preventDefault();const name=f.elements.name.value.trim();if(!name){toast("نام را وارد کنید");return}profile.firstName=name.split(" ")[0];profile.lastName=name.split(" ").slice(1).join(" ");save(PROFILE,profile);toast("ورود با موفقیت انجام شد");setTimeout(()=>location.href="dashboard.html",450)});
  }

  document.addEventListener("DOMContentLoaded",()=>{
    bindNav();bindReport();bindProfile();bindLogin();
    if($("[data-dashboard]"))renderDashboard();
    if($("[data-history]"))renderHistory();
    if($("[data-leaderboard]"))renderLeaderboard();
    $$("[data-print]").forEach(b=>b.addEventListener("click",()=>window.print()));
    $$("[data-clear]").forEach(b=>b.addEventListener("click",()=>{if(confirm("تمام گزارش‌های ذخیره‌شده حذف شود؟")){reports=[];save(KEY,reports);location.reload()}}));
  });
})();
