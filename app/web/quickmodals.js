// Stream RADIUS // Quick Modals & Global Topbar Search
// Centered live search with popup inspector + Side-by-side dashboard action shortcuts.
"use strict";

let searchTimer = null;

function initTopbarSearch() {
  const input = document.getElementById("topbarSearchInput");
  const dropdown = document.getElementById("topbarSearchResults");
  const clearBtn = document.getElementById("topbarSearchClear");
  if (!input || !dropdown || input._searchBound) return;
  input._searchBound = true;

  // Keyboard shortcut Ctrl+K or Cmd+K
  window.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      input.focus();
      input.select();
    }
    if (e.key === "Escape") {
      dropdown.classList.add("hidden");
    }
  });

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (clearBtn) clearBtn.classList.toggle("hidden", !q);
    clearTimeout(searchTimer);
    if (!q) {
      dropdown.innerHTML = "";
      dropdown.classList.add("hidden");
      return;
    }
    dropdown.innerHTML = `<div class="search-loading"><i class="bi bi-arrow-repeat bi-spin"></i> جاري البحث عن المشتركين...</div>`;
    dropdown.classList.remove("hidden");

    searchTimer = setTimeout(async () => {
      try {
        const res = await api("subscribers?q=" + encodeURIComponent(q) + "&size=8");
        const list = res.rows || [];
        if (!list.length) {
          dropdown.innerHTML = `<div class="search-empty"><i class="bi bi-person-x" style="font-size:18px"></i> لم يتم العثور على مشترك يطابق "${esc(q)}"</div>`;
          return;
        }
        dropdown.innerHTML = list.map(sub => {
          const isOnline = +sub.online === 1;
          const isAct = sub.st === "_act_" || (!sub.st && +sub.enabled && new Date(sub.expiration) > new Date());
          const ipVal = sub.framed_ip || sub.ip || "ديناميكي";
          return `
            <div class="search-item" onclick="openSubscriberQuickModalById(${sub.id})">
              <div class="search-item-avatar ${isOnline ? 'online' : ''}">
                <i class="bi ${isOnline ? 'bi-broadcast' : 'bi-person'}"></i>
              </div>
              <div class="search-item-info">
                <div class="search-item-title">
                  <span class="search-username">${esc(sub.username)}</span>
                  ${sub.firstname ? `<span class="search-fullname">(${esc(sub.firstname)} ${esc(sub.lastname || '')})</span>` : ''}
                </div>
                <div class="search-item-meta">
                  <span class="search-badge-ip"><i class="bi bi-hdd-network"></i> ${esc(ipVal)}</span>
                  <span class="search-badge-profile">${esc(sub.profile || 'بدون باقة')}</span>
                </div>
              </div>
              <div class="search-item-status">
                ${isOnline ? '<span class="dz-pill p-green"><span class="dz-dot"></span> متصل</span>' : ''}
                ${isAct ? '<span class="dz-pill p-sky">نشط</span>' : '<span class="dz-pill p-rose">منتهي</span>'}
              </div>
            </div>
          `;
        }).join("");
      } catch (err) {
        dropdown.innerHTML = `<div class="search-empty text-danger">خطأ أثناء البحث: ${esc(err.message)}</div>`;
      }
    }, 200);
  });

  // Close dropdown on outside click
  document.addEventListener("click", e => {
    if (!e.target.closest("#topbarSearchContainer")) {
      dropdown.classList.add("hidden");
    }
  });
}

function clearTopbarSearch() {
  const input = document.getElementById("topbarSearchInput");
  const dropdown = document.getElementById("topbarSearchResults");
  const clearBtn = document.getElementById("topbarSearchClear");
  if (input) { input.value = ""; input.focus(); }
  if (dropdown) dropdown.classList.add("hidden");
  if (clearBtn) clearBtn.classList.add("hidden");
}

// -----------------------------------------------------------------------------
// 1. Subscriber Quick Modal Inspector (بطاقة فحص المشترك في نافذة منبثقة)
// -----------------------------------------------------------------------------
async function openSubscriberQuickModalById(id) {
  const dropdown = document.getElementById("topbarSearchResults");
  if (dropdown) dropdown.classList.add("hidden");
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري جلب تفاصيل المشترك...</p></div>`);
  try {
    const sub = await api("subscribers/" + id);
    openSubscriberQuickModal(sub);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger">تعذر تحميل بيانات المشترك: ${esc(err.message)}</div>`);
  }
}

