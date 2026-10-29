package main

// "VPN الكافيهات والأماكن": an SSTP server on this VM (accel-ppp, built by deploy/sstp-build.sh) so every café's MikroTik
// connects straight to the RADIUS over the internet, whatever line it is on.
//   - one account per café router: custom or random password, custom or fixed tunnel address
//   - the same address is registered as a NAS with its own random RADIUS secret, so the café asks RADIUS
//     at the gateway IP and CoA (disconnect / speed) reaches the café back through the tunnel
//   - the tunnel carries only RADIUS/CoA: no NAT, no forwarding, the cafés' internet never passes through here
// This process writes /etc/accel-ppp.conf and /etc/ppp/chap-secrets (0600) from the database and reloads accel-ppp.

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
)

const (
	vpnConf    = "/etc/accel-ppp.conf"
	vpnSecrets = "/etc/ppp/chap-secrets"
	vpnCert    = "/etc/radmanager/sstp-cert.pem"
	vpnKey     = "/etc/radmanager/sstp-key.pem"
	vpnCLIPass = "/etc/radmanager/accel-cli.pass"
	vpnDefPort = "4444"
)

func vpnGateway() string {
	if gw := strings.TrimSpace(setting("vpn_gateway")); gw != "" && net.ParseIP(gw) != nil {
		return gw
	}
	return "10.199.0.1"
}

func vpnNetPrefix() string {
	gw := vpnGateway()
	if idx := strings.LastIndex(gw, "."); idx > 0 {
		return gw[:idx]
	}
	return "10.199.0"
}

