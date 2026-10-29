// "الإعدادات" — Stream RADIUS Studio Settings Console (Design #3 Architecture)
// Categorized 2-Column Studio Layout with Dual Light/Dark Support.
"use strict";

const SETTINGS_CATEGORIES = [
  {
    category: "النظام والشبكة",
    icon: "bi-hdd-rack-fill",
    tabs: [
      { id: "إعدادات عامة", icon: "bi-sliders" },
      { id: "NAS", icon: "bi-router-fill" },
      { id: "متقدم", icon: "bi-gear-wide-connected" },
      { id: "ADV Radius", icon: "bi-shield-check" },
      { id: "الترخيص", icon: "bi-patch-check-fill" },
    ]
  },
  {
    category: "بوابة المشترك والفواتير",
    icon: "bi-person-badge-fill",
    tabs: [
      { id: "لوحة تحكم المشترك", icon: "bi-person-workspace" },
      { id: "فاتورة المشترك", icon: "bi-receipt" },
    ]
  },
  {
    category: "قنوات التنبيهات والرسائل",
    icon: "bi-chat-dots-fill",
    tabs: [
      { id: "Whatsapp", icon: "bi-whatsapp" },
      { id: "بوت واتساب", icon: "bi-robot" },
      { id: "SMS", icon: "bi-chat-left-text-fill" },
      { id: "Advanced Whatsapp", icon: "bi-send-check-fill" },
    ]
  },
  {
    category: "المدفوعات والنسخ الاحتياطي",
    icon: "bi-credit-card-2-front-fill",
    tabs: [
      { id: "بوابات الدفع", icon: "bi-credit-card" },
      { id: "المحفظة الإلكترونية", icon: "bi-wallet2" },
      { id: "FTP/SFTP", icon: "bi-server" },
    ]
  },
  {
    category: "خدمات قادمة ومكملة",
    icon: "bi-stars",
    tabs: [
      { id: "Google Drive", icon: "bi-google", soon: true },
      { id: "تليجرام", icon: "bi-telegram", soon: true },
      { id: "شهادة SSL", icon: "bi-lock-fill", soon: true },
      { id: "إدارة الفواتير", icon: "bi-file-earmark-text", soon: true },
      { id: "سلة المحذوفات", icon: "bi-trash3-fill", soon: true },
    ]
  }
];

const TAB_META = {
  "إعدادات عامة": { icon: "bi-sliders", title: "إعدادات عامة وهويـة النظام", desc: "اسم الشبكة، العملة، التوقيت، ومعلومات الاتصال الرئيسية" },
  "NAS": { icon: "bi-router-fill", title: "إعدادات NAS وأحواض الـ Pools", desc: "أحواض المنتهي والكوتة وربط الماك والتحكم في الجلسات" },
  "متقدم": { icon: "bi-gear-wide-connected", title: "السياسات المتقدمة والتشغيل", desc: "مهلة التجديد، الطرد التلقائي، وحذف السجلات" },
  "ADV Radius": { icon: "bi-shield-check", title: "خادم FreeRADIUS والمزامنة", desc: "التحويل بين وضع المراقبة (Shadow) والتشغيل المباشر (Live)" },
  "الترخيص": { icon: "bi-patch-check-fill", title: "معلومات النظام والترخيص", desc: "مواصفات الخادم ورخصة الاستخدام المفتوحة" },
  "لوحة تحكم المشترك": { icon: "bi-person-workspace", title: "بوابة الخدمة الذاتية للمشترك (Portal)", desc: "روابط الخدمة، التجديد الذاتي، وتنبيهات البوابة" },
  "فاتورة المشترك": { icon: "bi-receipt", title: "تصميم إيصال وفاتورة السداد", desc: "تخصيص كود الـ HTML لإيصالات سداد المشتركين" },
  "Whatsapp": { icon: "bi-whatsapp", title: "إعدادات الواتساب والنسخ الاحتياطي", desc: "إرسال التنبيهات، تذكير المديونية، وتلقي النسخة اليومية" },
  "بوت واتساب": { icon: "bi-robot", title: "بوت الرد التلقائي على المشتركين", desc: "الردود التلقائية والاستعلام الذكي على مدار الساعة" },
  "SMS": { icon: "bi-chat-left-text-fill", title: "بوابات الرسائل النصية SMS", desc: "إعدادات مزود الرسائل النصية المباشرة وحساب الرصيد" },
  "Advanced Whatsapp": { icon: "bi-send-check-fill", title: "إشعارات الواتساب المتقدمة", desc: "قوالب الرسائل عند التفعيل والشحن وإيداع الرصيد" },
  "بوابات الدفع": { icon: "bi-credit-card", title: "بوابات الدفع الإلكتروني", desc: "ربط بوابات الدفع: Paymob، فوري، Stripe، و PayPal" },
  "المحفظة الإلكترونية": { icon: "bi-wallet2", title: "المحفظة الإلكترونية ومطابقة التحويلات", desc: "التحويلات البنكية والمحافظ الإلكترونية والذكاء الاصطناعي" },
  "FTP/SFTP": { icon: "bi-server", title: "النسخ الاحتياطي عن بُعد (FTP/SFTP)", desc: "رفع النسخ الاحتياطية تلقائياً لسيرفر خارجي" },
};

