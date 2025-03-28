// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDBuaaDvbyVBV0No_7vG7doaIIBl8ELNME",
  authDomain: "e2referrals.firebaseapp.com",
  projectId: "e2referrals",
  storageBucket: "e2referrals.firebasestorage.app",
  messagingSenderId: "563306851925",
  appId: "1:563306851925:web:f693d09be9dad2f6b06edc",
  measurementId: "G-8J5F5JF6GP"
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
const promoCodesCollection = db.collection('promoCodes');

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