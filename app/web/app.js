
// =============================================================================
// Linux Static Route Management Modal
// =============================================================================
window.openStaticRouteModal = async function() {
  try {
    const data = await api("network/routes");
    const ifaces = data.interfaces || [];
    const staticRoutes = data.static_routes || [];
    const kernelRoutes = data.kernel_routes || [];

    const ifaceOptions = ifaces.map(i => `<option value="${esc(i)}">${esc(i)}</option>`).join("");

    const html = `
      <div class="quick-modal-content wide" style="max-width:840px">
        <div class="quick-modal-head" style="border-bottom:1px solid var(--border);padding-bottom:14px">
          <div class="quick-modal-icon" style="background:var(--accent-subtle);color:var(--accent)">
            <i class="bi bi-signpost-split-fill"></i>
          </div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <h3 style="margin:0;font-size:1.15rem;font-weight:800">إدارة المسارات الثابتة (Linux Static Routes)</h3>
              <span class="status-pill active" style="font-size:11px">محرك لينكس نشط</span>
            </div>
            <small style="color:var(--text-muted)">إضافة وتطبيق مسارات التوجيه الثابتة مباشرة في كيرنل السيرفر لحزم الفروع وشبكات الراوترات</small>
          </div>
        </div>

        <div class="quick-modal-body" style="padding:18px 0;display:flex;flex-direction:column;gap:18px">
          
          <!-- Route Creator Bento Subcard -->
          <form id="formAddStaticRoute" class="bento-subcard" style="box-shadow:none">
            <div class="bento-subcard-head" style="padding:12px 16px">
              <div class="bento-head-title">
                <div class="bento-head-icon" style="width:26px;height:26px;font-size:13px"><i class="bi bi-plus-circle-fill"></i></div>
                <h4 style="margin:0;font-size:13px;font-weight:800">إضافة مسار ثابت جديد (New Static Route)</h4>
              </div>
            </div>
            <div class="bento-subcard-body" style="padding:16px;gap:12px 14px">
              <div class="form-group fg s4">
                <label style="font-size:11.5px;font-weight:700">الشبكة المستهدفة (Destination) *</label>
                <input name="destination" required placeholder="مثال: 192.168.10.0/24" dir="ltr" class="mono" style="height:38px;font-size:12.5px">
              </div>
              <div class="form-group fg s4">
                <label style="font-size:11.5px;font-weight:700">عنوان البوابة (Gateway IP) *</label>
                <input name="gateway" required placeholder="مثال: 10.199.0.2" dir="ltr" class="mono" style="height:38px;font-size:12.5px">
              </div>
              <div class="form-group fg s4">
                <label style="font-size:11.5px;font-weight:700">الواجهة (Interface) اختياري</label>
                <select name="interface" style="height:38px;font-size:12px;cursor:pointer">
                  <option value="">— تلقائي (Auto dev) —</option>
                  ${ifaceOptions}
                </select>
              </div>
              <div class="form-group fg s9">
                <label style="font-size:11.5px;font-weight:700">الوصف أو الفرع المستهدف</label>
                <input name="description" placeholder="مثال: مسار شبكة راوتر كافيه المعادي / نفق SSTP" style="height:38px;font-size:12.5px">
              </div>
              <div class="fg s3" style="display:flex;align-items:flex-end">
                <button type="submit" id="btnAddRouteSubmit" class="btn-primary" style="height:38px;width:100%;font-size:12.5px;padding:0 12px;display:flex;align-items:center;justify-content:center;gap:6px">
                  <i class="bi bi-plus-lg"></i> تطبيق وحفظ
                </button>
              </div>
            </div>
          </form>

          <!-- Static Routes Table -->
          <div class="bento-subcard" style="box-shadow:none">
            <div class="bento-subcard-head" style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
              <div class="bento-head-title">
                <div class="bento-head-icon" style="width:26px;height:26px;font-size:13px"><i class="bi bi-hdd-network-fill"></i></div>
                <h4 style="margin:0;font-size:13px;font-weight:800">المسارات الثابتة المخصصة (${staticRoutes.length})</h4>
              </div>
              <span style="font-size:11px;color:var(--text-muted)">يتم تطبيقها فورياً وحفظها تلقائياً عند إعادة تشغيل السيرفر</span>
            </div>
            <div class="tablewrap" style="border:0;max-height:240px;overflow-y:auto">
              <table class="modern-dist-table" style="font-size:12.5px">
                <thead>
                  <tr>
                    <th>الشبكة (Destination)</th>
                    <th>البوابة (Gateway)</th>
                    <th>الواجهة (Dev)</th>
                    <th>الوصف</th>
                    <th>الحالة</th>
                    <th style="width:70px;text-align:center">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  ${staticRoutes.map(r => `
                    <tr>
                      <td><b class="mono" style="color:var(--accent)"><bdi dir="ltr">${esc(r.destination)}</bdi></b></td>
                      <td><span class="mono"><bdi dir="ltr">${esc(r.gateway)}</bdi></span></td>
                      <td><span class="mono" style="color:var(--text-muted)"><bdi dir="ltr">${esc(r.iface || 'تلقائي')}</bdi></span></td>
                      <td><span>${esc(r.description || '—')}</span></td>
                      <td><span class="status-pill active" style="font-size:10px">نشط</span></td>
                      <td style="text-align:center">
                        <button type="button" class="btn-cancel btn-del-route" data-route-id="${r.id}" data-route-dst="${esc(r.destination)}" title="حذف المسار" style="padding:4px 8px;color:#ef4444;font-size:11.5px;height:auto">
                          <i class="bi bi-trash3-fill"></i> حذف
                        </button>
                      </td>
                    </tr>
                  `).join("") || '<tr><td colspan="6" class="empty" style="padding:20px;text-align:center;color:var(--text-muted)">لا توجد مسارات ثابتة مخصصة حتى الآن. أضف مساراً جديداً أعلاه.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Kernel Active Routes Dropdown/Accordion -->
          <details style="background:var(--bg-card-subtle);border:1px solid var(--border);border-radius:12px;padding:10px 14px;cursor:pointer">
            <summary style="font-size:12.5px;font-weight:800;color:var(--text-main);user-select:none;display:flex;align-items:center;gap:6px">
              <i class="bi bi-terminal"></i> استعراض جدول توجيه الكيرنل المباشر (${kernelRoutes.length} مسار نشط في السيرفر)
            </summary>
            <div class="tablewrap" style="border:1px solid var(--border);border-radius:10px;margin-top:10px;max-height:180px;overflow-y:auto;background:var(--bg-card)">
              <table class="modern-dist-table" style="font-size:11.5px">
                <thead>
                  <tr>
                    <th>المسار (Destination)</th>
                    <th>البوابة (Gateway)</th>
                    <th>الواجهة (Dev)</th>
                    <th>البروتوكول</th>
                  </tr>
                </thead>
                <tbody>
                  ${kernelRoutes.map(kr => `
                    <tr>
                      <td class="mono"><bdi dir="ltr">${esc(kr.dst)}</bdi></td>
                      <td class="mono"><bdi dir="ltr">${esc(kr.gateway || '—')}</bdi></td>
                      <td class="mono"><bdi dir="ltr">${esc(kr.dev || '—')}</bdi></td>
                      <td class="mono"><bdi dir="ltr">${esc(kr.protocol || '—')}</bdi></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </details>

        </div>

        <div class="quick-modal-footer" style="padding-top:14px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end">
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
        </div>
      </div>
    `;

    const m = modal(html);

    // Form submit: Add static route
    $("#formAddStaticRoute", m).onsubmit = async (e) => {
      e.preventDefault();
      const fd = formData(e.target);
      const submitBtn = $("#btnAddRouteSubmit", m);
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-arrow-repeat bi-spin"></i> جاري التطبيق...';

      try {
        await api("network/routes", {
          method: "POST",
          body: {
            destination: fd.destination,
            gateway: fd.gateway,
            interface: fd.interface,
            description: fd.description
          }
        });
        toast("تم تطبيق المسار الثابت في لينكس بنجاح");
        closeModal();
        openStaticRouteModal();
      } catch (err) {
        toast("فشل تطبيق المسار: " + err.message, true);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-plus-lg"></i> تطبيق وحفظ';
      }
    };

    // Delete route handlers
    m.querySelectorAll(".btn-del-route").forEach(b => {
      b.onclick = async () => {
        const id = +b.dataset.routeId;
        const dst = b.dataset.routeDst;
        if (!confirm(`هل تريد بالتأكيد حذف المسار الثابت ${dst} من لينكس؟`)) return;
        try {
          await api("network/routes/delete", {
            method: "POST",
            body: { id: id, destination: dst }
          });
          toast("تم حذف المسار من لينكس");
          closeModal();
          openStaticRouteModal();
        } catch (err) {
          toast("فشل حذف المسار: " + err.message, true);
        }
      };
    });

  } catch (err) {
    modal(`<div class="p-4 text-center text-danger">خطأ في جلب بيانات المسارات: ${esc(err.message)}</div>`);
  }
};


// Interactive Shadow / Live Mode Switcher with Confirmation
window.openModeSwitchModal = function() {
  const currentMode = (typeof ME !== "undefined" && ME && ME.mode) || "shadow";
  const targetMode = currentMode === "shadow" ? "live" : "shadow";
  const isGoingLive = targetMode === "live";

  const html = `
    <div class="quick-modal-content" style="max-width:540px">
      <div class="quick-modal-head" style="border-bottom:1px solid var(--border);padding-bottom:14px">
        <div class="quick-modal-icon" style="background:${isGoingLive ? 'var(--badge-green-bg)' : 'var(--badge-amber-bg)'};color:${isGoingLive ? 'var(--badge-green-text)' : 'var(--badge-amber-text)'}">
          <i class="bi ${isGoingLive ? 'bi-broadcast-pin' : 'bi-eye-fill'}"></i>
        </div>
        <div>
          <h3 style="margin:0;font-size:1.15rem;font-weight:800">${isGoingLive ? 'التحويل إلى وضع التشغيل الحي (Live Mode)' : 'الرجوع إلى وضع المراقبة (Shadow Mode)'}</h3>
          <small style="color:var(--text-muted)">تبديل وضع تشغيل النظام والتحكم في الشبكة والمشتركين</small>
        </div>
      </div>

      <div class="quick-modal-body" style="padding:18px 0;display:flex;flex-direction:column;gap:14px">
        <div style="background:var(--bg-card-subtle);border:1px solid var(--border);border-radius:12px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11.5px;color:var(--text-muted);font-weight:700">الوضع الحالي للنظام</div>
            <div style="font-size:13.5px;font-weight:800;color:var(--text-main);margin-top:2px">
              ${currentMode === 'shadow' ? '👁️ وضع المراقبة (Shadow) — ADV هو المتحكم' : '⚡ وضع التشغيل الحي (Live) — FreeRADIUS هو الأساس'}
            </div>
          </div>
          <i class="bi bi-arrow-left" style="font-size:18px;color:var(--text-muted)"></i>
          <div>
            <div style="font-size:11.5px;color:var(--text-muted);font-weight:700">الوضع المستهدف</div>
            <div style="font-size:13.5px;font-weight:800;color:${isGoingLive ? 'var(--badge-green-text)' : 'var(--badge-amber-text)'};margin-top:2px">
              ${isGoingLive ? '⚡ وضع التشغيل الحي (Live)' : '👁️ وضع المراقبة (Shadow)'}
            </div>
          </div>
        </div>

        <div style="font-size:12.5px;line-height:1.6;color:var(--text-main);background:${isGoingLive ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)'};border:1px solid ${isGoingLive ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'};border-radius:12px;padding:14px">
          ${isGoingLive ? `
            <b style="color:var(--badge-green-text);display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <i class="bi bi-info-circle-fill"></i> ماذا يعني تفعيل وضع التشغيل الحي (Live)؟
            </b>
            سيتولى خادم FreeRADIUS المدمج إدارة اتصالات الراوترات ومصادقة المشتركين مباشرة، وسيتم تفعيل كافة العمليات المالية (شحن رصيد، تجديد اشتراكات، خصم، وتعديل حسابات) محلياً على هذا السيرفر بدلاً من ADV.
          ` : `
            <b style="color:var(--badge-amber-text);display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <i class="bi bi-info-circle-fill"></i> ماذا يعني تفعيل وضع المراقبة (Shadow)؟
            </b>
            سيعمل السيرفر كمرآة قراءة ومراقبة ذكية لسيرفر ADV القديم، مع تجميد العمليات المالية المباشرة محلياً لتجنب أي تعارض في الأرصدة.
          `}
        </div>
      </div>

      <div class="quick-modal-footer" style="padding-top:14px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
        <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
        <button type="button" id="btnConfirmSwitchMode" class="btn-primary" style="background:${isGoingLive ? '#10b981' : '#f59e0b'};border-color:${isGoingLive ? '#059669' : '#d97706'}">
          <i class="bi bi-power"></i> ${isGoingLive ? 'تأكيد تفعيل وضع Live الآن' : 'تأكيد تفعيل وضع Shadow الآن'}
        </button>
      </div>
    </div>
  `;

  const m = modal(html);
  const btn = $("#btnConfirmSwitchMode", m);
  if (btn) {
    btn.onclick = async () => {
      try {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-repeat bi-spin"></i> جاري التبديل...';
        await api("settings", { method: "PUT", body: { mode: targetMode, confirm: "نعم انقل" } });
        toast("تم التحويل بنجاح إلى: " + (targetMode === "live" ? "وضع التشغيل الحي (Live)" : "وضع المراقبة (Shadow)"));
        closeModal();
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        toast("فشل التحويل: " + err.message, true);
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-power"></i> إعادة المحاولة';
      }
    };
  }
};

// RAD-Manager panel: one page, hash routes, same look as the old ADV panel.
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = n => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
let ME = null, PROFILES = [], MANAGERS = [];

// CSV that Excel opens with Arabic intact (BOM)
function downloadCSV(name, header, rows) {
  const cell = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "﻿" + [header.map(cell).join(",")].concat(rows.map(r => r.map(cell).join(","))).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = name + ".csv"; a.click();
}

async function api(path, opt = {}) {
  const o = { method: opt.method || "GET", headers: { "X-Requested-With": "rm", "X-Page": (location.hash.slice(1) || "dashboard").split("?")[0] }, credentials: "same-origin" };
  if (opt.body !== undefined) { o.body = JSON.stringify(opt.body); o.headers["Content-Type"] = "application/json"; }
  const r = await fetch("/api/" + path, o);
  let j = null; try { j = await r.json(); } catch (_) {}
  if (r.status === 401 && path !== "login") { showLogin(); throw new Error("سجل دخول"); }
  if (!r.ok) throw new Error((j && j.error) || ("HTTP " + r.status));
  return j;
}
function toast(msg, bad) { const t = $("#toast"); t.textContent = msg; t.className = "toast" + (bad ? " bad" : ""); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add("hidden"), 4000); }
function modal(html) { $("#modalBody").innerHTML = html; $("#modal").classList.remove("hidden"); return $("#modalBody"); }
function closeModal() { $("#modal").classList.add("hidden"); }
document.addEventListener("click", e => { if (e.target.closest("[data-close]") || e.target.id === "modal") closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#modal").classList.contains("hidden")) closeModal(); });
async function act(fn, okMsg) { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, true); throw e; } }
function formData(form) { const o = {}; new FormData(form).forEach((v, k) => { o[k] = v; }); return o; }
const statusTag = s => {
  if (+s.enabled === 0) return '<span class="tag gray">موقوف</span>';
  if (!s.expiration) return '<span class="tag gray">بدون تاريخ</span>';
  return new Date(s.expiration.replace(" ", "T")) < new Date() ? '<span class="tag red">منتهي</span>' : '<span class="tag green">فعال</span>';
};
const onlineTag = s => +s.online ? '<span class="tag blue">متصل</span>' : "";

// ---------- menu (same order as the old panel)
const MENU = [ // same order and sub-menus as ADV's sidebar
  ["dashboard", "fa-dashboard", "لوحة التحكم"],
  ["subscribers", "fa-users", "المشتركين", false, [
    ["subscribers?view=overview", "fa-th-large", "نظرة عامة"], ["subscribers", "fa-list", "قائمة المشتركين"], ["user?new=1", "fa-user-plus", "إضافة مشترك"],
    ["online", "fa-lightbulb-o", "المتصلين الآن"], ["appusers", "fa-mobile", "مستخدمي التطبيق"], ["cardusers", "fa-credit-card", "مشتركو الكارت"],
    ["onlinecards", "fa-credit-card", "الكروت المتصلة"]]],
  ["profiles", "fa-gift", "الباقات والعروض", false, [["profiles?view=overview", "fa-th-large", "نظرة عامة"], ["profiles", "fa-list", "قائمة العروض"],
    ["profile", "fa-plus", "إضافة عرض"], ["ippool", "fa-sitemap", "IP Pool"]]],
  ["tickets", "fa-exclamation-circle", "الشكاوى", false, [["tickets?view=overview", "fa-th-large", "نظرة عامة"], ["tickets", "fa-list", "قائمة الشكاوى"]]],
  ["managers", "fa-university", "المدراء والموزعين", false, [["managers?view=overview", "fa-th-large", "نظرة عامة"], ["managers", "fa-list", "قائمة المدراء"],
    ["onlinemgr", "fa-circle", "المدراء المتصلين"], ["managers?add=1", "fa-plus", "إضافة مدير"], ["pricing", "fa-tags", "أسعار العروض"], ["perms", "fa-key", "صلاحيات الموزعين"]]],
  ["cards", "fa-credit-card", "كروت الشحن", false, [["cards", "fa-credit-card", "كروت الشحن"], ["cardtpl", "fa-paint-brush", "تصميم الكروت"]]],
  ["nas", "fa-paper-plane", "أجهزة NAS"],
  ["cafe", "fa-coffee", "كروت الكافيهات"],
  ["vpn", "fa-lock", "VPN الكافيهات"],
    ["reports", "fa-pie-chart", "التقارير"],
  ["smart", "fa-magic", "المزايا الذكية"],
  ["bandwidth", "fa-tachometer", "مراقبة الباندويث"],
  ["speed", "fa-bolt", "التحكم في السرعات"],
  ["charge", "fa-money", "لوحة الشحن"],
  ["cash", "fa-money", "معاملات الكاش"],
  ["tools", "fa-wrench", "الأدوات", false, [["backup", "fa-database", "النسخ الاحتياطي"], ["sync", "fa-google", "مزامنة ADV"], ["genadj", "fa-edit", "تعديلات عامة"],
    ["trash", "fa-trash", "سلة المحذوفات"], ["messages", "fa-envelope", "سجل الرسائل"], ["maintenance", "fa-cogs", "صيانة النظام"], ["invoices", "fa-file-text-o", "الفواتير"], ["audit", "fa-history", "سجل العمليات"], ["admins", "fa-user-secret", "مشرفي النظام"]]],
  ["settings", "fa-cog", "الإعدادات"],
];
// ADV permission number each menu entry needs, for distributor logins that carry their ADV group (ME.admin.perms)
const MENU_PERM = { subscribers: 1, "subscribers?view=overview": 1, "user?new=1": 2, online: 6, appusers: 6, cardusers: 9, onlinecards: 12, profiles: 15, ippool: 15, profile: 16,
  tickets: 136, managers: 20, onlinemgr: 20, "managers?add=1": 21, pricing: 30, perms: 33, cards: 37, nas: 42, ports: 42, reports: 47, smart: 0, bandwidth: 0, charge: 100 };
// Bootstrap Icons + a colour per section (look taken from Haitham's system); anything not listed keeps its Font Awesome icon
const MENU_BI = {
  dashboard: ["bi-grid-1x2-fill", "mi-indigo"], subscribers: ["bi-people-fill", "mi-indigo"], profiles: ["bi-tags-fill", "mi-amber"], tickets: ["bi-exclamation-octagon-fill", "mi-rose"],
  managers: ["bi-shop-window", "mi-sky"], cards: ["bi-credit-card-2-front-fill", "mi-amber"], nas: ["bi-hdd-network-fill", "mi-green"], ports: ["bi-shuffle", "mi-green"],
  reports: ["bi-file-earmark-bar-graph-fill", "mi-indigo"], smart: ["bi-stars", "mi-violet"], bandwidth: ["bi-speedometer2", "mi-sky"], speed: ["bi-lightning-charge-fill", "mi-amber"],
  charge: ["bi-wallet2", "mi-green"], tools: ["bi-tools", "mi-slate"], settings: ["bi-gear-wide-connected", "mi-slate"], vpn: ["bi-shield-lock-fill", "mi-sky"], cafe: ["bi-cup-hot-fill", "mi-amber"], cash: ["bi-cash-coin", "mi-green"],
  "subscribers?view=overview": ["bi-grid"], "subscribers": ["bi-people-fill"], "user?new=1": ["bi-person-plus-fill"], online: ["bi-broadcast"], appusers: ["bi-phone"],
  cardusers: ["bi-person-badge"], onlinecards: ["bi-credit-card"], "profiles?view=overview": ["bi-grid"], profile: ["bi-plus-circle"], ippool: ["bi-diagram-3"],
  "tickets?view=overview": ["bi-grid"], "managers?view=overview": ["bi-grid"], onlinemgr: ["bi-circle-fill"], "managers?add=1": ["bi-plus-circle"], pricing: ["bi-tags"],
  perms: ["bi-key-fill"], backup: ["bi-cloud-arrow-down-fill"], sync: ["bi-arrow-left-right"], genadj: ["bi-pencil-square"], trash: ["bi-trash3"],
  messages: ["bi-envelope-fill"], maintenance: ["bi-wrench-adjustable"], invoices: ["bi-receipt"], audit: ["bi-clock-history"], admins: ["bi-person-lock"],
  portal: ["bi-person-workspace"], cardtpl: ["bi-palette-fill"], cafe: ["bi-cup-hot-fill"], radiuslog: ["bi-hdd-network"], traffic: ["bi-graph-up-arrow"],
};
const menuIcon = (k, fa, sub) => {
  const b = MENU_BI[k] || (sub ? MENU_BI[k.split("?")[0]] : null);
  return b ? `<i class="bi ${b[0]} ${b[1] || ""}"></i>` : `<i class="bi bi-circle-square"></i>`;
};
const can = p => !ME.admin.perms || p === undefined || (p > 0 && ME.admin.perms.includes(p));
function drawMenu() {
  const adminOnly = ["tools", "settings", "speed", "vpn", "cafe", "cash"];
  const adminKids = ["cardtpl"];
  const ok = k => can(MENU_PERM[k] ?? MENU_PERM[k.split("?")[0]]);
  $("#menu").innerHTML = MENU.filter(([k]) => (ME.admin.role === "admin" || !adminOnly.includes(k)) && ok(k)).map(([k, ic, t, soon, kids]) =>
    `<a href="#${k}" data-k="${k}" class="${soon ? "soon" : ""}">${menuIcon(k, ic)}${t}${kids ? '<i class="bi bi-chevron-down caret"></i>' : ""}</a>` +
    (kids ? `<div class="sub" data-parent="${k}">${kids.filter(([h]) => ok(h) && (ME.admin.role === "admin" || !adminKids.includes(h))).map(([h, i2, t2]) => `<a href="#${h}" data-h="${h}">${menuIcon(h, i2, true)}${t2}</a>`).join("")}</div>` : "")).join("");
}

// ---------- login
function showLogin() { $("#app").classList.add("hidden"); $("#login").classList.remove("hidden"); }
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault(); $("#loginErr").textContent = "";
  try { await api("login", { method: "POST", body: formData(e.target) }); boot(); }
  catch (err) { $("#loginErr").textContent = err.message; }
});
$("#logout").onclick = async () => { await api("logout", { method: "POST" }); showLogin(); };
$("#burger").onclick = () => $("#app").classList.toggle("menu-open");

async function boot() {
  try { ME = await api("me"); } catch (_) { showLogin(); return; }
  $("#login").classList.add("hidden"); $("#app").classList.remove("hidden");
  $("#who").textContent = ME.admin.full_name || ME.admin.username;
  $("#brand").innerHTML = '<span class="brand-slash">\\</span> Stream <span class="brand-sub">RADIUS</span>';
  const mb = $("#modeBadge");
  if (mb) {
    mb.className = "mode-badge-interactive mode " + ME.mode;
    mb.innerHTML = `
      <i class="bi ${ME.mode === 'shadow' ? 'bi-eye-fill' : 'bi-lightning-charge-fill'}"></i>
      <span>${ME.mode === "shadow" ? "وضع المراقبة (Shadow) — ADV هو الشغال" : "وضع التشغيل الحي (Live) — FreeRADIUS"}</span>
      <span class="mode-toggle-action" title="انقر لتبديل وضع التشغيل"><i class="bi bi-arrow-left-right"></i> تبديل</span>
    `;
    mb.onclick = () => window.openModeSwitchModal();
    mb.title = "انقر لتبديل وضع التشغيل (Live / Shadow)";
  }
  if (ME.sim) { mb.className = "mode shadow"; mb.textContent = "🧪 لوحة التجربة — نسخة، مش بتكلم أي راوتر ولا ADV"; }
  drawMenu();
  [PROFILES, MANAGERS] = await Promise.all([api("profiles").catch(() => []), api("managers").catch(() => [])]);
  route();
}
window.addEventListener("hashchange", route);
function route() {
  const k = (location.hash.slice(1) || "dashboard").split("?")[0];
  const full = location.hash.slice(1) || "dashboard";
  const owns = s => s.dataset.parent === k || [...s.querySelectorAll("a")].some(a => a.dataset.h.split("?")[0] === k);
  document.querySelectorAll("#menu .sub").forEach(s => s.classList.toggle("open", owns(s)));
  document.querySelectorAll("#menu > a").forEach(a => { const sub = a.nextElementSibling; a.classList.toggle("active", a.dataset.k === k || !!(sub && sub.classList.contains("sub") && owns(sub))); });
  document.querySelectorAll("#menu .sub a").forEach(a => a.classList.toggle("cur", a.dataset.h === full));
  $("#app").classList.remove("menu-open");
  (PAGES[k] || PAGES.soon)().catch(e => { $("#content").innerHTML = `<div class="panel"><div class="empty">${esc(e.message)}</div></div>`; });
}
const C = html => { $("#content").innerHTML = html; };
const options = (list, sel, label = "name", none = "—") => `<option value="0">${none}</option>` + list.map(x => `<option value="${x.id}" ${+sel === +x.id ? "selected" : ""}>${esc(x[label])}</option>`).join("");

// ---------- pages
const PAGES = {};
PAGES.soon = async () => C('<div class="panel"><div class="empty"><i class="bi bi-tools fs-2"></i><br><br>الصفحة دي هتتعمل في المرحلة الجاية</div></div>');

PAGES.dashboard = async () => {
  const d = await api("dashboard");
  const box = (cls, num, lbl, ico, link) => `<div class="box ${cls}"><div class="in"><div><div class="num big">${num}</div><div class="lbl">${lbl}</div></div><i class="fa ${ico} ico"></i></div><a class="more" href="#${link || ""}"><i class="bi bi-arrow-left-circle-fill"></i> تفاصيل أخرى</a></div>`;
  const inv = (title, x) => `<div class="inv"><div class="head"><i class="bi bi-arrow-repeat"></i> ${title}</div><div class="body"><i class="bi bi-cash-stack ico"></i><dl>
      <dt>إجمالي الفواتير المدفوعة</dt><dd>${fmt(x.paid)}</dd><dt>إجمالي الفواتير الغير مدفوعة</dt><dd>${fmt(x.unpaid)}</dd>
      <dt>محصلة الفواتير (العدد)</dt><dd>${fmt(x.count)}</dd><dt>محصلة الفواتير اليومية</dt><dd>${fmt(x.today)}</dd><dt>محصلة الفواتير الشهرية</dt><dd>${fmt(x.month)}</dd></dl></div></div>`;
  const online = d.mode === "shadow" ? d.adv_online : d.online;
  if (d.mode === "shadow") { // mirror mode: money boxes show ADV's own numbers (read-only metrics from the last sync)
    try {
      const m = (await api("sync")).adv_metrics || {}, qs = m.quick_stats || {}, cs = m.get_cards_sales_stats || {};
      d.inv_subscribers = { paid: qs.today_sales_total || 0, unpaid: qs.unpaid_total || 0, count: qs.unpaid_invoices_count || 0, today: qs.today_sales_total || 0, month: d.inv_subscribers.month };
      d.inv_cards = { paid: (cs.year || {}).total || 0, unpaid: 0, count: (cs.year || {}).count || 0, today: (cs.day || {}).total || 0, month: (cs.month || {}).total || 0 };
      if ((cs.year || {}).count) d.cards = cs.year.count;
    } catch (_) {}
  }
  C(`${d.mode === "shadow" ? `<div class="alert"><b><i class="bi bi-exclamation-triangle-fill"></i> وضع المراقبة!</b>النظام ده بيقرا من ADV بس ومش بيكلم أي سيرفر. آخر مزامنة: ${esc(d.last_sync || "لسه")} — الحالة: ${esc(d.sync_state)}</div>` : ""}
  <div class="grid g2">${box("blue", fmt(online), "المشتركين المتصلين", "fa-lightbulb-o", "online")}${box("blue", fmt(d.subscribers), "مشتركين", "fa-users", "subscribers")}</div>
  <div class="grid g3">${box("orange", fmt(d.expiring), `مشتركين ينتهي اشتراكهم خلال ${d.expiring_days} ايام`, "fa-meh-o", "subscribers?status=expiring")}
    ${box("amber", fmt(d.expired), "المشتركين المنتهي اشتراكهم", "fa-frown-o", "subscribers?status=expired")}
    ${box("green", fmt(d.active), "المشتركين المتاحين", "fa-smile-o", "subscribers?status=active")}</div>
  <div class="grid g2">${box("purple", "EGP " + fmt(d.received), "إجمالي قيم الإستلام", "fa-database", "invoices")}${box("green", typeof d.balance === "number" ? fmt(d.balance) : esc(d.balance), "الرصيد", "fa-money", "managers")}</div>
  <div class="grid g2">${box("blue", fmt(d.cards_online), "الكروت المتصلة", "fa-credit-card", "cards")}${box("blue", fmt(d.cards), "كروت", "fa-credit-card", "cards")}</div>
  <div class="grid g3">${inv("إجمالي الفواتير (الكروت)", d.inv_cards)}${inv("إجمالي الفواتير (المشتركين)", d.inv_subscribers)}${inv("إجمالي الفواتير (المدراء)", d.inv_managers)}</div>
  <div class="grid g4">${box(d.radius_ok ? "blue" : "red", d.radius_ok ? "شغال" : "واقف", "خدمة الراديوس (FreeRADIUS)", "fa-signal", "settings")}
    ${box("blue", esc(d.uptime), "مدة تشغيل النظام", "fa-clock-o")}${box("blue", esc(d.now), "الوقت داخل النظام", "fa-clock-o")}${box("blue", esc(d.version), "إصدار النظام", "fa-star")}</div>`);
};

function subForm(s) {
  s = s || {};
  return `<form class="form" id="sf">
    <label>اسم المستخدم<input name="username" value="${esc(s.username)}" ${s.id ? "readonly" : "required"}></label>
    <label>الموبايل<input name="mobile" value="${esc(s.mobile)}"></label>
    <label>الاسم الأول<input name="firstname" value="${esc(s.firstname)}"></label>
    <label>الاسم الأخير<input name="lastname" value="${esc(s.lastname)}"></label>
    <label>الباقة<select name="profile_id">${options(PROFILES, s.profile_id)}</select></label>
    <label>المدير<select name="manager_id">${options(MANAGERS, s.manager_id, "username")}</select></label>
    <label>تاريخ الانتهاء<input name="expiration" type="datetime-local" value="${esc((s.expiration || "").replace(" ", "T").slice(0, 16))}"></label>
    <label>عدد الأجهزة في نفس الوقت<input name="simul" type="number" min="1" value="${esc(s.simul || 1)}"></label>
    <label>MAC<input name="mac" value="${esc(s.mac)}" dir="ltr"></label>
    <label>IP ثابت<input name="framed_ip" value="${esc(s.framed_ip)}" dir="ltr"></label>
    <label class="full">العنوان<input name="address" value="${esc(s.address)}"></label>
    <label class="full">ملاحظات<textarea name="notes" rows="2">${esc(s.notes)}</textarea></label>
    <div class="actions full"><button class="green">حفظ</button><button type="button" class="gray" data-close>إلغاء</button></div></form>`;
}
function editSubscriber(s, after) {
  const m = modal(`<h3>${s ? "تعديل " + esc(s.username) : "مشترك جديد"}</h3>` + subForm(s));
  $("#sf", m).onsubmit = async e => {
    e.preventDefault();
    const f = formData(e.target);
    const body = { Username: f.username, Firstname: f.firstname, Lastname: f.lastname, Mobile: f.mobile, Address: f.address, Notes: f.notes, Mac: f.mac,
      FramedIP: f.framed_ip, Expiration: f.expiration ? f.expiration.replace("T", " ") : "", ProfileID: +f.profile_id, ManagerID: +f.manager_id, Simul: +f.simul };
    await act(() => api(s ? "subscribers/" + s.id : "subscribers", { method: s ? "PUT" : "POST", body }), "اتحفظ");
    closeModal(); after && after();
  };
}
async function openSubscriber(id, after) {
  const d = await api("subscribers/" + id), s = d.subscriber;
  const isOnline = +s.online === 1;
  const isAct = +s.enabled === 1;

  const html = `
    <div class="quick-modal-content wide">
      <div class="sub360-header">
        <div class="sub360-user-info">
          <div class="sub360-avatar">
            <i class="bi ${isOnline ? 'bi-broadcast' : 'bi-person-fill'}"></i>
          </div>
          <div class="sub360-names">
            <h2 style="margin:0;font-size:1.2rem;font-weight:800;display:flex;align-items:center;gap:8px">
              ${esc(s.username)}
              <span class="status-pill ${isOnline ? 'active' : ''}">${isOnline ? 'متصل أونلاين' : 'غير متصل'}</span>
              <span class="status-pill ${isAct ? 'info' : 'stopped'}">${isAct ? 'حساب مفعّل' : 'معطل'}</span>
            </h2>
            <p style="margin:3px 0 0;font-size:12px;color:var(--text-muted)">
              ${esc(s.firstname || '')} ${esc(s.lastname || '')} • الباقة: <b>${esc(s.profile || 'افتراضي')}</b> • المسؤول: <b>${esc(s.manager || 'الإدارة')}</b>
            </p>
          </div>
        </div>
      </div>

      <!-- Bento 360 KPIs -->
      <div class="sub360-kpis-grid">
        <div class="sub360-kpi-card">
          <span style="font-size:11.5px;color:var(--text-muted);font-weight:700">الرصيد النقدي</span>
          <span class="mono" style="font-size:1.15rem;font-weight:800;color:var(--accent)">${fmt(s.money)} ج.م</span>
        </div>
        <div class="sub360-kpi-card">
          <span style="font-size:11.5px;color:var(--text-muted);font-weight:700">IP المعين / MAC</span>
          <span class="mono" style="font-size:12px;font-weight:700">${esc(s.framed_ip || s.ip || 'ديناميكي')}</span>
        </div>
        <div class="sub360-kpi-card">
          <span style="font-size:11.5px;color:var(--text-muted);font-weight:700">تاريخ انتهاء الاشتراك</span>
          <span class="mono" style="font-size:12px;font-weight:700">${esc(s.expiration ? String(s.expiration).slice(0, 16) : '—')}</span>
        </div>
        <div class="sub360-kpi-card">
          <span style="font-size:11.5px;color:var(--text-muted);font-weight:700">عنوان التوصيل / الهاتف</span>
          <span style="font-size:12px;color:var(--text-main);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.mobile || s.address || '—')}</span>
        </div>
      </div>

      <!-- Action Ribbon -->
      <div class="quick-modal-actions-bar" style="padding:12px 20px;background:var(--bg-card-subtle);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button id="bRenew" class="btn-primary" style="padding:7px 16px;font-size:12.5px"><i class="bi bi-arrow-repeat"></i> تجديد الاشتراك</button>
        <button id="bExt" class="btn-secondary" style="padding:7px 14px;font-size:12.5px"><i class="bi bi-clock-history"></i> تمديد أيام</button>
        <button id="bEdit" class="btn-secondary" style="padding:7px 14px;font-size:12.5px"><i class="bi bi-pencil-square"></i> تعديل المشترك</button>
        <button id="bTog" class="btn-secondary" style="padding:7px 14px;font-size:12.5px;color:${+s.enabled ? '#ef4444' : '#10b981'}">${+s.enabled ? 'إيقاف الحساب' : 'تفعيل الحساب'}</button>
      </div>

      <!-- Tabbed Views -->
      <div class="sub360-tabs-nav">
        <a class="sub360-tab active" data-s360-tab="invoices"><i class="bi bi-receipt"></i> الفواتير (${(d.invoices || []).length})</a>
        <a class="sub360-tab" data-s360-tab="sessions"><i class="bi bi-broadcast"></i> سجل الجلسات</a>
        <a class="sub360-tab" data-s360-tab="radius"><i class="bi bi-sliders"></i> إعدادات FreeRADIUS</a>
        <a class="sub360-tab" data-s360-tab="audit"><i class="bi bi-clock-history"></i> سجل العمليات</a>
      </div>

      <div class="quick-modal-body" style="padding:18px 20px">
        <div id="tabInvoices" class="s360-tab-pane">
          <div class="tablewrap" style="border:1px solid var(--border);border-radius:12px">
            ${table(d.invoices, [["created", "التاريخ"], ["operation", "العملية"], ["amount", "المبلغ"], ["discount", "خصم"], ["paid", "مدفوع", v => +v ? "✔" : "✘"], ["period_to", "لحد"], ["created_by", "بواسطة"]])}
          </div>
        </div>
        <div id="tabSessions" class="s360-tab-pane hidden">
          <div class="tablewrap" style="border:1px solid var(--border);border-radius:12px">
            ${table(d.adv_online.length ? d.adv_online : d.sessions, d.adv_online.length ? [["nas", "NAS"], ["ip", "IP"], ["mac", "MAC"], ["since", "من"]] :
              [["acctstarttime", "بداية"], ["acctstoptime", "نهاية"], ["nasipaddress", "NAS"], ["framedipaddress", "IP"], ["callingstationid", "MAC"]])}
          </div>
        </div>
        <div id="tabRadius" class="s360-tab-pane hidden">
          <div class="tablewrap" style="border:1px solid var(--border);border-radius:12px">
            ${table(d.radius, [["t", "النوع"], ["attribute", "الخاصية"], ["op", ""], ["value", "القيمة"]])}
          </div>
        </div>
        <div id="tabAudit" class="s360-tab-pane hidden">
          <div class="tablewrap" style="border:1px solid var(--border);border-radius:12px">
            ${table(d.log, [["ts", "الوقت"], ["admin", "بواسطة"], ["action", "العملية"]])}
          </div>
        </div>
      </div>
    </div>
  `;

  const m = modal(html);

  // Tab switching logic
  document.querySelectorAll("[data-s360-tab]").forEach(t => t.onclick = () => {
    document.querySelectorAll("[data-s360-tab]").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    const target = t.dataset.s360Tab;
    document.querySelectorAll(".s360-tab-pane").forEach(p => p.classList.add("hidden"));
    if (target === "invoices") $("#tabInvoices")?.classList.remove("hidden");
    if (target === "sessions") $("#tabSessions")?.classList.remove("hidden");
    if (target === "radius") $("#tabRadius")?.classList.remove("hidden");
    if (target === "audit") $("#tabAudit")?.classList.remove("hidden");
  });

  const reload = () => { closeModal(); after && after(); };
  $("#bEdit", m).onclick = () => editSubscriber(s, after);
  $("#bTog", m).onclick = () => act(() => api(`subscribers/${s.id}/toggle`, { method: "POST" }), "تم").then(reload);
  $("#bExt", m).onclick = () => {
    const days = prompt("عدد الأيام (من 1 لـ 60):", "1"); if (!days) return;
    act(() => api(`subscribers/${s.id}/extend`, { method: "POST", body: { Days: +days, Reason: "تمديد يدوي" } }), "اتمدد").then(reload);
  };
  $("#bRenew", m).onclick = () => {
    const mm = modal(`<h3>تجديد ${esc(s.username)}</h3><form class="form" id="rf"><label>الباقة<select name="p">${options(PROFILES, s.profile_id)}</select></label>
      <label>خصم<input name="d" type="number" value="0" min="0"></label><label class="full"><span><input type="checkbox" name="paid" checked style="width:auto"> مدفوع (يتخصم من رصيد المدير)</span></label>
      <label class="full">ملاحظات<input name="n"></label><div class="actions full"><button class="green">تجديد</button></div></form>`);
    $("#rf", mm).onsubmit = async e => {
      e.preventDefault(); const f = formData(e.target);
      const r = await act(() => api(`subscribers/${s.id}/renew`, { method: "POST", body: { ProfileID: +f.p, Discount: +f.d, Paid: !!f.paid, Notes: f.n } }));
      toast("اتجدد لحد " + r.expiration); reload();
    };
  };
}

function table(rows, cols) {
  if (!rows || !rows.length) return '<div class="empty">مفيش بيانات</div>';
  return `<table><tr>${cols.map(c => `<th>${c[1]}</th>`).join("")}</tr>${rows.map(r => `<tr>${cols.map(c => `<td>${c[2] ? c[2](r[c[0]], r) : esc(r[c[0]] ?? "")}</td>`).join("")}</tr>`).join("")}</table>`;
}

PAGES.profiles = async () => {
  PROFILES = await api("profiles");
  C(`<div class="panel"><h2><i class="bi bi-tags-fill"></i> العروض (الباقات) <span class="spacer"></span><button class="green" id="addP"><i class="bi bi-plus-lg"></i> باقة جديدة</button></h2>
    <div class="tablewrap">${table(PROFILES, [["name", "الاسم"], ["price", "السعر", v => fmt(v)], ["down_speed", "تحميل"], ["up_speed", "رفع"], ["rate_limit", "Rate-Limit"], ["days", "أيام"],
      ["quota_mb", "كوتة MB"], ["pool", "Pool"], ["users", "المشتركين"], ["id", "", (v) => `<button class="sm" data-p="${v}">تعديل</button>`]])}</div></div>`);
  const edit = p => {
    p = p || {};
    const m = modal(`<h3>${p.id ? "تعديل باقة" : "باقة جديدة"}</h3><form class="form" id="pf">
      <label>الاسم<input name="Name" value="${esc(p.name)}" required></label><label>السعر<input name="Price" type="number" step="0.01" value="${esc(p.price || 0)}"></label>
      <label>سرعة التحميل (مثلا 10M)<input name="DownSpeed" value="${esc(p.down_speed)}" dir="ltr"></label><label>سرعة الرفع (مثلا 2M)<input name="UpSpeed" value="${esc(p.up_speed)}" dir="ltr"></label>
      <label class="full">Rate-Limit كامل (اختياري، بيغطي على السرعات)<input name="RateLimit" value="${esc(p.rate_limit)}" dir="ltr"></label>
      <label>عدد الأيام<input name="Days" type="number" value="${esc(p.days || 30)}"></label><label>كوتة MB (0 = مفتوح)<input name="QuotaMB" type="number" value="${esc(p.quota_mb || 0)}"></label>
      <label>Pool<input name="Pool" value="${esc(p.pool)}" dir="ltr"></label><label>أجهزة في نفس الوقت<input name="Simul" type="number" value="${esc(p.simul || 1)}"></label>
      <div class="actions full"><button class="green">حفظ</button></div></form>`);
    $("#pf", m).onsubmit = async e => {
      e.preventDefault(); const f = formData(e.target);
      ["Price", "Days", "QuotaMB", "Simul"].forEach(k => f[k] = +f[k]);
      await act(() => api(p.id ? "profiles/" + p.id : "profiles", { method: p.id ? "PUT" : "POST", body: f }), "اتحفظت");
      closeModal(); PAGES.profiles();
    };
  };
  $("#addP").onclick = () => edit();
  document.querySelectorAll("[data-p]").forEach(b => b.onclick = () => edit(PROFILES.find(x => +x.id === +b.dataset.p)));
};

PAGES.managers = async () => {
  MANAGERS = await api("managers");
  C(`<div class="panel"><h2><i class="bi bi-bank"></i> المدراء <span class="spacer"></span><button class="green" id="addM"><i class="bi bi-plus-lg"></i> مدير جديد</button></h2>
    <div class="tablewrap">${table(MANAGERS, [["username", "اليوزر"], ["full_name", "الاسم"], ["phone", "الموبايل"], ["balance", "الرصيد", (v, r) => +r.unlimited ? "غير محدود" : fmt(v)],
      ["users", "المشتركين"], ["enabled", "الحالة", v => +v ? '<span class="tag green">فعال</span>' : '<span class="tag gray">موقوف</span>'],
      ["id", "", v => `<button class="sm green" data-dep="${v}">شحن</button> <button class="sm" data-led="${v}">الحساب</button> <button class="sm gray" data-ed="${v}">تعديل</button>`]])}</div></div>`);
  const edit = x => {
    x = x || { enabled: 1 };
    const m = modal(`<h3>${x.id ? "تعديل مدير" : "مدير جديد"}</h3><form class="form" id="mf"><label>اليوزر<input name="Username" value="${esc(x.username)}" required></label>
      <label>الاسم<input name="FullName" value="${esc(x.full_name)}"></label><label>الموبايل<input name="Phone" value="${esc(x.phone)}"></label>
      <label>المدير الأعلى<select name="ParentID">${options(MANAGERS.filter(z => z.id !== x.id), x.parent_id, "username")}</select></label>
      <label class="full"><span><input type="checkbox" name="Unlimited" ${+x.unlimited ? "checked" : ""} style="width:auto"> رصيد غير محدود</span></label>
      <label class="full"><span><input type="checkbox" name="Enabled" ${+x.enabled ? "checked" : ""} style="width:auto"> فعال</span></label>
      <div class="actions full"><button class="green">حفظ</button></div></form>`);
    $("#mf", m).onsubmit = async e => {
      e.preventDefault(); const f = formData(e.target);
      await act(() => api(x.id ? "managers/" + x.id : "managers", { method: x.id ? "PUT" : "POST", body: { ...f, ParentID: +f.ParentID, Unlimited: !!f.Unlimited, Enabled: !!f.Enabled } }), "اتحفظ");
      closeModal(); PAGES.managers();
    };
  };
  $("#addM").onclick = () => edit();
  document.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => edit(MANAGERS.find(x => +x.id === +b.dataset.ed)));
  document.querySelectorAll("[data-dep]").forEach(b => b.onclick = async () => {
    const amt = prompt("المبلغ (بالسالب للسحب):"); if (!amt) return;
    const reason = prompt("السبب:", "شحن رصيد") || "";
    await act(() => api(`managers/${b.dataset.dep}/balance`, { method: "POST", body: { Amount: +amt, Reason: reason } }), "تم"); PAGES.managers();
  });
  document.querySelectorAll("[data-led]").forEach(b => b.onclick = async () => {
    const rows = await api(`managers/${b.dataset.led}/balance`);
    modal(`<h3>كشف حساب</h3><div class="tablewrap">${table(rows, [["created", "الوقت"], ["delta", "المبلغ"], ["balance_after", "الرصيد بعدها"], ["reason", "السبب"], ["created_by", "بواسطة"]])}</div>`);
  });
};

PAGES.invoices = async () => {
  C(`<div class="panel"><h2><i class="bi bi-cash-stack"></i> الفواتير والشحن</h2><div class="toolbar"><select id="ik"><option value="">الكل</option><option value="subscriber">المشتركين</option>
    <option value="manager">المدراء</option><option value="card">الكروت</option></select><select id="ip"><option value="">مدفوع وغير مدفوع</option><option value="1">مدفوع</option><option value="0">غير مدفوع</option></select>
    <input type="date" id="if"><input type="date" id="it"></div><div class="tablewrap" id="itbl"></div></div>`);
  const load = async () => {
    const rows = await api("invoices?" + new URLSearchParams({ kind: $("#ik").value, paid: $("#ip").value, from: $("#if").value, to: $("#it").value }));
    $("#itbl").innerHTML = table(rows, [["created", "التاريخ"], ["kind", "النوع"], ["username", "المشترك"], ["manager", "المدير"], ["profile", "الباقة"], ["operation", "العملية"],
      ["amount", "المبلغ", v => fmt(v)], ["discount", "خصم"], ["paid", "مدفوع", v => +v ? '<span class="tag green">مدفوع</span>' : '<span class="tag red">غير مدفوع</span>'], ["created_by", "بواسطة"]]);
  };
  ["ik", "ip", "if", "it"].forEach(i => $("#" + i).onchange = load); load();
};

PAGES.cards = async () => {
  C(`<div class="panel"><h2><i class="bi bi-credit-card-2-front"></i> كروت الشحن <span class="spacer"></span><button class="green" id="gen"><i class="bi bi-plus-lg"></i> توليد كروت</button></h2>
    <div class="pbody" id="cst"></div><div class="toolbar"><select id="ck"><option value="">كل الأنواع</option><option value="recharge">كروت شحن</option><option value="user">كروت مستخدمين</option></select>
    <select id="cs"><option value="">كل الحالات</option><option value="new">جديد</option><option value="used">مستخدم</option></select><input id="cq" placeholder="بحث بالكود / السلسلة"></div><div class="tablewrap" id="ctbl"></div></div>`);
  const load = async () => {
    const r = await api("cards?" + new URLSearchParams({ kind: $("#ck").value, status: $("#cs").value, q: $("#cq").value }));
    $("#cst").innerHTML = r.stats.map(s => `<span class="tag ${s.status === "used" ? "gray" : "green"}">${s.kind === "user" ? "مستخدمين" : "شحن"} / ${s.status === "used" ? "مستخدم" : "جديد"}: ${fmt(s.n)}</span>`).join(" ") || "";
    $("#ctbl").innerHTML = table(r.rows, [["code", "الكود"], ["series", "السلسلة"], ["kind", "النوع"], ["profile", "الباقة"], ["price", "السعر"], ["status", "الحالة"], ["manager", "المدير"], ["expires", "صالح لحد"], ["created", "اتعمل"]]);
  };
  ["ck", "cs"].forEach(i => $("#" + i).onchange = load); let t; $("#cq").oninput = () => { clearTimeout(t); t = setTimeout(load, 350); };
  $("#gen").onclick = () => {
    const m = modal(`<h3>توليد كروت</h3><form class="form" id="gf"><label>النوع<select name="Kind"><option value="recharge">كروت شحن</option><option value="user">كروت مستخدمين</option></select></label>
      <label>العدد<input name="Count" type="number" min="1" max="1000" value="10"></label><label>الباقة<select name="ProfileID">${options(PROFILES, 0)}</select></label>
      <label>السعر<input name="Price" type="number" step="0.01" value="0"></label><label>بادئة<input name="Prefix" dir="ltr"></label><label>طول الكود<input name="Length" type="number" value="10"></label>
      <label>المدير<select name="ManagerID">${options(MANAGERS, 0, "username")}</select></label><label>اسم السلسلة<input name="Series"></label>
      <div class="actions full"><button class="green">توليد</button></div></form>`);
    $("#gf", m).onsubmit = async e => {
      e.preventDefault(); const f = formData(e.target); ["Count", "ProfileID", "Length", "ManagerID", "Price"].forEach(k => f[k] = +f[k]);
      const r = await act(() => api("cards/generate", { method: "POST", body: f }));
      modal(`<h3>اتعمل ${r.codes.length} كارت — السلسلة ${esc(r.series)}</h3><pre>${esc(r.codes.join("\n"))}</pre>`); load();
    };
  };
  load();
};

PAGES.nas = async () => {
  const rows = await api("nas");
  C(`<div class="panel"><h2><i class="bi bi-router-fill"></i> أجهزة NAS (السيرفرات اللي بتكلم الراديوس) <span class="spacer"></span><button class="green" id="addN"><i class="bi bi-plus-lg"></i> إضافة</button></h2>
    <div class="pbody muted">في وضع المراقبة مفيش سيرفر بيكلم النظام ده. إضافة NAS هنا مش بتغيّر أي حاجة على الميكروتيك.</div>
    <div class="tablewrap">${table(rows, [["nasname", "IP"], ["shortname", "الاسم"], ["type", "النوع"], ["description", "وصف"], ["id", "", v => `<button class="sm red" data-del="${v}">حذف</button>`]])}</div></div>`);
  $("#addN").onclick = () => {
    const m = modal(`<h3>إضافة NAS</h3><form class="form" id="nf"><label>IP<input name="Nasname" dir="ltr" required></label><label>الاسم<input name="Shortname"></label>
      <label>Secret<input name="Secret" type="password" required></label><label>وصف<input name="Description"></label><div class="actions full"><button class="green">حفظ</button></div></form>`);
    $("#nf", m).onsubmit = async e => { e.preventDefault(); await act(() => api("nas", { method: "POST", body: formData(e.target) }), "اتضاف"); closeModal(); PAGES.nas(); };
  };
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => { if (confirm("حذف الجهاز ده؟")) { await act(() => api("nas/" + b.dataset.del, { method: "DELETE" }), "اتحذف"); PAGES.nas(); } });
};

PAGES.online = async () => {
  const r = await api("online");
  C(`<div class="panel"><h2><i class="bi bi-speedometer2"></i> المتصلين الآن</h2>
    <div class="pbody"><b>على الراديوس الجديد:</b> ${fmt(r.own.length)} — <b>على ADV (آخر مزامنة):</b> ${fmt(r.adv.length)}</div>
    <div class="tablewrap">${r.own.length ? table(r.own, [["username", "اليوزر"], ["nasipaddress", "NAS"], ["framedipaddress", "IP"], ["callingstationid", "MAC"], ["acctstarttime", "من"]])
      : table(r.adv, [["username", "اليوزر"], ["nas", "NAS"], ["ip", "IP"], ["mac", "MAC"], ["since", "من"]])}</div></div>`);
};

PAGES.tickets = async () => {
  const rows = await api("tickets");
  C(`<div class="panel"><h2><i class="bi bi-exclamation-circle-fill"></i> الشكاوى <span class="spacer"></span><button class="green" id="addT"><i class="bi bi-plus-lg"></i> شكوى جديدة</button></h2>
    <div class="tablewrap">${table(rows, [["id", "#"], ["subject", "الموضوع"], ["username", "المشترك"], ["status", "الحالة"], ["created", "التاريخ"], ["created_by", "بواسطة"],
      ["id", "", v => `<button class="sm" data-t="${v}">فتح</button>`]])}</div></div>`);
  $("#addT").onclick = () => {
    const m = modal(`<h3>شكوى جديدة</h3><form class="form" id="tf"><label>يوزر المشترك<input name="Username"></label><label>الموضوع<input name="Subject" required></label>
      <label class="full">التفاصيل<textarea name="Body" rows="4"></textarea></label><div class="actions full"><button class="green">حفظ</button></div></form>`);
    $("#tf", m).onsubmit = async e => { e.preventDefault(); await act(() => api("tickets", { method: "POST", body: formData(e.target) }), "اتسجلت"); closeModal(); PAGES.tickets(); };
  };
  document.querySelectorAll("[data-t]").forEach(b => b.onclick = async () => {
    const d = await api("tickets/" + b.dataset.t), t = d.ticket[0];
    const m = modal(`<h3>${esc(t.subject)} <span class="tag gray">${esc(t.status)}</span></h3>${d.replies.map(x => `<div class="panel"><div class="pbody"><b>${esc(x.created_by)}</b> <span class="muted">${esc(x.created)}</span><br>${esc(x.body)}</div></div>`).join("")}
      <form class="form" id="rf"><label class="full">رد<textarea name="Body" rows="3"></textarea></label><label>الحالة<select name="Status"><option value="">بدون تغيير</option><option value="open">مفتوحة</option><option value="pending">معلقة</option><option value="closed">مقفولة</option></select></label>
      <div class="actions full"><button class="green">حفظ</button></div></form>`);
    $("#rf", m).onsubmit = async e => { e.preventDefault(); await act(() => api(`tickets/${t.id}/reply`, { method: "POST", body: formData(e.target) }), "اتحفظ"); closeModal(); PAGES.tickets(); };
  });
};

PAGES.reports = async () => {
  C(`<div class="panel"><h2><i class="bi bi-pie-chart-fill"></i> تقارير المبيعات</h2><div class="toolbar"><input type="date" id="rf"><input type="date" id="rt">
    <select id="rg"><option value="day">باليوم</option><option value="month">بالشهر</option><option value="manager">بالمدير</option><option value="profile">بالباقة</option><option value="kind">بالنوع</option></select></div>
    <div class="tablewrap" id="rtbl"></div></div>`);
  const load = async () => {
    const r = await api("reports/sales?" + new URLSearchParams({ from: $("#rf").value, to: $("#rt").value, group: $("#rg").value }));
    if (!$("#rf").value) { $("#rf").value = r.from; $("#rt").value = r.to; }
    const tot = r.rows.reduce((a, x) => (a.n += +x.n, a.p += +x.paid, a.u += +x.unpaid, a), { n: 0, p: 0, u: 0 });
    $("#rtbl").innerHTML = table(r.rows.concat([{ k: "الإجمالي", n: tot.n, paid: tot.p, unpaid: tot.u }]), [["k", "البند"], ["n", "عدد الفواتير"], ["paid", "مدفوع", v => fmt(v)], ["unpaid", "غير مدفوع", v => fmt(v)]]);
  };
  ["rf", "rt", "rg"].forEach(i => $("#" + i).onchange = load); load();
};

PAGES.sync = async () => {
  const d = await api("sync");
  const L = d.local;
  C(`<div class="panel"><h2><i class="bi bi-arrow-repeat"></i> المزامنة مع ADV (قراءة بس) <span class="spacer"></span>${ME.admin.role === "admin" ? '<button class="green" id="runS"><i class="bi bi-arrow-repeat"></i> زامن دلوقتي</button>' : ""}</h2>
    <div class="pbody">${d.cred_error ? `<div class="alert" style="background:var(--red)">${esc(d.cred_error)}</div>` : ""}
    <div class="kv"><div>الحالة</div><div>${esc(d.state)}</div><div>آخر مزامنة</div><div>${esc(d.last || "لسه")}</div>
      <div>المشتركين عندنا</div><div>${fmt(L.subscribers)} (منهم من ADV: ${fmt(L.from_adv)})</div><div>الباقات</div><div>${fmt(L.profiles)}</div><div>المدراء</div><div>${fmt(L.managers)}</div>
      <div>الكروت</div><div>${fmt(L.cards)}</div><div>المتصلين على ADV</div><div>${fmt(L.adv_online)}</div><div>مشتركين من غير باقة</div><div>${fmt(L.no_profile)}</div>
      <div>مشتركين من غير تاريخ انتهاء</div><div>${fmt(L.no_expiration)}</div><div>جاهزين على الراديوس الجديد</div><div>${fmt(L.radius_users)}</div></div>
    <h3>أرقام ADV نفسه (للمقارنة)</h3><pre>${esc(JSON.stringify(d.adv_metrics, null, 2))}</pre>
    <h3>سجل المزامنة</h3><div class="tablewrap">${table(d.logs, [["ts", "الوقت"], ["kind", "الجزء"], ["ok", "", v => +v ? "✔" : "✘"], ["fetched", "اتقرا"], ["changed", "اتغير"], ["message", "رسالة"]])}</div></div></div>`);
  const b = $("#runS"); if (b) b.onclick = async () => { b.disabled = true; b.textContent = "شغالة..."; try { await act(() => api("sync/run", { method: "POST" }), "خلصت"); } finally { PAGES.sync(); } };
  if (ME.admin.role === "admin") { verifyBox(); quotaCmpBox(); archiveBox(); }
};

// مطابقة مع ADV: random subscribers read live from ADV and compared field by field (runs every 6 hours by itself)

// مقارنة عدّ الجيجات: ADV's quota deduction vs our own count (download / upload / total) over the same window
async function quotaCmpBox() {
  const st = await api("sync/quota-compare").catch(() => null);
  if (!st) return;
  const L = st.last || {};
  const mb = v => fmt(Math.round(v || 0)) + " ميجا";
  const pc = v => (v > 0 ? "+" : "") + (v || 0) + "%";
  const box = document.createElement("div");
  box.className = "panel";
  box.innerHTML = `<h2><i class="bi bi-scale"></i> مقارنة عدّ الجيجات مع ADV <span class="spacer"></span>
    <button class="green" id="runQc" ${st.running ? "disabled" : ""}><i class="bi bi-play-fill"></i> ${st.running ? esc(st.state || "شغالة...") : "قيس 60 مشترك لمدة ساعة"}</button></h2>
    <div class="pbody"><div class="kv"><div>آخر قياس</div><div>${esc(L.ts || "لسه")}${L.minutes ? ` (${L.minutes} دقيقة)` : ""}</div><div>مشتركين اتقاسوا</div><div>${fmt(L.users || 0)}${L.skipped ? ` (اتشال ${fmt(L.skipped)} اتجدّدوا في النص)` : ""}</div>
      <div>ADV خصم</div><div>${mb(L.adv_mb)}</div>
      <div>إحنا عدّينا تحميل</div><div>${mb(L.down_mb)} (الفرق ${pc(L.vs_down_pc)})</div>
      <div>إحنا عدّينا رفع</div><div>${mb(L.up_mb)} (الفرق ${pc(L.vs_up_pc)})</div>
      <div>إحنا عدّينا تحميل + رفع</div><div>${mb((L.down_mb || 0) + (L.up_mb || 0))} (الفرق ${pc(L.vs_total_pc)})</div></div>
    ${(L.rows || []).length ? `<div class="tablewrap">${table(L.rows, [["user", "المشترك"], ["adv_mb", "ADV خصم", mb], ["down_mb", "تحميل عندنا", mb], ["up_mb", "رفع عندنا", mb], ["diff_pc", "الفرق", pc]])}</div>` : ""}</div>`;
  $("#content").appendChild(box);
  $("#runQc").onclick = async () => { await act(() => api("sync/quota-compare", { method: "POST", body: { N: 60, Minutes: 60 } }), "بدأت — النتيجة بعد ساعة وشوية"); PAGES.sync(); };
}
async function verifyBox() {
  const st = await api("sync/verify").catch(() => null);
  if (!st) return;
  const L = st.last || {};
  const box = document.createElement("div");
  box.className = "panel";
  box.innerHTML = `<h2><i class="bi bi-check2-square"></i> مطابقة مع ADV <span class="spacer"></span>
    <button class="green" id="runVer" ${st.running ? "disabled" : ""}><i class="bi bi-play-fill"></i> ${st.running ? "شغالة..." : "طابق 100 مشترك دلوقتي"}</button></h2>
    <div class="pbody"><div class="kv"><div>آخر مطابقة</div><div>${esc(L.ts || "لسه")}</div><div>اتفحص</div><div>${fmt(L.checked || 0)} مشترك</div>
      <div>متطابق 100%</div><div>${fmt(L.identical || 0)}</div><div>فيه اختلاف</div><div>${fmt(L.different || 0)}${L.fixed ? ` (اتصلّح منهم ${fmt(L.fixed)})` : ""}</div></div>
    ${(L.diffs || []).length ? `<div class="tablewrap">${table(L.diffs, [["user", "المشترك"], ["field", "الحقل"], ["adv", "في ADV"], ["ours", "عندنا"]])}</div>` : ""}</div>`;
  $("#content").appendChild(box);
  $("#runVer").onclick = async () => { await act(() => api("sync/verify", { method: "POST", body: { N: 100 } }), "بدأت — النتيجة خلال 3 دقايق تقريبا"); PAGES.sync(); };
}

// أرشيف ADV: keep ADV's activity log + every subscriber's old sessions before migrating (about one ADV call per subscriber)
async function archiveBox() {
  const st = await api("sync/archive").catch(() => null);
  if (!st) return;
  const box = document.createElement("div");
  box.className = "panel";
  box.innerHTML = `<h2><i class="bi bi-archive-fill"></i> أرشيف ADV (سجل العمليات + الجلسات القديمة) <span class="spacer"></span>
    <button class="orange" id="runArc" ${st.running ? "disabled" : ""}><i class="bi bi-download"></i> ${st.running ? "شغالة..." : "ابدأ الأرشفة"}</button></h2>
    <div class="pbody"><div class="kv"><div>الحالة</div><div>${esc(st.state || "لسه ما اتعملتش")}</div><div>عمليات محفوظة</div><div>${fmt(st.activity)}</div><div>جلسات محفوظة</div><div>${fmt(st.sessions)}</div></div>
    <p class="muted">بتقرا بس من ADV، طلب واحد لكل مشترك (حوالي ${fmt(5200)} طلب على نص ساعة تقريبا). سجل العمليات الجديد بيتحفظ لوحده كل 20 ثانية.</p></div>`;
  $("#content").appendChild(box);
  $("#runArc").onclick = async () => {
    const c = prompt("الأرشفة هتبعت آلاف الطلبات لـ ADV (قراءة بس). اكتب: نعم ابدأ");
    if (c === null) return;
    await act(() => api("sync/archive", { method: "POST", body: { Confirm: c.trim() } }), "بدأت — تابع الحالة هنا");
    PAGES.sync();
  };
}

PAGES.audit = async () => {
  let rows = [];
  let lastLoadedTime = Date.now();
  const st = { q: "", act: "", page: 1, size: 25 };

  C(`<div class="adv-card">
    <div class="adv-head">
      <span><i class="bi bi-clock-history text-primary"></i> سجل الرقابة والعمليات التشغيلية (NOC Audit Trail) <small id="audFound"></small></span>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="icon-btn" id="audReload" title="تحديث فوري"><i class="bi bi-arrow-repeat"></i></button>
      </div>
    </div>
    <div class="adv-body">
      <!-- Telemetry Bar -->
      <div class="noc-telemetry-bar">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="stale-badge stale-fresh" id="audBadge">
            <span class="stale-dot"></span>
            <span>آخر استعلام حي: <b id="audSec">منذ لحظات</b></span>
          </span>
          <span class="mini gray"><i class="bi bi-shield-check"></i> سجل غير قابل للتعديل أو الحذف (Tamper-Proof)</span>
        </div>
        <div class="adv-tbtns">
          <button id="audCsv" title="تصدير CSV"><i class="bi bi-file-text-o"></i> CSV</button>
          <button onclick="window.print()" title="طباعة"><i class="bi bi-print"></i> طباعة</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="adv-row" style="margin-bottom:12px">
        <div class="adv-f adv-grow">
          <label>بحث في السجل (المشغّل / المشترك المستهدف / عنوان IP / التفاصيل)</label>
          <div class="adv-inline">
            <span class="adv-cal"><i class="bi bi-funnel-fill"></i></span>
            <input id="audQ" placeholder="ابحث باسم المشغل أو المشترك أو IP...">
          </div>
        </div>
        <div class="adv-f">
          <label>نوع العملية (Action)</label>
          <select id="audAct">
            <option value="">كل العمليات</option>
            <option value="login">تسجيل الدخول</option>
            <option value="login_failed">فشل تسجيل الدخول</option>
            <option value="disconnect">فصل الجلسات (PoD)</option>
            <option value="subscriber">إدارة المشتركين</option>
            <option value="toggle">تغيير الحالة</option>
            <option value="nas">إدارة الـ NAS</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="tablewrap">
        <table class="adv-table" id="audT"></table>
      </div>

      <div class="adv-tools">
        <div id="audInfo" class="muted"></div>
        <div class="adv-pager" id="audPg"></div>
      </div>
    </div>
  </div>`);

  const actionBadge = a => {
    a = String(a || "");
    if (a.includes("fail")) return `<span class="tag red"><i class="bi bi-x-lg-circle"></i> ${esc(a)}</span>`;
    if (a.includes("login")) return `<span class="tag green"><i class="bi bi-sign-in"></i> ${esc(a)}</span>`;
    if (a.includes("disconnect")) return `<span class="tag red"><i class="bi bi-plug-fill"></i> ${esc(a)}</span>`;
    if (a.includes("delete")) return `<span class="tag red"><i class="bi bi-trash3-fill"></i> ${esc(a)}</span>`;
    if (a.includes("create")) return `<span class="tag green"><i class="bi bi-plus-lg"></i> ${esc(a)}</span>`;
    return `<span class="tag gray">${esc(a)}</span>`;
  };

  const draw = () => {
    const q = st.q.toLowerCase();
    const actFilter = st.act.toLowerCase();
    const filtered = rows.filter(r => {
      const matchQ = !q || (String(r.admin || "") + " " + String(r.action || "") + " " + String(r.target || "") + " " + String(r.ip || "") + " " + String(r.details || "")).toLowerCase().includes(q);
      const matchAct = !actFilter || String(r.action || "").toLowerCase().includes(actFilter);
      return matchQ && matchAct;
    });

    const pages = Math.max(1, Math.ceil(filtered.length / st.size));
    st.page = Math.min(st.page, pages);
    const view = filtered.slice((st.page - 1) * st.size, st.page * st.size);

    $("#audFound").textContent = `( تم إيجاد ${fmt(filtered.length)} من أصل ${fmt(rows.length)} عملية )`;
    $("#audInfo").textContent = `إظهار ${filtered.length ? (st.page - 1) * st.size + 1 : 0} إلى ${Math.min(filtered.length, st.page * st.size)} من أصل ${fmt(filtered.length)} مُدخل`;

    if (!view.length) {
      $("#audT").innerHTML = `
        <thead><tr><th>#</th><th>الوقت</th><th>المشغّل</th><th>العملية</th><th>الهدف</th><th>التفاصيل</th><th>عنوان IP</th></tr></thead>
        <tbody><tr><td colspan="7">
          <div class="noc-empty-state">
            <i class="bi bi-search-minus noc-empty-icon" style="opacity:0.4"></i>
            <h3>لا توجد عمليات تطابق البحث</h3>
            <p>لا توجد سجلات مطابقة لنص البحث أو الفلتر المحدد.</p>
            <button class="noc-btn-reset" id="btnAudReset"><i class="bi bi-undo"></i> إعادة تعيين الفلتر</button>
          </div>
        </td></tr></tbody>`;
      const btnReset = $("#btnAudReset");
      if (btnReset) btnReset.onclick = () => { st.q = ""; st.act = ""; $("#audQ").value = ""; $("#audAct").value = ""; draw(); };
      return;
    }

    $("#audT").innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>وقت العملية (Timestamp)</th>
          <th>بواسطة المشغّل</th>
          <th>نوع العملية</th>
          <th>المشترك / الهدف</th>
          <th>التفاصيل الفنية (Details)</th>
          <th>عنوان IP المشغّل</th>
        </tr>
      </thead>
      <tbody>
        ${view.map((r, i) => `
          <tr>
            <td class="c-n" style="background:#475569;color:#fff">${(st.page - 1) * st.size + i + 1}</td>
            <td><bdi dir="ltr" class="tech-val">${advDate(r.ts)}</bdi></td>
            <td><b>${esc(r.admin || "النظام")}</b></td>
            <td>${actionBadge(r.action)}</td>
            <td><b><bdi dir="ltr" class="tech-val">${esc(r.target || "—")}</bdi></b></td>
            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis">
              <span class="tech-val" style="font-size:12px;color:#475569"><bdi dir="ltr">${esc(String(r.details || "—").slice(0, 140))}</bdi></span>
            </td>
            <td><bdi dir="ltr" class="tech-val">${esc(r.ip || "—")}</bdi></td>
          </tr>`).join("")}
      </tbody>`;

    // Pager
    const p = st.page;
    const nums = [...new Set([1, pages, p - 1, p, p + 1, p + 2].filter(n => n >= 1 && n <= pages))].sort((a, b) => a - b);
    let html = `<a class="${p <= 1 ? "dis" : ""}" data-apg="${p - 1}">السابقة</a>`, last = 0;
    nums.forEach(n => {
      if (n - last > 1) html += "<span>…</span>";
      html += `<a class="${n === p ? "cur" : ""}" data-apg="${n}">${n}</a>`;
      last = n;
    });
    html += `<a class="${p >= pages ? "dis" : ""}" data-apg="${p + 1}">التالية</a>`;
    $("#audPg").innerHTML = html;
    $("#audPg").querySelectorAll("[data-apg]").forEach(a => {
      a.onclick = () => {
        const n = +a.dataset.apg;
        if (n >= 1 && n <= pages && n !== p) {
          st.page = n;
          draw();
        }
      };
    });
  };

  const load = async () => {
    // Skeleton
    const rowsHtml = Array.from({ length: 6 }).map(() =>
      `<tr class="skeleton-row">${Array.from({ length: 7 }).map(() => '<td><div class="skeleton-cell"></div></td>').join("")}</tr>`
    ).join("");
    $("#audT").innerHTML = `<thead><tr><th>#</th><th>الوقت</th><th>المشغّل</th><th>العملية</th><th>الهدف</th><th>التفاصيل</th><th>IP</th></tr></thead><tbody>${rowsHtml}</tbody>`;

    try {
      rows = await api("audit");
      lastLoadedTime = Date.now();
      draw();
    } catch (err) {
      $("#audT").innerHTML = `
        <thead><tr><th>#</th><th>الوقت</th><th>المشغّل</th><th>العملية</th><th>الحالة</th></tr></thead>
        <tbody><tr><td colspan="5">
          <div class="noc-error-state">
            <i class="bi bi-exclamation-triangle-fill noc-error-icon"></i>
            <h3>تعذر استرجاع سجل العمليات</h3>
            <p>${esc(err.message || "فشل الاتصال بقاعدة البيانات")}</p>
            <button class="noc-btn-retry" id="audRetry"><i class="bi bi-arrow-repeat"></i> إعادة المحاولة</button>
          </div>
        </td></tr></tbody>`;
      const btnRetry = $("#audRetry");
      if (btnRetry) btnRetry.onclick = () => load();
    }
  };

  $("#audReload").onclick = () => load();
  $("#audAct").onchange = e => { st.act = e.target.value; st.page = 1; draw(); };
  let tq;
  $("#audQ").oninput = e => {
    clearTimeout(tq);
    tq = setTimeout(() => {
      st.q = e.target.value.trim();
      st.page = 1;
      draw();
    }, 300);
  };

  $("#audCsv").onclick = () => {
    if (!rows.length) return;
    downloadCSV("audit_log", ["#", "الوقت", "المشغل", "العملية", "الهدف", "التفاصيل", "IP"],
      rows.map((r, i) => [i + 1, r.ts, r.admin, r.action, r.target, r.details, r.ip]));
  };

  load();
};

