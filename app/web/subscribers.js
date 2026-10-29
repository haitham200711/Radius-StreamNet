// "قائمة المشتركين والتشخيص التشغيلي" — NOC Commander Direction 1: High-Density Operational Console & Sliding Diagnostic Drawer.
"use strict";

const SUB_COLS = [
  ["chk", ""], ["n", "#"], ["diag", "التشخيص"], ["username", "اسم المستخدم"], ["firstname", "الاسم الأول"], ["money", "رصيد نقدي (EGP)"], ["quota", "الكوتة المتبقية"],
  ["expiration", "وقت الانتهاء"], ["ip", "عنوان IP"], ["profile", "الباقة"], ["lastname", "الاسم الأخير"], ["mac", "عنوان MAC"], ["manager", "المدير"],
  ["mobile", "الهاتف"], ["created", "تم إنشائه في"], ["notes", "ملاحظات"], ["paid_total", "إجمالي الفواتير المدفوعة (EGP)"],
  ["unpaid_total", "إجمالي الفواتير الغير مدفوعة (EGP)"], ["online", ""], ["address", "العنوان"], ["used", "استهلاك الكوتة"], ["framed_ip", "IP ثابت"],
];
const SUB_HIDDEN_DEFAULT = ["lastname", "mac", "manager", "created", "paid_total", "unpaid_total", "used", "framed_ip"];
const SUB_SORT = { username: "name", money: "money", quota: "quota", expiration: "exp", created: "created" };

const SUB_STATUS = [
  ["", "كل المشتركين"], ["active", "المشتركين المتاحين"], ["expired", "المشتركين المنتهي اشتراكهم"], ["quota", "منتهي الكوتة"],
  ["none", "منتهي الكوتة اليومية"], ["expiring", "ينتهي وقتهم خلال 3 أيام"], ["today", "ينتهي وقتهم اليوم"], ["unavailable", "مشتركين غير متاحين"],
  ["offline", "المشتركين الغير متصلين"], ["online", "المشتركين المتصلين"], ["borrowed", "المشتركين المستلفين"], ["auto_sub", "تفعيل تلقائي من حساب المشترك"],
  ["auto_mgr", "تفعيل تلقائي من حساب المدير"], ["static", "لديه ايبي ثابت"], ["debtors", "مدينون"], ["special_speed", "لديه سرعة خاصة"], ["temp_speed", "لديه سرعة مؤقتة"],
  ["none", "اسم مختلف في الجلسات"], ["discount", "مشتركون لديهم خصم"], ["disabled", "الموقوفون مؤقتًا"], ["none", "الموجّه متصل"], ["none", "الموجّه غير متصل"],
  ["nosession", "غير متصل بالإنترنت"], ["nosession", "لا توجد جلسة إنترنت"], ["expired", "اشتراك الإنترنت منتهي"]
];

const ST_COLOR = {
  _exp_3: ["#80ff80", "ينتهي وقتهم خلال 3 أيام"],
  _exp_1: ["#ccffcc", "ينتهي وقتهم اليوم"],
  _exp_: ["#EAD303", "منتهي"],
  _exp_q: ["#f1a447", "منتهي الكوتة"],
  _dis_: ["#ff3b3be0", "معطل"]
};

const ACT_MENU = [
  ["CREDITS", "الرصيد"], ["REF_CARD", "شحن بالكارت"], ["TRIAL", "تجريبي"], ["ADD_TIME", "إضافة وقت"],
  ["ADD_ADVANCE", "إضافة سلفة"], ["SELF_BORROW_BY_ADMIN", "سلفة من حساب المشترك"], ["ADD_NEW_QUOTA", "إضافة كوتة"],
  ["multi", "تجديد متعدد"], ["RECH_CASH", "شحن بالرصيد النقدي"], ["ADD_CASH", "إضافة مبلغ نقدي"],
  ["WITHDRAW_CASH", "سحب مبلغ نقدي"], ["pay_with_wallet", "التفعيل برقم المعاملة"]
];

const MORE_MENU = [
  ["print", "طباعة اخر فاتورة"], ["print", "طباعة إيصال"], ["rename_user", "إعادة تسمية"], ["copy", "تكرار"],
  ["disconnect_user", "فصل الإتصال"], ["send_msg", "إرسال رسالة"], ["soon", "إنشاء عقد"], ["delete_user", "حذف"],
  ["soon", "استعادة الكوتة اليومية"], ["soon", "ضغط البيانات"], ["toggle", "تغيير الحالة"], ["mac", "تعديل عنوان الماك"],
  ["PART_PAY", "دفع جزئي"], ["disable", "إيقاف مؤقت"]
];