func ensureVPNSchema() {
	db.Exec(`CREATE TABLE IF NOT EXISTS rm_vpn_clients (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(64) NOT NULL, username VARCHAR(32) NOT NULL UNIQUE,
		password VARCHAR(64) NOT NULL, ip VARCHAR(15) NOT NULL UNIQUE, nas_secret VARCHAR(64) NOT NULL, phone VARCHAR(32) NOT NULL DEFAULT '',
		manager_id INT NULL, notes VARCHAR(255) NOT NULL DEFAULT '', enabled TINYINT NOT NULL DEFAULT 1, created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
}

// letters and digits only: safe inside chap-secrets quotes and RouterOS scripts
func randToken(n int) string {
	const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, n)
	for i := range b {
		k, _ := rand.Int(rand.Reader, big.NewInt(int64(len(abc))))
		b[i] = abc[k.Int64()]
	}
	return string(b)
}

func vpnPort() string {
	if p := setting("vpn_port"); p != "" {
		if n, err := strconv.Atoi(p); err == nil && n > 0 && n < 65536 {
			return p
		}
	}
	return vpnDefPort
}

// writeVPN rebuilds accel-ppp's files from the database and reloads it (no-op in the staging test copy)
func writeVPN() error {
	if env("RM_STAGING", "") == "1" {
		return nil
	}
	if _, err := os.Stat("/usr/local/sbin/accel-pppd"); err != nil {
		return fmt.Errorf("سيرفر الـ VPN مش متسطّب")
	}
	cli, _ := os.ReadFile(vpnCLIPass)
	gw := vpnGateway()
	conf := strings.Join([]string{
		"# written by RAD-Manager (vpn.go) — edit from the panel, not by hand",
		"[modules]", "log_file", "sstp", "auth_mschap_v2", "chap-secrets", "iprange", "",
		"[core]", "log-error=/var/log/accel-ppp/core.log", "thread-count=2", "",
		"[common]", "single-session=replace", "max-starting=20", "",
		"[ppp]", "verbose=1", "min-mtu=1280", "mtu=1400", "mru=1400", "ipv4=require", "ipv6=deny", "lcp-echo-interval=20", "lcp-echo-failure=3", "",
		"[sstp]", "verbose=1", "accept=ssl", "port=" + vpnPort(), "ssl-protocol=tls1.2,tls1.3", "ssl-pemfile=" + vpnCert, "ssl-keyfile=" + vpnKey, "timeout=60", "hello-interval=60", "",
		"[client-ip-range]", clientRanges(), "", // who may connect: the whole internet EXCEPT the tunnel network (loop guard)
		"[chap-secrets]", "gw-ip-address=" + gw, "chap-secrets=" + vpnSecrets, "",
		"[cli]", "tcp=127.0.0.1:2001", "password=" + strings.TrimSpace(string(cli)), "",
		"[log]", "log-file=/var/log/accel-ppp/accel-ppp.log", "log-emerg=/var/log/accel-ppp/emerg.log", "log-fail-file=/var/log/accel-ppp/auth-fail.log", "copy=1", "level=3", "",
	}, "\n")
	var sec strings.Builder
	sec.WriteString("# written by RAD-Manager — one line per router: \"user\" * \"password\" fixed-ip\n")
	rows, err := db.Query("SELECT username, password, ip FROM rm_vpn_clients WHERE enabled=1 ORDER BY id")
	if err != nil {
		return err
	}
	for rows.Next() {
		var u, p, ip string
		rows.Scan(&u, &p, &ip)
		fmt.Fprintf(&sec, "%q * %q %s\n", u, p, ip)
	}
	rows.Close()
	if err := writeFileAtomic(vpnConf, []byte(conf), 0600); err != nil {
		return err
	}
	if err := writeFileAtomic(vpnSecrets, []byte(sec.String()), 0600); err != nil {
		return err
	}
	if exec.Command("systemctl", "is-active", "--quiet", "accel-ppp").Run() == nil {
		if out, err := accelCmd("reload"); err != nil {
			return fmt.Errorf("reload: %v %s", err, out)
		}
		return nil
	}
	return exec.Command("systemctl", "restart", "accel-ppp").Run()
}

func writeFileAtomic(path string, b []byte, mode os.FileMode) error {
	os.MkdirAll(filepath.Dir(path), 0755)
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, b, mode); err != nil {
		return err
	}
	return os.Rename(tmp, path)
}

func accelCmd(args ...string) (string, error) {
	if simMode() {
		return "", errSim
	}
	pass, _ := os.ReadFile(vpnCLIPass)
	a := []string{"-H", "127.0.0.1", "-p", "2001"}
	if p := strings.TrimSpace(string(pass)); p != "" {
		a = append(a, "-P", p)
	}
	out, err := exec.Command("/usr/local/bin/accel-cmd", append(a, args...)...).CombinedOutput()
	return string(out), err
}

// who is connected now: username → {ip, uptime}
func vpnSessions() map[string][2]string {
	res := map[string][2]string{}
	out, err := accelCmd("show", "sessions", "username,ip,uptime,state")
	if err != nil {
		return res
	}
	for _, l := range strings.Split(out, "\n") {
		f := strings.Split(l, "|")
		if len(f) < 4 {
			continue
		}
		u, ip, up, st := strings.TrimSpace(f[0]), strings.TrimSpace(f[1]), strings.TrimSpace(f[2]), strings.TrimSpace(f[3])
		if u == "" || u == "username" || st != "active" {
			continue
		}
		res[u] = [2]string{ip, up}
	}
	return res
}

func nextVPNIP() (string, error) {
	prefix := vpnNetPrefix()
	gw := vpnGateway()
	used := map[string]bool{gw: true}
	rows, err := db.Query("SELECT ip FROM rm_vpn_clients")
	if err != nil {
		return "", err
	}
	for rows.Next() {
		var ip string
		rows.Scan(&ip)
		used[ip] = true
	}
	rows.Close()
	for i := 2; i <= 254; i++ {
		if ip := prefix + "." + strconv.Itoa(i); !used[ip] {
			return ip, nil
		}
	}
	return "", fmt.Errorf("كل عناوين الـ VPN في %s.0/24 محجوزة", prefix)
}

// the RouterOS 6/7 commands a router needs (tunnel + RADIUS for the hotspot + CoA)
func vpnScript(c map[string]any) string {
	host := setting("vpn_host")
	if host == "" {
		host = "VPN_HOST_HERE"
	}
	gw := vpnGateway()
	return strings.Join([]string{
		"# Stream-Radius — " + fmt.Sprint(c["name"]) + " (RouterOS 6 / 7)",
		"# ⚠️ على راوتر شغال: Backup + Export الأول",
		"/interface sstp-client remove [find name=\"stream-radius\"]",
		fmt.Sprintf("/interface sstp-client add name=stream-radius connect-to=%s port=%s user=%s password=%s authentication=mschap2 profile=default-encryption keepalive-timeout=60 add-default-route=no dial-on-demand=no disabled=no comment=\"Stream-Radius VPN\"",
			host, vpnPort(), c["username"], c["password"]),
		"/radius remove [find comment=\"Stream-Radius\"]",
		fmt.Sprintf("/radius add address=%s secret=%s service=hotspot,login timeout=3s src-address=%s comment=\"Stream-Radius\"", gw, c["nas_secret"], c["ip"]),
		"/radius incoming set accept=yes port=3799",
		"/ip hotspot profile set [find] use-radius=yes radius-interim-update=1m",
	}, "\n")
}

func vpnAPI(w http.ResponseWriter, r *http.Request, a *Admin) {
	if r.Method == http.MethodGet {
		if id, _ := strconv.Atoi(r.URL.Query().Get("script")); id > 0 {
			c, _ := queryRows("SELECT name, username, password, ip, nas_secret FROM rm_vpn_clients WHERE id=?", id)
			if len(c) == 0 {
				fail(w, 404, "مش موجود")
				return
			}
			audit(a, r, "vpn_script", fmt.Sprint(c[0]["name"]), nil)
			writeJSON(w, 200, map[string]any{"script": vpnScript(c[0])})
			return
		}
		list, _ := queryRows(`SELECT v.id, v.name, v.username, v.password, v.ip, v.phone, v.notes, v.enabled, v.created, v.manager_id, m.username AS manager,
			(SELECT COUNT(*) FROM radacct a WHERE a.nasipaddress=v.ip AND a.acctstoptime IS NULL) AS online_cards
			FROM rm_vpn_clients v LEFT JOIN rm_managers m ON m.id=v.manager_id ORDER BY v.id`)
		on := vpnSessions()
		for _, c := range list {
			if s, ok := on[fmt.Sprint(c["username"])]; ok {
				c["connected"], c["uptime"] = true, s[1]
			} else {
				c["connected"] = false
			}
		}
		_, err := os.Stat("/usr/local/sbin/accel-pppd")
		nextIP, _ := nextVPNIP()
		writeJSON(w, 200, map[string]any{
			"clients":   list,
			"host":      setting("vpn_host"),
			"port":      vpnPort(),
			"gateway":   vpnGateway(),
			"net":       vpnNetPrefix() + ".0/24",
			"next_ip":   nextIP,
			"installed": err == nil,
			"running":   exec.Command("systemctl", "is-active", "--quiet", "accel-ppp").Run() == nil,
		})
		return
	}
	var in struct {
		Action, Name, Username, Password, IP, Phone, Notes, Host, Port, Gateway string
		ID, ManagerID                                                          int
	}
	if readJSON(r, &in) != nil {
		fail(w, 400, "bad request")
		return
	}
	switch in.Action {
	case "settings":
		h := strings.TrimSpace(in.Host)
		if h != "" && net.ParseIP(h) == nil && !validHostname(h) {
			fail(w, 400, "اكتب دومين أو IP صحيح")
			return
		}
		if p, err := strconv.Atoi(in.Port); in.Port != "" && (err != nil || p < 1 || p > 65535) {
			fail(w, 400, "البورت غلط")
			return
		}
		gw := strings.TrimSpace(in.Gateway)
		if gw != "" {
			ip := net.ParseIP(gw)
			if ip == nil || ip.To4() == nil {
				fail(w, 400, "أدخل IP جيتواي صحيح (IPv4)")
				return
			}
			setSetting("vpn_gateway", gw)
		}
		setSetting("vpn_host", h)
		if in.Port != "" {
			setSetting("vpn_port", in.Port)
		}
	case "add":
		name := strings.TrimSpace(in.Name)
		if name == "" || len([]rune(name)) > 60 {
			fail(w, 400, "اكتب اسم المكان أو الكافيه")
			return
		}
		ip := strings.TrimSpace(in.IP)
		if ip != "" {
			parsedIP := net.ParseIP(ip)
			if parsedIP == nil || parsedIP.To4() == nil {
				fail(w, 400, "عنوان الـ IP غير صحيح")
				return
			}
			if ip == vpnGateway() {
				fail(w, 400, "لا يمكن استخدام آي بي الجيتواي نفسه")
				return
			}
			var exists int
			db.QueryRow("SELECT COUNT(*) FROM rm_vpn_clients WHERE ip=?", ip).Scan(&exists)
			if exists > 0 {
				fail(w, 400, "عنوان الـ IP محجوز بالفعل لمكان آخر")
				return
			}
		} else {
			var err error
			ip, err = nextVPNIP()
			if err != nil {
				fail(w, 400, err.Error())
				return
			}
		}

		user := strings.TrimSpace(in.Username)
		if user != "" {
			if len(user) < 2 || len(user) > 32 {
				fail(w, 400, "اسم المستخدم يجب أن يكون بين 2 و 32 حرف")
				return
			}
			var exists int
			db.QueryRow("SELECT COUNT(*) FROM rm_vpn_clients WHERE username=?", user).Scan(&exists)
			if exists > 0 {
				fail(w, 400, "اسم المستخدم محجوز بالفعل")
				return
			}
		} else {
			user = "cafe" + strconv.Itoa(ipLast(ip))
		}

		pass := strings.TrimSpace(in.Password)
		if pass == "" {
			pass = randToken(20)
		}
		secret := randToken(24)

		if _, err := db.Exec("INSERT INTO rm_vpn_clients(name,username,password,ip,nas_secret,phone,manager_id,notes) VALUES(?,?,?,?,?,?,?,?)",
			name, user, pass, ip, secret, strings.TrimSpace(in.Phone), nullInt(in.ManagerID), in.Notes); err != nil {
			fail(w, 400, err.Error())
			return
		}
		db.Exec("DELETE FROM nas WHERE nasname=?", ip)
		db.Exec("INSERT INTO nas(nasname,shortname,type,secret,description) VALUES(?,?,'mikrotik',?,?)", ip, cut("cafe-"+name, 32), secret, "مكان عبر VPN: "+name)
		restartRadius()
	case "edit":
		if in.ID <= 0 {
			fail(w, 400, "معرف غير صحيح")
			return
		}
		name := strings.TrimSpace(in.Name)
		if name == "" || len([]rune(name)) > 60 {
			fail(w, 400, "اكتب اسم المكان أو الكافيه")
			return
		}
		var oldIP, oldUser string
		err := db.QueryRow("SELECT ip, username FROM rm_vpn_clients WHERE id=?", in.ID).Scan(&oldIP, &oldUser)
		if err != nil {
			fail(w, 404, "المكان غير موجود")
			return
		}

		newIP := strings.TrimSpace(in.IP)
		if newIP == "" {
			newIP = oldIP
		} else if newIP != oldIP {
			parsed := net.ParseIP(newIP)
			if parsed == nil || parsed.To4() == nil {
				fail(w, 400, "عنوان الـ IP داخل التانل غير صحيح")
				return
			}
			if newIP == vpnGateway() {
				fail(w, 400, "لا يمكن استخدام آي بي الجيتواي نفسه")
				return
			}
			var exists int
			db.QueryRow("SELECT COUNT(*) FROM rm_vpn_clients WHERE ip=? AND id!=?", newIP, in.ID).Scan(&exists)
			if exists > 0 {
				fail(w, 400, "عنوان الـ IP محجوز لمكان آخر")
				return
			}
		}

		newUser := strings.TrimSpace(in.Username)
		if newUser == "" {
			newUser = oldUser
		} else if newUser != oldUser {
			if len(newUser) < 2 || len(newUser) > 32 {
				fail(w, 400, "اسم المستخدم يجب أن يكون بين 2 و 32 حرف")
				return
			}
			var exists int
			db.QueryRow("SELECT COUNT(*) FROM rm_vpn_clients WHERE username=? AND id!=?", newUser, in.ID).Scan(&exists)
			if exists > 0 {
				fail(w, 400, "اسم المستخدم محجوز لمكان آخر")
				return
			}
		}

		if in.Password != "" {
			db.Exec("UPDATE rm_vpn_clients SET password=? WHERE id=?", strings.TrimSpace(in.Password), in.ID)
		}

		db.Exec("UPDATE rm_vpn_clients SET name=?, username=?, ip=?, phone=?, manager_id=?, notes=? WHERE id=?",
			name, newUser, newIP, strings.TrimSpace(in.Phone), nullInt(in.ManagerID), in.Notes, in.ID)

		if newIP != oldIP {
			var secret string
			db.QueryRow("SELECT nas_secret FROM rm_vpn_clients WHERE id=?", in.ID).Scan(&secret)
			db.Exec("DELETE FROM nas WHERE nasname=?", oldIP)
			db.Exec("DELETE FROM nas WHERE nasname=?", newIP)
			db.Exec("INSERT INTO nas(nasname,shortname,type,secret,description) VALUES(?,?,'mikrotik',?,?)",
				newIP, cut("cafe-"+name, 32), secret, "مكان عبر VPN: "+name)
			restartRadius()
		} else {
			db.Exec("UPDATE nas SET shortname=?, description=? WHERE nasname=?",
				cut("cafe-"+name, 32), "مكان عبر VPN: "+name, newIP)
		}
	case "toggle":
		db.Exec("UPDATE rm_vpn_clients SET enabled=1-enabled WHERE id=?", in.ID)
	case "new_password":
		db.Exec("UPDATE rm_vpn_clients SET password=? WHERE id=?", randToken(20), in.ID)
	case "delete":
		var ip string
		db.QueryRow("SELECT ip FROM rm_vpn_clients WHERE id=?", in.ID).Scan(&ip)
		db.Exec("DELETE FROM rm_vpn_clients WHERE id=?", in.ID)
		if ip != "" {
			db.Exec("DELETE FROM nas WHERE nasname=?", ip)
			restartRadius()
		}
	default:
		fail(w, 400, "عملية مش معروفة")
		return
	}
	audit(a, r, "vpn_"+in.Action, in.Name, map[string]any{"id": in.ID, "phone": in.Phone, "host": in.Host, "port": in.Port, "ip": in.IP, "gateway": in.Gateway})
	if err := writeVPN(); err != nil {
		writeJSON(w, 200, map[string]any{"ok": true, "warning": err.Error()})
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func ipLast(ip string) int {
	n, _ := strconv.Atoi(ip[strings.LastIndex(ip, ".")+1:])
	return n
}

func validHostname(h string) bool {
	if len(h) > 253 || !strings.Contains(h, ".") {
		return false
	}
	for _, p := range strings.Split(h, ".") {
		if p == "" || len(p) > 63 {
			return false
		}
		for _, c := range p {
			if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-') {
				return false
			}
		}
	}
	return true
}

// clientRanges: every IPv4 address except the tunnel subnet, as 24 CIDR blocks
func clientRanges() string {
	base := net.ParseIP(vpnNetPrefix() + ".0").To4()
	if base == nil {
		return "0.0.0.0/0"
	}
	v := uint32(base[0])<<24 | uint32(base[1])<<16 | uint32(base[2])<<8 | uint32(base[3])
	var out []string
	for i := 1; i <= 24; i++ {
		flip := v ^ (1 << (32 - i))
		mask := ^uint32(0) << (32 - i)
		p := flip & mask
		out = append(out, fmt.Sprintf("%d.%d.%d.%d/%d", p>>24, p>>16&255, p>>8&255, p&255, i))
	}
	return strings.Join(out, "\n")
}
