#!/bin/bash
set -e

# Insert default profile if not exists
mariadb -u radius -pradpass radius << 'EOF'
INSERT IGNORE INTO rm_profiles (id, name, price, down_speed, up_speed, rate_limit, days, quota_mb, pool)
VALUES (1, 'Super FTTH 50M', 250.00, '50M', '10M', '10M/50M', 30, 150000, 'default-pool');

INSERT IGNORE INTO rm_profiles (id, name, price, down_speed, up_speed, rate_limit, days, quota_mb, pool)
VALUES (2, 'Basic DSL 15M', 140.00, '15M', '3M', '3M/15M', 30, 10000, 'default-pool');

-- Clean old test subscribers if any
DELETE FROM rm_subscribers WHERE username IN ('ahmed_ftth', 'mahmoud_dsl', 'khalid_quota', 'tamer_mac', 'salma_disabled');
DELETE FROM radacct WHERE username IN ('ahmed_ftth', 'mahmoud_dsl', 'khalid_quota', 'tamer_mac', 'salma_disabled');
DELETE FROM radpostauth WHERE username IN ('ahmed_ftth', 'mahmoud_dsl', 'khalid_quota', 'tamer_mac', 'salma_disabled');
DELETE FROM radcheck WHERE username IN ('ahmed_ftth', 'mahmoud_dsl', 'khalid_quota', 'tamer_mac', 'salma_disabled');
DELETE FROM radreply WHERE username IN ('ahmed_ftth', 'mahmoud_dsl', 'khalid_quota', 'tamer_mac', 'salma_disabled');

-- 1. Active & Online Subscriber
INSERT INTO rm_subscribers (username, firstname, lastname, mobile, address, notes, profile_id, manager_id, expiration, quota_mb, used_mb, money, mac, framed_ip, simul, enabled, online, source, created, updated)
VALUES ('ahmed_ftth', 'أحمد', 'عبدالله', '01012345678', 'القاهرة - التجمع الخامس', 'خط فايبر منزلي', 1, 1, DATE_ADD(NOW(), INTERVAL 25 DAY), 150000, 32450, 50.00, '00:1A:2B:3C:4D:5E', '192.0.2.50', 1, 1, 1, 'local', NOW(), NOW());

INSERT INTO radcheck (username, attribute, op, value) VALUES ('ahmed_ftth', 'Cleartext-Password', ':=', 'TestP@ss1');
INSERT INTO radreply (username, attribute, op, value) VALUES ('ahmed_ftth', 'Framed-IP-Address', ':=', '192.0.2.50');

INSERT INTO radacct (acctsessionid, acctuniqueid, username, nasipaddress, nasportid, acctstarttime, acctsessiontime, acctinputoctets, acctoutputoctets, calledstationid, callingstationid, framedipaddress, acctterminatecause)
VALUES ('sess-1001', 'uniq-1001', 'ahmed_ftth', '198.51.100.1', 'ether1', DATE_SUB(NOW(), INTERVAL 4 HOUR), 14400, 429496729, 3221225472, 'server-hotspot', '00:1A:2B:3C:4D:5E', '192.0.2.50', '');

INSERT INTO radpostauth (username, pass, reply, authdate, class)
VALUES ('ahmed_ftth', '••••••••', 'Access-Accept', DATE_SUB(NOW(), INTERVAL 4 HOUR), 'PPPoE-Session-OK');

-- 2. Expired Subscriber
INSERT INTO rm_subscribers (username, firstname, lastname, mobile, address, notes, profile_id, manager_id, expiration, quota_mb, used_mb, money, mac, framed_ip, simul, enabled, online, source, created, updated)
VALUES ('mahmoud_dsl', 'محمود', 'إبراهيم', '01123456789', 'الجيزة - الدقي', 'اشتراك VDSL', 2, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 10000, 9500, 0.00, '00:11:22:AA:BB:CC', '', 1, 1, 0, 'local', DATE_SUB(NOW(), INTERVAL 33 DAY), NOW());

INSERT INTO radpostauth (username, pass, reply, authdate, class)
VALUES ('mahmoud_dsl', '••••••••', 'Access-Reject', DATE_SUB(NOW(), INTERVAL 20 MINUTE), 'Account-Expired');

-- 3. Quota Depleted Subscriber
INSERT INTO rm_subscribers (username, firstname, lastname, mobile, address, notes, profile_id, manager_id, expiration, quota_mb, used_mb, money, mac, framed_ip, simul, enabled, online, source, created, updated)
VALUES ('khalid_quota', 'خالد', 'منصور', '01234567890', 'الإسكندرية - سموحة', 'باقة منتهية الكوتة', 2, 1, DATE_ADD(NOW(), INTERVAL 10 DAY), 10000, 10000, 15.00, '', '', 1, 1, 0, 'local', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW());

INSERT INTO radpostauth (username, pass, reply, authdate, class)
VALUES ('khalid_quota', '••••••••', 'Access-Reject', DATE_SUB(NOW(), INTERVAL 1 HOUR), 'Total-Octets-Exceeded');

-- 4. MAC Mismatch Subscriber
INSERT INTO rm_subscribers (username, firstname, lastname, mobile, address, notes, profile_id, manager_id, expiration, quota_mb, used_mb, money, mac, framed_ip, simul, enabled, online, source, created, updated)
VALUES ('tamer_mac', 'تامر', 'سعيد', '01512345678', 'المنصورة - حي الجامعة', 'مقفل على ماك الراوتر القديم', 1, 1, DATE_ADD(NOW(), INTERVAL 15 DAY), 150000, 12000, 0.00, 'AA:BB:CC:DD:EE:FF', '', 1, 1, 0, 'local', DATE_SUB(NOW(), INTERVAL 15 DAY), NOW());

INSERT INTO radacct (acctsessionid, acctuniqueid, username, nasipaddress, nasportid, acctstarttime, acctstoptime, acctsessiontime, acctinputoctets, acctoutputoctets, calledstationid, callingstationid, framedipaddress, acctterminatecause)
VALUES ('sess-1002', 'uniq-1002', 'tamer_mac', '198.51.100.1', 'ether2', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), 600, 1048576, 5242880, 'server-hotspot', '11:22:33:44:55:66', '192.0.2.88', 'User-Request');

INSERT INTO radpostauth (username, pass, reply, authdate, class)
VALUES ('tamer_mac', '••••••••', 'Access-Reject', DATE_SUB(NOW(), INTERVAL 15 MINUTE), 'Calling-Station-Id-Mismatch');

-- 5. Disabled Subscriber
INSERT INTO rm_subscribers (username, firstname, lastname, mobile, address, notes, profile_id, manager_id, expiration, quota_mb, used_mb, money, mac, framed_ip, simul, enabled, online, source, created, updated)
VALUES ('salma_disabled', 'سلمى', 'فاروق', '01099887766', 'مدينة نصر - المنطقة الأولى', 'موقوف إدارياً بطلب العميل', 1, 1, DATE_ADD(NOW(), INTERVAL 18 DAY), 150000, 5000, -30.00, '', '', 1, 0, 0, 'local', DATE_SUB(NOW(), INTERVAL 12 DAY), NOW());

INSERT INTO radpostauth (username, pass, reply, authdate, class)
VALUES ('salma_disabled', '••••••••', 'Access-Reject', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'User-Disabled');
EOF

echo "Operational test subscribers seeded successfully!"
