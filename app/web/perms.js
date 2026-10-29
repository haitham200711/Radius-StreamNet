// "صلاحيات الموزعين" (المجموعات الامنية) and "توجيه البورتات" — same layout as ADV.
"use strict";
PAGES.perms = async () => {
  const groups = await api("security-groups");
  C(`<div class="adv-card"><div class="adv-head"><span><i class="bi bi-key"></i> المجموعات الامنية <small>(تم إيجاد ${groups.length} نتائج )</small></span></div><div class="adv-body">
    <div class="adv-actions" style="margin:0 0 12px"><button class="btn-hoki soon"><i class="bi bi-plus-lg"></i> إضافة</button><button class="btn-blue2 soon">تعديل</button>
      <button class="btn-blue2" id="toMgr">قائمة المدراء</button><button class="btn-red soon">حذف</button></div>
    <div class="adv-tools"><div class="adv-tbtns"><button>CSV</button><button>EXCEL</button><button onclick="print()">طباعة</button><button>عرض/إخفاء</button></div><label>بحث <input id="gq"></label></div>
    <div class="tablewrap"><table class="adv-table" id="gT"></table></div>
    <div class="adv-tools"><div class="muted">إظهار 1 إلى ${groups.length} من أصل ${groups.length} مُدخل</div><div class="adv-pager"><a class="dis">السابقة</a><a class="cur">1</a><a class="dis">التالية</a></div></div></div></div>`);
  const draw = q => { $("#gT").innerHTML = `<thead><tr><th class="c-chk"><input type="checkbox"></th><th>#</th><th>اسم المجموعة</th><th>عدد المدراء</th><th>إجمالي الصلاحيات</th><th>انشى في</th></tr></thead>
    <tbody>${groups.filter(g => !q || String(g.name).includes(q)).map((g, i) => `<tr><td class="c-chk"><input type="radio" name="g"></td><td>${i + 1}</td><td>${esc(g.name)}</td><td>${g.managers}</td><td>${g.perms}</td><td>${esc(g.created || "")}</td></tr>`).join("")
    || '<tr><td colspan="6" class="empty">لا توجد اي بيانات في هذا الجدول</td></tr>'}</tbody>`; };
  $("#gq").oninput = e => draw(e.target.value.trim());
  $("#toMgr").onclick = () => { location.hash = "managers"; };
  document.querySelectorAll("button.soon").forEach(b => b.onclick = () => toast("الخاصية دي هتتعمل في المرحلة الجاية", true));
  draw("");
};