function openSubscriberQuickModal(sub) {
  const isOnline = +sub.online === 1;
  const isAct = +sub.enabled && sub.expiration && new Date(sub.expiration.replace(" ", "T")) > new Date();
  const staticIP = sub.framed_ip || "غير محدد (ديناميكي)";
  const currentIP = sub.ip || (isOnline ? "متصل" : "غير متصل");
  const macVal = sub.mac || "غير مسجل";
  const usedGb = sub.used_mb ? (sub.used_mb / 1024).toFixed(1) + " GB" : "0 GB";
  const quotaGb = sub.quota_mb ? (sub.quota_mb / 1024).toFixed(1) + " GB" : "غير محدودة";
  const quotaPct = sub.quota_mb && sub.used_mb ? Math.min(100, Math.round((sub.used_mb / sub.quota_mb) * 100)) : 0;

  const contentHtml = `
    <div class="sub-modal-wrap wide">
      
      <!-- Modal Header -->
      <div class="sub-modal-header">
        <div class="sub-avatar-box">
          <i class="bi ${isOnline ? 'bi-broadcast text-emerald-400' : 'bi-person-fill'}"></i>
        </div>
        <div class="sub-header-details">
          <div class="sub-title-row">
            <h3 class="sub-modal-username">${esc(sub.username)}</h3>
            <span class="sub-modal-id">#${sub.id}</span>
            ${isOnline ? '<span class="dz-pill p-green"><span class="dz-dot"></span> متصل الآن</span>' : '<span class="dz-pill p-slate">غير متصل</span>'}
            ${isAct ? '<span class="dz-pill p-sky">اشتراك فعال</span>' : '<span class="dz-pill p-rose">اشتراك منتهي</span>'}
          </div>
          <div class="sub-fullname">
            ${sub.firstname ? `${esc(sub.firstname)} ${esc(sub.lastname || '')}` : 'مشترك راديوس'} 
            ${sub.mobile ? ` • <a href="tel:${esc(sub.mobile)}" style="color:var(--accent);text-decoration:none"><i class="bi bi-telephone-fill"></i> ${esc(sub.mobile)}</a>` : ''}
          </div>
        </div>
      </div>

      <!-- Quick Action Toolbar inside Modal -->
      <div class="sub-modal-actions-bar">
        <button class="modal-btn-act primary" onclick="location.hash='#user?id=${sub.id}';closeModal();">
          <i class="bi bi-pencil-square"></i> تعديل كامل البيانات
        </button>
        <button class="modal-btn-act" onclick="USEROPS.RENEW(${sub.id});">
          <i class="bi bi-arrow-repeat"></i> تجديد الاشتراك
        </button>
        <button class="modal-btn-act" onclick="USEROPS.add_quota(${sub.id});">
          <i class="bi bi-plus-circle"></i> إضافة كوتة
        </button>
        ${isOnline ? `
          <button class="modal-btn-act danger" onclick="USEROPS.disconnect_user(${sub.id}, () => openSubscriberQuickModalById(${sub.id}));">
            <i class="bi bi-power"></i> فصل الجلسة (PoD)
          </button>
        ` : ''}
      </div>

      <!-- Modal Body: 4 Studio Inspector Cards -->
      <div class="sub-modal-body">
        <div class="sub-modal-grid">
          
          <!-- Card 1: Network & Connection -->
          <div class="sub-inspector-card">
            <div class="sub-card-title"><i class="bi bi-diagram-3-fill" style="color:var(--accent)"></i> بيانات الشبكة والاتصال</div>
            <div class="sub-prop-row">
              <span class="k">عنوان Static IP:</span>
              <span class="v mono" style="color:var(--accent)">
                ${esc(staticIP)} 
                ${sub.framed_ip ? `<i class="bi bi-copy copy-ico" title="انقر لنسخ الآيبي" onclick="navigator.clipboard.writeText('${esc(sub.framed_ip)}');toast('تم نسخ الآيبي');"></i>` : ''}
              </span>
            </div>
            <div class="sub-prop-row">
              <span class="k">الآيبي اللحظي (Session):</span>
              <span class="v mono">${esc(currentIP)}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">عنوان الماك (MAC):</span>
              <span class="v mono">${esc(macVal)}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">راوتر الـ NAS:</span>
              <span class="v">${esc(sub.nas_name || sub.nas || 'غير محدد')}</span>
            </div>
          </div>

          <!-- Card 2: Profile & Quota -->
          <div class="sub-inspector-card">
            <div class="sub-card-title"><i class="bi bi-speedometer2" style="color:var(--badge-green-text)"></i> الباقة والاستهلاك</div>
            <div class="sub-prop-row">
              <span class="k">الباقة الحالية:</span>
              <span class="v font-bold">${esc(sub.profile || 'بدون باقة')}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">السعر الشهري:</span>
              <span class="v mono">${sub.price ? esc(sub.price) + ' ج.م' : '—'}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">الاستهلاك / السعة:</span>
              <span class="v mono">${usedGb} / ${quotaGb}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">الرصيد المالي:</span>
              <span class="v mono" style="color:${+sub.money >= 0 ? 'var(--badge-green-text)' : 'var(--badge-rose-text)'}">${fmt(sub.money)} ج.م</span>
            </div>
          </div>

          <!-- Card 3: Validity & Dates -->
          <div class="sub-inspector-card">
            <div class="sub-card-title"><i class="bi bi-calendar-check-fill" style="color:var(--badge-amber-text)"></i> الصلاحية والتواريخ</div>
            <div class="sub-prop-row">
              <span class="k">تاريخ الانتهاء:</span>
              <span class="v mono font-bold" style="color:${isAct ? 'var(--text-main)' : 'var(--badge-rose-text)'}">
                ${esc(sub.expiration || 'غير محدد')}
              </span>
            </div>
            <div class="sub-prop-row">
              <span class="k">تاريخ الإنشاء:</span>
              <span class="v mono">${esc(sub.created || '—')}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">تفعيل المشترك:</span>
              <span class="v">${+sub.enabled ? 'مفعل' : 'موقوف إدارياً'}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">التجديد التلقائي:</span>
              <span class="v">${+sub.auto_renew ? 'مفعل تلقائياً' : 'غير مفعل'}</span>
            </div>
          </div>

          <!-- Card 4: Management & Notes -->
          <div class="sub-inspector-card">
            <div class="sub-card-title"><i class="bi bi-info-circle-fill" style="color:var(--text-muted)"></i> الإدارة والملاحظات</div>
            <div class="sub-prop-row">
              <span class="k">المدير المسؤول:</span>
              <span class="v">${esc(sub.manager || 'الإدارة المركزية')}</span>
            </div>
            <div class="sub-prop-row">
              <span class="k">العنوان:</span>
              <span class="v">${esc(sub.address || '—')}</span>
            </div>
            <div class="sub-prop-row" style="grid-column:span 2">
              <span class="k">ملاحظات:</span>
              <span class="v">${esc(sub.notes || 'لا توجد ملاحظات مسجلة')}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Modal Footer -->
      <div class="sub-modal-footer">
        <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
      </div>

    </div>
  `;

  modal(contentHtml);
}

