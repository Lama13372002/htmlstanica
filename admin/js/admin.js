class AdminPanel {
    constructor() {
        this.workingHours = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.renderDays();
        this.renderPreview();
        this.bindEvents();
    }

    async loadData() {
        try {
            const response = await fetch('../data/working-hours.json');
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            this.workingHours = await response.json();

            // Заполняем заголовок
            document.getElementById('title').value = this.workingHours.title;
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showMessage('Ошибка загрузки данных', 'error');

            // Инициализируем с дефолтными данными
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

    renderDays() {
        const container = document.getElementById('daysContainer');
        container.innerHTML = '';

        this.workingHours.days.forEach((day, index) => {
            const dayElement = this.createDayElement(day, index);
            container.appendChild(dayElement);
        });
    }

    createDayElement(day, index) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-item';
        dayDiv.innerHTML = `
            <div class="day-header">
                <span class="day-name">${day.nameRu} (${day.name})</span>
                <div class="status-indicator status-${day.status}"></div>
            </div>
            <div class="day-controls">
                <div class="form-group">
                    <label>Время работы:</label>
                    <input type="text"
                           class="form-control time-input"
                           value="${day.time}"
                           data-day-index="${index}"
                           placeholder="11:00 — 22:00">
                </div>
                <div class="form-group">
                    <label>Статус:</label>
                    <div class="status-buttons">
                        <button class="status-btn green ${day.status === 'green' ? 'active' : ''}"
                                data-day-index="${index}"
                                data-status="green">Открыто</button>
                        <button class="status-btn yellow ${day.status === 'yellow' ? 'active' : ''}"
                                data-day-index="${index}"
                                data-status="yellow">Ограничено</button>
                        <button class="status-btn red ${day.status === 'red' ? 'active' : ''}"
                                data-day-index="${index}"
                                data-status="red">Закрыто</button>
                    </div>
                </div>
            </div>
        `;

        return dayDiv;
    }

    renderPreview() {
        const container = document.getElementById('previewContent');
        const title = document.getElementById('title').value;

        let previewHTML = `<div class="preview-title">${title}</div>`;

        this.workingHours.days.forEach(day => {
            previewHTML += `
                <div class="preview-day">
                    <span class="preview-day-name">${day.name}</span>
                    <div class="preview-time-status">
                        <span class="preview-time">${day.time}</span>
                        <span class="preview-status status-${day.status}"></span>
                    </div>
                </div>
            `;
        });

        container.innerHTML = previewHTML;
    }

    bindEvents() {
        // Обработчик для кнопки сохранения
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveData();
        });

        // Обработчик для изменения заголовка
        document.getElementById('title').addEventListener('input', (e) => {
            this.workingHours.title = e.target.value;
            this.renderPreview();
        });

        // Обработчики для времени работы
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('time-input')) {
                const dayIndex = parseInt(e.target.dataset.dayIndex);
                this.workingHours.days[dayIndex].time = e.target.value;
                this.renderPreview();
            }
        });

        // Обработчики для кнопок статуса
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('status-btn')) {
                const dayIndex = parseInt(e.target.dataset.dayIndex);
                const status = e.target.dataset.status;

                this.updateDayStatus(dayIndex, status);
                this.renderPreview();
            }
        });
    }

    updateDayStatus(dayIndex, status) {
        // Обновляем данные
        this.workingHours.days[dayIndex].status = status;

        // Обновляем активные кнопки
        const dayItem = document.querySelectorAll('.day-item')[dayIndex];
        const statusButtons = dayItem.querySelectorAll('.status-btn');
        const statusIndicator = dayItem.querySelector('.status-indicator');

        statusButtons.forEach(btn => btn.classList.remove('active'));
        statusButtons.forEach(btn => {
            if (btn.dataset.status === status) {
                btn.classList.add('active');
            }
        });

        // Обновляем индикатор статуса
        statusIndicator.className = `status-indicator status-${status}`;
    }

    async saveData() {
        try {
            // Показываем состояние загрузки
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Сохранение...';
            saveBtn.disabled = true;

            // Отправляем данные на сервер (попробуем PHP скрипт)
            let response;
            try {
                response = await fetch('save-data.php', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.workingHours, null, 2)
                });
            } catch (error) {
                // Если PHP недоступен, попробуем напрямую (только для демонстрации)
                response = await fetch('../data/working-hours.json', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.workingHours, null, 2)
                });
            }

            if (!response.ok) {
                throw new Error('Ошибка сохранения данных');
            }

            // Для демонстрации, так как в реальности нужен серверный скрипт
            this.downloadJSON();

            this.showMessage('Данные успешно сохранены!', 'success');

        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showMessage('Ошибка сохранения данных. Файл скачан для ручного сохранения.', 'error');
            this.downloadJSON();
        } finally {
            // Восстанавливаем кнопку
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.textContent = 'Сохранить изменения';
            saveBtn.disabled = false;
        }
    }

    downloadJSON() {
        // Создаем файл для скачивания
        const dataStr = JSON.stringify(this.workingHours, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = 'working-hours.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showMessage('Файл скачан! Замените файл data/working-hours.json', 'success');
    }

    showMessage(text, type) {
        const messageElement = document.getElementById('statusMessage');
        messageElement.textContent = text;
        messageElement.className = `status-message ${type}`;

        // Показываем сообщение
        setTimeout(() => {
            messageElement.classList.add('show');
        }, 100);

        // Скрываем через 4 секунды
        setTimeout(() => {
            messageElement.classList.remove('show');
        }, 4000);
    }

    // Метод для обновления основной страницы (для будущего использования)
    updateMainPage() {
        // Этот метод будет использоваться для обновления основной страницы
        // после сохранения данных
        const event = new CustomEvent('workingHoursUpdated', {
            detail: this.workingHours
        });
        window.dispatchEvent(event);
    }
}

// Инициализация админ панели при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
});

// Простая валидация времени
function validateTime(timeString) {
    const timeRegex = /^\d{1,2}:\d{2}\s*—\s*\d{1,2}:\d{2}$/;
    return timeRegex.test(timeString);
}

// Форматирование времени
function formatTime(timeString) {
    return timeString.replace(/\s+/g, ' ').replace(/\s*—\s*/, ' — ');
}
