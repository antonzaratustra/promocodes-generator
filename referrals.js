document.addEventListener('DOMContentLoaded', function() {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('event');
    const year = urlParams.get('year');
    const promoCode = urlParams.get('promo');
    const isAdmin = urlParams.get('admin') === 'true';
    
    console.log('Admin mode:', isAdmin);
    
    if (!eventCode || !year || !promoCode) {
        showError('Отсутствуют необходимые параметры в URL');
        return;
    }
    
    // Заполняем информацию
    document.getElementById('eventTitle').textContent = getEventNameByCode(eventCode);
    document.getElementById('yearInfo').textContent = year;
    document.getElementById('promoInfo').textContent = promoCode;
    
    // Получаем данные
    fetchReferralData(eventCode, year, promoCode, isAdmin);
    
    // Функция для преобразования кода мероприятия в читаемое название
    function getEventNameByCode(code) {
        const eventNames = {
            'MRWRU': 'RestaurantWeek Moscow',
            'DRWRU': 'RestaurantWeek Dubai',
            'DRWEN': 'RestaurantWeek Dubai',
            'MSWRU': 'SalonWeek Moscow',
            'DSWRU': 'SalonWeek Dubai',
            'DSWEN': 'SalonWeek Dubai'
        };
        
        return eventNames[code] || 'Неизвестное мероприятие';
    }
    
    // Функция для получения данных рефералов
    async function fetchReferralData(eventCode, year, promoCode, isAdmin) {
        try {
            const dataUrl = getDataUrl(eventCode);
            const tableBody = document.getElementById('referralsTableBody');
            tableBody.innerHTML = `<tr><td colspan="9" class="loading-cell">Загрузка данных...</td></tr>`;
            
            const response = await fetch(`${dataUrl}?eventCode=${eventCode}&year=${year}&promoCode=${promoCode}`, {
                method: 'GET',
                mode: 'no-cors'
            });
            
            let data;
            
            try {
                const jsonResponse = await response.json();
                console.log('Ответ от API:', jsonResponse);
                
                if (jsonResponse.error) {
                    throw new Error(jsonResponse.error);
                }
                
                if (jsonResponse.success && jsonResponse.data) {
                    data = jsonResponse.data;
                } else {
                    console.warn('Данные не получены, используем тестовые данные');
                    data = getMockData(eventCode);
                }
            } catch (parseError) {
                console.error('Ошибка парсинга ответа:', parseError);
                data = getMockData(eventCode);
            }
            
            if (validateData(data)) {
                renderReferralsTable(data, eventCode, isAdmin);
                updateStats(data, eventCode);
            } else {
                console.warn('Некоторые данные не прошли валидацию');
            }
            
        } catch (error) {
            console.error('Ошибка запроса:', error);
            showError('Ошибка загрузки данных: ' + error.message);
        }
    }
    
    // Функция для определения URL получения данных
    function getDataUrl(eventCode) {
        switch(eventCode) {
            case 'MRWRU':
            case 'DRWRU':
                return 'https://script.google.com/macros/s/AKfycbw1OX4UDGmlZzmE1TMj0ZY5-H1zHdoMzmUv7zUryczOGyhMONBzoCbhnNESaHjRBAY89A/exec';
            case 'DRWEN':
                return 'https://script.google.com/macros/s/AKfycbw1OX4UDGmlZzmE1TMj0ZY5-H1zHdoMzmUv7zUryczOGyhMONBzoCbhnNESaHjRBAY89A/exec';
            case 'MSWRU':
            case 'DSWRU':
                return 'https://script.google.com/macros/s/AKfycbwe5iDg_rmBd7thFQyt49QY-pTOQ4w7HSHz1eJWHKcuAERBC3j_u8lY8QSpKJUo0K45Sw/exec';
            case 'DSWEN':
                return 'https://script.google.com/macros/s/AKfycbyPiPe_a0iQdPYKeEFsBAMfGKbMqxRqJgOnevV8KL0pFBWlWLrTnbRG_VQ50t42DXNV/exec';
            default:
                throw new Error('Неизвестный тип мероприятия');
        }
    }
    
    // Функция для отображения таблицы рефералов
    function renderReferralsTable(data, eventCode, isAdmin) {
        const tableBody = document.getElementById('referralsTableBody');
        tableBody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9">Данные не найдены</td></tr>`;
            return;
        }
        
        // Определяем валюту в зависимости от кода мероприятия
        const currency = eventCode.endsWith('EN') ? '$' : '₽';
        
        data.forEach(item => {
            const row = document.createElement('tr');
            
            // Определяем, какой контент отображать в столбце "Оплачено"
            const paidContent = isAdmin
                ? `<input type="checkbox" class="paid-checkbox" data-orderid="${item.orderid}" ${item.isPaid ? 'checked' : ''}>`
                : (item.isPaid ? '✅' : '⏳');
            
            // Рассчитываем выплату как 5% от цены
            const commission = parseFloat(item.price) * 0.05;
            
            // Обработка orderid
            const orderId = item.orderid ? String(item.orderid).toUpperCase() : '-';
            
            row.innerHTML = `
                <td>${formatDate(item.sent)}</td>
                <td>${orderId}</td>
                <td>${item.products || '-'}</td>
                <td>${item.name || '-'}</td>
                <td>${item.price} ${currency}</td>
                <td>${formatReferer(item.referer)}</td>
                <td>${item.email || '-'}</td>
                <td>${commission.toFixed(2)} ${currency}</td>
                <td>${paidContent}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Добавляем обработчик для чекбоксов, если это админ
        if (isAdmin) {
            console.log('Adding checkbox handlers');
            document.querySelectorAll('.paid-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const orderId = this.dataset.orderid;
                    const isChecked = this.checked;
                    console.log('Updating payment status for orderId:', orderId, 'to', isChecked);
                    updatePaymentStatus(orderId, isChecked);
                });
            });
        }
    }
    
    // Функция для обновления статистики
    function updateStats(data, eventCode) {
        if (!data || data.length === 0) {
            document.getElementById('totalPaid').textContent = '0';
            document.getElementById('totalPending').textContent = '0';
            document.getElementById('totalCommission').textContent = '0 человек';
            return;
        }
        
        // Определяем валюту
        const currency = eventCode.endsWith('EN') ? '$' : '₽';
        
        // Рассчитываем статистику
        const totalPaid = data.reduce((sum, item) => sum + (item.isPaid ? parseFloat(item.price) : 0), 0);
        const totalPending = data.reduce((sum, item) => sum + (!item.isPaid ? parseFloat(item.price) : 0), 0);
        const totalPeople = data.length;

        // Форматируем вывод
        document.getElementById('totalPaid').textContent = `${totalPaid.toFixed(2)} ${currency}`;
        document.getElementById('totalPending').textContent = `${totalPending.toFixed(2)} ${currency}`;
        document.getElementById('totalCommission').textContent = `${totalPeople} человек`;
    }
    
    // Вспомогательные функции
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    }
    
    function formatReferer(url) {
        if (!url) return '-';
        
        // Сокращаем URL для более компактного отображения
        return url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    }
    
    function showError(message) {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="error-container">
                <h2>Ошибка</h2>
                <p>${message}</p>
                <a href="/" class="button">Вернуться на главную</a>
            </div>
        `;
    }
    
    // Функция для получения тестовых данных (только для демонстрации)
    function getMockData(eventCode) {
        const isEnglish = eventCode.endsWith('EN');
        
        return [
            {
                sent: '2024-11-06 15:32:37',
                orderid: '6410618:1336588072',
                products: 'Ticket Test - 1x0 = 0',
                name: 'Test promocode',
                price: isEnglish ? '100' : '5000',
                referer: isEnglish ? 'https://dubaisalonweek.com/' : 'https://salonweek.ru/moscow',
                email: 'testsspromocode@gmail.com',
                isPaid: true
            },
            {
                sent: '2024-11-11 11:59:45',
                orderid: '6410618:6827327921',
                products: 'Premium Ticket - 1x200 = 200',
                name: 'Shahinaz',
                price: isEnglish ? '200' : '10000',
                referer: isEnglish ? 'https://dubaisalonweek.com/#price' : 'https://restaurantweek.ru/dubai',
                email: 'shahinaz@example.com',
                isPaid: false
            }
        ];
    }

    function validateData(data) {
        if (!Array.isArray(data)) {
            console.error('Данные должны быть массивом');
            return false;
        }

        for (const item of data) {
            if (typeof item.orderid !== 'string') {
                console.error('orderid должен быть строкой:', item.orderid);
                return false;
            }
            if (isNaN(parseFloat(item.price))) {
                console.error('price должен быть числом:', item.price);
                return false;
            }
            if (typeof item.products !== 'string') {
                console.error('products должен быть строкой:', item.products);
                return false;
            }
            if (typeof item.name !== 'string') {
                console.error('name должен быть строкой:', item.name);
                return false;
            }
            if (typeof item.referer !== 'string') {
                console.error('referer должен быть строкой:', item.referer);
                return false;
            }
            if (typeof item.email !== 'string') {
                console.error('email должен быть строкой:', item.email);
                return false;
            }
            if (typeof item.isPaid !== 'boolean') {
                console.error('isPaid должен быть булевым значением:', item.isPaid);
                return false;
            }
        }

        return true;
    }

    async function updatePaymentStatus(orderId, isPaid) {
        try {
            const dataUrl = getDataUrl(eventCode);
            const response = await fetch(dataUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'updatePayment',
                    orderId: orderId,
                    isPaid: isPaid
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('Статус оплаты обновлен:', result);
                // Перезагружаем данные после успешного обновления
                fetchReferralData(eventCode, year, promoCode, isAdmin);
            } else {
                console.error('Ошибка обновления статуса:', result.error);
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса:', error);
            showError('Ошибка при обновлении статуса оплаты');
        }
    }
}); 