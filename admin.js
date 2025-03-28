document.addEventListener('DOMContentLoaded', function() {
    // Удаляем тестовые кнопки
    const testButtons = document.querySelectorAll('.btn-success');
    testButtons.forEach(button => button.remove());

    // Элементы интерфейса
    const promoCodesTableBody = document.getElementById('promoCodesTableBody');
    const eventFilter = document.getElementById('eventFilter');
    const yearFilter = document.getElementById('yearFilter');
    const applyFiltersBtn = document.getElementById('applyFilters');
    
    // Модальные окна
    const referralsModal = document.getElementById('referralsModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const modalPromoCode = document.getElementById('modalPromoCode');
    const deletePromoCode = document.getElementById('deletePromoCode');
    const modalReferralsTableBody = document.getElementById('modalReferralsTableBody');
    
    // Кнопки
    const saveChangesBtn = document.getElementById('saveChangesBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const closeButtons = document.querySelectorAll('.close');
    
    // Переменные для хранения текущих данных
    let currentPromoCodes = [];
    let currentPromoCodeData = null;
    let referralsData = [];
    let promoToDelete = null;
    
    // Инициализация
    initYearFilter();
    loadPromoCodes();
    
    // Инициализация фильтра годов
    function initYearFilter() {
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        }
    }
    
    // Загрузка промокодов из Firebase
    async function loadPromoCodes() {
        try {
            const snapshot = await promoCodesCollection.get();
            const promoCodes = [];
            
            for (const doc of snapshot.docs) {
                const promoData = doc.data();
                
                // Получаем данные о рефералах для каждого промокода
                const referralData = await fetchReferralData(promoData.promoCode, promoData.eventCode);
                
                promoCodes.push({
                    id: doc.id,
                    ...promoData,
                    referralsCount: referralData ? referralData.length : 0 // Добавляем количество рефералов
                });
            }

            displayPromoCodes(promoCodes);
        } catch (error) {
            console.error('Ошибка загрузки промокодов:', error);
            showError('Ошибка загрузки данных: ' + error.message);
        }
    }
    
    function displayPromoCodes(promoCodes) {
        const tbody = document.querySelector('#promoCodesTable tbody');
        tbody.innerHTML = '';

        if (promoCodes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Нет промокодов</td>
                </tr>
            `;
            return;
        }

        promoCodes.forEach(promo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${promo.promoCode}</td>
                <td>${promo.eventCode}</td>
                <td>${promo.year}</td>
                <td>${promo.referralsCount || 0}</td>
                <td>${new Date(promo.createdAt).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Открытие модального окна с рефералами
    function openReferralsModal(promoId) {
        const promo = currentPromoCodes.find(p => p.id === promoId);
        if (!promo) return;
        
        currentPromoCodeData = promo;
        modalPromoCode.textContent = promo.promoCode;
        
        // Загружаем данные рефералов
        loadReferralsData(promo);
        
        // Открываем модальное окно
        referralsModal.style.display = 'block';
    }
    
    // Загрузка данных рефералов
    function loadReferralsData(promo) {
        showLoading(modalReferralsTableBody, 8);
        
        // В реальном приложении здесь был бы запрос к Google Apps Script
        // Для примера используем тестовые данные
        setTimeout(() => {
            referralsData = getMockReferralData(promo.eventCode);
            renderReferralsInModal(referralsData, promo.eventCode);
            updateModalStats(referralsData, promo.eventCode);
        }, 1000);
    }
    
    // Отображение данных рефералов в модальном окне
    function renderReferralsInModal(data, eventCode) {
        modalReferralsTableBody.innerHTML = '';
        
        if (!data || data.length === 0) {
            modalReferralsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">Данные не найдены</td>
                </tr>
            `;
            return;
        }
        
        // Определяем валюту в зависимости от кода мероприятия
        const currency = eventCode.endsWith('EN') ? '$' : '₽';
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // Рассчитываем выплату как 5% от цены
            const commission = parseFloat(item.price) * 0.05;
            
            row.innerHTML = `
                <td>${formatDate(item.sent)}</td>
                <td>${item.orderid || '-'}</td>
                <td>${item.products || '-'}</td>
                <td>${item.name || '-'}</td>
                <td>${item.price} ${currency}</td>
                <td>${item.email || '-'}</td>
                <td>${commission.toFixed(2)} ${currency}</td>
                <td class="checkbox-cell">
                    <input type="checkbox" class="payment-checkbox" data-index="${index}" ${item.isPaid ? 'checked' : ''}>
                </td>
            `;
            
            modalReferralsTableBody.appendChild(row);
        });
        
        // Добавляем обработчики событий для чекбоксов
        const checkboxes = modalReferralsTableBody.querySelectorAll('.payment-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const index = parseInt(this.getAttribute('data-index'));
                referralsData[index].isPaid = this.checked;
                updateModalStats(referralsData, eventCode);
            });
        });
    }
    
    // Обновление статистики в модальном окне
    function updateModalStats(data, eventCode) {
        if (!data || data.length === 0) {
            document.getElementById('modalPaidAmount').textContent = '0';
            document.getElementById('modalToPay').textContent = '0';
            document.getElementById('modalPeopleReferred').textContent = '0';
            return;
        }
        
        // Определяем валюту
        const currency = eventCode.endsWith('EN') ? '$' : '₽';
        
        // Рассчитываем статистику
        const paidAmount = data
            .filter(item => item.isPaid)
            .reduce((sum, item) => sum + parseFloat(item.price) * 0.05, 0);
            
        const toPayAmount = data
            .filter(item => !item.isPaid)
            .reduce((sum, item) => sum + parseFloat(item.price) * 0.05, 0);
            
        const peopleCount = data.length;
        
        // Обновляем элементы на странице
        document.getElementById('modalPaidAmount').textContent = `${paidAmount.toFixed(2)} ${currency}`;
        document.getElementById('modalToPay').textContent = `${toPayAmount.toFixed(2)} ${currency}`;
        document.getElementById('modalPeopleReferred').textContent = peopleCount;
    }
    
    // Открытие модального окна подтверждения удаления
    function openDeleteConfirmation(promoId, promoCode) {
        promoToDelete = promoId;
        deletePromoCode.textContent = promoCode;
        deleteConfirmModal.style.display = 'block';
    }
    
    // Удаление промокода
    function deletePromoCode(promoId) {
        promoCodesCollection.doc(promoId).delete()
            .then(() => {
                // Удаляем промокод из текущего списка
                currentPromoCodes = currentPromoCodes.filter(p => p.id !== promoId);
                loadPromoCodes(); // Перезагружаем список
                
                // Закрываем модальное окно
                deleteConfirmModal.style.display = 'none';
                
                // Показываем сообщение об успехе
                alert('Промокод успешно удален!');
            })
            .catch(error => {
                alert(`Ошибка при удалении промокода: ${error.message}`);
            });
    }
    
    // Сохранение изменений в статусах оплаты
    function saveReferralChanges() {
        // В реальном приложении здесь был бы код для сохранения изменений
        // в Google Sheets или Firebase
        
        // Для примера просто показываем сообщение
        alert('Изменения успешно сохранены!');
        referralsModal.style.display = 'none';
    }
    
    // Обработчики событий
    
    // Применение фильтров
    applyFiltersBtn.addEventListener('click', function() {
        const filters = {
            event: eventFilter.value,
            year: yearFilter.value
        };
        loadPromoCodes(filters);
    });
    
    // Сохранение изменений в модальном окне
    saveChangesBtn.addEventListener('click', saveReferralChanges);
    
    // Закрытие модальных окон
    closeModalBtn.addEventListener('click', function() {
        referralsModal.style.display = 'none';
    });
    
    cancelDeleteBtn.addEventListener('click', function() {
        deleteConfirmModal.style.display = 'none';
    });
    
    confirmDeleteBtn.addEventListener('click', function() {
        if (promoToDelete) {
            deletePromoCode(promoToDelete);
        }
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.style.display = 'none';
        });
    });
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        if (event.target === referralsModal) {
            referralsModal.style.display = 'none';
        }
        if (event.target === deleteConfirmModal) {
            deleteConfirmModal.style.display = 'none';
        }
    });
    
    // Вспомогательные функции
    
    // Отображение загрузки
    function showLoading(element, colSpan = 6) {
        element.innerHTML = `
            <tr class="loading-row">
                <td colspan="${colSpan}">Загрузка данных...</td>
            </tr>
        `;
    }
    
    // Отображение ошибки
    function showError(element, message, colSpan = 6) {
        element.innerHTML = `
            <tr class="error-row">
                <td colspan="${colSpan}">${message}</td>
            </tr>
        `;
    }
    
    // Форматирование даты
    function formatDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    }
    
    // Получение тестовых данных (только для демонстрации)
    function getMockReferralData(eventCode) {
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
            },
            {
                sent: '2024-11-12 09:15:22',
                orderid: '6410618:6827328888',
                products: 'VIP Ticket - 1x300 = 300',
                name: 'John Doe',
                price: isEnglish ? '300' : '15000',
                referer: isEnglish ? 'https://dubaisalonweek.com/vip' : 'https://restaurantweek.ru/vip',
                email: 'john@example.com',
                isPaid: false
            }
        ];
    }
}); 