// -----------------------------------------------------------------------------
// 2. Dashboard Quick Modals (نوافذ الاختصارات السريعة)
// -----------------------------------------------------------------------------

// A. Quick Add Subscriber Modal
function openQuickAddUserModal() {
  const profilesOpts = (PROFILES || []).map(p => `<option value="${p.id}">${esc(p.name)} (${p.price ? p.price + ' ج.م' : 'مجاني'})</option>`).join("");
  const managersOpts = (MANAGERS || []).map(m => `<option value="${m.id}">${esc(m.username)}</option>`).join("");

  const html = `
    <div class="quick-modal-content">
      <div class="quick-modal-head">
        <div class="quick-modal-icon" style="background:var(--accent-subtle);color:var(--accent)">
          <i class="bi bi-person-plus-fill"></i>
        </div>
        <div>
          <h3>إضافة مشترك جديد</h3>
          <small>إنشاء حساب مشترك جديد وتفعيله فورياً على النظام</small>
        </div>
      </div>

      <form id="quickAddUserForm">
        <div class="quick-modal-body">
          <div class="form-grid-2">
            <div class="form-group">
              <label>اسم المستخدم *</label>
              <input name="username" required placeholder="مثال: ahmed_net" autocomplete="off" class="mono">
            </div>
            <div class="form-group">
              <label>كلمة المرور *</label>
              <input name="password" required type="text" value="${Math.floor(100000 + Math.random() * 900000)}" class="mono">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label>باقة الاشتراك *</label>
              <select name="profile_id" required>
                ${profilesOpts || '<option value="0">افتراضي</option>'}
              </select>
            </div>
            <div class="form-group">
              <label>رقم الهاتف / الموبايل</label>
              <input name="mobile" placeholder="01xxxxxxxxx" class="mono">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label>عنوان IP ثابت (اختياري)</label>
              <input name="framed_ip" placeholder="مثال: 10.10.20.50" class="mono">
            </div>
            <div class="form-group">
              <label>المسؤول / الفرع</label>
              <select name="manager_id">
                <option value="0">— الإدارة المركزية —</option>
                ${managersOpts}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>ملاحظات أو العنوان</label>
            <input name="notes" placeholder="ملاحظات التركيب، المكان، رقم العقد، إلخ...">
          </div>
        </div>

        <div class="quick-modal-footer">
          <button type="button" class="btn-cancel" onclick="closeModal()">إلغاء</button>
          <button type="submit" class="btn-primary"><i class="bi bi-check2-circle"></i> إنشاء وتفعيل الحساب</button>
        </div>
      </form>
    </div>
  `;

  modal(html);

  const form = document.getElementById("quickAddUserForm");
  if (form) {
    form.onsubmit = async e => {
      e.preventDefault();
      const data = formData(form);
      try {
        await api("user", { method: "POST", body: data });
        toast("تم إنشاء وتفعيل حساب المشترك بنجاح!");
        closeModal();
        if (location.hash === "#dashboard" || !location.hash) PAGES.dashboard();
      } catch (err) {
        toast(err.message, true);
      }
    };
  }
}

