// "لوحة التحكم" — Stream-Net NOC Dashboard (Design #3: Pure Minimal Studio Edition)
// Dual Light / Dark Mode, high-clarity operational HUD with live telemetry & FreeRADIUS/SSTP indicators.
"use strict";

const GB = 1073741824;
function gbText(b) {
  b = +b || 0;
  return b >= 1099511627776 ? (b / 1099511627776).toFixed(2) + " TB" : (b / GB).toFixed(1) + " GB";
}

// SVG Network Traffic Usage Chart (Daily Download & Upload) — Works in Light & Dark
function usageChart(days) {
  if (!days || !days.length) {
    return '<div class="empty" style="padding:30px;color:var(--text-muted)">لا توجد بيانات استهلاك مسجلة حتى الآن</div>';
  }
  const W = 1400, H = 220, P = 40, n = days.length;
  const max = Math.max(1, ...days.map(d => Math.max(+d.down || 0, +d.up || 0)));
  const TB = max >= 2 * 1099511627776, unit = TB ? 1099511627776 : GB;
  const x = i => P + (n === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (n - 1));
  const y = v => H - P - (v / max) * (H - 2 * P);
  const line = k => days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(+d[k] || 0).toFixed(1)}`).join(" ");
  const area = k => `${line(k)} L${x(n - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;

  const grid = [0, .25, .5, .75, 1].map(f => `
    <line x1="${P}" x2="${W - P}" y1="${y(max * f)}" y2="${y(max * f)}" stroke="var(--border)" stroke-width="1"/>
    <text x="${P - 8}" y="${y(max * f) + 4}" fill="var(--text-muted)" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="end">${(max * f / unit).toFixed(TB ? 1 : 0)}</text>
  `).join("");

  const labels = days.map((d, i) => i % Math.ceil(n / 7) === 0 || i === n - 1 
    ? `<text x="${x(i)}" y="${H - 10}" fill="var(--text-muted)" font-size="11" font-family="'JetBrains Mono', monospace" text-anchor="middle">${d.day.slice(5)}</text>` 
    : "").join("");

  const dots = days.map((d, i) => `
    <circle cx="${x(i)}" cy="${y(+d.down || 0)}" r="8" fill="transparent" cursor="pointer">
      <title>${d.day}\nتحميل: ${gbText(d.down)}\nرفع: ${gbText(d.up)}</title>
    </circle>
  `).join("");

  return `<svg viewBox="0 0 ${W} ${H}" class="dz-chart" role="img" aria-label="استهلاك آخر ${n} يوم" style="width:100%;height:auto;max-height:240px;display:block">
    <defs>
      <linearGradient id="gDown" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#0055ff" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#0055ff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gUp" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area("down")}" fill="url(#gDown)"/>
    <path d="${area("up")}" fill="url(#gUp)"/>
    <path d="${line("down")}" fill="none" stroke="#0055ff" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${line("up")}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round"/>
    ${labels}
    ${dots}
  </svg>`;
}

PAGES.dashboard = async () => {
  const d = await api("dashboard");
  let m = {};
  const isAdmin = ME.admin.role === "admin";

  if (d.mode === "shadow" && isAdmin) {
    try { m = (await api("sync")).adv_metrics || {}; } catch (_) {}
  }

  const qs = m.quick_stats || {};
  const cs = m.get_cards_sales_stats || {};
  const online = d.mode === "shadow" && isAdmin ? +d.adv_online || +qs.online_users || 0 : d.online;
  const days = d.usage_days || [];
  const last = days[days.length - 1] || {};

  const act = (href, ic, t, cls) => `
    <a class="dz-act ${cls || ""}" href="#${href}" style="display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:9999px;font-size:12px;font-weight:700;text-decoration:none">
      <span class="dz-bub" style="width:24px;height:24px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center"><i class="bi ${ic}"></i></span>
      <span>${t}</span>
    </a>
  `;

  const sparkline = (pts, stroke) => `
    <svg viewBox="0 0 100 24" class="dz-spark" style="width:75px;height:22px;overflow:visible;flex-shrink:0">
      <path d="${pts}" fill="none" stroke="${stroke || 'var(--accent)'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const kpi = (cls, ic, title, val, foot, link, spark) => `
    <a class="dz-kpi ${cls}" href="#${link}" style="border-radius:16px;padding:16px 18px;text-decoration:none;display:block">
      <div class="dz-kpi-h" style="font-size:12px;color:var(--text-muted);font-weight:700;display:flex;align-items:center;justify-content:space-between">
        <span>${title}</span>
        <span class="dz-ico" style="width:34px;height:34px;border-radius:9999px;font-size:16px;display:inline-flex;align-items:center;justify-content:center"><i class="bi ${ic}"></i></span>
      </div>
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin:6px 0">
        <div class="dz-num" style="font-family:'JetBrains Mono','Cairo',sans-serif;font-feature-settings:'tnum' 1;font-size:1.75rem;font-weight:800;color:var(--text-main)">${val}</div>
        ${spark || ""}
      </div>
      <div class="dz-foot" style="display:flex;flex-wrap:wrap;gap:6px">${foot}</div>
    </a>
  `;

  const pill = (cls, t) => `<span class="dz-pill ${cls}" style="padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700">${t}</span>`;

  // SVG Radial Progress Ring (دايرة بنسبة الإنجاز والمسار الدائري)
  const radialRing = (curr, total, color, size = 66, stroke = 5.5) => {
    curr = +curr || 0;
    total = +total || 0;
    const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((curr / total) * 100))) : 0;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    const center = size / 2;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="radial-ring-svg" style="flex-shrink:0">
        <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
        <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" 
                stroke-linecap="round" stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" 
                transform="rotate(-90 ${center} ${center})" style="transition:stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)"/>
        <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" 
              font-family="'JetBrains Mono',monospace" font-size="12" font-weight="800" fill="var(--text-main)">${pct}%</text>
      </svg>
    `;
  };

  // Compact KPI Card with Circular Progress
  const compactCard = ({ href, icon, title, badge, badgeClass, curr, total, subText, color }) => `
    <a href="#${href}" class="studio-compact-card">
      <div class="scc-header">
        <div class="scc-title-wrap">
          <span class="scc-icon" style="color:${color}"><i class="bi ${icon}"></i></span>
          <span>${title}</span>
        </div>
        ${badge ? `<span class="dz-pill ${badgeClass}">${badge}</span>` : ''}
      </div>
      <div class="scc-body">
        <div class="scc-ring-wrap">
          ${radialRing(curr, total, color)}
        </div>
        <div class="scc-data">
          <div class="scc-numbers">
            <span class="scc-curr">${fmt(curr)}</span>
            <span class="scc-slash">/</span>
            <span class="scc-total">${fmt(total)}</span>
          </div>
          <div class="scc-sub">${subText}</div>
        </div>
      </div>
    </a>
  `;

  // Calculate live ratio for progress bars
  const totalSub = +d.subscribers || 1;
  const onlinePct = Math.min(100, Math.round((online / totalSub) * 100));
  const nasTotal = +(d.nas_total || 0) || 1;
  const nasActive = +(d.nas_active || 0);
  const nasPct = Math.min(100, Math.round((nasActive / nasTotal) * 100));

  C(`<div class="dz" style="display:flex;flex-direction:column;gap:18px">
    
    <!-- 1. Header Hero Telemetry (Pure Minimal Studio) -->
    <div class="dz-card dz-head" style="border-radius:16px;padding:18px 20px;">
      <div class="dz-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
        <div style="display:flex;align-items:center;gap:14px">
          <span class="dz-bub big" style="background:var(--accent-subtle);color:var(--accent);width:44px;height:44px;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;font-size:20px"><i class="bi bi-grid-1x2-fill"></i></span>
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <h2 style="margin:0;font-size:1.25rem;font-weight:800;color:var(--text-main)">Stream RADIUS // Studio</h2>
              <span class="studio-badge-pill" style="font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 8px;border-radius:9999px;background:var(--bg-card-subtle);border:1px solid var(--border);color:var(--text-muted);font-weight:700">Design 3</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:4px;flex-wrap:wrap">
              <small style="color:var(--text-muted);font-size:12px">
                ${d.mode === "shadow" ? "وضع المراقبة (Shadow) — القراءة المباشرة من ADV. آخر مزامنة: " + esc(d.last_sync || "الآن") : "إدارة المشتركين وبوابات SSTP بالبساطة النقية — محرك FreeRADIUS نشط"}
              </small>
              <button type="button" class="btn-mode-quick-switch ${d.mode === 'shadow' ? 'mode-to-live' : 'mode-to-shadow'}" onclick="openModeSwitchModal()" title="انقر لإيقاف أو تشغيل وضع المراقبة">
                <i class="bi ${d.mode === 'shadow' ? 'bi-lightning-charge-fill' : 'bi-eye-fill'}"></i>
                <span>${d.mode === 'shadow' ? 'التحويل إلى وضع Live' : 'الرجوع إلى وضع Shadow'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Studio Actions Ribbon: Side-by-side shortcut tiles with Popup Modals -->
      <div class="studio-actions-ribbon">
        <div class="studio-action-tile primary-tile" onclick="openQuickAddUserModal()" title="إضافة مشترك في نافذة منبثقة">
          <span class="action-tile-ico" style="color:var(--accent)"><i class="bi bi-person-plus-fill"></i></span>
          <div class="action-tile-content">
            <span class="action-tile-title">إضافة مشترك جديد</span>
            <span class="action-tile-sub">تفعيل فوري للحساب</span>
          </div>
        </div>

        <div class="studio-action-tile" onclick="openQuickRenewalsModal()" title="تجديد الاشتراكات المنتهية">
          <span class="action-tile-ico" style="color:var(--badge-amber-text)"><i class="bi bi-hourglass-split"></i></span>
          <div class="action-tile-content">
            <span class="action-tile-title">تجديد المنتهين</span>
            <span class="action-tile-sub">${fmt(d.expiring)} تستحق التجديد</span>
          </div>
        </div>

        <div class="studio-action-tile" onclick="openQuickSpeedModal()" title="التحكم ومضاعفة السرعات">
          <span class="action-tile-ico" style="color:#8b5cf6"><i class="bi bi-lightning-charge-fill"></i></span>
          <div class="action-tile-content">
            <span class="action-tile-title">التحكم في السرعات</span>
            <span class="action-tile-sub">مضاعفة أو زيادة مؤقتة</span>
          </div>
        </div>

        <div class="studio-action-tile" onclick="openQuickSstpModal()" title="حالة أنفاق SSTP والفروع">
          <span class="action-tile-ico" style="color:var(--accent)"><i class="bi bi-shield-lock-fill"></i></span>
          <div class="action-tile-content">
            <span class="action-tile-title">أنفاق SSTP والفروع</span>
            <span class="action-tile-sub">بوابات الربط والتشفير</span>
          </div>
        </div>

        ${isAdmin ? `
        <div class="studio-action-tile" onclick="openQuickNasModal()" title="أجهزة NAS والراوترات">
          <span class="action-tile-ico" style="color:var(--badge-green-text)"><i class="bi bi-hdd-network-fill"></i></span>
          <div class="action-tile-content">
            <span class="action-tile-title">أجهزة NAS والمواقع</span>
            <span class="action-tile-sub">${fmt(d.nas_active)} فروع متصلة</span>
          </div>
        </div>
        ` : ''}

                <div class="studio-action-tile" onclick="openQuickCafeModal()" title="كروت الكافيهات والهوتسبوت">
          <span class="action-tile-ico" style="color:#f59e0b"><i class="bi bi-cup-hot-fill"></i></span>
          <div class="action-tile-content">
            <span class="action-tile-title">كروت الكافيهات</span>
            <span class="action-tile-sub">الحزم والكروت المتاحة</span>
          </div>
        </div>

        <div class="studio-action-tile" onclick="openQuickCashModal()" title="معاملات الكاش وإنستاباي">
          <span class="action-tile-ico" style="color:#10b981"><i class="bi bi-cash-stack"></i></span>
          <div class="action-tile-content">
            <span class="action-tile-title">معاملات الكاش</span>
            <span class="action-tile-sub">المحافظ والتحويلات</span>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- 2. Compact Subscriber KPI Cards with Radial Progress Rings (خانات المشتركين الصغيرة بالأشرطة الدائرية) -->
    <div class="scc-grid">
      
      <!-- 1. Online Subscribers -->
      ${compactCard({
        href: "online",
        icon: "bi-broadcast",
        title: "المشتركون المتصلون",
        badge: '<span class="pulse-dot"></span> متصل الآن',
        badgeClass: "p-green",
        curr: online,
        total: totalSub,
        subText: "مشترك نشط على الراوترات",
        color: "#10b981"
      })}

      <!-- 2. Active Subscriptions -->
      ${compactCard({
        href: "subscribers?status=active",
        icon: "bi-check2-circle",
        title: "الاشتراكات السارية",
        badge: "اشتراك فعال",
        badgeClass: "p-sky",
        curr: d.active,
        total: totalSub,
        subText: "حساب ساري الصلاحية",
        color: "var(--accent)"
      })}

      <!-- 3. Expiring Soon -->
      ${compactCard({
        href: "subscribers?status=expiring",
        icon: "bi-hourglass-split",
        title: `تنتهي خلال ${d.expiring_days || 3} أيام`,
        badge: "مطلوب تجديد",
        badgeClass: "p-amber",
        curr: d.expiring,
        total: d.active || totalSub,
        subText: "توشك على الانتهاء قريباً",
        color: "#f59e0b"
      })}

      <!-- 4. Expired Subscriptions -->
      ${compactCard({
        href: "subscribers?status=expired",
        icon: "bi-exclamation-octagon",
        title: "الاشتراكات المنتهية",
        badge: "منتهي",
        badgeClass: "p-rose",
        curr: d.expired,
        total: totalSub,
        subText: "اشتراك منتهي الصلاحية",
        color: "#ef4444"
      })}

      <!-- 5. Active NAS Routers -->
      ${isAdmin ? compactCard({
        href: "nas",
        icon: "bi-hdd-network-fill",
        title: "راوترات NAS النشطة",
        badge: "خوادم التوزيع",
        badgeClass: "p-purple",
        curr: d.nas_active,
        total: d.nas_total,
        subText: "راوتر يبث جلسات الآن",
        color: "#8b5cf6"
      }) : ""}

      <!-- 6. Suspended / Disabled Accounts -->
      ${compactCard({
        href: "subscribers?status=disabled",
        icon: "bi-slash-circle",
        title: "الحسابات الموقوفة",
        badge: "إدارياً",
        badgeClass: "p-slate",
        curr: d.disabled,
        total: totalSub,
        subText: "موقوف يدوي بدون اتصال",
        color: "#64748b"
      })}

    </div>

    <!-- 4. Network Traffic Graph & Consumption -->
    <div class="dz-card" style="border-radius:16px;padding:18px 20px;">
      <div class="dz-card-h" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <span style="font-weight:800;font-size:14px;color:var(--text-main);display:flex;align-items:center;gap:8px">
          <i class="bi bi-graph-up-arrow" style="color:var(--accent)"></i>
          <span>حركة ترافيك الشبكة واستيعاب الحزم — آخر ${days.length || 14} يوم</span>
        </span>
        <div style="display:flex;align-items:center;gap:12px;font-size:12px;color:var(--text-muted)">
          <span style="display:inline-flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:3px;background:#0055ff;display:inline-block"></i>تحميل (Download)</span>
          <span style="display:inline-flex;align-items:center;gap:6px"><i style="width:10px;height:10px;border-radius:3px;background:#10b981;display:inline-block"></i>رفع (Upload)</span>
        </div>
      </div>
      ${usageChart(days)}
    </div>

    <!-- 5. Server Diagnostics & Resources Strip -->
    <div class="dz-card" style="border-radius:16px;padding:18px 20px;">
      <div class="dz-card-h" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-weight:800;font-size:14px;color:var(--text-main);display:flex;align-items:center;gap:8px">
          <i class="bi bi-cpu-fill" style="color:var(--accent)"></i>
          <span>المؤشرات الحيوية لخادم السيرفر المركزي (VPS Core)</span>
        </span>
        <span class="dz-pill p-slate" style="font-family:monospace">${esc(d.version || "Linux amd64")}</span>
      </div>
      <div class="dz-res" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
        ${[
          ["cpu", "bi-cpu", "استهلاك المعالج CPU"],
          ["ram", "bi-memory", "الذاكرة العشوائية RAM"],
          ["disk", "bi-device-hdd", "مساحة القرص الصلب"],
          ["uptime", "bi-clock-history", "مدة تشغيل السيرفر"],
                    ["ping_google", "bi-globe2", "Ping بوابة الإنترنت"],
          ["now", "bi-calendar-event", "توقيت السيرفر اللحظي"]
        ].map(([k, ic, t]) => `
          <div class="dz-tile" style="background:var(--bg-card-subtle);border:1px solid var(--border);border-radius:12px;padding:12px 14px">
            <div class="dz-tile-h" style="font-size:11.5px;color:var(--text-muted);display:flex;align-items:center;gap:6px">
              <i class="bi ${ic}" style="color:var(--accent)"></i>
              <span>${t}</span>
            </div>
            <div class="dz-tile-v" data-sys="${k}" style="font-family:'JetBrains Mono','Inter',monospace;font-size:1.15rem;font-weight:800;color:var(--text-main);margin:6px 0">...</div>
            <div class="dz-bar" style="height:5px;background:var(--border);border-radius:9999px;overflow:hidden">
              <i data-bar="${k}" style="display:block;height:100%;width:0;background:var(--accent);transition:width 0.2s ease-out"></i>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

  </div>`);

  // Live sysinfo fetch
  api("sysinfo").then(s => {
    document.querySelectorAll("[data-sys]").forEach(e => {
      const k = e.dataset.sys, v = s[k];
      e.innerHTML = v && typeof v === "object" ? `<bdi>${esc(v.ms)}</bdi> <small style="font-size:11px;color:var(--text-muted)">فقد ${esc(v.loss)}</small>` : `<bdi>${esc(v ?? "--")}</bdi>`;
      const bar = document.querySelector(`[data-bar="${k}"]`), pct = parseFloat(v);
      if (bar) {
        if (/%$/.test(String(v)) && !isNaN(pct)) {
          bar.style.width = Math.min(100, pct) + "%";
          bar.style.background = pct > 85 ? "#ef4444" : pct > 65 ? "#f59e0b" : "var(--accent)";
        } else {
          bar.parentElement.style.visibility = "hidden";
        }
      }
    });
  }).catch(() => {});
};
