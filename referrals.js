document.addEventListener('DOMContentLoaded', function() {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventCode = urlParams.get('event');
    const year = urlParams.get('year');
    const promoCode = urlParams.get('promo');
    const isAdmin = urlParams.get('admin') === 'true';
    
    console.log('Event code:', eventCode);
    
    // Функция для определения языка интерфейса
    function getInterfaceLanguage(eventCode) {
        if (eventCode === 'DSWEN' || eventCode === 'DRWEN') return 'en';
        return 'ru';
    }

    // Функция для получения текстов интерфейса
    function getInterfaceTexts(lang) {
        return {
            'ru': {
                year: 'Год:',
                promo: 'Промокод:',
                totalPaid: 'Всего выплачено:',
                totalPending: 'Всего к выплате:',
                totalCommission: 'Всего привлечено:',
                tableHeaders: [
                    'Время оплаты',
                    'ID заказа',
                    'Продукты',
                    'Имя купившего',
                    'Цена',
                    'Email',
                    'Выплата',
                    'Оплачено'
                ]
            },
            'en': {
                year: 'Year:',
                promo: 'Promo code:',
                totalPaid: 'Total paid:',
                totalPending: 'Total pending:',
                totalCommission: 'Total referrals:',
                tableHeaders: [
                    'Payment time',
                    'Order ID',
                    'Products',
                    'Buyer name',
                    'Price',
                    'Email',
                    'Commission',
                    'Paid'
                ]
            }
        }[lang];
    }
    
    // Определяем язык интерфейса
    const interfaceLang = getInterfaceLanguage(eventCode);
    const texts = getInterfaceTexts(interfaceLang);
    
    console.log('Admin mode:', isAdmin);
    console.log('Interface language:', interfaceLang);
    
    if (!eventCode || !year || !promoCode) {
        showError('Отсутствуют необходимые параметры в URL');
        return;
    }
    
    // Заполняем информацию
    console.log('Setting event title...');
    const eventName = getEventNameByCode(eventCode);
    console.log('Event name:', eventName);
    document.getElementById('eventTitle').textContent = eventName;
    
    // Устанавливаем текст загрузки в таблице
    const loadingText = document.getElementById('loadingText');
    if (interfaceLang === 'en') {
        loadingText.textContent = 'Loading data...';
    } else {
        loadingText.textContent = 'Загрузка данных...';
    }
    
    document.getElementById('yearLabel').textContent = texts.year;
    document.getElementById('promoLabel').textContent = texts.promo;
    document.getElementById('yearInfo').textContent = year;
    document.getElementById('promoInfo').textContent = promoCode;
    
    // Обновляем заголовки таблицы
    const headers = document.querySelectorAll('#referralsTable thead th');
    headers.forEach((header, index) => {
        if (index < texts.tableHeaders.length) {
            header.textContent = texts.tableHeaders[index];
        }
    });
    
    // Обновляем заголовки статистики
    document.getElementById('totalPaidLabel').textContent = texts.totalPaid;
    document.getElementById('totalPendingLabel').textContent = texts.totalPending;
    document.getElementById('totalCommissionLabel').textContent = texts.totalCommission;
    
    // Обновляем текст кнопок
    const viewButtons = document.querySelectorAll('.action-button.view');
    const copyButtons = document.querySelectorAll('.action-button.copy');
    const deleteButtons = document.querySelectorAll('.action-button.delete');
    
    if (interfaceLang === 'en') {
        viewButtons.forEach(btn => btn.textContent = '👁️ View');
        copyButtons.forEach(btn => btn.textContent = '🔗 Copy link');
        deleteButtons.forEach(btn => btn.textContent = '🗑️ Delete');
    } else {
        viewButtons.forEach(btn => btn.textContent = '👁️ Просмотр');
        copyButtons.forEach(btn => btn.textContent = '🔗 Ссылка');
        deleteButtons.forEach(btn => btn.textContent = '🗑️ Удалить');
    }
    
    // Функция для преобразования кода мероприятия в читаемое название
    function getEventNameByCode(code) {
        const eventNames = {
            'MRWRU': 'RestaurantWeek Москва',
            'DRWRU': 'RestaurantWeek Дубай',
            'DRWEN': 'RestaurantWeek Dubai',
            'MSWRU': 'SalonWeek Москва',
            'DSWRU': 'SalonWeek Дубай',
            'DSWEN': 'SalonWeek Dubai'
        };
        
        return eventNames[code] || 'Неизвестное мероприятие';
    }
    
    // Функция для получения данных рефералов
    async function fetchReferralData(eventCode, year, promoCode, isAdmin) {
        try {
            const dataUrl = getDataUrl(eventCode);
            const tableBody = document.getElementById('referralsTableBody');
            
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
            
            // Формируем URL для просмотра
            const adminUrl = `index.html?event=${eventCode}&year=${year}&promo=${promoCode}&admin=true`;
            const viewUrl = `referrals.html?event=${eventCode}&year=${year}&promo=${promoCode}`;
            
            // Создаем кнопки действий
            const actions = `
                <div class="action-buttons">
                    <button onclick="window.location.href='${adminUrl}'" class="action-button view">👁️ View</button>
                    <button onclick="copyLink('${viewUrl}'); return false;" class="action-button copy">🔗 Copy link</button>
                    ${isAdmin ? `<button onclick="deleteReferral('${item.orderid}'); return false;" class="action-button delete">🗑️ Delete</button>` : ''}
                </div>
            `;
            
            row.innerHTML = `
                <td>${formatDate(item.sent)}</td>
                <td>${orderId}</td>
                <td>${item.products || '-'}</td>
                <td>${item.name || '-'}</td>
                <td>${parseFloat(item.price).toFixed(2)} ${currency}</td>
                <td>${item.email || '-'}</td>
                <td>${commission.toFixed(2)} ${currency}</td>
                <td>${paidContent}</td>
                <td>${actions}</td>
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
        // Определяем валюту
        const currency = eventCode.endsWith('EN') ? '$' : '₽';
        
        // Инициализируем значения по умолчанию
        let paidValue = '0';
        let pendingValue = '0';
        let peopleValue = '0';
        
        if (data && data.length > 0) {
            // Рассчитываем статистику
            const totalPaid = data.reduce((sum, item) => sum + (item.isPaid ? parseFloat(item.price) : 0), 0);
            const totalPending = data.reduce((sum, item) => sum + (!item.isPaid ? parseFloat(item.price) : 0), 0);
            const totalPeople = data.length;

            // Форматируем вывод
            paidValue = totalPaid > 0 ? `${totalPaid.toFixed(2)} ${currency}` : '0';
            pendingValue = totalPending > 0 ? `${totalPending.toFixed(2)} ${currency}` : '0';
            const peopleSuffix = interfaceLang === 'en' ? 'people' : 'человек';
            peopleValue = totalPeople > 0 ? `${totalPeople} ${peopleSuffix}` : '0';
        }

        // Обновляем DOM
        document.getElementById('totalPaid').textContent = paidValue;
        document.getElementById('totalPending').textContent = pendingValue;
        document.getElementById('totalCommission').textContent = peopleValue;
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
            const urlParams = new URLSearchParams(window.location.search);
            const eventCode = urlParams.get('event');
            const year = urlParams.get('year');
            const promoCode = urlParams.get('promo');

            const webhookUrl = getWebhookUrl(eventCode);
            const url = new URL(webhookUrl);
            
            // Добавляем параметры в URL
            url.searchParams.append('mode', 'updatePayment');
            url.searchParams.append('eventCode', eventCode);
            url.searchParams.append('year', year);
            url.searchParams.append('promoCode', promoCode);
            url.searchParams.append('orderId', orderId);
            url.searchParams.append('isPaid', isPaid);

            console.log('Updating payment status for orderId:', orderId, 'to', isPaid);
            console.log('Request URL:', url.toString());

            const response = await fetch(url.toString(), {
                method: 'GET',
                mode: 'no-cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const textData = await response.text();
            console.log('Received text data:', textData);
            
            try {
                const parsedData = JSON.parse(JSON.parse(textData));
                console.log('Parsed data:', parsedData);
                
                if (parsedData.error) {
                    throw new Error(parsedData.error);
                }

                // Обновляем таблицу и статистику
                const data = parsedData.data || [];
                renderReferralsTable(data, eventCode, true);
                updateStats(data, eventCode);

            } catch (parseError) {
                console.error('Ошибка парсинга ответа:', parseError);
                throw new Error('Ошибка обновления статуса оплаты');
            }

        } catch (error) {
            console.error('Ошибка при обновлении статуса оплаты:', error);
            showError('Ошибка при обновлении статуса оплаты: ' + error.message);
        }
    }
    
    // Получаем данные
    fetchReferralData(eventCode, year, promoCode, isAdmin);
}); 