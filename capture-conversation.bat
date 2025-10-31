@echo off
REM Script Batch pour capturer les conversations Claude Code
REM Usage: capture-conversation.bat

setlocal enabledelayedexpansion

REM Créer le dossier conversations s'il n'existe pas
if not exist ".claude\conversations" (
    mkdir ".claude\conversations"
    echo Dossier cree: .claude\conversations
)

REM Générer le nom de fichier pour aujourd'hui
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set dateStr=!datetime:~0,4!-!datetime:~4,2!-!datetime:~6,2!
set timeStr=!datetime:~8,2!-!datetime:~10,2!-!datetime:~12,2!
set logFile=.claude\conversations\conversation_!dateStr!.log

echo.
echo ========================================
echo CAPTURE DE CONVERSATION CLAUDE CODE
echo ========================================
echo.
echo Fichier de log: !logFile!
echo Date: !dateStr! !timeStr!
echo.

REM Ajouter l'en-tête de session
echo. >> "!logFile!"
echo ================================================================================ >> "!logFile!"
echo NOUVELLE SESSION - !dateStr! !timeStr! >> "!logFile!"
echo ================================================================================ >> "!logFile!"
echo. >> "!logFile!"

echo Session enregistree dans: !logFile!
echo.
echo IMPORTANT:
echo - Pour capturer automatiquement, utilisez: claude ^| tee -a "!logFile!"
echo - Ou copiez manuellement les conversations importantes
echo - Un nouveau fichier est cree chaque jour
echo.

pause