// B. Quick Renewals Modal
async function openQuickRenewalsModal() {
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري جلب المشتركين المنتهين...</p></div>`);
  try {
    const res = await api("subscribers?status=expiring&size=10");
    const rows = res.rows || [];
    const html = `
      <div class="quick-modal-content wide">
        <div class="quick-modal-head">
          <div class="quick-modal-icon" style="background:var(--badge-amber-bg);color:var(--badge-amber-text)">
            <i class="bi bi-hourglass-split"></i>
          </div>
          <div>
            <h3>تجديد الاشتراكات المنتهية</h3>
            <small>قائمة المشتركين التي توشك اشتراكاتهم على الانتهاء أو منتهية الصلاحية</small>
          </div>
        </div>

        <div class="quick-modal-body">
          ${!rows.length ? '<div class="p-4 text-center" style="color:var(--text-muted)">لا توجد اشتراكات منتهية أو بحاجة لتجديد حالياً 🎉</div>' : `
            <div class="table-wrap">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>اسم المشترك</th>
                    <th>الباقة</th>
                    <th>تاريخ الانتهاء</th>
                    <th>الرصيد الحالي</th>
                    <th style="text-align:center">إجراء فوري</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(r => `
                    <tr>
                      <td><b class="mono">${esc(r.username)}</b><br><small style="color:var(--text-muted)">${esc(r.mobile || '')}</small></td>
                      <td>${esc(r.profile || '—')}</td>
                      <td class="mono" style="color:var(--badge-rose-text);font-weight:700">${esc(r.expiration ? r.expiration.split(' ')[0] : 'منتهي')}</td>
                      <td class="mono font-bold">${fmt(r.money)} ج.م</td>
                      <td style="text-align:center">
                        <button class="btn-primary sm" onclick="USEROPS.RENEW(${r.id});closeModal();" style="padding:5px 12px;font-size:12px">
                          <i class="bi bi-arrow-repeat"></i> تجديد الآن
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="quick-modal-footer" style="justify-content:space-between">
          <a href="#subscribers?status=expiring" onclick="closeModal()" style="font-size:12.5px;color:var(--accent);text-decoration:none;font-weight:700">عرض كامل قائمة التجديدات ←</a>
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
        </div>
      </div>
    `;
    modal(html);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger">خطأ: ${esc(err.message)}</div>`);
  }
}

