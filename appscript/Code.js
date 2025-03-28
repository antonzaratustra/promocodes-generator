// Your Google Apps Script code goes here
// This is the code that will be pushed to all your Google Sheets

// Общая функция для установки CORS заголовков
function createCorsResponse(content) {
    return ContentService.createTextOutput()
        .setMimeType(ContentService.MimeType.JSON)
        .setContent(JSON.stringify({
          ...content,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        }));
  }
  
  // Обработка OPTIONS запросов
  function doOptions(e) {
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify({ status: "ok" }));
    
    return output;
  }
  
  // Обработка POST запросов
  function doPost(e) {
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    try {
      var data = JSON.parse(e.postData.contents);
      console.log('Получены данные:', JSON.stringify(data));
      
      if (e.parameter.action === 'updatePayment') {
        if (!data.orderId || typeof data.isPaid !== 'boolean') {
          throw new Error('Отсутствуют обязательные поля для обновления статуса оплаты');
        }
        
        updatePaymentStatus(data.orderId, data.isPaid);
        
        output.setContent(JSON.stringify({
          success: true,
          message: 'Статус оплаты успешно обновлен'
        }));
        return output;
      }
      
      if (!data.promoCode || !data.eventCode || !data.year) {
        throw new Error('Отсутствуют обязательные поля');
      }
      
      createPromoCode(data.promoCode, data.eventCode, data.year);
      
      output.setContent(JSON.stringify({
        success: true,
        message: 'Промокод успешно создан'
      }));
      
    } catch (err) {
      console.error('Ошибка:', err.toString());
      output.setContent(JSON.stringify({
        success: false,
        error: err.toString()
      }));
    }
    
    return output;
  }
  
  // Обработка GET запросов
  function doGet(e) {
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    
    try {
      var promoCode = e.parameter.promoCode;
      if (!promoCode) {
        throw new Error('Не указан промокод');
      }
      
      var data = getReferralData(promoCode);
      output.setContent(JSON.stringify({
        success: true,
        data: data
      }));
      
    } catch (err) {
      output.setContent(JSON.stringify({
        success: false,
        error: err.toString()
      }));
    }
    
    return output;
  }
  
  /**
   * Получает данные рефералов по промокоду
   */
  function getReferralData(promoCode) {
    console.log('Getting referral data for promo code:', promoCode);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data-from-tilda');
    if (!sheet) {
      throw new Error('Лист data-from-tilda не найден');
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    // Получаем заголовки таблицы
    var headers = values[0];
    console.log('Заголовки таблицы:', headers); // Логируем заголовки
    
    // Ищем индекс столбца promocode (case-insensitive)
    var promoCodeIndex = -1;
    for (var i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase() === 'promocode') {
        promoCodeIndex = i;
        break;
      }
    }
    
    if (promoCodeIndex === -1) {
      throw new Error('Столбец "promocode" не найден. Доступные столбцы: ' + headers.join(', '));
    }
    
    // Данные для возврата
    var referrals = [];
    
    // Проходим по всем строкам и ищем совпадения с промокодом
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      
      // Логируем значение в promoCodeIndex
      console.log('Значение в promoCodeIndex:', row[promoCodeIndex]);
      
      // Проверяем, является ли значение строкой
      if (typeof row[promoCodeIndex] === 'string' && row[promoCodeIndex].toUpperCase() === promoCode.toUpperCase()) {
        // Преобразуем строку в объект
        var referral = {};
        for (var j = 0; j < headers.length; j++) {
          referral[headers[j]] = row[j];
        }
        
        // Добавляем информацию о статусе оплаты
        referral.isPaid = false;
        
        // Проверяем статус оплаты
        var statusSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('payment-statuses');
        if (statusSheet) {
          var statusData = statusSheet.getDataRange().getValues();
          for (var k = 1; k < statusData.length; k++) {
            if (statusData[k][0] === promoCode && statusData[k][1] === referral.orderid) {
              referral.isPaid = statusData[k][2] === 'true';
              break;
            }
          }
        }
        
        referrals.push(referral);
      } else {
        console.warn('Не удалось найти совпадение для промокода:', row[promoCodeIndex]);
      }
    }
    
    console.log('Found referrals:', referrals.length);
    return referrals;
  }
  
  /**
   * Обновляет статус оплаты для заказа
   */
  function updatePaymentStatus(orderId, isPaid) {
    console.log('Updating payment status for orderId:', orderId);
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data-from-tilda');
    if (!sheet) {
      throw new Error('Лист data-from-tilda не найден');
    }
    
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
    // Получаем заголовки таблицы
    var headers = values[0];
    var orderIdIndex = headers.indexOf('orderid');
    var isPaidIndex = headers.indexOf('isPaid');
    
    if (orderIdIndex === -1 || isPaidIndex === -1) {
      throw new Error('Не найдены необходимые столбцы в таблице');
    }
    
    // Ищем строку с нужным orderId
    for (var i = 1; i < values.length; i++) {
      if (values[i][orderIdIndex] === orderId) {
        // Обновляем статус оплаты
        sheet.getRange(i + 1, isPaidIndex + 1).setValue(isPaid);
        return;
      }
    }
    
    throw new Error('Заказ с указанным ID не найден');
  }
  
  // Функция создания промокода
  function createPromoCode(promoCode, eventCode, year) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('promo-codes');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('promo-codes');
      sheet.appendRow(['promoCode', 'eventCode', 'year', 'createdAt']);
    }
    
    sheet.appendRow([
      promoCode,
      eventCode,
      year,
      new Date().toISOString()
    ]);
    
    console.log('Промокод создан:', promoCode, eventCode, year);
  }