function initReferralPage(eventCode, year, promoCode) {
    // Заполняем информацию на странице
    document.getElementById('eventTitle').textContent = getEventNameByCode(eventCode);
    document.getElementById('yearInfo').textContent = year;
    document.getElementById('promoInfo').textContent = promoCode;
    
    // Загружаем данные
    fetchReferralData(eventCode, year, promoCode);
}

function getEventNameByCode(code) {
    const eventNames = {
        'MRWRU': 'RestaurantWeek Moscow',
        'DRWRU': 'RestaurantWeek Dubai RU',
        'DRWEN': 'RestaurantWeek Dubai ENG',
        'MSWRU': 'SalonWeek Moscow',
        'DSWRU': 'SalonWeek Dubai RU',
        'DSWEN': 'SalonWeek Dubai ENG'
    };
    return eventNames[code] || 'Неизвестное мероприятие';
} 