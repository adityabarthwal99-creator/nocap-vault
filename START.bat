@echo off
title NOCAP ASSET VAULT
if not exist node_modules npm install
start http://localhost:3000
node server.js
pause
