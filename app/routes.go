package main

import (
	"encoding/json"
	"net"
	"net/http"
	"os/exec"
	"regexp"
	"strings"
)

type KernelRoute struct {
	Dst      string `json:"dst"`
	Gateway  string `json:"gateway"`
	Dev      string `json:"dev"`
	Protocol string `json:"protocol"`
	Scope    string `json:"scope"`
	PrefSrc  string `json:"prefsrc"`
}

type KernelLink struct {
	IfName    string `json:"ifname"`
	OperState string `json:"operstate"`
}

type StaticRouteRow struct {
	ID          int    `json:"id"`
	Destination string `json:"destination"`
	Gateway     string `json:"gateway"`
	Interface   string `json:"iface"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
	CreatedBy   string `json:"created_by"`
}

func ensureStaticRoutesTable() {
	db.Exec(`CREATE TABLE IF NOT EXISTS rm_static_routes (
		id INT AUTO_INCREMENT PRIMARY KEY,
		destination VARCHAR(64) NOT NULL,
		gateway VARCHAR(64) NOT NULL,
		iface VARCHAR(32) NOT NULL DEFAULT '',
		description VARCHAR(255) NOT NULL DEFAULT '',
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		created_by VARCHAR(64) NOT NULL DEFAULT '',
		UNIQUE KEY uq_dst (destination)
	)`)
}

func applyStaticRoutesFromDB() {
	ensureStaticRoutesTable()
	rows, err := db.Query("SELECT destination, gateway, iface FROM rm_static_routes")
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var dst, gw, iface string
		if rows.Scan(&dst, &gw, &iface) == nil && dst != "" && gw != "" {
			args := []string{"route", "replace", dst, "via", gw}
			if iface != "" {
				args = append(args, "dev", iface)
			}
			exec.Command("ip", args...).Run()
		}
	}
}

// GET /api/network/routes
func networkRoutesGetAPI(w http.ResponseWriter, r *http.Request, a *Admin) {
	ensureStaticRoutesTable()

	// 1. Fetch live kernel routes via `ip -j route show`
	var kernelRoutes []KernelRoute
	out, err := exec.Command("ip", "-j", "route", "show").Output()
	if err == nil {
		json.Unmarshal(out, &kernelRoutes)
	}

	// 2. Fetch live network interfaces via `ip -j link show`
	var ifaces []string
	linkOut, err := exec.Command("ip", "-j", "link", "show").Output()
	if err == nil {
		var links []KernelLink
		if json.Unmarshal(linkOut, &links) == nil {
			for _, l := range links {
				if l.IfName != "" && l.IfName != "lo" {
					ifaces = append(ifaces, l.IfName)
				}
			}
		}
	}

	// 3. Fetch custom stored routes
	var staticRoutes []StaticRouteRow
	dbRows, err := db.Query("SELECT id, destination, gateway, iface, description, created_at, created_by FROM rm_static_routes ORDER BY id DESC")
	if err == nil {
		defer dbRows.Close()
		for dbRows.Next() {
			var sr StaticRouteRow
			if dbRows.Scan(&sr.ID, &sr.Destination, &sr.Gateway, &sr.Interface, &sr.Description, &sr.CreatedAt, &sr.CreatedBy) == nil {
				staticRoutes = append(staticRoutes, sr)
			}
		}
	}

	writeJSON(w, 200, map[string]any{
		"kernel_routes": kernelRoutes,
		"static_routes": staticRoutes,
		"interfaces":    ifaces,
	})
}

// POST /api/network/routes
func networkRouteAddAPI(w http.ResponseWriter, r *http.Request, a *Admin) {
	ensureStaticRoutesTable()

	var in struct {
		Destination string `json:"destination"`
		Gateway     string `json:"gateway"`
		Interface   string `json:"interface"`
		Description string `json:"description"`
	}
	if readJSON(r, &in) != nil {
		fail(w, 400, "بيانات غير صالحة")
		return
	}

	dst := strings.TrimSpace(in.Destination)
	gw := strings.TrimSpace(in.Gateway)
	iface := strings.TrimSpace(in.Interface)
	desc := strings.TrimSpace(in.Description)

	if dst == "" || gw == "" {
		fail(w, 400, "الشبكة المستهدفة (Destination) وعنوان البوابة (Gateway) مطلوبان")
		return
	}

	// Validate Gateway IP
	if net.ParseIP(gw) == nil {
		fail(w, 400, "عنوان البوابة (Gateway IP) غير صحيح")
		return
	}

	// Validate Destination IP or CIDR
	if !strings.Contains(dst, "/") {
		if net.ParseIP(dst) != nil {
			dst = dst + "/32"
		} else {
			fail(w, 400, "الشبكة المستهدفة غير صحيحة (مثال: 192.168.10.0/24)")
			return
		}
	} else {
		_, _, err := net.ParseCIDR(dst)
		if err != nil {
			fail(w, 400, "صيغة CIDR غير صحيحة (مثال: 10.20.0.0/16)")
			return
		}
	}

	// Validate Interface if provided (alphanumeric, dots, dashes)
	if iface != "" {
		validIface := regexp.MustCompile(`^[a-zA-Z0-9_\-\.]+$`)
		if !validIface.MatchString(iface) {
			fail(w, 400, "اسم الواجهة (Interface) غير صالح")
			return
		}
	}

	// Execute `ip route replace` in Linux kernel
	args := []string{"route", "replace", dst, "via", gw}
	if iface != "" {
		args = append(args, "dev", iface)
	}
	cmd := exec.Command("ip", args...)
	cmdOut, err := cmd.CombinedOutput()
	if err != nil {
		fail(w, 400, "خطأ في لينكس: "+string(cmdOut))
		return
	}

	// Save or update in database
	_, err = db.Exec(`INSERT INTO rm_static_routes (destination, gateway, iface, description, created_by)
		VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE gateway=VALUES(gateway), iface=VALUES(iface), description=VALUES(description), created_by=VALUES(created_by)`,
		dst, gw, iface, desc, a.Username)
	if err != nil {
		fail(w, 500, "فشل حفظ المسار في قاعدة البيانات: "+err.Error())
		return
	}

	audit(a, r, "static_route_add", dst, map[string]string{"dst": dst, "gw": gw, "iface": iface, "desc": desc})
	writeJSON(w, 200, map[string]any{"ok": true, "destination": dst, "gateway": gw})
}

// POST /api/network/routes/delete
func networkRouteDelAPI(w http.ResponseWriter, r *http.Request, a *Admin) {
	ensureStaticRoutesTable()

	var in struct {
		ID          int    `json:"id"`
		Destination string `json:"destination"`
	}
	if readJSON(r, &in) != nil {
		fail(w, 400, "طلب غير صالح")
		return
	}

	dst := strings.TrimSpace(in.Destination)
	if in.ID > 0 && dst == "" {
		db.QueryRow("SELECT destination FROM rm_static_routes WHERE id = ?", in.ID).Scan(&dst)
	}

	if dst == "" {
		fail(w, 400, "المسار المطلوب حذفه غير محدد")
		return
	}

	// Delete from Linux kernel
	exec.Command("ip", "route", "del", dst).Run()

	// Delete from DB
	if in.ID > 0 {
		db.Exec("DELETE FROM rm_static_routes WHERE id = ?", in.ID)
	} else {
		db.Exec("DELETE FROM rm_static_routes WHERE destination = ?", dst)
	}

	audit(a, r, "static_route_del", dst, map[string]any{"id": in.ID, "destination": dst})
	writeJSON(w, 200, map[string]any{"ok": true})
}
