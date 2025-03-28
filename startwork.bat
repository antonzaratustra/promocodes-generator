@echo off
echo Начинаем синхронизацию с GitHub...

git fetch origin
git pull origin main

echo Синхронизация завершена!
echo Проект готов к работе.
pause