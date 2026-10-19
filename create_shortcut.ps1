$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Layla AI.lnk")
$Shortcut.TargetPath = "C:\Users\leonel\.gemini\antigravity\scratch\jarvis_app\Iniciar_Layla.bat"
$Shortcut.WorkingDirectory = "C:\Users\leonel\.gemini\antigravity\scratch\jarvis_app"
$Shortcut.WindowStyle = 1
$Shortcut.IconLocation = "shell32.dll,14"
$Shortcut.Description = "Layla AI - Asistente Inteligente"
$Shortcut.Save()
Write-Host "Acceso directo de Layla AI creado en el Escritorio."
