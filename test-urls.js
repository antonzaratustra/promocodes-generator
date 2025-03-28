// Скрипт для проверки URL развертываний
import fetch from 'node-fetch';

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

async function testUrl(eventCode, year = '2024', promoCode = 'TEST') {
    try {
        const url = getDataUrl(eventCode);
        console.log(`Testing URL for ${eventCode}: ${url}`);
        
        const response = await fetch(`${url}?eventCode=${eventCode}&year=${year}&promoCode=${promoCode}`);
        const status = response.status;
        
        console.log(`Status: ${status}`);
        
        if (status === 200) {
            try {
                const data = await response.json();
                console.log('Response data:', data);
                return { success: true, data };
            } catch (e) {
                console.log('Could not parse JSON response');
                const text = await response.text();
                console.log('Raw response:', text.substring(0, 200) + '...');
                return { success: false, error: 'Invalid JSON response' };
            }
        } else {
            return { success: false, error: `HTTP status ${status}` };
        }
    } catch (error) {
        console.error(`Error testing ${eventCode}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    const eventCodes = ['MRWRU', 'DRWRU', 'DRWEN', 'MSWRU', 'DSWRU', 'DSWEN'];
    
    console.log('Starting URL tests...');
    
    for (const code of eventCodes) {
        console.log('\n-----------------------------------');
        console.log(`Testing ${code}...`);
        await testUrl(code);
    }
    
    console.log('\nAll tests completed.');
}

runTests().catch(console.error);