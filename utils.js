// Функция для определения URL вебхука
function getWebhookUrl(eventCode) {
    switch(eventCode) {
        case 'MRWRU':
        case 'DRWRU':
            // Первый URL для MRW и DRW RU
            return 'https://script.google.com/macros/s/AKfycbyZEaxmorO6rogNkex6UOU02B1jiE4HwW-Fe4AXk4AfMphsAef1rMBZaiQtfxWsPqvD0w/exec';
        case 'DRWEN':
            // Второй URL для DRW ENG
            return 'https://script.google.com/macros/s/AKfycbxRIV9zCMb2TbxBsyRd9p-MhwtJp9B1yO13vFljD6nUs_Pd-nHn-yT4YNPY3tTLr9M4TQ/exec';
        case 'MSWRU':
        case 'DSWRU':
            // Третий URL для MSW и DSW RU
            return 'https://script.google.com/macros/s/AKfycbyCSHa74BQKmq2iN4ysFHze6jAv1xYHseJ4GQ9GukKEmsPFpyrha9pOQyRm6mmtz2VOiw/exec';
        case 'DSWEN':
            // Четвертый URL для DSW ENG
            return 'https://script.google.com/macros/s/AKfycbydkn57pXHqoP1dO_4TzjQVQ_Z04gtkVUjJeye33-BkvsK9SSzy0pVLpnuKyFu5LgHn/exec';
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