@echo off
echo ===== Обновление кода AppScript =====
call npm run push

echo ===== Создание новых развертываний =====
call npm run deploy

echo ===== Тестирование URL =====
call npm run test

echo ===== Готово! =====
pause