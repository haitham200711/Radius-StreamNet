// "إدارة أجهزة الـ NAS" — NOC Commander Direction 1: NAS Hardware & Gateway Fleet
"use strict";

PAGES.nas = async () => {
  const shadow = ME.mode === "shadow";
  const sel = new Set();
  let rows = [];
  let d = { local: [], adv: [] };
  let lastLoadedTime = Date.now();

  const typeAr = t => ({ mikrotik: "MikroTik RouterOS", other: "سيرفر عام (Other)", cisco: "Cisco IOS / XE" })[String(t).toLowerCase()] || t || "MikroTik";

  C(`<div class="adv-card">
    <div class="adv-head">
      <span><i class="bi bi-hdd-network-fill text-primary"></i> أجهزة الـ NAS وبوابات الشبكة (NAS Gateways Fleet) <small id="nFound"></small></span>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="icon-btn" id="reload" title="تحديث فوري"><i class="bi bi-arrow-repeat"></i></button>
      </div>
    </div>
    <div class="adv-body">
      ${shadow ? '<div class="alert"><i class="bi bi-info-circle"></i> وضع المراقبة (Shadow Mode): يتم عرض أجهزة الـ NAS المسجلة في ADV للقراءة فقط. الأسرار المشتركة (Shared Secrets) مقنّعة تماماً لأسباب أمنية.</div>' : ""}

      <!-- Action Buttons Bar -->
      <div class="adv-actions" style="margin:0 0 14px">
        <button class="b-blue ${ME.admin.role === "admin" ? "" : "perm-disabled"}" id="nAdd" ${ME.admin.role === "admin" ? "" : 'title="يتطلب صلاحية الإدارة (Admin)"'}>
          <i class="bi bi-plus-lg"></i> ${ME.admin.role === "admin" ? "" : '<i class="bi bi-lock-fill"></i> '}إضافة جهاز NAS
        </button>
        <button class="b-gray ${ME.admin.role === "admin" ? "" : "perm-disabled"}" id="nEdit" ${ME.admin.role === "admin" ? "" : 'title="يتطلب صلاحية الإدارة (Admin)"'}>
          <i class="bi bi-pencil-square"></i> ${ME.admin.role === "admin" ? "" : '<i class="bi bi-lock-fill"></i> '}تعديل الجهاز
        </button>
        <button class="b-red ${ME.admin.role === "admin" ? "" : "perm-disabled"}" id="nDel" ${ME.admin.role === "admin" ? "" : 'title="يتطلب صلاحية الإدارة (Admin)"'}>
          <i class="bi bi-trash3-fill-o"></i> ${ME.admin.role === "admin" ? "" : '<i class="bi bi-lock-fill"></i> '}حذف الجهاز
        </button>
      </div>

      <!-- Table Container -->
      <div class="tablewrap" id="nTableWrap">
        <table class="adv-table" id="nT"></table>
      </div>

      <div class="adv-tools">
        <div id="nInfo" class="muted"></div>
      </div>
    </div>
  </div>`);

  // State 1: Skeleton
  const renderSkeleton = () => {
    const rowsHtml = Array.from({ length: 4 }).map(() =>
      `<tr class="skeleton-row">${Array.from({ length: 8 }).map(() => '<td><div class="skeleton-cell"></div></td>').join("")}</tr>`
    ).join("");
    $("#nT").innerHTML = `
      <thead>
        <tr>
          <th class="c-chk"></th><th>#</th><th>اسم الجهاز (Shortname)</th><th>عنوان IP</th>
          <th>الرمز السري (Secret)</th><th>النوع</th><th>الوصف التشغيلي</th><th>الجلسات النشطة</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>`;
  };

  // State 2: Empty
  const renderEmpty = () => {
    return `<tr><td colspan="8">
      <div class="noc-empty-state">
        <i class="bi bi-hdd-network-fill noc-empty-icon" style="opacity:0.4"></i>
        <h3>لا توجد أجهزة NAS مسجلة حالياً</h3>
        <p>لم يتم إضافة أي سيرفرات أو أجهزة NAS في قاعدة بيانات FreeRADIUS.</p>
        ${ME.admin.role === "admin" ? '<button class="noc-btn-reset" id="btnEmptyAdd"><i class="bi bi-plus-lg"></i> إضافة جهاز NAS الآن</button>' : ""}
      </div>
    </td></tr>`;
  };

  // State 3: Error
  const renderError = (errMsg) => {
    return `<tr><td colspan="8">
      <div class="noc-error-state">
        <i class="bi bi-exclamation-triangle-fill noc-error-icon"></i>
        <h3>تعذر جلب قائمة أجهزة الـ NAS</h3>
        <p>${esc(errMsg || "خطأ في الاتصال بقاعدة البيانات.")}</p>
        <button class="noc-btn-retry" id="btnErrorRetry"><i class="bi bi-arrow-repeat"></i> إعادة المحاولة</button>
      </div>
    </td></tr>`;
  };

  const draw = () => {
    let tbodyContent = "";
    if (rows.length) {
      tbodyContent = rows.map((n, i) => {
        const isChecked = sel.has(String(n.id));
        return `
          <tr data-id="${esc(n.id)}">
            <td class="c-chk"><input type="checkbox" data-n="${esc(n.id)}" ${isChecked ? "checked" : ""}></td>
            <td class="c-n" style="background:${+n.online > 0 ? "#10b981" : "#8e8e93"};color:#fff">${i + 1}</td>
            <td><b><bdi dir="ltr" class="tech-val">${esc(n.name)}</bdi></b></td>
            <td><bdi dir="ltr" class="tech-val">${esc(n.ip)}</bdi></td>
            <td><bdi dir="ltr" class="tech-val" style="letter-spacing:2px;color:#8e8e93">••••••••</bdi></td>
            <td><span class="tag gray">${esc(typeAr(n.type))}</span></td>
            <td>${esc(n.description || "—")}</td>
            <td>
              ${+n.online > 0
                ? `<span class="tag green"><i class="bi bi-circle-fill"></i> ${n.online} متصل</span>`
                : '<span class="tag gray">0 متصل</span>'}
            </td>
          </tr>`;
      }).join("");
    } else {
      tbodyContent = renderEmpty();
    }

    $("#nT").innerHTML = `
      <thead>
        <tr>
          <th class="c-chk"><input type="checkbox" id="nSelAll"></th>
          <th>#</th>
          <th>اسم الجهاز (Shortname)</th>
          <th>عنوان IP</th>
          <th>الرمز السري (Secret)</th>
          <th>النوع</th>
          <th>الوصف التشغيلي</th>
          <th>الجلسات النشطة</th>
        </tr>
      </thead>
      <tbody>${tbodyContent}</tbody>`;

    $("#nFound").textContent = `( إجمالي ${fmt(rows.length)} أجهزة NAS )`;
    $("#nInfo").textContent = `إظهار 1 إلى ${rows.length} من أصل ${rows.length} مُدخل`;

    $("#nSelAll").onchange = e => {
      rows.forEach(n => e.target.checked ? sel.add(String(n.id)) : sel.delete(String(n.id)));
      draw();
    };

    document.querySelectorAll("[data-n]").forEach(c => {
      c.onchange = () => {
        c.checked ? sel.add(c.dataset.n) : sel.delete(c.dataset.n);
      };
    });

    const btnEmptyAdd = $("#btnEmptyAdd");
    if (btnEmptyAdd) btnEmptyAdd.onclick = openAddModal;
  };

  const load = async () => {
    renderSkeleton();
    try {
      d = await api("nas");
      rows = shadow
        ? (d.adv || []).map(x => ({ ...x, src: "adv" }))
        : (d.local || []).map(x => ({ id: x.id, name: x.shortname, ip: x.nasname, type: x.type, description: x.description, online: x.online || 0, src: "local" }));
      rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      draw();
    } catch (err) {
      $("#nT").innerHTML = `
        <thead><tr><th>#</th><th>اسم الجهاز</th><th>عنوان IP</th><th>الحالة</th></tr></thead>
        <tbody>${renderError(err.message)}</tbody>`;
      const btnRetry = $("#btnErrorRetry");
      if (btnRetry) btnRetry.onclick = () => load();
    }
  };

  const openAddModal = () => {
    if (ME.admin.role !== "admin") return toast("غير مسموح (يتطلب صلاحية Admin)", true);
    const m = modal(`
      <h3><i class="bi bi-hdd-network-fill"></i> إضافة جهاز NAS جديد</h3>
      <form class="form" id="nf">
        <label>اسم الجهاز (Shortname)<input name="Shortname" placeholder="MikroTik-Core-1" required></label>
        <label>عنوان IP الخاص بـ NAS<input name="Nasname" placeholder="192.168.1.1" dir="ltr" required></label>
        <label>الرمز السري (Shared Secret)<input name="Secret" type="password" placeholder="••••••••" required></label>
        <label>نوع الجهاز<select name="Type"><option value="mikrotik">مايكروتك (MikroTik)</option><option value="cisco">سيسكو (Cisco)</option><option value="other">أخرى (Other)</option></select></label>
        <label class="full">الوصف التشغيلي / الموقع<input name="Description" placeholder="راوتر التوزيع الرئيسي - السنترال"></label>
        <div class="actions full" style="justify-content:flex-end">
          <button type="button" class="b-gray" data-close>إلغاء</button>
          <button class="b-blue"><i class="bi bi-check-lg"></i> حفظ وإعادة تحميل FreeRADIUS</button>
        </div>
      </form>`);

    $("#nf", m).onsubmit = async e => {
      e.preventDefault();
      await act(() => api("nas", { method: "POST", body: formData(e.target) }), "تمت إضافة الجهاز بنجاح");
      closeModal();
      load();
    };
  };

  const openEditModal = () => {
    if (ME.admin.role !== "admin") return toast("غير مسموح (يتطلب صلاحية Admin)", true);
    const ids = [...sel].filter(Boolean);
    if (ids.length !== 1) return toast(shadow ? "أجهزة ADV للقراءة فقط" : "يرجى اختيار جهاز واحد للتعديل", true);
    const n = d.local.find(x => String(x.id) === ids[0]);
    if (!n) return toast("الجهاز غير موجود", true);

    const m = modal(`
      <h3><i class="bi bi-pencil-square"></i> تعديل جهاز الـ NAS (${esc(n.shortname)})</h3>
      <form class="form" id="nf">
        <label>اسم الجهاز (Shortname)<input name="Shortname" value="${esc(n.shortname)}" required></label>
        <label>عنوان IP<input name="Nasname" value="${esc(n.nasname)}" dir="ltr" required></label>
        <label>الرمز السري (Secret)<input name="Secret" type="password" placeholder="اتركه فارغاً دون تغيير" autocomplete="new-password"></label>
        <label>نوع الجهاز<select name="Type">
          <option value="mikrotik" ${n.type === "mikrotik" ? "selected" : ""}>مايكروتك (MikroTik)</option>
          <option value="cisco" ${n.type === "cisco" ? "selected" : ""}>سيسكو (Cisco)</option>
          <option value="other" ${n.type === "other" ? "selected" : ""}>أخرى (Other)</option>
        </select></label>
        <label class="full">الوصف التشغيلي<input name="Description" value="${esc(n.description || "")}"></label>
        <div class="actions full" style="justify-content:flex-end">
          <button type="button" class="b-gray" data-close>إلغاء</button>
          <button class="b-blue"><i class="bi bi-check-lg"></i> حفظ التعديلات</button>
        </div>
      </form>`);

    $("#nf", m).onsubmit = async e => {
      e.preventDefault();
      await act(() => api("nas/" + n.id, { method: "PUT", body: formData(e.target) }), "تم حفظ التعديل");
      closeModal();
      load();
    };
  };

  const confirmDangerousDelete = () => {
    if (ME.admin.role !== "admin") return toast("غير مسموح (يتطلب صلاحية Admin)", true);
    const ids = [...sel].filter(Boolean);
    if (!ids.length) return toast(shadow ? "أجهزة ADV لا يمكن حذفها من هنا" : "يرجى تحديد جهاز أو أكثر من الجدول", true);

    const targetNames = rows.filter(r => ids.includes(String(r.id))).map(r => r.name).join("، ");

    const m = modal(`
      <div class="danger-modal-box">
        <div class="danger-modal-h">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <h3>تأكيد حذف أجهزة NAS من قاعدة بيانات FreeRADIUS</h3>
        </div>
        <div class="danger-modal-body">
          <p>أنت على وشك حذف أجهزة الـ NAS التالية:</p>
          <div class="danger-impact-callout">
            <div><b>الأجهزة المحددة (${ids.length}):</b> <bdi dir="ltr" class="tech-val">${esc(targetNames)}</bdi></div>
            <div style="margin-top:6px;"><b>الأثر التشغيلي:</b> سيرفض خادم FreeRADIUS استقبال أي طلبات مصادقة أو حزم محاسبة من هذه الأجهزة فوراً.</div>
          </div>
          <p style="font-size:12px;color:#8e8e93">هل ترغب بالتأكيد ومتابعة الحذف؟</p>
        </div>
        <div class="danger-modal-actions">
          <button id="delCancel" class="b-gray">إلغاء</button>
          <button id="delConfirm" class="b-red"><i class="bi bi-trash3-fill-o"></i> نعم، احذف الأجهزة</button>
        </div>
      </div>`);

    $("#delCancel", m).onclick = () => closeModal();
    $("#delConfirm", m).onclick = async () => {
      closeModal();
      for (const id of ids) {
        await api("nas/" + id, { method: "DELETE" });
      }
      toast(`تم حذف ${ids.length} جهاز وإعادة تشغيل FreeRADIUS`);
      sel.clear();
      load();
    };
  };

  $("#reload").onclick = () => load();
  $("#nAdd").onclick = openAddModal;
  $("#nEdit").onclick = openEditModal;
  $("#nDel").onclick = confirmDangerousDelete;

  load();
};
