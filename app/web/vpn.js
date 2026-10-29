// "VPN الكافيهات والأماكن": SSTP accounts for MikroTik routers + RouterOS scripts.
// UI/UX Pro Max Edition: Real-time Gateway Control, Subscriber Location Mapping & Static Tunnel Allocation.
"use strict";

PAGES.vpn = async () => {
  const [d, mgrs] = await Promise.all([
    api("vpn"),
    api("managers").catch(() => [])
  ]);

  const mOpts = sel => `<option value="0">— بدون مدير محدد —</option>` + 
    mgrs.map(m => `<option value="${m.id}" ${+sel === +m.id ? "selected" : ""}>${esc(m.username)}</option>`).join("");

  const clients = d.clients || [];
  const onlineCount = clients.filter(c => c.connected).length;
  const totalCards = clients.reduce((acc, c) => acc + (+c.online_cards || 0), 0);

  C(`<div class="vpn-container">
    
    <!-- 1. Hero Telemetry & Status HUD (UI-UX Pro Max) -->
    <div class="vpn-hero-card">
      <div class="vpn-hero-h">
        <div class="vpn-hero-title">
          <div class="vpn-hero-icon">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <h2>بوابة VPN الكافيهات والفروع (SSTP Gateway)</h2>
            <p>ربط راوترات المايكروتك بنفق SSTP مشفر ومستقر، مع التحكم الكامل في IP جيتواي السيرفيس وحجز Static IP لكل مكان.</p>
          </div>
        </div>
        <div class="dz-status ${d.running ? "ok" : "bad"}" style="font-size:13px;padding:7px 16px;">
          <span class="dz-dot"></span>
          <span>${d.installed ? (d.running ? "سيرفر SSTP نشط (accel-ppp)" : "سيرفر الـ SSTP متوقف") : "غير مثبت"}</span>
        </div>
      </div>

      <!-- Live KPIs Grid -->
      <div class="vpn-stats-grid">
        <div class="vpn-stat-tile">
          <span class="vpn-stat-lbl">إجمالي الأماكن والفروع</span>
          <span class="vpn-stat-val">${clients.length} <small style="font-size:12px;color:#8e8e93">فروع</small></span>
        </div>
        <div class="vpn-stat-tile">
          <span class="vpn-stat-lbl">الراوترات المتصلة لحظياً</span>
          <span class="vpn-stat-val" style="color:#10b981">${onlineCount} <small style="font-size:12px;color:#8e8e93">أونلاين</small></span>
        </div>
        <div class="vpn-stat-tile">
          <span class="vpn-stat-lbl">آي بي جيتواي السيرفيس (Gateway)</span>
          <bdi class="vpn-stat-val" style="color:#38bdf8">${esc(d.gateway || "10.199.0.1")}</bdi>
        </div>
        <div class="vpn-stat-tile">
          <span class="vpn-stat-lbl">الآي بي الحر التالي للتخصيص</span>
          <bdi class="vpn-stat-val" style="color:#a855f7">${esc(d.next_ip || "10.199.0.2")}</bdi>
        </div>
      </div>
    </div>

    <!-- 2. Gateway & Tunnel Core Configuration Form -->
    <form class="vpn-section-card" id="vpnSet">
      <div class="vpn-card-header">
        <h3><i class="bi bi-hdd-network-fill" style="color:#0055ff"></i> التحكم في إعدادات آي بي الجيتواي وبوابة الـ SSTP</h3>
        <button type="submit" class="green" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;font-weight:700">
          <i class="bi bi-check2-circle"></i> حفظ وتطبيق إعدادات البوابة
        </button>
      </div>
      <div class="vpn-card-body">
        <div class="vpn-form-grid">
          <div class="vpn-field s4">
            <label>الدومين أو الـ IP العام للسيرفر (Public Host)</label>
            <input name="Host" dir="ltr" value="${esc(d.host || "")}" placeholder="مثال: 209.38.247.201 أو vpn.domain.com">
            <small class="muted">العنوان الذي تتصل به أجهزة المايكروتك من الفروع عبر الإنترنت.</small>
          </div>
          <div class="vpn-field s4">
            <label>بورت الاتصال العام (SSTP TCP Port)</label>
            <input name="Port" dir="ltr" value="${esc(d.port || "4444")}" placeholder="4444" required>
            <small class="muted">المنفذ المعتمد (4444 موصى به لتفادي مشاكل RouterOS 7).</small>
          </div>
          <div class="vpn-field s4">
            <label style="color:#0055ff;font-weight:800">آي بي جيتواي السيرفيس داخل التانل (SSTP Gateway IP) *</label>
            <input name="Gateway" dir="ltr" value="${esc(d.gateway || "10.199.0.1")}" placeholder="10.199.0.1" required style="border-color:rgba(0,85,255,0.3);font-weight:bold;color:#60a5fa">
            <small class="muted">عنوان السيرفر الداخلي الذي يتصل عليه الراديوس من الراوترات.</small>
          </div>
        </div>

        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px 14px;margin-top:14px;display:flex;align-items:center;gap:10px;font-size:12.5px;color:#60a5fa">
          <i class="bi bi-info-circle-fill" style="font-size:18px"></i>
          <div>
            شبكة الأنفاق الحالية: <b dir="ltr">${esc(d.net)}</b> — جيتواي الراديوس المعتمد للراوترات: <b dir="ltr">${esc(d.gateway || "10.199.0.1")}</b>.
            عند حفظ الإعدادات، يتم تحديث إعدادات <code dir="ltr">accel-ppp</code> وقواعد الراديوس فوراً.
          </div>
        </div>
      </div>
    </form>

    <!-- 3. Add Place / Subscriber Form with Dedicated Static IP -->
    <form class="vpn-section-card" id="vpnAdd">
      <div class="vpn-card-header">
        <h3><i class="bi bi-plus-circle-fill" style="color:#10b981"></i> إضافة مكان / كافيه جديد وتخصيص Static IP داخل التانل</h3>
        <button type="submit" class="green" style="display:inline-flex;align-items:center;gap:6px;padding:7px 16px;border-radius:8px;font-weight:700">
          <i class="bi bi-plus-lg"></i> إضافة المكان وحجز التانل
        </button>
      </div>
      <div class="vpn-card-body">
        <div class="vpn-form-grid">
          <div class="vpn-field s3">
            <label>اسم المكان / الفرع / الكافيه *</label>
            <input name="Name" required placeholder="مثال: كافيه النخيل - فرع 1">
          </div>
          <div class="vpn-field s3">
            <label>اسم المستخدم للراوتر (Username)</label>
            <input name="Username" dir="ltr" placeholder="تلقائي إذا تُرك فارغاً">
          </div>
          <div class="vpn-field s3">
            <label>كلمة المرور (Password)</label>
            <input name="Password" dir="ltr" placeholder="تلقائية إذا تُركت فارغة">
          </div>
          <div class="vpn-field s3">
            <label style="color:#10b981;font-weight:800">Static IP داخل نفق SSTP *</label>
            <input name="IP" dir="ltr" value="${esc(d.next_ip || "10.199.0.2")}" required style="border-color:#10b981;font-weight:bold;color:#047857">
          </div>
          <div class="vpn-field s4">
            <label>رقم موبايل المسؤول</label>
            <input name="Phone" dir="ltr" placeholder="01xxxxxxxxx">
          </div>
          <div class="vpn-field s4">
            <label>المدير / الموزع المسؤول</label>
            <select name="ManagerID">${mOpts(0)}</select>
          </div>
          <div class="vpn-field s4">
            <label>ملاحظات إضافية عن الفرع</label>
            <input name="Notes" placeholder="نوع الراوتر، السرعة، الموقع...">
          </div>
        </div>
      </div>
    </form>

    <!-- 4. Registered Places & Static IP Fleet Table -->
    <div class="vpn-section-card">
      <div class="vpn-card-header">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <h3><i class="bi bi-router-fill" style="color:#0055ff"></i> الأماكن والكافيهات المسجلة والـ Static IPs (${clients.length})</h3>
          <span style="font-size:12px;color:#8e8e93">إجمالي الكروت المتصلة عبر الأنفاق: <b style="color:#ffffff">${fmt(totalCards)}</b></span>
        </div>
        <div style="min-width:240px">
          <input type="text" id="vpnTableSearch" placeholder="بحث باسم المكان أو الـ Static IP..." style="padding:6px 12px;font-size:12px;border-radius:8px">
        </div>
      </div>

      ${clients.length ? `
        <div class="tablewrap">
          <table id="vpnClientsTable">
            <thead>
              <tr style="background:var(--bg-card-subtle)">
                <th>اسم المكان / الفرع</th>
                <th>حالة النفق اللحظية</th>
                <th>Static IP داخل التانل</th>
                <th>اليوزر (Username)</th>
                <th>كلمة المرور</th>
                <th>الموبايل</th>
                <th>المدير</th>
                <th>كروت متصلة</th>
                <th style="text-align:center">الإجراءات والراوتر</th>
              </tr>
            </thead>
            <tbody>
              ${clients.map(c => `
                <tr class="vpn-row">
                  <td>
                    <b style="font-size:13.5px;color:var(--text-main)">${esc(c.name)}</b>
                    ${c.notes ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${esc(c.notes)}</div>` : ""}
                  </td>
                  <td>
                    ${+c.enabled 
                      ? (c.connected 
                          ? `<span class="dz-pill p-green" title="النفق مستقر"><span class="dz-dot"></span> متصل ${esc(c.uptime || "")}</span>` 
                          : `<span class="dz-pill p-rose" title="الراوتر غير متصل حالياً">غير متصل</span>`) 
                      : `<span class="dz-pill p-slate">موقوف إدارياً</span>`}
                  </td>
                  <td>
                    <b dir="ltr" class="vpn-ip-tag" title="انقر لنسخ عنوان الـ IP" onclick="navigator.clipboard.writeText('${esc(c.ip)}').then(()=>toast('تم نسخ الـ IP: ${esc(c.ip)}'))">
                      ${esc(c.ip)}
                    </b>
                  </td>
                  <td dir="ltr">
                    <code style="background:var(--bg-card-subtle);padding:2px 6px;border-radius:6px;color:var(--text-main);font-weight:600;font-family:'JetBrains Mono',monospace">${esc(c.username)}</code>
                  </td>
                  <td dir="ltr">
                    <span class="vpn-pass-cell" title="انقر للنسخ" style="cursor:pointer;font-family:monospace;background:var(--bg-card-subtle);border:1px solid var(--border);padding:3px 8px;border-radius:6px;color:var(--accent);font-weight:bold" onclick="navigator.clipboard.writeText('${esc(c.password)}').then(()=>toast('تم نسخ كلمة المرور'))">
                      ${esc(c.password || "••••••")}
                    </span>
                  </td>
                  <td dir="ltr">${esc(c.phone || "—")}</td>
                  <td>${esc(c.manager || "—")}</td>
                  <td><b style="color:#0055ff;font-size:13px">${fmt(c.online_cards)}</b></td>
                  <td>
                    <div class="vpn-actions-btn-group" style="justify-content:center">
                      <button class="vpn-btn-action primary" data-scr="${c.id}" title="توليد وعرض كود المايكروتك">
                        <i class="bi bi-terminal-fill"></i> أوامر الراوتر
                      </button>
                      <button class="vpn-btn-action" data-edit="${c.id}" title="تعديل بيانات المكان والـ IP">
                        <i class="bi bi-pencil-square"></i> تعديل
                      </button>
                      <button class="vpn-btn-action" data-em="${c.id}" title="تجهيز كروت الطوارئ للفرع">
                        <i class="bi bi-life-preserver"></i> كروت الطوارئ
                      </button>
                      <button class="vpn-btn-action" data-act="toggle" data-id="${c.id}">
                        ${+c.enabled ? "إيقاف" : "تشغيل"}
                      </button>
                      <button class="vpn-btn-action" data-act="new_password" data-id="${c.id}" title="توليد باسورد جديد">
                        <i class="bi bi-key-fill"></i> باسورد
                      </button>
                      <button class="vpn-btn-action danger" data-act="delete" data-id="${c.id}" data-name="${esc(c.name)}">
                        <i class="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty" style="padding:40px;text-align:center">
          <i class="bi bi-router" style="font-size:40px;color:#8e8e93;display:block;margin-bottom:10px"></i>
          <h4 style="margin:0 0 6px;color:#334155">لا توجد أماكن أو فروع مسجلة بعد</h4>
          <p class="muted" style="margin:0">يمكنك إضافة أول مكان وتخصيص عنوان Static IP له من النموذج بالأعلى.</p>
        </div>
      `}
    </div>

  </div>`);

  // Search filter
  const sInput = $("#vpnTableSearch");
  if (sInput) {
    sInput.onkeyup = () => {
      const q = sInput.value.toLowerCase().trim();
      document.querySelectorAll(".vpn-row").forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    };
  }

  // API Submission helper
  const post = async (body, msg) => {
    const r = await act(() => api("vpn", { method: "POST", body }), msg);
    if (r && r.warning) toast(r.warning, true);
    PAGES.vpn();
  };

  // 1. Save Gateway & Port Settings
  $("#vpnSet").onsubmit = e => {
    e.preventDefault();
    const f = formData(e.target);
    post({ Action: "settings", Host: f.Host, Port: f.Port, Gateway: f.Gateway }, "تم حفظ وتطبيق إعدادات جيتواي الـ SSTP بنجاح");
  };

  // 2. Add Place & Static IP
  $("#vpnAdd").onsubmit = e => {
    e.preventDefault();
    const f = formData(e.target);
    post({
      Action: "add",
      Name: f.Name,
      Username: f.Username,
      Password: f.Password,
      IP: f.IP,
      Phone: f.Phone,
      ManagerID: +f.ManagerID,
      Notes: f.Notes
    }, "تمت إضافة المكان وحجز حساب الـ VPN والـ Static IP بنجاح");
  };

  // 3. Edit Place & Static IP Modal
  document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => {
    const id = +b.dataset.edit;
    const c = clients.find(x => +x.id === id);
    if (!c) return;

    const m = modal(`
      <div style="font-family:'Cairo',sans-serif">
        <h3 style="display:flex;align-items:center;gap:8px;margin:0 0 16px;color:#ffffff">
          <i class="bi bi-pencil-square" style="color:#0055ff"></i>
          <span>تعديل بيانات المكان والـ Static IP: <b>${esc(c.name)}</b></span>
        </h3>
        <form class="vpn-form-grid" id="vpnEditForm" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="vpn-field" style="grid-column:span 2">
            <label>اسم المكان / الكافيه *</label>
            <input name="Name" value="${esc(c.name)}" required>
          </div>
          <div class="vpn-field">
            <label>اسم المستخدم (Username) *</label>
            <input name="Username" dir="ltr" value="${esc(c.username)}" required>
          </div>
          <div class="vpn-field">
            <label style="color:#0055ff;font-weight:bold">الـ Static IP داخل نفق SSTP *</label>
            <input name="IP" dir="ltr" value="${esc(c.ip)}" required style="font-weight:bold;color:#60a5fa">
          </div>
          <div class="vpn-field">
            <label>كلمة المرور (اتركها فارغة للإبقاء على الحالية)</label>
            <input name="Password" dir="ltr" placeholder="تغيير كلمة المرور">
          </div>
          <div class="vpn-field">
            <label>رقم الموبايل</label>
            <input name="Phone" dir="ltr" value="${esc(c.phone || "")}">
          </div>
          <div class="vpn-field" style="grid-column:span 2">
            <label>المدير / الموزع المسؤول</label>
            <select name="ManagerID">${mOpts(c.manager_id || 0)}</select>
          </div>
          <div class="vpn-field" style="grid-column:span 2">
            <label>ملاحظات إضافية</label>
            <input name="Notes" value="${esc(c.notes || "")}">
          </div>
          <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
            <button type="button" class="b-cancel" data-close style="background:rgba(255,255,255,0.06);color:#ffffff;padding:6px 14px;border-radius:9999px">إلغاء</button>
            <button class="green" style="padding:8px 18px;border-radius:8px;font-weight:bold">حفظ التعديلات</button>
          </div>
        </form>
      </div>
    `);

    $("#vpnEditForm", m).onsubmit = async e => {
      e.preventDefault();
      const f = formData(e.target);
      await act(() => api("vpn", { method: "POST", body: { Action: "edit", ID: id, ...f, ManagerID: +f.ManagerID } }), "تم حفظ التعديلات بنجاح");
      closeModal();
      PAGES.vpn();
    };
  });

  // 4. Quick Actions (Toggle, New Password, Delete)
  document.querySelectorAll("[data-act]").forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === "delete" && !confirm(`هل أنت متأكد من حذف المكان «${b.dataset.name}»؟ سيتم إيقاف اتصال الراوتر بالنظام فوراً.`)) return;
    if (a === "new_password" && !confirm("سيتم تغيير كلمة المرور وتوليد باسورد جديد، ستحتاج لوضع الأمر الجديد على الراوتر. متابعة؟")) return;
    post({ Action: a, ID: +b.dataset.id }, "تمت العملية بنجاح");
  });

  // 5. RouterOS Script Viewer Modal (Dark Terminal High-Tech)
  document.querySelectorAll("[data-scr]").forEach(b => b.onclick = async () => {
    const id = b.dataset.scr;
    const client = clients.find(x => +x.id === +id);
    const r = await act(() => api("vpn?script=" + id));
    if (!r || !r.script) return;

    modal(`
      <div style="font-family:'Cairo',sans-serif">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:10px">
          <div>
            <h3 style="margin:0;font-size:16px;color:#ffffff;display:flex;align-items:center;gap:8px">
              <i class="bi bi-terminal-fill" style="color:#0055ff"></i>
              <span>أوامر المايكروتك لربط: <b>${esc(client ? client.name : "الراوتر")}</b></span>
            </h3>
            <p class="muted" style="margin:4px 0 0;font-size:12px">انسخ الأوامر التالية وضعها في New Terminal داخل راوتر المايكروتك مباشرة.</p>
          </div>
        </div>

        <pre class="vpn-script-modal" id="modalScriptContent">${esc(r.script)}</pre>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
          <span style="font-size:12px;color:#10b981;font-weight:bold"><i class="bi bi-shield-check"></i> الأوامر مجهزة بالمنفذ ${esc(d.port)} والـ Static IP المخصص</span>
          <button class="green" id="btnCopyRouterScript" style="display:inline-flex;align-items:center;gap:8px;padding:9px 18px;border-radius:8px;font-weight:bold">
            <i class="bi bi-clipboard-check"></i> نسخ أوامر المايكروتك
          </button>
        </div>
      </div>
    `);

    $("#btnCopyRouterScript").onclick = () => {
      navigator.clipboard.writeText($("#modalScriptContent").textContent).then(() => {
        toast("تم نسخ أوامر المايكروتك إلى الحافظة بنجاح!");
      });
    };
  });

  // 6. Emergency Cards Script Viewer
  document.querySelectorAll("[data-em]").forEach(b => b.onclick = async () => {
    const r = await act(() => api("cafe?scripts=" + b.dataset.em));
    if (!r) return;
    const text = "# ⚠️ للعرض فقط — لا يتم تطبيقه إلا بعد التجربة\n\n" +
      "# ===== 1) إعدادات الهوتسبوت المقترحة =====\n" + r.hotspot +
      "\n# ===== 2) مراقب الطوارئ (مرة واحدة) =====\n" + r.watch +
      "\n# ===== 3) محتوى الملف sr-emergency-users.rsc (" + r.cards + " كارت صالح) =====\n" + r.users;

    modal(`
      <div style="font-family:'Cairo',sans-serif">
        <h3 style="margin:0 0 10px;color:#991b1b"><i class="bi bi-life-preserver"></i> أوامر كروت الطوارئ للفرع</h3>
        <pre class="vpn-script-modal" id="modalEmContent">${esc(text)}</pre>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
          <button type="button" class="b-cancel" data-close style="padding:8px 16px;border-radius:8px">إغلاق</button>
          <button class="green" id="btnCopyEmScript" style="padding:8px 18px;border-radius:8px;font-weight:bold">
            <i class="bi bi-clipboard"></i> نسخ كود الطوارئ
          </button>
        </div>
      </div>
    `);

    $("#btnCopyEmScript").onclick = () => {
      navigator.clipboard.writeText($("#modalEmContent").textContent).then(() => {
        toast("تم نسخ أوامر الطوارئ بنجاح");
      });
    };
  });
};