// C. Quick Speed Boost Modal
async function openQuickSpeedModal() {
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري جلب حالة السرعات...</p></div>`);
  try {
    const d = await api("speed");
    const on = d.state === "on";
    const html = `
      <div class="quick-modal-content">
        <div class="quick-modal-head">
          <div class="quick-modal-icon" style="background:var(--accent-subtle);color:var(--accent)">
            <i class="bi bi-lightning-charge-fill"></i>
          </div>
          <div>
            <h3>التحكم اللحظي في السرعات</h3>
            <small>مضاعفة أو زيادة السرعة فورياً لجميع المشتركين دون انقطاع الاتصال</small>
          </div>
        </div>

        <div class="quick-modal-body">
          <div style="margin-bottom:16px;padding:12px 16px;background:var(--bg-card-subtle);border-radius:12px;border:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:12.5px;font-weight:700">الحالة التشغيلية الحالية:</span>
            <span class="dz-pill ${on ? 'p-green' : 'p-slate'}">${on ? 'الزيادة مفعلة الآن' : 'السرعات الطبيعية الافتراضية'}</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="speed-boost-card" onclick="applyQuickSpeed('multiply', 2, 'temp', 2)">
              <div class="sbc-icon" style="color:var(--accent)"><i class="bi bi-lightning-charge-fill"></i></div>
              <div class="sbc-text">
                <b>مضاعفة السرعة ×2</b>
                <small>لمدة ساعتين لجميع الباقات</small>
              </div>
            </div>

            <div class="speed-boost-card" onclick="applyQuickSpeed('add', 5, 'temp', 3)">
              <div class="sbc-icon" style="color:var(--badge-green-text)"><i class="bi bi-rocket-takeoff-fill"></i></div>
              <div class="sbc-text">
                <b>زيادة +5 ميجا</b>
                <small>لمدة 3 ساعات لجميع المشتركين</small>
              </div>
            </div>

            <div class="speed-boost-card" onclick="applyQuickSpeed('multiply', 1.5, 'permanent')">
              <div class="sbc-icon" style="color:var(--badge-amber-text)"><i class="bi bi-star-fill"></i></div>
              <div class="sbc-text">
                <b>زيادة ×1.5 دائمة</b>
                <small>مستمرة حتى الاسترجاع اليدوي</small>
              </div>
            </div>

            <div class="speed-boost-card reset" onclick="restoreQuickSpeed()" style="${!on ? 'opacity:0.5;pointer-events:none' : ''}">
              <div class="sbc-icon" style="color:#ef4444"><i class="bi bi-arrow-counterclockwise"></i></div>
              <div class="sbc-text">
                <b>استرجاع السرعات الطبيعية</b>
                <small>إلغاء الزيادة وإرجاع كل الباقات</small>
              </div>
            </div>
          </div>
        </div>

        <div class="quick-modal-footer" style="justify-content:space-between">
          <a href="#speed" onclick="closeModal()" style="font-size:12.5px;color:var(--accent);text-decoration:none;font-weight:700">فتح لوحة التحكم التفصيلية بالسرعات ←</a>
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
        </div>
      </div>
    `;
    modal(html);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger">خطأ: ${esc(err.message)}</div>`);
  }
}

async function applyQuickSpeed(type, val, mode, hours = 2) {
  try {
    await api("speed", { method: "POST", body: { mode, type, value: val, hours } });
    toast("تم تفعيل زيادة السرعة بنجاح!");
    closeModal();
  } catch (e) { toast(e.message, true); }
}

async function restoreQuickSpeed() {
  try {
    await api("speed", { method: "POST", body: { mode: "off" } });
    toast("تم استرجاع السرعات الطبيعية لجميع الباقات.");
    closeModal();
  } catch (e) { toast(e.message, true); }
}

// D. Quick SSTP & VPN Modal
async function openQuickSstpModal() {
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري فحص أنفاق SSTP...</p></div>`);
  try {
    const res = await api("vpn");
    const clients = res.clients || [];
    const html = `
      <div class="quick-modal-content wide">
        <div class="quick-modal-head">
          <div class="quick-modal-icon" style="background:var(--accent-subtle);color:var(--accent)">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <h3>بوابات وأنفاق اتصال SSTP</h3>
            <small>خادم البوابة الآمنة المباشر (تشفير مركزي AES-256)</small>
          </div>
        </div>

        <div class="quick-modal-body">
          ${!clients.length ? '<div class="p-4 text-center" style="color:var(--text-muted)">لا توجد فروع مسجلة حالياً</div>' : `
            <div class="table-wrap">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>اسم الفرع / الموقع</th>
                    <th>حالة الاتصال</th>
                    <th>عنوان IP الثابت</th>
                    <th>اسم المستخدم</th>
                    <th style="text-align:center">الجلسات المتصلة</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(c => `
                    <tr>
                      <td><b>${esc(c.name)}</b></td>
                      <td>
                        ${+c.enabled 
                          ? (c.connected ? '<span class="dz-pill p-green"><span class="dz-dot"></span> متصل</span>' : '<span class="dz-pill p-rose">غير متصل</span>') 
                          : '<span class="dz-pill p-slate">موقوف</span>'}
                      </td>
                      <td><span class="mono" style="color:var(--accent);font-weight:bold">${esc(c.ip)}</span></td>
                      <td class="mono">${esc(c.username)}</td>
                      <td class="mono font-bold" style="text-align:center">${fmt(c.online_cards)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="quick-modal-footer" style="justify-content:space-between">
          <a href="#vpn" onclick="closeModal()" style="font-size:12.5px;color:var(--accent);text-decoration:none;font-weight:700">فتح إدارة VPN بالكامل ←</a>
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
        </div>
      </div>
    `;
    modal(html);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger">خطأ: ${esc(err.message)}</div>`);
  }
}

