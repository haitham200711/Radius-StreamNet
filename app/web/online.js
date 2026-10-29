// "الجلسات النشطة وتيليمتري أجهزة الـ NAS" — NOC Commander Direction 1: Active Sessions & NAS Telemetry
"use strict";

PAGES.online = async () => {
  let all = [];
  const sel = new Set();
  const st = { nas: "", prof: "", q: "", size: +(localStorage.getItem("rm_online_size") || 25), page: 1 };
  let lastLoadedTime = Date.now();
  let autoRefreshEnabled = true;
  let autoRefreshTimer = null;
  let staleCounterTimer = null;
  let isTyping = false;

  C(`<div class="adv-card">
    <div class="adv-head">
      <span><i class="bi bi-wifi text-primary"></i> الجلسات النشطة وتيليمتري الشبكة (Active Sessions & NAS Telemetry) <small id="oFound"></small></span>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="icon-btn" id="reload" title="تحديث فوري"><i class="bi bi-arrow-repeat"></i></button>
      </div>
    </div>
    <div class="adv-body">
      <!-- KPI Telemetry Cards -->
      <div class="dz-kpis small" style="margin-bottom:14px">
        <div class="dz-kpi k-indigo">
          <div class="dz-kpi-h"><span>الجلسات النشطة حالياً</span><span class="dz-ico"><i class="bi bi-person-fills"></i></span></div>
          <div class="dz-num" id="kpiTotalSessions">0</div>
          <div class="dz-foot"><span class="dz-pill p-indigo"><i class="bi bi-circle-fill stale-dot"></i> متصل بالسيرفر</span></div>
        </div>
        <div class="dz-kpi k-sky">
          <div class="dz-kpi-h"><span>أجهزة الـ NAS النشطة</span><span class="dz-ico"><i class="bi bi-hdd-network-fill"></i></span></div>
          <div class="dz-num" id="kpiActiveNas">0</div>
          <div class="dz-foot"><span class="dz-pill p-sky">خوادم استقبال الجلسات</span></div>
        </div>
        <div class="dz-kpi k-green">
          <div class="dz-kpi-h"><span>إجمالي حجم التحميل (Down)</span><span class="dz-ico"><i class="bi bi-download"></i></span></div>
          <div class="dz-num mono" id="kpiTotalDown" dir="ltr" style="font-size:1.35rem"><bdi dir="ltr">0 B</bdi></div>
          <div class="dz-foot"><span class="dz-pill p-green">بيانات الجلسات المفتوحة</span></div>
        </div>
        <div class="dz-kpi k-amber">
          <div class="dz-kpi-h"><span>إجمالي حجم الرفع (Up)</span><span class="dz-ico"><i class="bi bi-upload"></i></span></div>
          <div class="dz-num mono" id="kpiTotalUp" dir="ltr" style="font-size:1.35rem"><bdi dir="ltr">0 B</bdi></div>
          <div class="dz-foot"><span class="dz-pill p-amber">بيانات الجلسات المفتوحة</span></div>
        </div>
      </div>

      <!-- Telemetry & Live Heartbeat Bar -->
      <div class="noc-telemetry-bar">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span class="stale-badge stale-fresh" id="oStaleBadge">
            <span class="stale-dot"></span>
            <span>آخر استعلام حي: <b id="oStaleSec">منذ لحظات</b></span>
          </span>
          <button id="oBtnToggleRefresh" class="btn-refresh-toggle" title="إيقاف / استئناف التحديث التلقائي">
            <i class="bi bi-pause-fill"></i> <span>تحديث دوري (15ث)</span>
          </button>
        </div>
        <div style="font-size:12px;color:#8e8e93">
          <span>وضع التشغيل: <b style="color:#ffffff">${ME.mode === "shadow" ? "مراقبة (Shadow)" : "تشغيل حي (Live)"}</b></span>
          <span style="margin-inline:8px">|</span>
          <span>المستخدم: <b style="color:#ffffff">${esc(ME.admin.username)}</b></span>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="adv-row">
        <div class="adv-f">
          <label>خادم الـ NAS المستهدف</label>
          <div class="adv-inline">
            <select id="fNas"><option value="">كل أجهزة الـ NAS</option></select>
          </div>
        </div>
        <div class="adv-f">
          <label>تصفية حسب الباقة</label>
          <div class="adv-inline">
            <select id="fProf">${options(PROFILES, 0, "name", "كل العروض والباقات")}</select>
          </div>
        </div>
        <div class="adv-f adv-grow">
          <label>بحث فوري (اسم المشترك / عنوان IP / عنوان MAC / السيرفر)</label>
          <div class="adv-inline">
            <span class="adv-cal"><i class="bi bi-funnel-fill"></i></span>
            <input id="oQ" placeholder="ابحث باسم المستخدم أو IP أو MAC...">
          </div>
        </div>
      </div>

      <!-- Action Buttons Bar -->
      <div class="adv-actions" style="margin:10px 0 14px">
        <button class="b-light" id="o360"><i class="bi bi-eye"></i> بطاقة المشترك</button>
        <button class="b-blue" id="oMac"><i class="bi bi-lock-fill"></i> تثبيت الماك</button>
        <button class="b-blue" id="oIp"><i class="bi bi-tag"></i> تثبيت الـ IP</button>
        <button class="b-gray" id="oEdit"><i class="bi bi-pencil-square"></i> تعديل المشترك</button>
        <button class="b-gray" id="oMsg"><i class="bi bi-envelope-o"></i> إرسال رسالة</button>
        <button class="b-gray" id="oOpen"><i class="bi bi-box-arrow-up-right"></i> فتح راوتر المشترك (IP)</button>
        <button class="b-red" id="oDisc"><i class="bi bi-plug-fill"></i> فصل اتصال الجلسة (PoD)</button>
      </div>

      <!-- Grid Tools -->
      <div class="adv-tools">
        <div>
          <label>إظهار 
            <select id="oSz">
              ${[10, 25, 50, 100, 250, 500].map(n => `<option value="${n}" ${n === st.size ? "selected" : ""}>${n} في الصفحة</option>`).join("")}
            </select> نتائج
          </label>
        </div>
      </div>

      <!-- Sessions Table -->
      <div class="tablewrap" id="oTableWrap">
        <table class="adv-table" id="oT"></table>
      </div>

      <div class="adv-tools">
        <div id="oInfo" class="muted"></div>
        <div class="adv-pager" id="oPg"></div>
      </div>
    </div>
  </div>`);

  // State 1: Skeleton Loader Shimmer
  const renderSkeleton = () => {
    const rowsHtml = Array.from({ length: 6 }).map(() =>
      `<tr class="skeleton-row">${Array.from({ length: 12 }).map(() => '<td><div class="skeleton-cell"></div></td>').join("")}</tr>`
    ).join("");
    $("#oT").innerHTML = `
      <thead>
        <tr>
          <th class="c-chk"></th><th>#</th><th>اسم المشترك</th><th>الاسم</th><th>الباقة</th>
          <th>عنوان IP المعين</th><th>خادم NAS والمنفذ</th><th>عنوان MAC المتصل</th><th>مدة الاتصال</th>
          <th>التحميل</th><th>الرفع</th><th>الإجراءات</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>`;
  };

  // State 2: Operational Empty State
  const renderEmpty = () => {
    return `<tr><td colspan="12">
      <div class="noc-empty-state">
        <i class="bi bi-wifi noc-empty-icon" style="opacity:0.4"></i>
        <h3>لا توجد جلسات اتصال نشطة تطابق البحث</h3>
        <p>لا توجد جلسات مفتوحة حالياً تطابق معايير الفلترة المحددة (سيرفر الـ NAS، الباقة، أو نص البحث).</p>
        <button class="noc-btn-reset" id="btnEmptyReset"><i class="bi bi-undo"></i> إعادة تعيين الفلاتر</button>
      </div>
    </td></tr>`;
  };

  // State 3: Operational Error State
  const renderError = (errMsg) => {
    return `<tr><td colspan="12">
      <div class="noc-error-state">
        <i class="bi bi-exclamation-triangle-fill noc-error-icon"></i>
        <h3>تعذر جلب بيانات الجلسات النشطة</h3>
        <p>${esc(errMsg || "خطأ غير متوقع أثناء الاتصال بالخادم.")}</p>
        <button class="noc-btn-retry" id="btnErrorRetry"><i class="bi bi-arrow-repeat"></i> إعادة المحاولة الآن</button>
      </div>
    </td></tr>`;
  };

  const draw = () => {
    const pn = st.prof ? (PROFILES.find(p => +p.id === +st.prof) || {}).name : "";
    const filtered = all.filter(o => {
      const nasMatch = !st.nas || (o.nas_name || o.nas || o.nasipaddress || "-") === st.nas;
      const profMatch = !pn || o.profile === pn;
      const qStr = (o.username + " " + (o.firstname || "") + " " + (o.lastname || "") + " " + (o.ip || o.framedipaddress || "") + " " + (o.mac || o.callingstationid || "") + " " + (o.nas_name || o.nas || o.nasipaddress || "")).toLowerCase();
      const qMatch = !st.q || qStr.includes(st.q);
      return nasMatch && profMatch && qMatch;
    });

    const pages = Math.max(1, Math.ceil(filtered.length / st.size));
    st.page = Math.min(st.page, pages);
    const view = filtered.slice((st.page - 1) * st.size, st.page * st.size);

    $("#oFound").textContent = `( تم إيجاد ${fmt(filtered.length)} من إجمالي ${fmt(all.length)} جلسة نشطة )`;

    let tbodyContent = "";
    if (view.length) {
      tbodyContent = view.map((o, i) => {
        const ip = o.ip || o.framedipaddress || "—";
        const mac = o.mac || o.callingstationid || "—";
        const nas = o.nas_name || o.nas || o.nasipaddress || "—";
        const port = o.nasportid || o.portid || "";
        const sid = o.sid || "";
        const uname = o.username || "";
        const durTxt = o.acctsessiontime ? secondsDuration(o.acctsessiontime) : (o.session_sec ? secondsDuration(o.session_sec) : "نشط");
        const downTxt = octetsTxt(o.bytes_out || o.acctoutputoctets);
        const upTxt = octetsTxt(o.bytes_in || o.acctinputoctets);
        const isChecked = sel.has(o.radacctid || o.sid || uname);

        return `
          <tr data-uid="${esc(uname)}">
            <td class="c-chk"><input type="checkbox" data-chk="${esc(o.radacctid || o.sid || uname)}" ${isChecked ? "checked" : ""}></td>
            <td class="c-n" style="background:rgba(0,85,255,0.25);color:#fff">${(st.page - 1) * st.size + i + 1}</td>
            <td>
              <a class="u-pill font-mono" data-sub="${sid}" title="انقر لفتح ملف المشترك">
                <bdi dir="ltr" class="tech-val">${esc(uname)}</bdi>
              </a>
            </td>
            <td>${esc(o.firstname || "")} ${esc(o.lastname || "")}</td>
            <td><span class="tag gray">${esc(o.profile || "بدون باقة")}</span></td>
            <td><b><bdi dir="ltr" class="tech-val">${esc(ip)}</bdi></b></td>
            <td>
              <bdi dir="ltr" class="tech-val"><b>${esc(nas)}</b>${port ? ` : ${esc(port)}` : ""}</bdi>
            </td>
            <td><bdi dir="ltr" class="tech-val">${esc(mac)}</bdi></td>
            <td><bdi dir="ltr" class="tech-val">${durTxt}</bdi></td>
            <td><bdi dir="ltr" class="tech-val">${downTxt}</bdi></td>
            <td><bdi dir="ltr" class="tech-val">${upTxt}</bdi></td>
            <td>
              <button class="btn-diag-action sm" data-disc="${esc(uname)}" data-sub="${sid}" data-nas="${esc(nas)}" data-ip="${esc(ip)}" title="فصل هذه الجلسة فوراً (PoD)">
                <i class="bi bi-plug-fill"></i> فصل PoD
              </button>
            </td>
          </tr>`;
      }).join("");
    } else {
      tbodyContent = renderEmpty();
    }

    $("#oT").innerHTML = `
      <thead>
        <tr>
          <th class="c-chk"><input type="checkbox" id="oSelAll"></th>
          <th>#</th>
          <th>اسم المشترك</th>
          <th>الاسم</th>
          <th>الباقة</th>
          <th>عنوان IP المعين</th>
          <th>خادم NAS والمنفذ</th>
          <th>عنوان MAC المتصل</th>
          <th>مدة الاتصال</th>
          <th>التحميل</th>
          <th>الرفع</th>
          <th>الإجراءات</th>
        </tr>
      </thead>
      <tbody>${tbodyContent}</tbody>`;

    $("#oInfo").textContent = `إظهار ${filtered.length ? (st.page - 1) * st.size + 1 : 0} إلى ${Math.min(filtered.length, st.page * st.size)} من أصل ${fmt(filtered.length)} مُدخل`;

    // Bind checkboxes & rows
    $("#oSelAll").onchange = e => {
      view.forEach(o => {
        const k = o.radacctid || o.sid || o.username;
        e.target.checked ? sel.add(k) : sel.delete(k);
      });
      draw();
    };

    document.querySelectorAll("[data-chk]").forEach(c => {
      c.onchange = () => {
        c.checked ? sel.add(c.dataset.chk) : sel.delete(c.dataset.chk);
      };
    });

    document.querySelectorAll("[data-sub]").forEach(a => {
      a.onclick = (e) => {
        e.stopPropagation();
        if (a.dataset.sub) openSubscriber(+a.dataset.sub, load);
      };
    });

    document.querySelectorAll("[data-disc]").forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        confirmDangerousDisconnect(b.dataset.sub, b.dataset.disc, b.dataset.nas, b.dataset.ip);
      };
    });

    const btnReset = $("#btnEmptyReset");
    if (btnReset) {
      btnReset.onclick = resetFilters;
    }

    drawPager(filtered.length, pages);
  };

  const drawPager = (totalCount, pages) => {
    const p = st.page;
    const nums = [...new Set([1, pages, p - 1, p, p + 1, p + 2].filter(n => n >= 1 && n <= pages))].sort((a, b) => a - b);
    let html = `<a class="${p <= 1 ? "dis" : ""}" data-pg="${p - 1}">السابقة</a>`, last = 0;
    nums.forEach(n => {
      if (n - last > 1) html += "<span>…</span>";
      html += `<a class="${n === p ? "cur" : ""}" data-pg="${n}">${n}</a>`;
      last = n;
    });
    html += `<a class="${p >= pages ? "dis" : ""}" data-pg="${p + 1}">التالية</a>`;
    $("#oPg").innerHTML = html;
    $("#oPg").querySelectorAll("[data-pg]").forEach(a => {
      a.onclick = () => {
        const n = +a.dataset.pg;
        if (n >= 1 && n <= pages && n !== p) {
          st.page = n;
          draw();
        }
      };
    });
  };

  const updateTelemetryCounters = () => {
    $("#kpiTotalSessions").textContent = fmt(all.length);
    const nasSet = new Set(all.map(o => o.nas_name || o.nas || o.nasipaddress).filter(Boolean));
    $("#kpiActiveNas").textContent = fmt(nasSet.size);

    let totDown = 0, totUp = 0;
    all.forEach(o => {
      totDown += Number(o.bytes_out || o.acctoutputoctets || 0);
      totUp += Number(o.bytes_in || o.acctinputoctets || 0);
    });
    $("#kpiTotalDown").innerHTML = `<bdi dir="ltr">${octetsTxt(totDown)}</bdi>`;
    $("#kpiTotalUp").innerHTML = `<bdi dir="ltr">${octetsTxt(totUp)}</bdi>`;

    // Update NAS selector with active counts
    const nasCount = {};
    all.forEach(o => {
      const k = o.nas_name || o.nas || o.nasipaddress || "-";
      nasCount[k] = (nasCount[k] || 0) + 1;
    });
    const curNas = $("#fNas").value;
    $("#fNas").innerHTML = '<option value="">كل أجهزة الـ NAS</option>' +
      Object.entries(nasCount).sort((a, b) => b[1] - a[1]).map(([k, n]) =>
        `<option value="${esc(k)}" ${k === curNas ? "selected" : ""}>${esc(k)} (${n} جلسة)</option>`
      ).join("");
  };

  let seq = 0;
  const load = async (opts = {}) => {
    if (opts.background && isTyping) return;
    const my = ++seq;
    if (!opts.background) renderSkeleton();

    try {
      const d = await api("online");
      if (my !== seq) return;
      const shadow = ME.mode === "shadow";
      all = shadow ? (d.adv || []) : (d.own || []);
      lastLoadedTime = Date.now();
      updateStaleTelemetry(true);
      updateTelemetryCounters();
      draw();
    } catch (err) {
      if (my !== seq) return;
      updateStaleTelemetry(false, err.message);
      $("#oT").innerHTML = `
        <thead><tr><th>#</th><th>اسم المشترك</th><th>عنوان IP</th><th>خادم NAS</th><th>الإجراءات</th></tr></thead>
        <tbody>${renderError(err.message)}</tbody>`;
      const btnRetry = $("#btnErrorRetry");
      if (btnRetry) btnRetry.onclick = () => load();
    }
  };

  const updateStaleTelemetry = (ok, errStr) => {
    const badge = $("#oStaleBadge");
    const secSpan = $("#oStaleSec");
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

  const resetFilters = () => {
    st.page = 1;
    st.nas = "";
    st.prof = "";
    st.q = "";
    $("#fNas").value = "";
    $("#fProf").value = "0";
    $("#oQ").value = "";
    draw();
  };

  // Event handlers
  $("#fNas").onchange = e => { st.nas = e.target.value; st.page = 1; draw(); };
  $("#fProf").onchange = e => { st.prof = +e.target.value; st.page = 1; draw(); };
  $("#oSz").onchange = e => {
    st.size = +e.target.value;
    try { localStorage.setItem("rm_online_size", st.size); } catch (_) {}
    st.page = 1;
    draw();
  };

  let tq;
  $("#oQ").oninput = e => {
    isTyping = true;
    clearTimeout(tq);
    tq = setTimeout(() => {
      isTyping = false;
      st.q = e.target.value.trim().toLowerCase();
      st.page = 1;
      draw();
    }, 300);
  };

  $("#reload").onclick = () => load();

  // Auto-refresh control (every 15 seconds for live sessions)
  $("#oBtnToggleRefresh").onclick = () => {
    autoRefreshEnabled = !autoRefreshEnabled;
    const btn = $("#oBtnToggleRefresh");
    if (autoRefreshEnabled) {
      btn.classList.remove("paused");
      btn.innerHTML = '<i class="bi bi-pause-fill"></i> <span>تحديث دوري (15ث)</span>';
    } else {
      btn.classList.add("paused");
      btn.innerHTML = '<i class="bi bi-play-fill"></i> <span>استئناف التحديث</span>';
    }
  };

  staleCounterTimer = setInterval(() => {
    updateStaleTelemetry(true);
  }, 2000);

  autoRefreshTimer = setInterval(() => {
    if (autoRefreshEnabled && !isTyping) {
      load({ background: true });
    }
  }, 15000);

  // Dangerous Action: PoD Disconnect Confirmation Modal
  const confirmDangerousDisconnect = (subId, username, nasIp, framedIp) => {
    const canDisc = ME.admin.role === "admin" || (ME.admin.perms && ME.admin.perms.includes(8));
    if (!canDisc) {
      return toast("غير مسموح لك بفصل الاتصال (يتطلب صلاحية pDisconnect)", true);
    }

    const m = modal(`
      <div class="danger-modal-box">
        <div class="danger-modal-h">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <h3>تأكيد فصل اتصال الجلسة فوراً (PoD Disconnect)</h3>
        </div>
        <div class="danger-modal-body">
          <p>أنت على وشك إرسال حزمة فصل فورية <b>RADIUS Packet of Disconnect (PoD)</b> إلى جهاز NAS:</p>
          <div class="danger-impact-callout">
            <div><b>المشترك:</b> <bdi dir="ltr" class="tech-val">${esc(username)}</bdi></div>
            <div style="margin-top:4px;"><b>جهاز NAS:</b> <bdi dir="ltr" class="tech-val">${esc(nasIp || "غير محدد")}</bdi></div>
            <div style="margin-top:4px;"><b>عنوان IP:</b> <bdi dir="ltr" class="tech-val">${esc(framedIp || "غير محدد")}</bdi></div>
            <div style="margin-top:8px;"><b>الأثر التشغيلي:</b> سيتم إنهاء اتصال المشترك بالإنترنت فوراً، وإغلاق الجلسة في radacct، وتحرير عنوان الـ IP.</div>
          </div>
          <p style="font-size:12px;color:#8e8e93">سيتم توثيق العملية في سجل العمليات (Audit Log).</p>
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
        if (subId) {
          await act(() => api(`subscribers/${subId}/op`, { method: "POST", body: { Action: "disconnect" } }), "تم إرسال أمر الفصل إلى NAS");
        } else {
          // Fallback if no subId (disconnect by username)
          await act(() => api("user/disconnect", { method: "POST", body: { Username: username } }), "تم إرسال أمر الفصل إلى NAS");
        }
        load({ background: true });
      } catch (e) {
        toast(e.message || "فشل إرسال أمر الفصل إلى NAS", true);
      }
    };
  };

  const getOneSelected = () => {
    const k = [...sel][0];
    if (!k) {
      toast("يرجى تحديد مشترك واحد من الجدول أولاً", true);
      return null;
    }
    return all.find(x => (x.radacctid || x.sid || x.username) == k) || null;
  };

  $("#o360").onclick = () => {
    const o = getOneSelected();
    if (o && o.sid) openSubscriber(+o.sid, load);
  };
  $("#oEdit").onclick = () => {
    const o = getOneSelected();
    if (o && o.sid) location.hash = "user?id=" + o.sid;
  };
  $("#oMsg").onclick = () => {
    const o = getOneSelected();
    if (o && o.sid) USER_OPS.send_msg(o.sid);
  };
  $("#oOpen").onclick = () => {
    const o = getOneSelected();
    if (o && (o.ip || o.framedipaddress)) {
      window.open("http://" + (o.ip || o.framedipaddress), "_blank", "noopener");
    }
  };
  $("#oDisc").onclick = () => {
    const o = getOneSelected();
    if (o) {
      confirmDangerousDisconnect(o.sid, o.username, o.nas_name || o.nas || o.nasipaddress, o.ip || o.framedipaddress);
    }
  };
  $("#oMac").onclick = async () => {
    const o = getOneSelected();
    if (!o || !o.sid) return;
    const mac = o.mac || o.callingstationid;
    if (!mac) return toast("لا يوجد عنوان MAC مسجل لهذه الجلسة", true);
    if (confirm(`تثبيت عنوان الماك ${mac} على حساب المشترك ${o.username}؟`)) {
      await act(() => api("subscribers/bulk", { method: "POST", body: { Action: "mac", IDs: [+o.sid], Value: mac } }));
      toast("تم تثبيت الماك بنجاح");
      load({ background: true });
    }
  };
  $("#oIp").onclick = async () => {
    const o = getOneSelected();
    if (!o || !o.sid) return;
    const ip = o.ip || o.framedipaddress;
    if (!ip) return toast("لا يوجد عنوان IP مسجل لهذه الجلسة", true);
    if (confirm(`تثبيت عنوان الـ IP ${ip} على حساب المشترك ${o.username}؟`)) {
      await act(() => api("subscribers/bulk", { method: "POST", body: { Action: "ip", IDs: [+o.sid], Value: ip } }));
      toast("تم تثبيت عنوان IP بنجاح");
      load({ background: true });
    }
  };

  load();
};
