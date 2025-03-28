// Функция для определения URL вебхука
function getWebhookUrl(eventCode) {
    switch(eventCode) {
        case 'MRWRU':
        case 'DRWRU':
            // Первый URL для MRW и DRW RU
            return 'https://script.google.com/macros/s/AKfycbwo5NyUB3E1dSTibFGryEzKvGP8IEvuyec-Is3sFhaDa89ywcSSTfH578FHgkXOCgHqmw/exec';
        case 'DRWEN':
            // Второй URL для DRW ENG
            return 'https://script.google.com/macros/s/AKfycbwqLeCFbXMQugu9kYkHZ6V4tocRwbYXslxPmBTsk92RPDmwOARuw5yqDFfuXEDCd3A6Zg/exec';
        case 'MSWRU':
        case 'DSWRU':
            // Третий URL для MSW и DSW RU
            return 'https://script.google.com/macros/s/AKfycbwZ5WluEsSiggWvsOqSpo_i3uiK_MU3waIjEyxvdMFsEDyvoMdkYzO9aASvyzNH1WXlqA/exec';
        case 'DSWEN':
            // Четвертый URL для DSW ENG
            return 'https://script.google.com/macros/s/AKfycbzdLvKLrauiUkGlUlJiXSFRLYsKNuucXwG6J2p2AjLahHYVxvGT2PB31dC9OQ5w7ZA9/exec';
        default:
            throw new Error('Неизвестный тип мероприятия');
    }
}

// Функция для получения названия мероприятия по коду
function getEventNameByCode(code) {
    const eventNames = {
        'MRWRU': '🇷🇺🍽️RestaurantWeek Moscow',
        'DRWRU': '🇷🇺🍽️RestaurantWeek Dubai RU',
        'DRWEN': '🌍🍽️RestaurantWeek Dubai ENG',
        'MSWRU': '🇷🇺💅SalonWeek Moscow',
        'DSWRU': '🇷🇺💅SalonWeek Dubai RU',
        'DSWEN': '🌍💅SalonWeek Dubai ENG'
    };
    return eventNames[code] || code;
} 