// E. Quick NAS Fleet Modal
async function openQuickNasModal() {
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري جلب أجهزة NAS والراوترات...</p></div>`);
  try {
    const list = await api("nas");
    const html = `
      <div class="quick-modal-content wide">
        <div class="quick-modal-head">
          <div class="quick-modal-icon" style="background:var(--badge-green-bg);color:var(--badge-green-text)">
            <i class="bi bi-hdd-network-fill"></i>
          </div>
          <div>
            <h3>أجهزة الراوتر ومواقع التوزيع (NAS)</h3>
            <small>راوترات MikroTik وخوادم التوزيع المتصلة بالنظام</small>
          </div>
        </div>

        <div class="quick-modal-body">
          ${!list.length ? '<div class="p-4 text-center" style="color:var(--text-muted)">لا توجد أجهزة NAS مسجلة</div>' : `
            <div class="table-wrap">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>اسم الراوتر</th>
                    <th>عنوان IP</th>
                    <th>نوع الجهاز</th>
                    <th>الوصف / الموقع</th>
                  </tr>
                </thead>
                <tbody>
                  ${list.map(n => `
                    <tr>
                      <td><b>${esc(n.shortname || n.nasname)}</b></td>
                      <td><span class="mono font-bold" style="color:var(--accent)">${esc(n.nasname)}</span></td>
                      <td><span class="dz-pill p-slate">${esc(n.type || 'mikrotik')}</span></td>
                      <td>${esc(n.description || '—')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="quick-modal-footer" style="justify-content:space-between">
          <a href="#nas" onclick="closeModal()" style="font-size:12.5px;color:var(--accent);text-decoration:none;font-weight:700">فتح صفحة أجهزة NAS ←</a>
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
        </div>
      </div>
    `;
    modal(html);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger">خطأ: ${esc(err.message)}</div>`);
  }
}

// F. Quick FreeRADIUS Logs Modal
async function openQuickLogsModal() {
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري جلب سجلات FreeRADIUS...</p></div>`);
  try {
    const res = await api("reports?type=radius&size=15").catch(() => api("reports"));
    const rows = res.rows || res.radius || [];
    const html = `
      <div class="quick-modal-content wide">
        <div class="quick-modal-head">
          <div class="quick-modal-icon" style="background:var(--badge-slate-bg);color:var(--badge-slate-text)">
            <i class="bi bi-terminal-fill"></i>
          </div>
          <div>
            <h3>سجلات أحداث الراديوس الحية</h3>
            <small>مراقبة عمليات تسجيل الدخول والمصادقة والفصل اللحظية</small>
          </div>
        </div>

        <div class="quick-modal-body">
          ${!rows.length ? '<div class="p-4 text-center" style="color:var(--text-muted)">سيرفر FreeRADIUS يعمل بصفر أخطاء مصادقة!</div>' : `
            <div class="table-wrap">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>التوقيت</th>
                    <th>اسم المستخدم</th>
                    <th>نوع الحدث</th>
                    <th>راوتر البث (NAS)</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(l => `
                    <tr>
                      <td class="mono" style="font-size:11px">${esc(l.time || l.created || 'الآن')}</td>
                      <td class="mono font-bold">${esc(l.username || '—')}</td>
                      <td><span class="dz-pill p-green">${esc(l.event || l.action || 'Login OK')}</span></td>
                      <td class="mono">${esc(l.nas || l.ip || '127.0.0.1')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="quick-modal-footer" style="justify-content:space-between">
          <a href="#reports" onclick="closeModal()" style="font-size:12.5px;color:var(--accent);text-decoration:none;font-weight:700">فتح كامل تقارير وسجلات الراديوس ←</a>
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
        </div>
      </div>
    `;
    modal(html);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger">خطأ: ${esc(err.message)}</div>`);
  }
}

