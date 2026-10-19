@echo off
title J.A.R.V.I.S. - PROTOCOLO JEFE GERARDO
color 0B
echo =========================================================
echo    INICIANDO PROTOCOLO J.A.R.V.I.S. MARK VII
echo    COMANDANTE SUPREMO: JEFE GERARDO
echo =========================================================
cd /d "C:\Users\leonel\.gemini\antigravity\scratch\jarvis_app"
py run_jarvis.py
if %ERRORLEVEL% NEQ 0 (
    python run_jarvis.py
)
pause
