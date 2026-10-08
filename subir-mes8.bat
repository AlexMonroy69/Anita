@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === Subiendo "mes 8" al repositorio ===
echo.
git add index.html JS/index.js CSS/index.css IMG/web
git commit -m "mes 8"
echo.
git push
echo.
if %errorlevel%==0 (echo === LISTO: subido correctamente ===) else (echo === ERROR al subir - revisa el mensaje de arriba ===)
echo.
git log -1 --oneline
echo.
pause
(goto) 2>nul & del "%~f0"