// Auto-init search when document is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTopbarSearch);
} else {
  initTopbarSearch();
}


// -----------------------------------------------------------------------------
// G. Quick Cafe Cards Modal (كروت الكافيهات)
// -----------------------------------------------------------------------------
async function openQuickCafeModal() {
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري جلب كروت وحزم الكافيهات...</p></div>`);
  try {
    const d = await api("cafe");
    const series = d.series || [];
    const totalAvail = series.reduce((s, x) => s + (+x.available || 0), 0);
    const totalOnline = series.reduce((s, x) => s + (+x.online || 0), 0);
    const totalQty = series.reduce((s, x) => s + (+x.qty || 0), 0);

    const html = `
      <div class="quick-modal-content wide">
        <div class="quick-modal-head">
          <div class="quick-modal-icon" style="background:#fef3c7;color:#d97706">
            <i class="bi bi-cup-hot-fill"></i>
          </div>
          <div>
            <h3>كروت الكافيهات والهوتسبوت</h3>
            <small>متابعة وإدارة حزم الكروت النشطة، المتاحة للبيع، والمتصلة لحظياً</small>
          </div>
        </div>

        <div class="quick-modal-body">
          <div class="sub-modal-kpis" style="margin-bottom:16px">
            <div class="kpi-mini-card">
              <span class="kpi-mini-val" style="color:#d97706">${fmt(totalAvail)}</span>
              <span class="kpi-mini-lbl">كروت متاحة للبيع</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-mini-val" style="color:var(--badge-green-text)">${fmt(totalOnline)}</span>
              <span class="kpi-mini-lbl">متصل الآن أونلاين</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-mini-val" style="color:var(--accent)">${fmt(series.length)}</span>
              <span class="kpi-mini-lbl">حزم كروت مسجلة</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-mini-val" style="color:var(--text-main)">${fmt(totalQty)}</span>
              <span class="kpi-mini-lbl">إجمالي الكروت المنشأة</span>
            </div>
          </div>

          ${!series.length ? '<div class="p-4 text-center" style="color:var(--text-muted)">لا توجد حزم كافيهات منشأة حالياً. يمكنك إنشاء أول حزمة من صفحة كروت الكافيهات.</div>' : `
            <div class="table-wrap">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>اسم الحزمة</th>
                    <th>الكافيه / الموقع</th>
                    <th>الباقة</th>
                    <th>السعر</th>
                    <th>المتاح / الإجمالي</th>
                    <th>أونلاين</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${series.slice(0, 10).map(s => `
                    <tr>
                      <td><b>${esc(s.name)}</b></td>
                      <td>${esc(s.cafe || "—")}</td>
                      <td><span class="mono" style="font-weight:600">${esc(s.profile || "افتراضي")}</span></td>
                      <td><b>${fmt(s.price)} ج.م</b></td>
                      <td><span class="mono" style="font-weight:700;color:${+s.available > 0 ? '#10b981' : '#f43f5e'}">${fmt(s.available)}</span> / <span class="mono">${fmt(s.qty)}</span></td>
                      <td>${+s.online > 0 ? `<span class="badge-online"><i class="bi bi-broadcast"></i> ${fmt(s.online)}</span>` : '<span class="mono text-muted">0</span>'}</td>
                      <td>${+s.enabled ? '<span class="status-pill active">نشطة</span>' : '<span class="status-pill stopped">معطلة</span>'}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="quick-modal-footer">
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
          <button type="button" class="btn-primary" onclick="closeModal();location.hash='#cafe'">
            <i class="bi bi-box-arrow-up-right"></i> فتح إدارة كروت الكافيهات بالكامل ←
          </button>
        </div>
      </div>
    `;
    modal(html);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger"><i class="bi bi-exclamation-triangle fs-3"></i><p style="margin-top:10px">${esc(err.message)}</p></div>`);
  }
}

