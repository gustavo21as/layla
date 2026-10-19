import os
import sys
import time
import subprocess
import threading
from server import run_server, PORT

def start_server_thread():
    t = threading.Thread(target=run_server, daemon=True)
    t.start()

def launch_app_window():
    url = f"http://127.0.0.1:{PORT}"
    
    # Common paths for Edge and Chrome on Windows
    edge_paths = [
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe")
    ]
    
    chrome_paths = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe")
    ]

    browser_bin = None
    for p in edge_paths + chrome_paths:
        if os.path.exists(p):
            browser_bin = p
            break

    if browser_bin:
        # Launch as standalone app window without browser tabs or address bar
        cmd = [browser_bin, f"--app={url}", "--window-size=1280,840"]
        subprocess.Popen(cmd)
    else:
        # Fallback to default browser
        import webbrowser
        webbrowser.open(url)

if __name__ == "__main__":
    start_server_thread()
    time.sleep(1.2)
    launch_app_window()
    print("Aplicacion Layla AI iniciada. Presione Ctrl+C para finalizar el servidor.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nCerrando Layla AI.")
