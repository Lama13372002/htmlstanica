class WorkingHoursDisplay {
    constructor() {
        this.workingHours = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.updateDisplay();
    }

    async loadData() {
        try {
            const response = await fetch('data/working-hours.json');
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных рабочих часов');
            }
            this.workingHours = await response.json();
        } catch (error) {
            console.error('Ошибка загрузки данных рабочих часов:', error);
            // Используем дефолтные данные если файл не загрузился
            this.workingHours = this.getDefaultData();
        }
    }

    getDefaultData() {
        return {
            title: "Working Hours",
            days: [
                { name: "Monday", nameRu: "Понедельник", time: "11:00 — 22:00", status: "green" },
                { name: "Tuesday", nameRu: "Вторник", time: "11:00 — 22:00", status: "green" },
                { name: "Wednesday", nameRu: "Среда", time: "11:00 — 22:00", status: "green" },
                { name: "Thursday", nameRu: "Четверг", time: "11:00 — 22:00", status: "green" },
                { name: "Friday", nameRu: "Пятница", time: "11:00 — 23:00", status: "green" },
                { name: "Saturday", nameRu: "Суббота", time: "11:00 — 23:00", status: "green" },
                { name: "Sunday", nameRu: "Воскресенье", time: "12:00 — 21:00", status: "yellow" }
            ]
        };
    }

    getStatusColor(status) {
        const colors = {
            'green': 'rgb(34, 197, 94)',
            'yellow': 'rgb(234, 179, 8)',
            'red': 'rgb(239, 68, 68)'
        };
        return colors[status] || colors['green'];
    }

    getStatusOpacity(status) {
        const opacities = {
            'green': '1',
            'yellow': '0.8',
            'red': '0.6'
        };
        return opacities[status] || opacities['green'];
    }

    updateDisplay() {
        // Находим контейнер с рабочими часами
        const workingHoursContainer = document.querySelector('.restaurant-info-card');
        if (!workingHoursContainer) {
            console.error('Контейнер рабочих часов не найден');
            return;
        }

        // Находим элементы для обновления
        const titleElement = workingHoursContainer.querySelector('h3');
        const daysContainer = workingHoursContainer.querySelector('div[style*="display: flex; flex-direction: column; gap: 8px;"]');

        if (!titleElement || !daysContainer) {
            console.error('Элементы рабочих часов не найдены');
            return;
        }

        // Обновляем заголовок
        titleElement.textContent = this.workingHours.title;

        // Очищаем контейнер дней
        daysContainer.innerHTML = '';

        // Создаем новые элементы для каждого дня
        this.workingHours.days.forEach(day => {
            const dayElement = this.createDayElement(day);
            daysContainer.appendChild(dayElement);
        });
    }

    createDayElement(day) {
        const dayDiv = document.createElement('div');

        // Определяем стили в зависимости от статуса
        let backgroundOpacity, borderOpacity;
        switch(day.status) {
            case 'green':
                backgroundOpacity = '0.05';
                borderOpacity = '0.1';
                break;
            case 'yellow':
                backgroundOpacity = '0.08';
                borderOpacity = '0.15';
                break;
            case 'red':
                backgroundOpacity = '0.03';
                borderOpacity = '0.08';
                break;
            default:
                backgroundOpacity = '0.05';
                borderOpacity = '0.1';
        }

        dayDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 12px;
            border-radius: 8px;
            background: rgba(255, 255, 255, ${backgroundOpacity});
            border: 1px solid rgba(239, 231, 210, ${borderOpacity});
            margin-bottom: 8px;
        `;

        dayDiv.innerHTML = `
            <span style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, 0.95);">${day.name}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: rgb(239, 231, 210); font-weight: 600;">${day.time}</span>
                <span style="width: 6px; height: 6px; background-color: ${this.getStatusColor(day.status)}; border-radius: 50%; opacity: ${this.getStatusOpacity(day.status)};"></span>
            </div>
        `;

        return dayDiv;
    }

    // Метод для обновления данных (может быть вызван из админ панели)
    async refresh() {
        await this.loadData();
        this.updateDisplay();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем только если мы на главной странице
    if (document.querySelector('.restaurant-info-card')) {
        window.workingHoursDisplay = new WorkingHoursDisplay();
    }
});

// Слушаем события обновления данных
window.addEventListener('workingHoursUpdated', (event) => {
    if (window.workingHoursDisplay) {
        window.workingHoursDisplay.refresh();
    }
});