// -----------------------------------------------------------------------------
// H. Quick Cash Transactions Modal (معاملات الكاش)
// -----------------------------------------------------------------------------
async function openQuickCashModal() {
  modal(`<div class="p-4 text-center"><i class="bi bi-arrow-repeat bi-spin fs-3" style="color:var(--accent)"></i><p style="margin-top:10px;color:var(--text-muted)">جاري جلب معاملات الكاش وإنستاباي...</p></div>`);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const d = await api("cash?size=15");
    const rows = d.rows || [];
    const fresh = rows.filter(r => r.status === "new");
    const sumFresh = fresh.reduce((s, r) => s + +r.amount, 0);
    const totalAmount = rows.reduce((s, r) => s + +r.amount, 0);

    const html = `
      <div class="quick-modal-content wide">
        <div class="quick-modal-head">
          <div class="quick-modal-icon" style="background:#d1fae5;color:#059669">
            <i class="bi bi-cash-stack"></i>
          </div>
          <div>
            <h3>معاملات الكاش وإنستاباي</h3>
            <small>مراقبة وتخصيص تحويلات المحافظ الإلكترونية الواردة وتفعيل الاشتراكات</small>
          </div>
        </div>

        <div class="quick-modal-body">
          <div class="sub-modal-kpis" style="margin-bottom:16px">
            <div class="kpi-mini-card">
              <span class="kpi-mini-val" style="color:#059669">${fmt(sumFresh)} ج.م</span>
              <span class="kpi-mini-lbl">تحويلات جديدة غير مستخدمة (${fmt(fresh.length)})</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-mini-val" style="color:var(--accent)">${fmt(totalAmount)} ج.م</span>
              <span class="kpi-mini-lbl">إجمالي المبالغ المسجلة</span>
            </div>
            <div class="kpi-mini-card">
              <span class="kpi-mini-val" style="color:var(--text-main)">${fmt(rows.length)}</span>
              <span class="kpi-mini-lbl">إجمالي العمليات الواردة</span>
            </div>
          </div>

          ${!rows.length ? '<div class="p-4 text-center" style="color:var(--text-muted)">لا توجد معاملات كاش مسجلة حديثاً في النظام.</div>' : `
            <div class="table-wrap">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>كود المعاملة</th>
                    <th>المصدر / المحفظة</th>
                    <th>المبلغ</th>
                    <th>التاريخ / التوقيت</th>
                    <th>الحالة</th>
                    <th>المشترك المرتبط</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.slice(0, 12).map(r => {
                    const isNew = r.status === "new";
                    const isUsed = r.status === "used";
                    return `
                      <tr>
                        <td><b class="mono" style="color:var(--accent)">${esc(r.code || "—")}</b></td>
                        <td>
                          <span class="status-pill ${r.source === 'vfcash' ? 'active' : 'info'}" style="font-size:11px">
                            ${r.source === 'vfcash' ? 'Vodafone Cash' : r.source === 'instapay' ? 'InstaPay' : esc(r.source || 'كاش')}
                          </span>
                          <span class="mono" style="font-size:12px;margin-right:4px">${esc(r.wallet || "")}</span>
                        </td>
                        <td><b style="font-size:13.5px;color:${isNew ? '#059669' : 'var(--text-main)'}">${fmt(r.amount)} ج.م</b></td>
                        <td><small class="mono text-muted">${esc(String(r.tx_time || r.received || '').replace('T', ' ').slice(0, 16))}</small></td>
                        <td>
                          <span class="status-pill ${isNew ? 'active' : isUsed ? 'info' : 'stopped'}">
                            ${isNew ? 'جديدة' : isUsed ? 'مستخدمة' : r.status === 'dup' ? 'مكررة' : 'ملغية'}
                          </span>
                        </td>
                        <td>
                          ${r.username ? `<span class="mono font-bold" style="color:var(--accent)">${esc(r.username)}</span>` : (isNew ? '<span class="status-pill stopped" style="font-size:11px">غير مرتبطة بمشترك</span>' : '<span class="text-muted">—</span>')}
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div class="quick-modal-footer">
          <button type="button" class="btn-cancel" onclick="closeModal()">إغلاق</button>
          <button type="button" class="btn-primary" onclick="closeModal();location.hash='#cash'">
            <i class="bi bi-box-arrow-up-right"></i> فتح سجل معاملات الكاش بالكامل ←
          </button>
        </div>
      </div>
    `;
    modal(html);
  } catch (err) {
    modal(`<div class="p-4 text-center text-danger"><i class="bi bi-exclamation-triangle fs-3"></i><p style="margin-top:10px">${esc(err.message)}</p></div>`);
  }
}
