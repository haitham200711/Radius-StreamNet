#!/bin/bash
mariadb -u radius -pradpass radius << 'EOF'
INSERT IGNORE INTO nas (nasname, shortname, type, secret, description)
VALUES ('198.51.100.1', 'MikroTik-CCR2004', 'mikrotik', 'TestingSecret', 'Core Gateway Center 1');
EOF
echo "NAS added successfully!"
