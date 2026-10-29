#!/bin/bash
curl -s -c /tmp/c.txt -X POST http://127.0.0.1/api/login -H "Content-Type: application/json" -d '{"Username":"admin","Password":"d023937e216a"}'
echo ""
curl -s -b /tmp/c.txt http://127.0.0.1/api/subscribers
echo ""