PAGES.settings = async () => {
  const d = await api("settings"), S = Object.fromEntries(d.settings.map(x => [x.k, x.v]));
  const tab = decodeURIComponent((location.hash.split("?")[1] || "").replace("tab=", "")) || "إعدادات عامة";
  const tabMeta = TAB_META[tab] || { icon: "bi-gear-fill", title: tab, desc: "إعدادات وخيارات التكوين" };

  const fg = (span, label, inner) => `<div class="fg s${span}"><label>${label}</label>${inner}</div>`;
  const inp = (k, def = "", attrs = "") => `<input name="${k}" value="${esc(S[k] ?? def)}" ${attrs}>`;
  const sel = (k, opts, def) => `<select name="${k}">${opts.map(([v, t]) => `<option value="${v}" ${(S[k] ?? def) === v ? "selected" : ""}>${t}</option>`).join("")}</select>`;

  const bodies = {
        "إعدادات عامة": `
      <div class="bento-subcard">
        <div class="bento-subcard-head">
          <div class="bento-head-title">
            <div class="bento-head-icon"><i class="bi bi-building"></i></div>
            <h3>هوية وبيانات الشبكة الأساسية</h3>
          </div>
          <span class="bento-head-desc">اسم الموقع، اسم الشركة، والعملة المستخدمة</span>
        </div>
        <div class="bento-subcard-body">
          ${fg(6, "عنوان الموقع (العنوان الرئيسي بالمتصفح)", inp("s_title", S.company || "Stream-Net"))}
          ${fg(6, "اسم الشركة / المؤسسة في الفاتورة", inp("company", "Stream-Net"))}
          ${fg(4, "عملة النظام المعتمدة", sel("currency", [["EGP", "جنيه مصري (EGP)"], ["USD", "دولار أمريكي (USD)"], ["SAR", "ريال سعودي (SAR)"]], "EGP"))}
          ${fg(4, "اللغة الافتراضية للنظام", sel("def_lang", [["ar", "العربية (Arabic - RTL)"], ["en", "English (LTR)"]], "ar"))}
          ${fg(4, "الدولة", sel("country", [["EG", "مصر (Egypt)"]], "EG"))}
        </div>
      </div>

      <div class="bento-subcard">
        <div class="bento-subcard-head">
          <div class="bento-head-title">
            <div class="bento-head-icon"><i class="bi bi-shield-lock"></i></div>
            <h3>حالة التشغيل والسياسات العامة</h3>
          </div>
          <span class="bento-head-desc">التحكم في وصول المشتركين وحالة السيرفر</span>
        </div>
        <div class="bento-subcard-body">
          ${fg(4, "حالة الموقع والخدمة", sel("site_status", [["1", "مفعّل ويعمل بشكل طبيعي"], ["0", "مغلق للصيانة الدورية"]], "1"))}
          ${fg(4, "منع المشتركين من تسجيل الدخول", sel("block_login", [["0", "لا — السماح بالدخول"], ["1", "نعم — حظر الدخول مؤقتاً"]], "0"))}
          ${fg(4, "النطاق الزمني للسيرفر", sel("t_zone", [["Africa/Cairo", "Africa/Cairo (توقيت القاهرة GMT+3)"]], "Africa/Cairo"))}
          ${fg(12, "التاريخ والوقت المسجل في السيرفر حالياً", `<input value="${esc(new Date().toLocaleString("en-GB"))}" readonly class="mono" style="font-weight:bold;color:var(--accent)">`)}
        </div>
      </div>

      <div class="bento-subcard">
        <div class="bento-subcard-head">
          <div class="bento-head-title">
            <div class="bento-head-icon"><i class="bi bi-telephone"></i></div>
            <h3>بيانات التواصل ومقر الخدمة</h3>
          </div>
          <span class="bento-head-desc">الأرقام والعناوين التي تظهر للمشتركين وفي الإيصالات</span>
        </div>
        <div class="bento-subcard-body">
          ${fg(4, "رقم هاتف الدعم الفني", inp("com_phone", "", 'dir="ltr" placeholder="01xxxxxxxxx" class="mono"'))}
          ${fg(4, "البريد الإلكتروني للشركة", inp("com_email", "", 'dir="ltr" class="mono"'))}
          ${fg(4, "الموقع الإلكتروني الرسمي", inp("website", "", 'dir="ltr" class="mono"'))}
          ${fg(12, "العنوان الجغرافي للمقر الرئيسي أو نقطة التوزيع", inp("address"))}
        </div>
      </div>
    `,
    
    "NAS": `<div class="g12">${fg(6, "حوض المشتركين المنتهين (Pool END)", inp("expired_pool", "END", 'dir="ltr"'))}${fg(6, "حوض المشتركين منتهي الكوتة (Pool LIMIT)", inp("quota_pool", "LIMIT", 'dir="ltr"'))}
      ${fg(6, "السرعة المحددة للمنتهي (اختياري: 256k/256k)", inp("expired_rate", "", 'dir="ltr"'))}${fg(6, "طريقة احتساب استهلاك الكوتة", sel("quota_count", [["both", "التحميل + الرفع معاً"], ["down", "التحميل فقط"], ["up", "الرفع فقط"]], "both"))}${fg(6, "ربط حساب المشترك بعنوان الـ MAC", sel("mac_bind", [["0", "معطل"], ["1", "مفعّل تلقائياً"]], "0"))}</div>` + specForm(SET_SPEC["NAS_extra"], S),
    
    "متقدم": `<div class="g12">${fg(6, "تنبيه قرب الانتهاء (قبل كام يوم)", inp("expiring_days", "3"))}${fg(6, "الأيام الافتراضية للباقات الجديدة", inp("default_days", "30"))}
      ${fg(12, "كلمة مرور PPPoE الموحدة", `<input value="${d.default_password_set ? "متسجلة في ملف الإعدادات المحمي على السيرفر" : "غير مسجلة"}" readonly class="mono">`)}</div>` + specForm(SET_SPEC["متقدم_extra"], S),
    
    "ADV Radius": `<div class="g12">${fg(6, "المزامنة الكاملة مع ADV (كل كام دقيقة)", inp("sync_minutes", "15"))}${fg(6, "المزامنة السريعة للتغييرات اللحظية (بالثواني)", inp("fast_seconds", "20"))}${fg(12, "الوضع التشغيلي الحالي للنظام", `<input value="${S.mode === "shadow" ? "مراقبة (Shadow) — القراءة المباشرة من ADV" : "تشغيل مباشر (Live) — FreeRADIUS نشط كلياً"}" readonly class="mono">`)}</div>
      <div style="padding:14px;background:var(--bg-card-subtle);border-radius:12px;border:1px solid var(--border);margin-top:14px">
        <p style="margin:0 0 10px;font-size:12px;color:var(--text-muted);line-height:1.6">التحويل إلى وضع التشغيل المباشر (Live) يتيح التجديد والشحن الفوري هنا، دون أي تغييرات على السيرفرات المرتبطة. ربط سيرفرات التوزيع بالمحرك الجديد خطوة منفصلة بموافقة الإدارة.</p>
        <button type="button" class="${S.mode === "shadow" ? "b-red" : "b-light"}" id="modeBtn" style="padding:8px 18px;font-size:13px;font-weight:700">${S.mode === "shadow" ? "التحويل إلى وضع التشغيل المباشر (Live) ←" : "الرجوع إلى وضع المراقبة (Shadow)"}</button>
      </div>`,
    
    "SMS": '<div id="smsPanel"></div>' + specForm(SET_SPEC["SMS"], S),
    
    "Whatsapp": `<div id="waPanel"></div>
      <h4 style="font-size:13px;font-weight:800;margin:18px 0 10px;color:var(--text-main);display:flex;align-items:center;gap:6px"><i class="bi bi-clock-history"></i> تذكير المديونية والنسخ الاحتياطي عبر الواتساب</h4>
      <div class="g12">${fg(12, "نص رسالة تذكير المديونية (المتغيرات: {name} {user} {debt} {company})", `<textarea name="adv_set_debt_msg_whats" rows="3">${esc(S.adv_set_debt_msg_whats || "")}</textarea>`)}
      ${fg(4, "التذكير الدوري كل كام يوم", inp("debt_rem_days", "3", 'type="number" min="1" max="30"'))}${fg(4, "الحد الأدنى للمديونية للتذكير (ج.م)", inp("debt_rem_min", "1", 'type="number" min="1"'))}${fg(4, "رقم استلام النسخة اليومية", inp("backup_wa_to", "", 'dir="ltr" placeholder="01xxxxxxxxx"'))}</div>
      <div style="padding:12px 14px;background:var(--bg-card-subtle);border-radius:10px;border:1px solid var(--border);margin:12px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <span style="font-size:12px;color:var(--text-muted)">النسخة الاحتياطية تتضمن بيانات جميع المشتركين. ${esc(S.backup_wa_state || "")}</span>
        <button type="button" class="b-light" id="bkWa" style="padding:6px 14px;font-size:12px"><i class="bi bi-whatsapp"></i> إرسال أحدث نسخة احتياطية الآن</button>
      </div>
      <div class="g12">${fg(6, "رقم واتساب الشركة الرئيسي", inp("wa_number", "", 'dir="ltr"'))}${fg(6, "الفارق الزمني بين الرسائل (ثواني)", inp("wa_gap", "8", 'type="number" min="3"'))}</div>
      <small style="display:block;margin-top:8px;color:var(--text-muted);font-size:11.5px">المتغيرات المدعومة: {user} {name} {prof} {exp} {price} {money} {days} {company} — الرسائل التلقائية تعمل في وضع Live المباشر.</small>` + specForm(SET_SPEC["Whatsapp"], S),
    
    "بوت واتساب": specForm(SET_SPEC["بوت واتساب"], S),
    "Advanced Whatsapp": specForm(SET_SPEC["Advanced Whatsapp"], S),
    "FTP/SFTP": specForm(SET_SPEC["FTP/SFTP"], S),
    "المحفظة الإلكترونية": specForm(SET_SPEC["المحفظة الإلكترونية"], S),
    "بوابات الدفع": specForm(SET_SPEC["بوابات الدفع"], S),
    
    "لوحة تحكم المشترك": `<div style="padding:14px;background:var(--accent-subtle);border-radius:12px;border:1px solid var(--border);margin-bottom:16px;font-size:12.5px;display:flex;flex-direction:column;gap:6px">
        <div><i class="bi bi-person-workspace" style="color:var(--accent)"></i> رابط بوابة المشترك المباشر: <a href="/portal" target="_blank" dir="ltr" style="color:var(--accent);font-weight:700">${esc(location.origin)}/portal</a></div>
        <div><i class="bi bi-ban" style="color:#ef4444"></i> صفحة الخدمة المتوقفة: <a href="/expired" target="_blank" dir="ltr" style="color:var(--text-main);font-weight:700">${esc(location.origin)}/expired</a> (قم بتوجيه أحواض END/LIMIT إليها من راوتر MikroTik).</div>
      </div>
      <div class="g12">${fg(6, "حالة البوابة", sel("portal_on", [["1", "مفتوحة ومتاحة للمشتركين"], ["0", "معطلة مؤقتاً"]], "1"))}${fg(6, "تسجيل الدخول برقم الموبايل", sel("portal_phone_login", [["1", "مسموح"], ["0", "غير مسموح"]], "1"))}
      ${fg(4, "السماح بالتجديد من الرصيد", sel("portal_allow_renew", [["1", "مسموح"], ["0", "معطل"]], "1"))}${fg(4, "طلب سلفة (للمنتهي، يومين)", sel("portal_allow_advance", [["1", "مسموح"], ["0", "معطل"]], "1"))}${fg(4, "تغيير كلمة المرور ذاتياً", sel("portal_allow_password", [["1", "مسموح"], ["0", "معطل"]], "1"))}
      ${fg(12, "رسالة إعلان عام تظهر لجميع المشتركين بالبوابة", inp("portal_announce", "", 'placeholder="مثال: يرجى العلم بوجود صيانة دورية يوم الجمعة..."'))}</div>` + specForm(SET_SPEC["لوحة تحكم المشترك"], S),
    
    "فاتورة المشترك": `<div class="g12">${fg(12, "قالب إيصال سداد المشترك (HTML Template) — اتركه فارغاً للاعتماد على التصميم الافتراضي", `<textarea name="adv_set_invoice_tpl" rows="12" dir="ltr" style="font-family:'JetBrains Mono',monospace;font-size:12px">${esc(S.adv_set_invoice_tpl || "")}</textarea>`)}</div>
      <p style="font-size:12px;color:var(--text-muted);margin-top:8px">المتغيرات المدعومة داخل الإيصال: {company} {user} {name} {prof} {amount} {from} {to} {date} {by} {mobile} {notes}</p>`,
    
    "الترخيص": `<div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--bg-card-subtle);border:1px solid var(--border);border-radius:12px">
          <div><b style="font-size:13px;color:var(--text-main)">إصدار النظام المستقل (RAD-Manager Core)</b><br><small style="color:var(--text-muted)">الخادم المحلي: ${esc(d.host)}</small></div>
          <span class="dz-pill p-green"><span class="dz-dot"></span> ترخيص مفتوح غير محدود المشتركين</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--bg-card-subtle);border:1px solid var(--border);border-radius:12px">
          <div><b style="font-size:13px;color:var(--text-main)">ترخيص خادم ADV الأصلي</b><br><small style="color:var(--text-muted)">المشتركون المسموح بهم على ADV</small></div>
          <span class="dz-pill p-slate">مرخّص لـ 4,000 مشترك فقط</span>
        </div>
      </div>`,
  };

    const activeCat = SETTINGS_CATEGORIES.find(c => c.tabs.some(t => t.id === tab)) || SETTINGS_CATEGORIES[0];

  C(`
    <div class="settings-studio-container" style="width:100%;display:flex;flex-direction:column;gap:20px">
      
      <!-- Studio Settings Header -->
      <div class="studio-settings-header" style="background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--accent-subtle);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:22px"><i class="bi bi-sliders"></i></div>
          <div>
            <h1 style="margin:0;font-size:1.25rem;font-weight:800;color:var(--text-main)">إعدادات وتخصيص النظام</h1>
            <p style="margin:2px 0 0;font-size:12.5px;color:var(--text-muted)">تهيئة خوادم FreeRADIUS، بوابات الدفع، التنبيهات، والسياسات التشغيلية</p>
          </div>
        </div>
      </div>

      <!-- Top Horizontal Category Pillars Ribbon -->
      <div class="settings-categories-bar" style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:8px;box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:6px;overflow-x:auto">
        ${SETTINGS_CATEGORIES.map(cat => {
          const isCatActive = cat.category === activeCat.category;
          return `
            <div data-cat="${esc(cat.tabs[0].id)}" class="cat-pill ${isCatActive ? 'active' : ''}" style="display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;cursor:pointer;font-weight:700;font-size:13px;white-space:nowrap;user-select:none;transition:all 0.15s;${isCatActive ? 'background:var(--accent);color:#fff;' : 'color:var(--text-muted);'}">
              <i class="bi ${cat.icon}"></i> ${cat.category}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Sub-tabs Segmented Bar -->
      <div class="settings-subtabs-bar" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:2px 4px">
        ${activeCat.tabs.map(t => {
          const isTabActive = t.id === tab;
          return `
            <a data-tab="${esc(t.id)}" class="subtab-item ${isTabActive ? 'active' : ''} ${t.soon ? 'soon' : ''}" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:10px;border:1px solid ${isTabActive ? 'var(--accent-border)' : 'var(--border)'};background:${isTabActive ? 'var(--accent-subtle)' : 'var(--bg-card)'};color:${isTabActive ? 'var(--accent-text)' : 'var(--text-muted)'};font-size:13px;font-weight:${isTabActive ? '800' : '700'};cursor:pointer;user-select:none;text-decoration:none">
              <i class="bi ${t.icon || 'bi-gear'}"></i>
              <span>${esc(t.id)}</span>
              ${t.soon ? '<span style="font-size:10px;padding:1px 6px;border-radius:999px;background:var(--bg-card-subtle);color:var(--text-muted)">قريباً</span>' : ''}
            </a>
          `;
        }).join('')}
      </div>

      <!-- Form Container -->
      <form id="sf" class="settings-bento-form" style="display:flex;flex-direction:column;gap:18px">
        ${bodies[tab] || '<div class="bento-subcard"><div style="padding:40px;text-align:center;color:var(--text-muted)">هذا القسم مخصص للمرحلة القادمة</div></div>'}

        ${bodies[tab] && tab !== "الترخيص" ? `
          <div class="settings-sticky-actions" style="position:sticky;bottom:20px;z-index:20;background:var(--bg-card);border:1px solid var(--border-strong);border-radius:16px;padding:14px 24px;box-shadow:var(--shadow-md);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <span style="font-size:12.5px;color:var(--text-muted);display:flex;align-items:center;gap:8px">
              <i class="bi bi-check-circle-fill" style="color:var(--accent);font-size:16px"></i> يتم تطبيق التغييرات فوراً على قواعد FreeRADIUS ومحرك النظام
            </span>
            <button type="submit" class="btn-primary" style="padding:10px 24px;border-radius:10px;font-size:13.5px;font-weight:800;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(37,99,235,0.25)">
              <i class="bi bi-cloud-arrow-up-fill"></i> حفظ التغييرات وتطبيق الإعدادات
            </button>
          </div>
        ` : ''}
      </form>

    </div>
  `);

  document.querySelectorAll("[data-cat]").forEach(a => a.onclick = () => {
    location.hash = "settings?tab=" + encodeURIComponent(a.dataset.cat);
  });

  document.querySelectorAll("[data-tab]").forEach(a => a.onclick = () => {
    location.hash = "settings?tab=" + encodeURIComponent(a.dataset.tab);
  });

  if ($("#waPanel")) waPanel($("#waPanel"));
  if ($("#bkWa")) $("#bkWa").onclick = () => act(() => api("backups/whatsapp", { method: "POST", body: {} }), "اتبعتت على الواتساب");
  if ($("#smsPanel")) smsPanel($("#smsPanel"), S);

  $("#sf").onsubmit = async e => {
    e.preventDefault();
    await act(() => api("settings", { method: "PUT", body: specSubmit(e.target) }), "تم الحفظ بنجاح!");
  };

  const mb = $("#modeBtn");
  if (mb) mb.onclick = async () => {
    const to = S.mode === "shadow" ? "live" : "shadow";
    const c = prompt(`علشان تحوّل لـ ${to} اكتب: نعم انقل`);
    if (c !== "نعم انقل") return;
    await act(() => api("settings", { method: "PUT", body: { mode: to, confirm: c } }), "تم التحويل بنجاح");
    location.reload();
  };
};
