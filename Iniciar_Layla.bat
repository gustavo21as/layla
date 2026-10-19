@echo off
title Layla AI
color 0A
echo =========================================================
echo    INICIANDO LAYLA AI - SISTEMA PROFESIONAL
echo =========================================================
cd /d "C:\Users\leonel\.gemini\antigravity\scratch\jarvis_app"
py run_jarvis.py
if %ERRORLEVEL% NEQ 0 (
    python run_jarvis.py
)
pause
