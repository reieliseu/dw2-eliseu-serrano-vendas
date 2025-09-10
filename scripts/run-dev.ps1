<#
PowerShell helper to setup and run the project (backend + frontend).
Usage (PowerShell):
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
  .\scripts\run-dev.ps1

This script will:
- Check for Python and Node/npm
- Create and activate a virtualenv in backend, install requirements
- Start the backend (uvicorn) in a new PowerShell window
- Start the frontend (npm run dev) in a new PowerShell window
#>

function Write-Info($m){ Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-Warn($m){ Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Err($m){ Write-Host "[ERROR] $m" -ForegroundColor Red }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'

Write-Info "Projeto root: $root"

# Check Python
$python = Get-Command python -ErrorAction SilentlyContinue
if(-not $python){
  Write-Err "Python não encontrado no PATH. Instale Python 3.9+ e marque 'Add to PATH'."; exit 1
}
Write-Info "Python encontrado: $($python.Path)"

# Create venv and install deps
Push-Location $backend
if(-not (Test-Path '.venv')){
  Write-Info "Criando virtualenv em $backend\.venv"
  python -m venv .venv
} else { Write-Info "Virtualenv já existe" }

# Activate and install
$activate = Join-Path $backend '.venv\Scripts\Activate.ps1'
if(-not (Test-Path $activate)){
  Write-Warn "Arquivo de ativação não encontrado: $activate"; Pop-Location; exit 1
}

Write-Info "Instalando dependências do backend"
# Use python -m pip to be seguro
& python -m pip install --upgrade pip
& python -m pip install -r requirements.txt

Pop-Location

# Check npm
$node = Get-Command npm -ErrorAction SilentlyContinue
if(-not $node){ Write-Warn "npm não encontrado. Se quiser servir frontend, instale Node.js." }
else { Write-Info "npm encontrado: $($node.Path)" }

# If npm present, install frontend deps to ensure `npm run dev` works
if($node){
  Push-Location $frontend
  try{
    Write-Info "Instalando dependências do frontend (npm install)"
    & npm install
  } catch {
    Write-Warn "Falha ao instalar dependências do frontend: $($_.Exception.Message)"
  } finally {
    Pop-Location
  }
}

# Start backend in a new window
$backendCmd = "& { cd `"$backend`"; Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force; . `"$backend\\.venv\\Scripts\\Activate.ps1`"; python -m uvicorn app.main:app --reload --port 8000 }"
Write-Info "Iniciando backend em nova janela PowerShell..."
Start-Process powershell -ArgumentList '-NoExit','-Command',$backendCmd

# Start frontend if npm available
if($node){
  $frontendCmd = "& { cd `"$frontend`"; npm run dev }"
  Write-Info "Iniciando frontend em nova janela PowerShell..."
  Start-Process powershell -ArgumentList '-NoExit','-Command',$frontendCmd
} else {
  Write-Warn "npm ausente — para servir frontend localmente, rode: python -m http.server 3000 na pasta frontend/public"
}

Write-Info "Script iniciado. Verifique as janelas do PowerShell abertas para logs do backend/frontend."
