// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "ваш-api-key",
  authDomain: "ваш-auth-domain",
  projectId: "e2referrals",
  storageBucket: "ваш-storage-bucket",
  messagingSenderId: "ваш-messaging-sender-id",
  appId: "ваш-app-id"
};

// Инициализация Firebase
try {
  firebase.initializeApp(firebaseConfig);
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Ошибка инициализации Firebase:', error);
  }
}

// Получаем доступ к Firestore
const db = firebase.firestore();

// Экспортируем коллекцию промокодов
const promoCodesCollection = db.collection('promo-codes');

// Проверяем доступ к Firestore
promoCodesCollection.limit(1).get()
  .then(() => {
    console.log('Успешное подключение к Firestore');
  })
  .catch((error) => {
    console.error('Ошибка доступа к Firestore:', error);
    if (error.code === 'permission-denied') {
      alert('Ошибка доступа к базе данных. Пожалуйста, проверьте настройки Firebase.');
    }
  }); 