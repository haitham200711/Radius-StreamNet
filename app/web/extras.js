// Smaller ADV pages: overviews ("نظرة عامة"), IP Pool, prices, smart features, tools.
"use strict";
const viewOf = () => new URLSearchParams(location.hash.split("?")[1] || "").get("view");

const studioStatBox = (colorTheme, num, lbl, iconBi, link, badgeTxt) => `
  <div class="bento-kpi-card">
    <div class="bento-kpi-top">
      <div class="bento-kpi-values">
        <span class="bento-kpi-num" style="color:var(--c-${colorTheme}-text)">${num}</span>
        <span class="bento-kpi-lbl">${lbl}</span>
      </div>
      <div class="bento-kpi-icon" style="background:var(--c-${colorTheme}-bg);color:var(--c-${colorTheme}-text)">
        <i class="bi ${iconBi}"></i>
      </div>
    </div>
    <div class="bento-kpi-footer">
      <span class="bento-kpi-pill" style="background:var(--c-${colorTheme}-bg);color:var(--c-${colorTheme}-text)">${badgeTxt || "مباشر"}</span>
      <a href="#${link || ""}" class="bento-kpi-link">استعراض التفاصيل ←</a>
    </div>
  </div>
`;

// overview pages wrap the list pages
for (const [k, fn] of Object.entries({
  subscribers: async () => {
    const d = await api("dashboard");
    const byProf = await api("profiles/full");
    const totalUsers = d.subscribers || 1;
    C(`
      <div class="overview-studio-container" style="width:100%;display:flex;flex-direction:column;gap:20px">
        <div class="bento-subcard">
          <div class="bento-subcard-head">
            <div class="bento-head-title">
              <div class="bento-head-icon"><i class="bi bi-grid-1x2-fill"></i></div>
              <h3>نظرة عامة على المشتركين والخدمات</h3>
            </div>
            <span class="bento-head-desc">متابعة التوزيع التشغيلي، حالات الحسابات، وتوزيع المشتركين على الباقات</span>
          </div>
        </div>

        <div class="studio-bento-grid">
          ${studioStatBox("blue", fmt(d.subscribers), "إجمالي المشتركين المسجلين", "bi-people-fill", "subscribers", "100% مسجلين")}
          ${studioStatBox("green", fmt(d.active), "المشتركون المتاحون (Active)", "bi-check-circle-fill", "subscribers?status=active", "شغال ومفعل")}
          ${studioStatBox("amber", fmt(d.expired), "الاشتراكات المنتهية الصلاحية", "bi-hourglass-bottom", "subscribers?status=expired", "تستحق تجديد")}
          ${studioStatBox("blue", fmt(d.mode === "shadow" ? d.adv_online : d.online), "المتصلون الآن لحظياً (Online)", "bi-broadcast", "online", "جلسة نشطة")}
          ${studioStatBox("purple", fmt(d.expiring), "ينتهي اشتراكهم خلال 3 أيام", "bi-alarm-fill", "subscribers?status=expiring", "تنبيه استباقي")}
          ${studioStatBox("red", fmt(d.disabled), "المشتركون الموقوفون مؤقتاً", "bi-slash-circle-fill", "subscribers?status=disabled", "إيقاف إداري")}
        </div>

        <div class="bento-subcard">
          <div class="bento-subcard-head">
            <div class="bento-head-title">
              <div class="bento-head-icon"><i class="bi bi-pie-chart-fill"></i></div>
              <h3>توزيع المشتركين حسب الباقة والعرض</h3>
            </div>
            <span class="bento-head-desc">إجمالي الباقات النشطة: ${byProf.filter(p => p.users > 0).length}</span>
          </div>
          <div class="tablewrap" style="border:0">
            <table class="modern-dist-table">
              <thead>
                <tr>
                  <th>اسم الباقة / العرض</th>
                  <th>السعر الشهري</th>
                  <th>عدد المشتركين</th>
                  <th>نسبة التوزيع الإجمالية</th>
                  <th>إجراء</th>
                </tr>
              </thead>
              <tbody>
                ${byProf.filter(p => p.users > 0).sort((a, b) => b.users - a.users).map(p => {
                  const pct = Math.round((p.users / totalUsers) * 100);
                  return `
                    <tr>
                      <td><b style="color:var(--text-main)">${esc(p.name)}</b></td>
                      <td><b class="mono" style="color:var(--accent)">${fmt(p.price)} ج.م</b></td>
                      <td><b>${fmt(p.users)} مشترك</b></td>
                      <td>
                        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
                        <span class="mono" style="font-size:12px;font-weight:700">${pct}%</span>
                      </td>
                      <td><a href="#subscribers" class="bento-kpi-link">استعراض المشتركين ←</a></td>
                    </tr>
                  `;
                }).join("") || '<tr><td colspan="5" class="empty">لا توجد باقات مرتبطة بمشتركين حالياً</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `);
  },
  profiles: async () => {
    const list = await api("profiles/full"), used = list.filter(p => p.users > 0);
    const sumMonthly = used.reduce((a, p) => a + p.users * p.price, 0);
    C(`
      <div class="overview-studio-container" style="width:100%;display:flex;flex-direction:column;gap:20px">
        <div class="bento-subcard">
          <div class="bento-subcard-head">
            <div class="bento-head-title">
              <div class="bento-head-icon"><i class="bi bi-tags-fill"></i></div>
              <h3>نظرة عامة على الباقات والعروض</h3>
            </div>
          </div>
        </div>
        <div class="studio-bento-grid">
          ${studioStatBox("blue", list.length, "إجمالي العروض المسجلة", "bi-tags-fill", "profiles", "باقات النظام")}
          ${studioStatBox("green", used.length, "عروض مستخدمة فعلياً", "bi-check-all", "profiles", "نشطة")}
          ${studioStatBox("purple", fmt(sumMonthly) + " ج.م", "قيمة الاشتراكات الشهرية تقريباً", "bi-cash-coin", "profiles", "عائد متوقع")}
        </div>
        <div class="bento-subcard">
          <div class="bento-subcard-head">
            <div class="bento-head-title"><h3>العروض النشطة والمشتركون</h3></div>
          </div>
          <div class="tablewrap" style="border:0">
            ${table(used.sort((a, b) => b.users - a.users), [["name", "العرض"], ["price", "السعر"], ["users", "المشتركين"]])}
          </div>
        </div>
      </div>
    `);
  },
  managers: async () => {
    const list = await api("managers");
    const sumBal = list.reduce((a, m) => a + Number(m.balance || 0), 0);
    const sumUsers = list.reduce((a, m) => a + Number(m.users || 0), 0);
    C(`
      <div class="overview-studio-container" style="width:100%;display:flex;flex-direction:column;gap:20px">
        <div class="bento-subcard">
          <div class="bento-subcard-head">
            <div class="bento-head-title">
              <div class="bento-head-icon"><i class="bi bi-person-lines-fill"></i></div>
              <h3>نظرة عامة على المدراء والموزعين</h3>
            </div>
          </div>
        </div>
        <div class="studio-bento-grid">
          ${studioStatBox("blue", list.length, "إجمالي المدراء", "bi-people", "managers", "فروع النظام")}
          ${studioStatBox("green", fmt(sumBal) + " ج.م", "إجمالي أرصدة المدراء", "bi-wallet2", "managers", "محافظ نشطة")}
          ${studioStatBox("purple", fmt(sumUsers), "مشتركون تحت إدارة المدراء", "bi-person-check", "managers", "مشتركون")}
        </div>
        <div class="bento-subcard">
          <div class="tablewrap" style="border:0">
            ${table(list.sort((a, b) => b.users - a.users), [["username", "المدير"], ["full_name", "الاسم"], ["balance", "الرصيد"], ["users", "المشتركين"]])}
          </div>
        </div>
      </div>
    `);
  },
  tickets: async () => {
    C(`
      <div class="overview-studio-container" style="width:100%">
        <div class="studio-bento-grid">
          ${studioStatBox("blue", "—", "تذاكر الدعم والشكاوى", "bi-chat-left-dots", "tickets", "مركز الدعم")}
        </div>
      </div>
    `);
  },
})) {
  const orig = PAGES[k];
  PAGES[k] = () => viewOf() === "overview" ? fn() : orig();
}