PAGES.admins = async () => {
  const rows = await api("admins");
  C(`<div class="panel"><h2><i class="bi bi-person-fill-secret"></i> مستخدمين اللوحة <span class="spacer"></span><button class="green" id="addA"><i class="bi bi-plus-lg"></i> مستخدم جديد</button></h2>
    <div class="tablewrap">${table(rows, [["username", "اليوزر"], ["full_name", "الاسم"], ["role", "الصلاحية", v => ({ admin: "مدير النظام", manager: "موزع", viewer: "مشاهدة بس" }[v] || v)],
      ["enabled", "الحالة", v => +v ? "فعال" : "موقوف"], ["id", "", v => `<button class="sm" data-a="${v}">تعديل</button>`]])}</div>
    <div class="pbody"><button class="gray" id="myPw">تغيير كلمة المرور بتاعتي</button></div></div>`);
  const edit = x => {
    x = x || { enabled: 1, role: "viewer" };
    const m = modal(`<h3>${x.id ? "تعديل" : "مستخدم جديد"}</h3><form class="form" id="af"><label>اليوزر<input name="Username" value="${esc(x.username)}" ${x.id ? "readonly" : "required"}></label>
      <label>الاسم<input name="FullName" value="${esc(x.full_name)}"></label><label>الصلاحية<select name="Role">${[["admin", "مدير النظام"], ["manager", "موزع"], ["viewer", "مشاهدة بس"]].map(([k, t]) => `<option value="${k}" ${x.role === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
      <label>مربوط بالمدير (للموزع)<select name="ManagerID">${options(MANAGERS, x.manager_id, "username")}</select></label>
      <label>كلمة مرور ${x.id ? "(سيبها فاضية لو مش هتغيرها)" : ""}<input name="Password" type="password" autocomplete="new-password"></label>
      <label><span><input type="checkbox" name="Enabled" ${+x.enabled ? "checked" : ""} style="width:auto"> فعال</span></label><div class="actions full"><button class="green">حفظ</button></div></form>`);
    $("#af", m).onsubmit = async e => {
      e.preventDefault(); const f = formData(e.target);
      await act(() => api(x.id ? "admins/" + x.id : "admins", { method: x.id ? "PUT" : "POST", body: { ...f, ManagerID: +f.ManagerID, Enabled: !!f.Enabled } }), "اتحفظ");
      closeModal(); PAGES.admins();
    };
  };
  $("#addA").onclick = () => edit();
  document.querySelectorAll("[data-a]").forEach(b => b.onclick = () => edit(rows.find(x => +x.id === +b.dataset.a)));
  $("#myPw").onclick = () => {
    const m = modal(`<h3>تغيير كلمة المرور</h3><form class="form" id="pw"><label>الحالية<input name="Current" type="password" required></label><label>الجديدة (8 حروف على الأقل)<input name="New" type="password" required minlength="8"></label>
      <div class="actions full"><button class="green">حفظ</button></div></form>`);
    $("#pw", m).onsubmit = async e => { e.preventDefault(); await act(() => api("me/password", { method: "POST", body: formData(e.target) }), "اتغيرت"); closeModal(); };
  };
};

PAGES.settings = async () => {
  const d = await api("settings"), S = Object.fromEntries(d.settings.map(x => [x.k, x.v]));
  const f = (k, label, help = "") => `<label>${label}<input name="${k}" value="${esc(S[k])}" dir="auto">${help ? `<small class="muted">${help}</small>` : ""}</label>`;
  C(`<div class="panel"><h2><i class="bi bi-cog"></i> الإعدادات</h2><div class="pbody"><form class="form" id="sf">
    ${f("company", "اسم الشركة")}${f("currency", "العملة")}
    ${f("expired_pool", "Pool المنتهي اشتراكهم", "زي END على السيرفرات")}${f("quota_pool", "Pool اللي خلصت باقتهم", "زي LIMIT")}
    ${f("expired_rate", "سرعة المنتهي (اختياري)", "مثلا 256k/256k")}${f("expiring_days", "ينتهي قريب = خلال كام يوم")}
    ${f("sync_minutes", "المزامنة مع ADV كل كام دقيقة")}${f("default_days", "أيام الباقة الافتراضية")}
    <label>ربط اليوزر بالـ MAC<select name="mac_bind"><option value="0" ${S.mac_bind !== "1" ? "selected" : ""}>مقفول</option><option value="1" ${S.mac_bind === "1" ? "selected" : ""}>مفعّل</option></select></label>
    <label>كلمة سر PPPoE الموحدة<input value="${d.default_password_set ? "متسجلة في ملف الإعدادات على السيرفر" : "مش متسجلة!"}" readonly></label>
    <div class="actions full"><button class="green">حفظ</button></div></form></div></div>
    <div class="panel"><h2><i class="bi bi-exchange"></i> وضع التشغيل</h2><div class="pbody">
      <p>الوضع الحالي: <b>${S.mode === "shadow" ? "مراقبة (Shadow) — ADV هو الشغال، والنظام ده بيقرا بس" : "تشغيل (Live)"}</b></p>
      <p class="muted">التحويل لـ Live بيفتح التجديد والفلوس هنا، ومش بيغيّر أي حاجة على السيرفرات. ربط السيرفرات بالراديوس الجديد خطوة منفصلة بموافقة المالك.</p>
      <button class="${S.mode === "shadow" ? "red" : "orange"}" id="modeBtn">${S.mode === "shadow" ? "حوّل لـ Live" : "رجّع لـ Shadow"}</button></div></div>`);
  $("#sf").onsubmit = async e => { e.preventDefault(); await act(() => api("settings", { method: "PUT", body: formData(e.target) }), "اتحفظت"); };
  $("#modeBtn").onclick = async () => {
    const to = S.mode === "shadow" ? "live" : "shadow";
    const c = prompt(`علشان تحوّل لـ ${to} اكتب: نعم انقل`); if (c !== "نعم انقل") return;
    await act(() => api("settings", { method: "PUT", body: { mode: to, confirm: c } }), "اتغير"); location.reload();
  };
};

boot();
