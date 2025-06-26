/**
 * API интеграция для загрузки рабочих часов на основной сайт
 */

// Загрузка данных рабочих часов из API
async function loadWorkingHours() {
  try {
    const response = await fetch('/api/restaurant/working-hours');

    if (!response.ok) {
      console.error('Failed to load working hours:', response.statusText);
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data.workingHours;
    }

    return null;
  } catch (error) {
    console.error('Error loading working hours:', error);
    return null;
  }
}

// Обновление карточки ресторана с новыми данными
function updateRestaurantCard(workingHours) {
  if (!workingHours) return;

  // Названия дней на русском
  const dayNames = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье'
  };

  // Цвета статусов
  const statusColors = {
    green: '#22C55E',
    yellow: '#EAB308',
    red: '#EF4444'
  };

  // Найти элемент карточки ресторана
  const cardElement = document.querySelector('.restaurant-card, [data-restaurant-card]');

  if (!cardElement) {
    console.warn('Restaurant card element not found');
    return;
  }

  // Найти контейнер для рабочих часов
  let hoursContainer = cardElement.querySelector('.working-hours-container');

  if (!hoursContainer) {
    // Создать контейнер, если его нет
    hoursContainer = document.createElement('div');
    hoursContainer.className = 'working-hours-container';
    cardElement.appendChild(hoursContainer);
  }

  // Очистить содержимое
  hoursContainer.innerHTML = '';

  // Создать элементы для каждого дня
  Object.entries(workingHours).forEach(([day, hours]) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'working-hours-day';
    dayElement.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    `;

    const dayName = document.createElement('span');
    dayName.textContent = dayNames[day] || day;
    dayName.style.cssText = 'font-weight: 500;';

    const timeInfo = document.createElement('div');
    timeInfo.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    if (hours.isOpen) {
      const timeSpan = document.createElement('span');
      timeSpan.textContent = `${hours.open} - ${hours.close}`;
      timeInfo.appendChild(timeSpan);
    } else {
      const closedSpan = document.createElement('span');
      closedSpan.textContent = 'Закрыто';
      closedSpan.style.color = '#6b7280';
      timeInfo.appendChild(closedSpan);
    }

    // Статус индикатор
    const statusDot = document.createElement('div');
    statusDot.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: ${statusColors[hours.status] || statusColors.green};
    `;
    timeInfo.appendChild(statusDot);

    dayElement.appendChild(dayName);
    dayElement.appendChild(timeInfo);
    hoursContainer.appendChild(dayElement);
  });

  console.log('Restaurant card updated with new working hours');
}

// Инициализация при загрузке страницы
async function initializeWorkingHours() {
  console.log('Loading working hours from API...');

  const workingHours = await loadWorkingHours();

  if (workingHours) {
    updateRestaurantCard(workingHours);
    console.log('Working hours loaded successfully');
  } else {
    console.log('Using default working hours display');
  }
}

// Запуск при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWorkingHours);
} else {
  initializeWorkingHours();
}

// Обновление каждые 5 минут
setInterval(async () => {
  const workingHours = await loadWorkingHours();
  if (workingHours) {
    updateRestaurantCard(workingHours);
  }
}, 5 * 60 * 1000);