// "إضافة مدير" opens the list with the add form
{ const orig = PAGES.managers; PAGES.managers = async () => { await orig(); if (new URLSearchParams(location.hash.split("?")[1] || "").get("add") === "1") document.querySelector('[data-mact="add"]')?.click(); }; }

PAGES.ippool = async () => {
  const list = await api("profiles/full"), pools = {};
  list.forEach(p => { const n = p.pool || (p.f || {}).pool_name; if (n) (pools[n] = pools[n] || []).push(p.name); });
  C(`<div class="adv-card"><div class="adv-head"><span><i class="bi bi-sitemap"></i> IP Pool</span></div><div class="adv-body">
    <p class="muted">الـ Pools نفسها متعرّفة على السيرفرات (MikroTik). هنا اسم كل Pool والعروض اللي بتستخدمه.</p>
    <div class="tablewrap">${table(Object.entries(pools).map(([n, ps]) => ({ n, c: ps.length, ps: ps.join("، ") })), [["n", "اسم الـ Pool"], ["c", "عدد العروض"], ["ps", "العروض"]])}</div></div></div>`);
};
PAGES.pricing = async () => {
  const list = await api("profiles/full");
  C(`<div class="adv-card"><div class="adv-head"><span><i class="bi bi-tags"></i> اسعار العروض</span></div><div class="adv-body">
    <div class="tablewrap">${table(list, [["name", "العرض"], ["price", "السعر الأساسي (EGP)", v => Number(v).toFixed(2)], ["users", "المشتركين"]])}</div>
    <p class="muted">الأسعار الخاصة لكل مدير هتتعمل في المرحلة الجاية.</p></div></div>`);
};
PAGES.smart = async () => {
  const d = await api("settings").catch(() => ({ settings: [] })), S = Object.fromEntries((d.settings || []).map(x => [x.k, x.v]));
  C(`<div class="adv-card"><div class="adv-head"><span><i class="bi bi-magic"></i> المزايا الذكية</span></div><div class="adv-body"><form id="lf">
    <h3 class="form-section">نقاط تشجيعية <div class="adv-sw"><span>مفعّلة</span><label class="onoff"><input type="checkbox" name="loyalty_on" ${S.loyalty_on === "1" ? "checked" : ""}><b data-on="ON" data-off="OFF"></b></label></div></h3>
    <div class="g12"><div class="fg s6"><label>خيارات</label><select name="loyalty_for"><option value="manager" ${S.loyalty_for === "manager" ? "selected" : ""}>للمدير</option>
      <option value="subscriber" ${S.loyalty_for !== "manager" ? "selected" : ""}>للمشترك</option></select></div></div>
    <p class="muted"><b>كيف تعمل؟</b> يكسب المشترك نقاط عند كل تجديد أو شحن (1 نقطة لكل 10 وحدة عملة). يقدر يستبدل 100 نقطة برصيد. النقاط بتتحسب تلقائي.</p>
    <div class="form-actions"><button class="b-save">حفظ</button></div></form></div></div>`);
  $("#lf").onsubmit = async e => { e.preventDefault(); const f = formData(e.target); f.loyalty_on = e.target.loyalty_on.checked ? "1" : "0"; await act(() => api("settings", { method: "PUT", body: f }), "تم الحفظ"); };
};
PAGES.tools = () => PAGES.sync();
