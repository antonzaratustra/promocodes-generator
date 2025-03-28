// Проверяем, является ли пользователь администратором
let isAdmin = false;

// Функция для инициализации админ-панели
function initAdminPanel() {
    // Проверяем, есть ли параметр admin в URL
    const urlParams = new URLSearchParams(window.location.search);
    isAdmin = urlParams.get('admin') === 'true';

    if (isAdmin) {
        // Добавляем обработчики для чекбоксов
        const tableBody = document.getElementById('referralsTableBody');
        tableBody.addEventListener('change', handlePaymentStatusChange);
    } else {
        // Для клиентов делаем чекбоксы неактивными
        const checkboxes = document.querySelectorAll('.payment-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.disabled = true;
        });
    }
}

// Функция для обработки изменения статуса оплаты
async function handlePaymentStatusChange(event) {
    if (!isAdmin) return;

    const checkbox = event.target;
    if (!checkbox.classList.contains('payment-checkbox')) return;

    const row = checkbox.closest('tr');
    const orderId = row.querySelector('td:nth-child(2)').textContent;
    const isPaid = checkbox.checked;

    try {
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        const eventCode = urlParams.get('event');
        const year = urlParams.get('year');
        const promoCode = urlParams.get('promo');

        // Обновляем статус в Firestore
        const db = firebase.firestore();
        const referralsRef = db.collection('referrals');
        
        // Создаем уникальный ID для записи
        const referralId = `${eventCode}_${year}_${promoCode}_${orderId}`;
        
        await referralsRef.doc(referralId).set({
            isPaid: isPaid,
            orderId: orderId,
            eventCode: eventCode,
            year: year,
            promoCode: promoCode
        }, { merge: true });

        // Обновляем статистику
        fetchReferralData(eventCode, year, promoCode, true);

    } catch (error) {
        console.error('Ошибка при обновлении статуса:', error);
        alert('Произошла ошибка при обновлении статуса оплаты');
    }
}

// Функция для загрузки данных
async function fetchReferralData(eventCode, year, promoCode) {
    try {
        const db = firebase.firestore();
        const referralsRef = db.collection('referrals');
        
        // Создаем запрос к Firestore
        const query = referralsRef
            .where('eventCode', '==', eventCode)
            .where('year', '==', year)
            .where('promoCode', '==', promoCode);

        const snapshot = await query.get();
        const data = [];
        
        snapshot.forEach(doc => {
            const referral = doc.data();
            data.push({
                id: doc.id,
                ...referral,
                isPaid: referral.isPaid || false
            });
        });

        renderReferralsTable(data);
        updateStats(data);

    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        showError(`Ошибка при загрузке данных: ${error.message}`);
    }
}

function renderReferralsTable(data) {
    const tableBody = document.getElementById('referralsTableBody');
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="no-data">
                    Данные не найдены. Это может быть связано с тем, что:
                    <ul>
                        <li>По этому промокоду еще нет покупок</li>
                        <li>Данные еще не синхронизированы</li>
                        <li>Возникла временная ошибка связи с сервером</li>
                    </ul>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(item => {
        const commission = parseFloat(item.price) * 0.05; // 5% комиссия
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(item.sent)}</td>
            <td>${item.orderid ? String(item.orderid).toUpperCase() : '-'}</td>
            <td>${item.products || '-'}</td>
            <td>${item.name || '-'}</td>
            <td>${item.price || '0'}</td>
            <td>${item.referer || '-'}</td>
            <td>${item.email || '-'}</td>
            <td>${commission.toFixed(2)}</td>
            <td>${item.isPaid ? '✅' : '⏳'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initAdminPanel);