function subHidden() {
  try { return JSON.parse(localStorage.getItem("rm_sub_hidden2")) || SUB_HIDDEN_DEFAULT; } catch (_) { return SUB_HIDDEN_DEFAULT; }
}
function subSaveHidden(h) {
  try { localStorage.setItem("rm_sub_hidden2", JSON.stringify(h)); } catch (_) {}
}
function bytesTxt(mb) {
  const b = Number(mb || 0) * 1048576;
  if (b <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0, v = b;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${u[i]}`;
}
function octetsTxt(oct) {
  const b = Number(oct || 0);
  if (b <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0, v = b;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${u[i]}`;
}
function secondsDuration(sec) {
  const s = Math.max(0, Number(sec || 0));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  let parts = [];
  if (d > 0) parts.push(`${d} يوم`);
  if (h > 0 || d > 0) parts.push(`${h} س`);
  parts.push(`${m} د`);
  return parts.join(" ");
}
function advDate(s) {
  if (!s) return "—";
  const d = new Date(s.replace(" ", "T")), p = n => String(n).padStart(2, "0");
  if (isNaN(d.getTime())) return s;
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

PAGES.subscribers = async () => {
  const qs = new URLSearchParams(location.hash.split("?")[1] || "");
  const st = {
    status: qs.get("status") || "",
    q: "",
    profile_id: 0,
    manager_id: 0,
    sub: 0,
    page: 1,
    size: +(localStorage.getItem("rm_sub_size") || 25),
    sort: "",
    date_by: "created",
    from: "",
    to: ""
  };

  let rows = [], total = 0, all = 0;
  const sel = new Set();
  let lastLoadedTime = Date.now();
  let autoRefreshEnabled = true;
  let autoRefreshTimer = null;
  let staleCounterTimer = null;
  let drawerOpen = false;
  let isTyping = false;

  const ddMenu = (id, items) => `<div class="dd-menu" id="${id}">${items.map(([k, t]) => `<a data-act="${k}" class="${k === "soon" ? "soon" : ""}">${t}</a>`).join("")}</div>`;

  // Main Template
  C(`<div class="adv-card">
    <div class="adv-head">
      <span><i class="bi bi-person-fill-plus"></i> المشتركون والتشخيص التشغيلي <small id="foundTxt"></small></span>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="icon-btn" id="reload" title="تحديث فوري"><i class="bi bi-arrow-repeat"></i></button>
      </div>
    </div>
    <div class="adv-body">
      <!-- NOC Telemetry & Auto-Refresh Bar -->
      <div class="noc-telemetry-bar">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span class="stale-badge stale-fresh" id="staleBadge">
            <span class="stale-dot"></span>
            <span>آخر تحديث: <b id="staleSec">منذ لحظات</b></span>
          </span>
          <button id="btnToggleRefresh" class="btn-refresh-toggle" title="إيقاف / استئناف التحديث الدوري التلقائي">
            <i class="bi bi-pause-fill"></i> <span>تحديث تلقائي (30ث)</span>
          </button>
        </div>
        <div style="font-size:12px;color:#8e8e93">
          <span>وضع التشغيل: <b style="color:#ffffff">${ME.mode === "shadow" ? "مراقبة (Shadow)" : "تشغيل حي (Live)"}</b></span>
          <span style="margin-inline:8px">|</span>
          <span>المستخدم: <b style="color:#ffffff">${esc(ME.admin.username)}</b></span>
        </div>
      </div>

      <!-- 2-Tier Streamlined NOC Toolbar -->
      <div class="noc-toolbar" style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;margin-bottom:16px;padding:14px 18px;display:flex;flex-direction:column;gap:12px;box-shadow:var(--shadow-sm)">
        
        <!-- Tier 1: Search & Primary Action Commands -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:280px;max-width:480px">
            <div class="adv-inline" style="width:100%;display:flex;align-items:center;background:var(--bg-card-subtle);border:1px solid var(--border);border-radius:10px;padding:2px 10px">
              <span class="adv-cal" style="color:var(--text-muted);font-size:15px"><i class="bi bi-search"></i></span>
              <input id="q" placeholder="ابحث باسم المشترك، IP، MAC، أو الهاتف..." style="border:0;background:transparent;height:38px;padding:0 8px;width:100%;font-size:13px">
            </div>
            <button class="btn-primary" id="go2" style="height:38px;padding:0 16px;border-radius:10px;font-size:13px;white-space:nowrap"><i class="bi bi-search"></i> بحث</button>
          </div>

          <div class="adv-actions" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <button class="btn-primary" id="aAdd" style="height:38px;padding:0 16px;border-radius:10px;font-size:13px"><i class="bi bi-person-plus-fill"></i> إضافة مشترك</button>
            <button class="btn-secondary" id="a360" style="height:38px;padding:0 14px;border-radius:10px;font-size:13px"><i class="bi bi-person-badge"></i> بطاقة 360°</button>
            <span class="dd">
              <button class="btn-secondary" data-dd="dAct" style="height:38px;padding:0 14px;border-radius:10px;font-size:13px"><i class="bi bi-lightning-charge-fill"></i> تفعيل <i class="bi bi-caret-down-fill" style="font-size:10px"></i></button>
              ${ddMenu("dAct", ACT_MENU)}
            </span>
            <button class="btn-secondary" id="aProf" style="height:38px;padding:0 14px;border-radius:10px;font-size:13px"><i class="bi bi-arrow-left-right"></i> تغيير الباقة</button>
            <button class="btn-secondary" data-act="RECH_CASH" style="height:38px;padding:0 14px;border-radius:10px;font-size:13px"><i class="bi bi-cash-stack"></i> شحن نقدي</button>
            <span class="dd">
              <button class="btn-secondary" data-dd="dMore" style="height:38px;padding:0 14px;border-radius:10px;font-size:13px">المزيد <i class="bi bi-caret-down-fill" style="font-size:10px"></i></button>
              ${ddMenu("dMore", MORE_MENU)}
            </span>
          </div>
        </div>

        <!-- Tier 2: Filters & Table Controls -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-top:10px;border-top:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1">
            <select id="fst" style="height:36px;border-radius:8px;font-size:12.5px;padding:0 10px;background:var(--bg-card-subtle);border:1px solid var(--border)">
              ${SUB_STATUS.map(([k, t], i) => `<option value="${i}" ${k && k === st.status ? "selected" : ""}>${t}</option>`).join("")}
            </select>
            <select id="fp" style="height:36px;border-radius:8px;font-size:12.5px;padding:0 10px;background:var(--bg-card-subtle);border:1px solid var(--border)">
              ${options(PROFILES, 0, "name", "كل الباقات والعروض")}
            </select>
            <select id="fm" style="height:36px;border-radius:8px;font-size:12.5px;padding:0 10px;background:var(--bg-card-subtle);border:1px solid var(--border)">
              ${options(MANAGERS, 0, "username", ME.admin.username + " (" + (ME.admin.role === "admin" ? "Administrator" : ME.admin.role) + ")")}
            </select>
            <div style="display:flex;align-items:center;gap:4px">
              <select id="dateBy" style="height:36px;border-radius:8px;font-size:12px;padding:0 6px;background:var(--bg-card-subtle);border:1px solid var(--border)">
                <option value="created">الإنشاء</option>
                <option value="expiration">الانتهاء</option>
              </select>
              <input type="date" id="dFrom" style="height:36px;border-radius:8px;font-size:12px;padding:0 6px;background:var(--bg-card-subtle);border:1px solid var(--border)">
              <span style="font-size:11px;color:var(--text-muted)">إلى</span>
              <input type="date" id="dTo" style="height:36px;border-radius:8px;font-size:12px;padding:0 6px;background:var(--bg-card-subtle);border:1px solid var(--border)">
              <button id="go1" class="btn-secondary" title="تطبيق فلترة التاريخ" style="height:36px;padding:0 10px;border-radius:8px"><i class="bi bi-funnel"></i></button>
            </div>
            <label class="switch" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin-right:6px">
              <input type="checkbox" id="fsub" style="width:16px;height:16px"> <span>موزعو النظام</span>
            </label>
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <select id="psize" style="height:36px;border-radius:8px;font-size:12px;padding:0 8px;background:var(--bg-card-subtle);border:1px solid var(--border)">
              ${[10, 25, 50, 100, 250, 500, 1000].map(n => `<option value="${n}" ${n === st.size ? "selected" : ""}>${n} في الصفحة</option>`).join("")}
            </select>
            <div class="adv-tbtns" style="display:flex;align-items:center;gap:4px">
              <button id="tCsv" class="btn-secondary" title="تصدير CSV" style="height:36px;padding:0 10px;border-radius:8px;font-size:12px"><i class="bi bi-file-earmark-text"></i> CSV</button>
              <button id="tXls" class="btn-secondary" title="تصدير Excel" style="height:36px;padding:0 10px;border-radius:8px;font-size:12px"><i class="bi bi-file-earmark-excel"></i> Excel</button>
              <button id="tPrint" class="btn-secondary" title="طباعة القائمة" style="height:36px;padding:0 10px;border-radius:8px;font-size:12px"><i class="bi bi-printer"></i></button>
              <span class="dd">
                <button data-dd="dCols" class="btn-secondary" title="عرض/إخفاء الأعمدة" style="height:36px;padding:0 10px;border-radius:8px;font-size:12px"><i class="bi bi-layout-three-columns"></i></button>
                <div class="dd-menu" id="dCols"></div>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Operational Grid Table -->
      <div class="tablewrap" id="tableWrap">
        <table class="adv-table" id="advT"></table>
      </div>

      <div class="adv-tools">
        <div id="infoTxt" class="muted"></div>
        <div class="adv-pager" id="pg"></div>
      </div>
    </div>
  </div>

  <!-- Sliding Diagnostic Drawer Container -->
  <div id="diagOverlay" class="diag-drawer-overlay"></div>
  <aside id="diagDrawer" class="diag-drawer" role="dialog" aria-modal="true" aria-label="لوحة التشخيص الفوري">
    <div class="diag-header" style="background:var(--bg-card-subtle);border-bottom:1px solid var(--border);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
      <div class="diag-header-info">
        <h3 style="margin:0;font-size:1.15rem;font-weight:800;display:flex;align-items:center;gap:8px">
          <i class="bi bi-activity" style="color:var(--accent)"></i> تشخيص المشترك: <bdi dir="ltr" class="tech-val mono" id="diagUsername"></bdi>
        </h3>
        <div class="diag-sub" id="diagSubInfo" style="margin-top:4px;font-size:12px;color:var(--text-muted)"></div>
      </div>
      <button class="drawer-close-btn" id="diagClose" title="إغلاق (Esc)" style="width:34px;height:34px;border-radius:10px;background:var(--bg-card);border:1px solid var(--border);color:var(--text-main);font-size:20px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer">&times;</button>
    </div>
    <div class="diag-body" id="diagBody">
      <!-- Dynamic Content Populated on Row Selection -->
    </div>
  </aside>`);

  const hidden = () => subHidden();
  const visCols = () => SUB_COLS.filter(([k]) => !hidden().includes(k));

  const drawCols = () => {
    $("#dCols").innerHTML = SUB_COLS.filter(([k, t]) => k !== "chk" && k !== "n" && k !== "diag" && t).map(([k, t]) =>
      `<label class="dd-chk"><input type="checkbox" data-col="${k}" ${hidden().includes(k) ? "" : "checked"}> ${t}</label>`).join("");
    $("#dCols").querySelectorAll("input").forEach(i => i.onchange = () => {
      const h = new Set(hidden());
      i.checked ? h.delete(i.dataset.col) : h.add(i.dataset.col);
      subSaveHidden([...h]);
      draw();
    });
  };

  const nCell = (s, n) => {
    let color = "", title = "";
    if (s.st === "_act_") [color, title] = +s.online ? ["#0055ff", "متصل"] : ["#10b981", "نشط"];
    else if (ST_COLOR[s.st]) [color, title] = ST_COLOR[s.st];
    let bg = color;
    if (+s.borrowed) {
      const base = color || "#ffffff", b = s.st === "_exp_q" ? "#8e44ad" : "#f7a522";
      bg = `linear-gradient(to left, ${base} 0%, ${base} 52%, ${b} 100%)`;
      title = (title ? title + " & " : "") + "مستلف";
    }
    return `<td class="c-n" style="background:${bg}" title="${esc(title)}">${n}</td>`;
  };

  const cell = (k, s, i) => {
    switch (k) {
      case "chk":
        return `<td class="c-chk"><input type="checkbox" data-sel="${s.id}" ${sel.has(+s.id) ? "checked" : ""}></td>`;
      case "n":
        return nCell(s, (st.page - 1) * st.size + i + 1);
      case "diag":
        return `<td><button class="btn-diag-action" data-diag="${s.id}" title="فتح لوحة التشخيص الفوري"><i class="bi bi-activity"></i> تشخيص</button></td>`;
      case "username": {
        const hl = +s.online && s.st !== "_act_" ? ' style="background:#0055ff;color:#fff" title="متصل"' : "";
        const badges = (+s.discount > 0 ? ' <span class="mini green">خصم %</span>' : "");
        return `<td><a class="u-pill font-mono" data-diag="${s.id}" ${hl} title="انقر للتشخيص الفوري"><bdi dir="ltr" class="tech-val">${esc(s.username)}</bdi></a>${badges}</td>`;
      }
      case "money":
        return `<td><bdi dir="ltr" class="tech-val">${Number(s.money || 0).toFixed(2)}</bdi></td>`;
      case "quota": {
        if (+s.profile_quota <= 0) return "<td><span class=\"tag gray\">غير محدود</span></td>";
        const remMb = Number(s.quota_mb || 0) - Number(s.used_mb || 0);
        const t = bytesTxt(remMb);
        return `<td${remMb <= 0 ? ' style="background:#efa51e;color:#fff;font-weight:700"' : ""}><bdi dir="ltr" class="tech-val">${t}</bdi></td>`;
      }
      case "used":
        return `<td><bdi dir="ltr" class="tech-val">${bytesTxt(s.used_mb)}</bdi></td>`;
      case "expiration": {
        const exp = !s.expiration || new Date(s.expiration.replace(" ", "T")) < new Date();
        return `<td${exp && s.expiration ? ' style="background:#efa51e;color:#fff"' : ""}><bdi dir="ltr" class="tech-val">${s.expiration ? advDate(s.expiration) : "---"}</bdi></td>`;
      }
      case "created":
        return `<td><bdi dir="ltr" class="tech-val">${advDate(s.created)}</bdi></td>`;
      case "ip":
        return `<td>${s.ip ? `<b><bdi dir="ltr" class="tech-val">${esc(s.ip)}</bdi></b><div class="nas" style="font-size:11px;color:#8e8e93">NAS: <bdi dir="ltr" class="tech-val">${esc(s.nas_name || s.nas || "")}</bdi></div>` : "—"}</td>`;
      case "online":
        return `<td>${+s.online ? '<span class="tag green"><i class="bi bi-circle-fill"></i> متصل</span>' : '<span class="tag gray">غير متصل</span>'}</td>`;
      case "paid_total":
      case "unpaid_total":
        return `<td><bdi dir="ltr" class="tech-val">${Number(s[k] || 0).toFixed(2)}</bdi></td>`;
      case "firstname":
        return `<td>${esc(s.firstname || "")}</td>`;
      case "notes":
      case "address":
        return `<td class="c-txt">${esc(String(s[k] ?? "").replace(/\\n|\n/g, " "))}</td>`;
      default:
        return `<td>${esc(s[k] ?? "")}</td>`;
    }
  };

  // State 1: Skeleton Loader Shimmer
  const renderSkeleton = () => {
    const cols = visCols();
    const rowsHtml = Array.from({ length: 6 }).map(() =>
      `<tr class="skeleton-row">${cols.map(() => '<td><div class="skeleton-cell"></div></td>').join("")}</tr>`
    ).join("");
    $("#advT").innerHTML = `<thead><tr>${cols.map(([k, t]) => `<th>${t}</th>`).join("")}</tr></thead><tbody>${rowsHtml}</tbody>`;
  };

  // State 2: Operational Empty State
  const renderEmpty = () => {
    const cols = visCols();
    return `<tr><td colspan="${cols.length}">
      <div class="noc-empty-state">
        <i class="bi bi-search-minus noc-empty-icon"></i>
        <h3>لم يتم العثور على أي مشتركين يطابقون البحث</h3>
        <p>لا توجد نتائج مطابقة لمعايير الفلترة الحالية (الاسم، الحالة، الباقة، أو نطاق التاريخ).</p>
        <button class="noc-btn-reset" id="btnEmptyReset"><i class="bi bi-undo"></i> إعادة تعيين الفلاتر والبحث</button>
      </div>
    </td></tr>`;
  };

  // State 3: Operational Error State
  const renderError = (errMsg) => {
    const cols = visCols();
    return `<tr><td colspan="${cols.length}">
      <div class="noc-error-state">
        <i class="bi bi-exclamation-triangle-fill noc-error-icon"></i>
        <h3>تعذر تحميل بيانات المشتركين</h3>
        <p>${esc(errMsg || "خطأ غير متوقع أثناء الاتصال بالخادم.")}</p>
        <button class="noc-btn-retry" id="btnErrorRetry"><i class="bi bi-arrow-repeat"></i> إعادة المحاولة الآن</button>
      </div>
    </td></tr>`;
  };

  const draw = () => {
    const cols = visCols();
    const thead = `<thead><tr>${cols.map(([k, t]) => k === "chk" ? '<th class="c-chk"><input type="checkbox" id="selAll"></th>'
      : `<th ${SUB_SORT[k] ? `class="sortable" data-sort="${SUB_SORT[k]}"` : ""}>${t}${SUB_SORT[k] ? ` <i class="bi bi-arrow-down-up${st.sort === SUB_SORT[k] ? "-asc" : ""}"></i>` : ""}</th>`).join("")}</tr></thead>`;

    let tbodyContent = "";
    if (rows.length) {
      tbodyContent = rows.map((s, i) =>
        `<tr data-id="${s.id}" data-u="${esc(s.username)}">${cols.map(([k]) => cell(k, s, i)).join("")}</tr>`
      ).join("");
    } else {
      tbodyContent = renderEmpty();
    }

    $("#advT").innerHTML = `${thead}<tbody>${tbodyContent}</tbody>`;
    $("#foundTxt").textContent = `( تم إيجاد ${fmt(total)} من ${fmt(all)} مشتركين )`;
    const from = total ? (st.page - 1) * st.size + 1 : 0;
    $("#infoTxt").textContent = `إظهار ${fmt(from)} إلى ${fmt(Math.min(total, st.page * st.size))} من أصل ${fmt(total)} مُدخل`;

    // Event bindings
    $("#selAll").onchange = e => {
      rows.forEach(s => e.target.checked ? sel.add(+s.id) : sel.delete(+s.id));
      draw();
    };
    document.querySelectorAll("[data-sel]").forEach(c => c.onchange = () => c.checked ? sel.add(+c.dataset.sel) : sel.delete(+c.dataset.sel));
    
    // Diagnostic drawer triggers (Clicking username or dedicated diagnosis button)
    document.querySelectorAll("[data-diag]").forEach(c => c.onclick = (e) => {
      e.stopPropagation();
      openDiagnosticDrawer(+c.dataset.diag);
    });

    // Clicking row opens diagnostic drawer if not clicking a checkbox/menu
    document.querySelectorAll("#advT tbody tr[data-id]").forEach(tr => {
      tr.onclick = (e) => {
        if (e.target.closest("input, button, a")) return;
        openDiagnosticDrawer(+tr.dataset.id);
      };
      tr.oncontextmenu = e => showContextMenu(e, +tr.dataset.id, tr.dataset.u, () => { sel.clear(); load(); });
    });

    document.querySelectorAll("th[data-sort]").forEach(th => th.onclick = () => {
      st.sort = st.sort === th.dataset.sort && th.dataset.sort === "exp" ? "exp_desc" : th.dataset.sort;
      load();
    });

    const btnEmptyReset = $("#btnEmptyReset");
    if (btnEmptyReset) {
      btnEmptyReset.onclick = resetFilters;
    }

    drawPager();
  };

  const drawPager = () => {
    const pages = Math.max(1, Math.ceil(total / st.size)), p = st.page;
    const nums = new Set([1, pages, p - 1, p, p + 1, p + 2, p + 3].filter(n => n >= 1 && n <= pages));
    let html = `<a class="${p <= 1 ? "dis" : ""}" data-p="${p - 1}">السابقة</a>`, last = 0;
    [...nums].sort((a, b) => a - b).forEach(n => {
      if (n - last > 1) html += "<span>…</span>";
      html += `<a class="${n === p ? "cur" : ""}" data-p="${n}">${n}</a>`;
      last = n;
    });
    html += `<a class="${p >= pages ? "dis" : ""}" data-p="${p + 1}">التالية</a>`;
    $("#pg").innerHTML = html;
    $("#pg").querySelectorAll("a[data-p]").forEach(a => a.onclick = () => {
      const n = +a.dataset.p;
      if (n >= 1 && n <= pages && n !== p) {
        st.page = n;
        load();
      }
    });
  };

  const params = extra => new URLSearchParams({
    status: st.status,
    q: st.q,
    profile_id: st.profile_id,
    manager_id: st.manager_id,
    sub: st.sub,
    page: st.page,
    size: st.size,
    sort: st.sort,
    date_by: st.from || st.to ? st.date_by : "",
    from: st.from,
    to: st.to,
    ...extra
  });

  let seq = 0;
  const load = async (opts = {}) => {
    // If background refresh and user is actively diagnosing in the drawer or typing, skip to avoid UI disruption
    if (opts.background && (drawerOpen || isTyping)) return;

    const my = ++seq;
    if (!opts.background) {
      renderSkeleton();
    }

    try {
      const r = await api("subscribers?" + params());
      if (my !== seq) return;
      rows = r.rows;
      total = r.total;
      all = r.all;
      lastLoadedTime = Date.now();
      updateStaleTelemetry(true);
      draw();
    } catch (err) {
      if (my !== seq) return;
      updateStaleTelemetry(false, err.message);
      const cols = visCols();
      $("#advT").innerHTML = `<thead><tr>${cols.map(([k, t]) => `<th>${t}</th>`).join("")}</tr></thead><tbody>${renderError(err.message)}</tbody>`;
      const btnRetry = $("#btnErrorRetry");
      if (btnRetry) btnRetry.onclick = () => load();
    }
  };

  // State 4: Telemetry & Stale Indicator update
  const updateStaleTelemetry = (ok, errStr) => {
    const badge = $("#staleBadge");
    const secSpan = $("#staleSec");
    if (!badge || !secSpan) return;

    const diff = Math.floor((Date.now() - lastLoadedTime) / 1000);
    badge.classList.remove("stale-fresh", "stale-warning", "stale-danger");

    if (!ok) {
      badge.classList.add("stale-danger");
      secSpan.textContent = `انقطع الاتصال (${errStr || "خطأ"})`;
      return;
    }

    if (diff < 15) {
      badge.classList.add("stale-fresh");
      secSpan.textContent = "منذ لحظات";
    } else if (diff < 45) {
      badge.classList.add("stale-fresh");
      secSpan.textContent = `منذ ${diff} ثانية`;
    } else {
      badge.classList.add("stale-warning");
      secSpan.textContent = `منذ ${diff} ثانية (بيانات قديمة)`;
    }
  };

  const apply = () => {
    st.page = 1;
    st.q = $("#q").value.trim();
    st.from = $("#dFrom").value;
    st.to = $("#dTo").value;
    st.date_by = $("#dateBy").value;
    load();
  };

  const resetFilters = () => {
    st.page = 1;
    st.q = "";
    st.status = "";
    st.profile_id = 0;
    st.manager_id = 0;
    st.from = "";
    st.to = "";
    $("#q").value = "";
    $("#fst").value = "0";
    $("#fp").value = "0";
    $("#fm").value = "0";
    $("#dFrom").value = "";
    $("#dTo").value = "";
    load();
  };

  // Event Listeners for Filters
  $("#fst").onchange = e => { st.status = SUB_STATUS[+e.target.value][0]; apply(); };
  $("#fp").onchange = e => { st.profile_id = +e.target.value; apply(); };
  $("#fm").onchange = e => { st.manager_id = +e.target.value; apply(); };
  $("#fsub").onchange = e => { st.sub = e.target.checked ? 1 : 0; apply(); };
  ["go1", "go2"].forEach(id => $("#" + id).onclick = apply);

  let tq;
  const live = v => {
    clearTimeout(tq);
    isTyping = true;
    tq = setTimeout(() => {
      isTyping = false;
      $("#q").value = v;
      apply();
    }, 350);
  };
  $("#q").oninput = e => live(e.target.value);
  $("#q").onkeydown = e => { if (e.key === "Enter") { clearTimeout(tq); isTyping = false; apply(); } };
  ["dFrom", "dTo"].forEach(id => $("#" + id).onchange = apply);
  $("#psize").onchange = e => { st.size = +e.target.value; try { localStorage.setItem("rm_sub_size", st.size); } catch (_) {} apply(); };
  $("#reload").onclick = () => load();

  // Auto-Refresh setup
  $("#btnToggleRefresh").onclick = () => {
    autoRefreshEnabled = !autoRefreshEnabled;
    const btn = $("#btnToggleRefresh");
    if (autoRefreshEnabled) {
      btn.classList.remove("paused");
      btn.innerHTML = '<i class="bi bi-pause-fill"></i> <span>تحديث تلقائي (30ث)</span>';
    } else {
      btn.classList.add("paused");
      btn.innerHTML = '<i class="bi bi-play-fill"></i> <span>استئناف التحديث</span>';
    }
  };

  // Timer: updates counter every 2 seconds and fires reload every 30s
  staleCounterTimer = setInterval(() => {
    updateStaleTelemetry(true);
  }, 2000);

  autoRefreshTimer = setInterval(() => {
    if (autoRefreshEnabled && !drawerOpen && !isTyping) {
      load({ background: true });
    }
  }, 30000);

  // Dropdown menus
  document.querySelectorAll("[data-dd]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    const m = $("#" + b.dataset.dd);
    const open = m.classList.contains("open");
    document.querySelectorAll(".dd-menu.open").forEach(x => x.classList.remove("open"));
    if (!open) m.classList.add("open");
  });
  if (!window.__ddClose) {
    window.__ddClose = true;
    document.addEventListener("click", e => {
      if (!e.target.closest(".dd-menu")) document.querySelectorAll(".dd-menu.open").forEach(x => x.classList.remove("open"));
    });
  }

  // Bulk Operations
  const need = () => {
    if (!sel.size) {
      toast("من فضلك اختر مشتركاً أو أكثر من الجدول للعملية", true);
      return false;
    }
    return true;
  };

  const bulk = async (action, extra = {}) => {
    const r = await act(() => api("subscribers/bulk", { method: "POST", body: { Action: action, IDs: [...sel], ...extra } }));
    toast(`تم تطبيق العملية على ${r.done} مشترك`);
    sel.clear();
    load();
  };

  const renewEach = async paid => {
    let ok = 0;
    for (const id of sel) {
      try {
        await api(`subscribers/${id}/renew`, { method: "POST", body: { ProfileID: 0, Discount: 0, Paid: paid, Notes: paid ? "" : "سلفة" } });
        ok++;
      } catch (e) {
        toast(e.message, true);
        break;
      }
    }
    if (ok) toast(`تم تجديد ${ok} مشترك`);
    sel.clear();
    load();
  };

  const doAct = async k => {
    document.querySelectorAll(".dd-menu.open").forEach(x => x.classList.remove("open"));
    if (k === "soon") return toast("الخاصية دي هتتعمل في المرحلة الجاية", true);
    if (!need()) return;

    if (k === "disconnect_user") {
      const id = [...sel][0];
      const s = rows.find(x => x.id === id);
      return confirmDangerousDisconnect(id, s ? s.username : `ID #${id}`, () => { sel.clear(); load(); });
    }

    if (USER_OPS[k]) {
      if (sel.size > 1 && k === "CREDITS") return confirm(`تجديد ${sel.size} مشترك من الرصيد؟`) && renewEach(true);
      if (sel.size > 1) return toast("اختار مشترك واحد للعملية دي", true);
      return USER_OPS[k]([...sel][0], () => { sel.clear(); load(); });
    }

    switch (k) {
      case "renew":
      case "multi":
        if (confirm(`تجديد ${sel.size} مشترك من الرصيد؟`)) renewEach(true);
        break;
      case "borrow":
        if (confirm(`إضافة سلفة (تجديد غير مدفوع) لـ ${sel.size} مشترك؟`)) renewEach(false);
        break;
      case "extend": {
        const d = prompt("عدد الأيام (1 - 60):", "1");
        if (d) bulk("extend", { Days: +d });
        break;
      }
      case "toggle":
        if (confirm(`تغيير حالة ${sel.size} مشترك؟`)) bulk("toggle");
        break;
      case "disable":
        if (confirm(`إيقاف مؤقت لـ ${sel.size} مشترك؟`)) bulk("disable");
        break;
      case "mac": {
        const v = prompt("عنوان الماك الجديد (اتركه فارغاً لإزالة التثبيت):", "");
        if (v !== null) bulk(v.trim() ? "mac" : "unmac", { Value: v });
        break;
      }
      case "print":
        printLastInvoice([...sel][0]);
        break;
      case "copy":
        location.hash = "user?copy=" + [...sel][0];
        break;
    }
  };

  document.querySelectorAll("[data-act]").forEach(a => a.onclick = () => doAct(a.dataset.act));
  $("#aAdd").onclick = () => { location.hash = "user?new=1"; };
  $("#a360").onclick = () => { if (need()) openSubscriber([...sel][0], load); };
  $("#aProf").onclick = () => {
    if (!need()) return;
    if (sel.size === 1) return USER_OPS.change_profile([...sel][0], () => { sel.clear(); load(); });
    const m = modal(`<h3>تغيير العرض لـ ${sel.size} مشترك</h3>
      <form class="form" id="cp">
        <label class="full">العرض الجديد<select name="p">${options(PROFILES, 0)}</select></label>
        <div class="actions full"><button class="green">تغيير</button></div>
      </form>`);
    $("#cp", m).onsubmit = e => {
      e.preventDefault();
      closeModal();
      bulk("profile", { ProfileID: +formData(e.target).p });
    };
  };

  const exportCSV = () => { location.href = "/api/subscribers?" + params({ format: "csv" }); };
  $("#tCsv").onclick = exportCSV;
  $("#tXls").onclick = exportCSV;
  $("#tPrint").onclick = () => window.print();

  // ==========================================================================
  // SLIDING DIAGNOSTIC DRAWER LOGIC
  // ==========================================================================
  const drawer = $("#diagDrawer");
  const overlay = $("#diagOverlay");

  const closeDiagnosticDrawer = () => {
    drawerOpen = false;
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  };

  $("#diagClose").onclick = closeDiagnosticDrawer;
  overlay.onclick = closeDiagnosticDrawer;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawerOpen) {
      closeDiagnosticDrawer();
    }
  });

  const openDiagnosticDrawer = async (subId) => {
    drawerOpen = true;
    drawer.setAttribute("aria-hidden", "false");
    drawer.classList.add("open");
    overlay.classList.add("open");

    $("#diagUsername").textContent = "...";
    $("#diagSubInfo").innerHTML = '<i class="bi bi-arrow-repeat bi-spin"></i> جاري استعلام بيانات المشترك...';
    $("#diagBody").innerHTML = `
      <div style="text-align:center;padding:50px 20px;">
        <i class="bi bi-arrow-repeat bi-spin fa-2x" style="color:#0055ff"></i>
        <div style="margin-top:12px;font-weight:700;color:#ffffff">جاري الاتصال بقاعدة بيانات RADIUS...</div>
        <div style="margin-top:4px;font-size:12px;color:#8e8e93">فحص حالة الحساب وسجلات المصادقة والجلسة النشطة</div>
      </div>`;

    try {
      const data = await api("subscribers/" + subId);
      renderDiagnosticDetails(data);
    } catch (err) {
      $("#diagBody").innerHTML = `
        <div class="noc-error-state">
          <i class="bi bi-exclamation-triangle-fill noc-error-icon"></i>
          <h3>تعذر استرجاع بيانات التشخيص</h3>
          <p>${esc(err.message || "فشل الاتصال بالخادم")}</p>
          <button class="noc-btn-retry" id="diagRetry"><i class="bi bi-arrow-repeat"></i> إعادة المحاولة</button>
        </div>`;
      const btnRetry = $("#diagRetry");
      if (btnRetry) btnRetry.onclick = () => openDiagnosticDrawer(subId);
    }
  };

  // Render the Operational Diagnostic Evaluation
  const renderDiagnosticDetails = (data) => {
    const s = data.subscriber;
    const sessions = data.sessions || [];
    const auths = data.auth_attempts || [];
    const now = new Date();
    const isOnline = +s.online === 1;

    // Header info
    $("#diagUsername").textContent = s.username;
    $("#diagSubInfo").innerHTML = `
      <span>${esc(s.firstname || "")} ${esc(s.lastname || "")}</span>
      <span>•</span>
      <span>الباقة: <b>${esc(s.profile || "بدون باقة")}</b></span>
      <span>•</span>
      <span>${isOnline ? '<span class="tag green"><i class="bi bi-circle-fill"></i> متصل</span>' : '<span class="tag gray">غير متصل</span>'}</span>
    `;

    // ------------------------------------------------------------------------
    // Operational Rule Engine: "ليه المشترك ده مش بيتصل الآن؟"
    // ------------------------------------------------------------------------
    let vClass = "ok", vIcon = "fa-check-circle", vHeading = "", vDesc = "", vAction = "";

    const isExpired = s.expiration && new Date(s.expiration.replace(" ", "T")) < now;
    const isQuotaEmpty = +s.quota_mb > 0 && (+s.quota_mb - +s.used_mb) <= 0;
    const isDisabled = +s.enabled === 0;
    const lastAuth = auths.length ? auths[0] : null;

    if (isDisabled) {
      vClass = "err";
      vIcon = "fa-ban";
      vHeading = "الحساب معطل إدارياً (Account Disabled)";
      vDesc = "تم إيقاف حساب المشترك إدارياً من لوحة التحكم، وبالتالي يقوم سيرفر FreeRADIUS برفض أي محاولة اتصال فوراً.";
      vAction = 'الإجراء المطلوب: اضغط على زر [تفعيل الحساب] أدناه لإعادة إتاحة الخدمة للمشترك.';
    } else if (isExpired) {
      vClass = "err";
      vIcon = "fa-clock-o";
      vHeading = "الاشتراك منتهي الصلاحية (Subscription Expired)";
      vDesc = `انتهت صلاحية الحساب بتاريخ <bdi dir="ltr" class="tech-val">${advDate(s.expiration)}</bdi>. لا يمكن فتح جلسة إنترنت جديدة حتى تجديد الحساب.`;
      vAction = 'الإجراء المطلوب: تجديد الاشتراك من الرصيد أو تمديد فترة سماح (أيام) للمشترك.';
    } else if (isQuotaEmpty) {
      vClass = "warn";
      vIcon = "fa-database";
      vHeading = "نفاد كامل الكوتة المخصصة (Quota Depleted)";
      vDesc = `استهلك المشترك السعة بالكامل (<bdi dir="ltr" class="tech-val">${bytesTxt(s.used_mb)} / ${bytesTxt(s.quota_mb)}</bdi>). رصيد الكوتة المتبقي 0 B.`;
      vAction = 'الإجراء المطلوب: شحن كوتة إضافية أو تجديد الباقة لبدء دورة استهلاك جديدة.';
    } else if (lastAuth && lastAuth.reply === "Access-Reject") {
      vClass = "err";
      vIcon = "fa-times-circle";
      vHeading = "رفض المصادقة من سيرفر FreeRADIUS (Access-Reject)";
      vDesc = `آخر محاولة اتصال في <bdi dir="ltr" class="tech-val">${advDate(lastAuth.authdate)}</bdi> قوبلت بالرفض من السيرفر. ${lastAuth.class ? `(السبب المسجل: ${esc(lastAuth.class)})` : "(كلمة المرور في الراوتر غير مطابقة أو قفل MAC)"}.`;
      vAction = 'الإجراء المطلوب: التحقق من كلمة المرور المدخلة بالراوتر أو تفريغ قفل عنوان MAC.';
    } else if (s.mac && sessions.length && sessions[0].callingstationid && sessions[0].callingstationid.toUpperCase() !== s.mac.toUpperCase()) {
      vClass = "warn";
      vIcon = "fa-lock";
      vHeading = "عدم تطابق عنوان MAC المقفل (MAC Mismatch)";
      vDesc = `الحساب مقفل على MAC: <bdi dir="ltr" class="tech-val">${esc(s.mac)}</bdi> بينما يحاول الجهاز الاتصال بـ MAC مختلف (<bdi dir="ltr" class="tech-val">${esc(sessions[0].callingstationid)}</bdi>).`;
      vAction = 'الإجراء المطلوب: اضغط على زر [تفريغ قفل MAC] لإتاحة الاتصال من الجهاز الجديد.';
    } else if (isOnline) {
      vClass = "ok";
      vIcon = "fa-wifi";
      vHeading = "المشترك متصل وتعمل الخدمة بكفاءة (Online & Active)";
      const activeNas = s.nas_ip || (sessions[0] && sessions[0].nasipaddress) || "—";
      const activeIp = s.ip || (sessions[0] && sessions[0].framedipaddress) || "—";
      vDesc = `جلسة الاتصال نشطة ومستقرة على خادم NAS (<bdi dir="ltr" class="tech-val">${esc(activeNas)}</bdi>) بعنوان IP (<bdi dir="ltr" class="tech-val">${esc(activeIp)}</bdi>).`;
      vAction = 'الحالة ممتازة: لا توجد أي عوائق في المصادقة أو الحساب.';
    } else {
      vClass = "info";
      vIcon = "fa-info-circle";
      vHeading = "الحساب سليم وجاهز للاتصال (Ready - Offline)";
      vDesc = "بيانات الاعتماد وصلاحية الحساب والكوتة سليمة تماماً ولا توجد محاولات رفض حديثة. المشترك غير متصل حالياً.";
      vAction = 'الإجراء المقترح: تأكد من تشغيل راوتر المشترك والتأكد من ثبات لمبة الـ DSL/PON في الموقع.';
    }

    // ------------------------------------------------------------------------
    // Active / Last Session Details
    // ------------------------------------------------------------------------
    let sessionHtml = "";
    if (isOnline) {
      const activeSess = sessions.find(x => !x.acctstoptime) || sessions[0] || {};
      const nasIp = activeSess.nasipaddress || s.nas_ip || "127.0.0.1";
      const nasPort = activeSess.nasportid || "—";
      const framedIp = activeSess.framedipaddress || s.ip || s.framed_ip || "—";
      const mac = activeSess.callingstationid || s.mac || "—";
      const uptime = activeSess.acctsessiontime ? secondsDuration(activeSess.acctsessiontime) : "نشط الآن";
      const downBytes = octetsTxt(activeSess.acctoutputoctets);
      const upBytes = octetsTxt(activeSess.acctinputoctets);

      const canDisc = ME.admin.role === "admin" || (ME.admin.perms && ME.admin.perms.includes(8));

      sessionHtml = `
        <div class="diag-card">
          <div class="diag-card-h">
            <span><i class="bi bi-wifi"></i> الجلسة النشطة حالياً (Active Session Telemetry)</span>
            <span class="tag green"><i class="bi bi-circle-fill"></i> متصل الآن</span>
          </div>
          <div class="diag-telemetry-grid">
            <div class="diag-metric"><div class="diag-metric-lbl">خادم NAS</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${esc(nasIp)}</bdi></div></div>
            <div class="diag-metric"><div class="diag-metric-lbl">منفذ NAS Port</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${esc(nasPort)}</bdi></div></div>
            <div class="diag-metric"><div class="diag-metric-lbl">عنوان IP المعين</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${esc(framedIp)}</bdi></div></div>
            <div class="diag-metric"><div class="diag-metric-lbl">عنوان MAC المتصل</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${esc(mac)}</bdi></div></div>
            <div class="diag-metric"><div class="diag-metric-lbl">مدة الاتصال</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${uptime}</bdi></div></div>
            <div class="diag-metric"><div class="diag-metric-lbl">حجم التحميل (Download)</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${downBytes}</bdi></div></div>
            <div class="diag-metric"><div class="diag-metric-lbl">حجم الرفع (Upload)</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${upBytes}</bdi></div></div>
          </div>
          <div style="margin-top:14px;display:flex;justify-content:flex-end">
            <button id="btnDiagDisconnect" class="b-red sm ${canDisc ? "" : "perm-disabled"}" ${canDisc ? "" : 'title="يتطلب صلاحية فصل الاتصال (pDisconnect)"'}>
              <i class="bi bi-plug-fill"></i> ${canDisc ? "" : '<i class="bi bi-lock-fill"></i> '}قطع اتصال الجلسة (PoD Disconnect)
            </button>
          </div>
        </div>`;
    } else {
      const lastSess = sessions.length ? sessions[0] : null;
      sessionHtml = `
        <div class="diag-card">
          <div class="diag-card-h">
            <span><i class="bi bi-clock-history"></i> آخر جلسة مسجلة (Last Session History)</span>
            <span class="tag gray">غير متصل</span>
          </div>
          ${lastSess ? `
            <div class="diag-telemetry-grid">
              <div class="diag-metric"><div class="diag-metric-lbl">بداية الجلسة</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${advDate(lastSess.acctstarttime)}</bdi></div></div>
              <div class="diag-metric"><div class="diag-metric-lbl">نهاية الجلسة</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${advDate(lastSess.acctstoptime)}</bdi></div></div>
              <div class="diag-metric"><div class="diag-metric-lbl">مدة الاتصال</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${secondsDuration(lastSess.acctsessiontime)}</bdi></div></div>
              <div class="diag-metric"><div class="diag-metric-lbl">خادم الـ NAS</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${esc(lastSess.nasipaddress || "—")}</bdi></div></div>
              <div class="diag-metric"><div class="diag-metric-lbl">IP الأخير</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${esc(lastSess.framedipaddress || "—")}</bdi></div></div>
              <div class="diag-metric"><div class="diag-metric-lbl">سبب الإغلاق</div><div class="diag-metric-val"><bdi dir="ltr" class="tech-val">${esc(lastSess.acctterminatecause || "غير محدد")}</bdi></div></div>
            </div>`
          : '<div style="color:#8e8e93;font-size:13px;padding:12px;text-align:center">لا توجد سجلات لجلسات سابقة لهذا المشترك في جدول radacct.</div>'}
        </div>`;
    }

    // ------------------------------------------------------------------------
    // FreeRADIUS Post-Auth Attempts Log
    // ------------------------------------------------------------------------
    let authsHtml = "";
    if (auths.length) {
      authsHtml = `
        <div class="diag-card">
          <div class="diag-card-h">
            <span><i class="bi bi-shield-check"></i> آخر محاولات المصادقة في FreeRADIUS (radpostauth)</span>
            <span style="font-size:12px;color:#8e8e93">آخر ${auths.length} محاولات</span>
          </div>
          <div class="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>الوقت (Auth Date)</th>
                  <th>الرد (RADIUS Reply)</th>
                  <th>التفاصيل / Class</th>
                </tr>
              </thead>
              <tbody>
                ${auths.map(a => `
                  <tr>
                    <td><bdi dir="ltr" class="tech-val">${advDate(a.authdate)}</bdi></td>
                    <td>
                      ${a.reply === "Access-Accept" ? '<span class="tag green">Access-Accept ✔</span>' : '<span class="tag red">Access-Reject ✘</span>'}
                    </td>
                    <td><bdi dir="ltr" class="tech-val">${esc(a.class || "—")}</bdi></td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>`;
    } else {
      authsHtml = `
        <div class="diag-card">
          <div class="diag-card-h"><span><i class="bi bi-shield-check"></i> سجل محاولات المصادقة (radpostauth)</span></div>
          <div style="color:#8e8e93;font-size:13px;padding:12px;text-align:center">لا توجد محاولات مصادقة مسجلة بعد لهذا المشترك.</div>
        </div>`;
    }

    // ------------------------------------------------------------------------
    // Quick Actions Bar
    // ------------------------------------------------------------------------
    const quickActionsHtml = `
      <div class="diag-card">
        <div class="diag-card-h"><span><i class="bi bi-wrench-adjustable"></i> إجراءات تصحيحية سريعة</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="diagBtnRenew" class="b-blue sm"><i class="bi bi-arrow-repeat"></i> تجديد الاشتراك</button>
          <button id="diagBtnExtend" class="b-orange sm"><i class="bi bi-calendar-plus"></i> تمديد 3 أيام</button>
          <button id="diagBtnClearMac" class="b-gray sm"><i class="bi bi-unlock-fill"></i> تفريغ قفل MAC</button>
          <button id="diagBtnToggle" class="${+s.enabled ? "b-red" : "b-green"} sm">
            <i class="bi bi-power"></i> ${+s.enabled ? "تعطيل الحساب" : "تفعيل الحساب"}
          </button>
          <button id="diagBtn360" class="b-light sm"><i class="bi bi-box-arrow-up-right"></i> فتح البطاقة الكاملة °360</button>
        </div>
      </div>`;

    // Put everything together
    $("#diagBody").innerHTML = `
      <!-- Verdict Box -->
      <div class="noc-diag-box ${vClass}">
        <div class="diag-verdict-title"><i class="fa ${vIcon}"></i> الحكم التشغيلي الفوري للمشترك</div>
        <div class="diag-verdict-heading">${esc(vHeading)}</div>
        <div class="diag-verdict-desc">${vDesc}</div>
        <div class="diag-verdict-action"><i class="bi bi-lightbulb-fill"></i> ${vAction}</div>
      </div>

      <!-- Session & Telemetry -->
      ${sessionHtml}

      <!-- FreeRADIUS Post-Auth Log -->
      ${authsHtml}

      <!-- Quick Actions -->
      ${quickActionsHtml}
    `;

    // Wire Quick Action Buttons
    const btnDisc = $("#btnDiagDisconnect");
    if (btnDisc) {
      btnDisc.onclick = () => {
        confirmDangerousDisconnect(s.id, s.username, () => {
          openDiagnosticDrawer(s.id);
          load({ background: true });
        });
      };
    }

    $("#diagBtnRenew").onclick = () => {
      closeDiagnosticDrawer();
      openSubscriber(s.id, load);
    };

    $("#diagBtnExtend").onclick = async () => {
      if (confirm(`تمديد اشتراك المشترك ${s.username} لمدة 3 أيام سماح؟`)) {
        await act(() => api(`subscribers/${s.id}/extend`, { method: "POST", body: { Days: 3, Reason: "تمديد تشغيلي سريع" } }));
        toast("تم تمديد 3 أيام بنجاح");
        openDiagnosticDrawer(s.id);
        load({ background: true });
      }
    };

    $("#diagBtnClearMac").onclick = async () => {
      if (confirm(`إزالة قفل الماك عن المشترك ${s.username} والسماح له بالاتصال من أي جهاز؟`)) {
        await act(() => api("subscribers/bulk", { method: "POST", body: { Action: "unmac", IDs: [+s.id] } }));
        toast("تم إزالة قفل الماك بنجاح");
        openDiagnosticDrawer(s.id);
        load({ background: true });
      }
    };

    $("#diagBtnToggle").onclick = async () => {
      const verb = +s.enabled ? "تعطيل" : "تفعيل";
      if (confirm(`تأكيد ${verb} حساب المشترك ${s.username}؟`)) {
        await act(() => api(`subscribers/${s.id}/toggle`, { method: "POST" }));
        toast(`تم ${verb} الحساب`);
        openDiagnosticDrawer(s.id);
        load({ background: true });
      }
    };

    $("#diagBtn360").onclick = () => {
      closeDiagnosticDrawer();
      openSubscriber(s.id, load);
    };
  };

  // ==========================================================================
  // DANGEROUS ACTION: Confirmation Modal with Operational Impact Explanation
  // ==========================================================================
  const confirmDangerousDisconnect = (id, username, onDone) => {
    const canDisc = ME.admin.role === "admin" || (ME.admin.perms && ME.admin.perms.includes(8));
    if (!canDisc) {
      return toast("غير مسموح لك بفصل الاتصال (يتطلب صلاحية pDisconnect)", true);
    }

    const m = modal(`
      <div class="danger-modal-box">
        <div class="danger-modal-h">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <h3>تأكيد فصل اتصال الجلسة (PoD Disconnect)</h3>
        </div>
        <div class="danger-modal-body">
          <p>أنت على وشك إرسال أمر فصل فوري <b>RADIUS Packet of Disconnect (PoD)</b> إلى جهاز NAS المشترك:</p>
          <div class="danger-impact-callout">
            <div><b>المشترك المستهدف:</b> <bdi dir="ltr" class="tech-val">${esc(username)}</bdi></div>
            <div style="margin-top:6px;"><b>الأثر التشغيلي:</b> سيتم إنهاء الجلسة الحالية وإغلاق النفق/الخدمة فوراً وإلغاء حجز الـ IP. سيتم تسجيل العملية في سجل Audit Log.</div>
          </div>
          <p style="font-size:12.5px;color:#8e8e93">هل ترغب بالتأكيد والمتابعة؟</p>
        </div>
        <div class="danger-modal-actions">
          <button id="dangerCancel" class="b-gray">إلغاء</button>
          <button id="dangerConfirm" class="b-red"><i class="bi bi-plug-fill"></i> نعم، افصل الاتصال الآن</button>
        </div>
      </div>
    `);

    $("#dangerCancel", m).onclick = () => closeModal();
    $("#dangerConfirm", m).onclick = async () => {
      closeModal();
      try {
        await act(() => api(`subscribers/${id}/op`, { method: "POST", body: { Action: "disconnect" } }), "تم إرسال أمر الفصل إلى NAS");
        onDone && onDone();
      } catch (e) {
        toast(e.message || "فشل إرسال أمر الفصل إلى NAS", true);
      }
    };
  };

  drawCols();
  if (qs.get("add") === "1") location.hash = "user?new=1";
  load();
};

async function printLastInvoice(id) {
  const d = await api("subscribers/" + id), s = d.subscriber, inv = d.invoices[0];
  if (!inv) return toast("مفيش فواتير للمشترك ده", true);
  const w = window.open("", "_blank", "width=420,height=600");
  const tpl = (await api("settings").catch(() => ({ settings: [] }))).settings.find(x => x.k === "adv_set_invoice_tpl")?.v;
  if (tpl) {
    const v = { company: ME.company || "Stream-Net", user: s.username, name: `${s.firstname || ""} ${s.lastname || ""}`.trim(), prof: s.profile || "", amount: fmt(inv.amount - inv.discount),
      from: inv.period_from || "", to: inv.period_to || "", date: inv.created, by: inv.created_by, mobile: s.mobile || "", notes: inv.notes || "" };
    w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>إيصال</title></head><body>${tpl.replace(/\{(\w+)\}/g, (m, k) => k in v ? esc(v[k]) : m)}<script>print()<\/script></body></html>`);
    return;
  }
  w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>إيصال</title><style>body{font-family:Tahoma;padding:16px}td{padding:4px 8px}h2{text-align:center}</style></head><body>
    <h2>${esc(ME.company || "Stream-Net")}</h2><table><tr><td>المشترك</td><td>${esc(s.username)}</td></tr><tr><td>الاسم</td><td>${esc(s.firstname)} ${esc(s.lastname)}</td></tr>
    <tr><td>الباقة</td><td>${esc(s.profile || "")}</td></tr><tr><td>المبلغ</td><td>${fmt(inv.amount - inv.discount)}</td></tr><tr><td>من</td><td>${esc(inv.period_from || "")}</td></tr>
    <tr><td>إلى</td><td>${esc(inv.period_to || "")}</td></tr><tr><td>التاريخ</td><td>${esc(inv.created)}</td></tr><tr><td>بواسطة</td><td>${esc(inv.created_by)}</td></tr></table>
    <script>print()<\/script></body></html>`);
}
