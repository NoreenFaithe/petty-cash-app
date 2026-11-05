@echo off
title PettyCash Pro - Reimbursement Hub
color 0b

echo ===================================================================
echo     PettyCash Pro - Reimbursement & Expense Monitoring Hub
echo ===================================================================
echo.
echo Starting local application server...
echo.

:: Launch the default web browser to the local server URL
start http://localhost:8080

:: Run the lightweight PowerShell TCP server
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause
