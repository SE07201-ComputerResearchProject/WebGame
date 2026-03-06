# Helper to run frontend and backend dev servers in separate terminals (Windows PowerShell)
# Usage: .\run-dev.ps1

Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd `"$PSScriptRoot\server`"; npm run dev"
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "-NoExit","-Command","cd `"$PSScriptRoot`"; npm run dev"
