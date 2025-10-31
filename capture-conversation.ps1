# Script PowerShell pour capturer automatiquement les conversations Claude Code
# Usage: .\capture-conversation.ps1

param(
    [string]$ConversationsDir = ".\.claude\conversations",
    [int]$SaveIntervalSeconds = 300  # Sauvegarde toutes les 5 minutes par défaut
)

# Créer le dossier s'il n'existe pas
if (-not (Test-Path $ConversationsDir)) {
    New-Item -ItemType Directory -Path $ConversationsDir -Force | Out-Null
    Write-Host "✅ Dossier créé: $ConversationsDir" -ForegroundColor Green
}

# Générer le nom de fichier pour aujourd'hui
$dateStr = Get-Date -Format "yyyy-MM-dd"
$logFile = Join-Path $ConversationsDir "conversation_$dateStr.log"

Write-Host "📝 Démarrage de la capture de conversation..." -ForegroundColor Cyan
Write-Host "📁 Fichier de log: $logFile" -ForegroundColor Cyan
Write-Host "⏱️  Intervalle de sauvegarde: $SaveIntervalSeconds secondes" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour arrêter la capture, appuyez sur Ctrl+C" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

# Fonction pour capturer la sortie
function Start-ConversationCapture {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    # En-tête de session
    $header = @"

================================================================================
NOUVELLE SESSION - $timestamp
================================================================================

"@

    Add-Content -Path $logFile -Value $header

    # Lancer Claude Code et capturer la sortie
    # Note: Adaptez cette commande selon votre configuration
    Write-Host "ℹ️  Ce script doit être lancé dans un terminal séparé AVANT de démarrer Claude Code" -ForegroundColor Yellow
    Write-Host "ℹ️  Ou utilisez le wrapper ci-dessous pour démarrer Claude Code avec capture" -ForegroundColor Yellow
}

# Fonction pour wrapper Claude Code
function Start-ClaudeWithCapture {
    param([string[]]$ClaudeArgs)

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $header = @"

================================================================================
SESSION DÉMARRÉE - $timestamp
================================================================================

"@
    Add-Content -Path $logFile -Value $header

    # Lancer Claude Code avec capture de la sortie
    # Remplacez 'claude' par la commande réelle pour lancer Claude Code
    $process = Start-Process -FilePath "claude" -ArgumentList $ClaudeArgs -NoNewWindow -PassThru -RedirectStandardOutput "temp_output.txt" -RedirectStandardError "temp_error.txt"

    # Surveiller et sauvegarder la sortie
    while (-not $process.HasExited) {
        if (Test-Path "temp_output.txt") {
            $output = Get-Content "temp_output.txt" -Raw
            if ($output) {
                Add-Content -Path $logFile -Value $output
                Clear-Content "temp_output.txt"
            }
        }

        if (Test-Path "temp_error.txt") {
            $errors = Get-Content "temp_error.txt" -Raw
            if ($errors) {
                Add-Content -Path $logFile -Value "[ERREUR] $errors"
                Clear-Content "temp_error.txt"
            }
        }

        Start-Sleep -Seconds 1
    }

    # Nettoyage
    Remove-Item -Path "temp_output.txt", "temp_error.txt" -ErrorAction SilentlyContinue
}

# Démarrer la capture
Start-ConversationCapture

Write-Host "✅ Système de capture initialisé!" -ForegroundColor Green
Write-Host ""
Write-Host "📌 INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "  1. Ce script a créé le fichier de log: $logFile" -ForegroundColor White
Write-Host "  2. Utilisez le script wrapper ci-dessous pour lancer Claude Code avec capture automatique" -ForegroundColor White
Write-Host "  3. Ou copiez/collez manuellement les conversations importantes dans ce fichier" -ForegroundColor White
