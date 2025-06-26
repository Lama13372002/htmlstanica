<?php
/**
 * Улучшенный API endpoint для управления рабочими часами ресторана
 * Поддерживает автоматическое обновление и кеширование
 *
 * Разместите этот файл на сервере сайта по пути: /api/restaurant/working-hours.php
 */

// =============================================================================
// НАСТРОЙКИ (ОБЯЗАТЕЛЬНО ИЗМЕНИТЕ!)
// =============================================================================

$DATA_FILE = __DIR__ . '/working-hours.json';
$API_KEY = 'A555018A876E816C1C37DBC84C425B8A'; // ОБЯЗАТЕЛЬНО поменяйте!
$CACHE_TIME = 300; // Кеширование на 5 минут
$ALLOWED_ORIGINS = [
    'https://adminpanel-iota-sage.vercel.app/',    // Домен админ панели
    'https://htmlstanica.vercel.app/index.html',          // Домен основного сайта
    'http://localhost:3000',         // Для разработки
    'http://localhost:5173'          // Для разработки Vite
];

// =============================================================================
// ОСНОВНАЯ ЛОГИКА
// =============================================================================

// CORS заголовки
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Кеширование для GET запросов
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $etag = '"' . md5_file($DATA_FILE ?? '') . '"';
    header("ETag: $etag");
    header("Cache-Control: public, max-age=$CACHE_TIME");

    // Проверка If-None-Match
    if (isset($_SERVER['HTTP_IF_NONE_MATCH']) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag) {
        http_response_code(304);
        exit();
    }
}

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Функция логирования
function logRequest($message, $data = null) {
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "[$timestamp] $message";
    if ($data) {
        $log_entry .= " | Data: " . json_encode($data);
    }
    error_log($log_entry . PHP_EOL, 3, __DIR__ . '/api.log');
}

// Проверка авторизации для POST запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (!$authHeader || !preg_match('/Bearer\s+(.*)/', $authHeader, $matches)) {
        logRequest('Unauthorized request - missing token', $_SERVER['REQUEST_URI']);
        http_response_code(401);
        echo json_encode(['error' => 'Отсутствует токен авторизации']);
        exit();
    }

    $token = $matches[1];
    if ($token !== $API_KEY) {
        logRequest('Unauthorized request - invalid token', $token);
        http_response_code(403);
        echo json_encode(['error' => 'Неверный API ключ']);
        exit();
    }
}

// Валидация данных рабочих часов
function validateWorkingHours($data) {
    if (!isset($data['workingHours']) || !is_array($data['workingHours'])) {
        return false;
    }

    $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    $statuses = ['green', 'yellow', 'red'];

    foreach ($days as $day) {
        if (!isset($data['workingHours'][$day])) {
            return false;
        }

        $hours = $data['workingHours'][$day];

        // Проверка обязательных полей
        if (!isset($hours['open'], $hours['close'], $hours['isOpen'], $hours['status'])) {
            return false;
        }

        // Проверка формата времени
        if (!preg_match('/^\d{2}:\d{2}$/', $hours['open']) ||
            !preg_match('/^\d{2}:\d{2}$/', $hours['close'])) {
            return false;
        }

        // Проверка статуса
        if (!in_array($hours['status'], $statuses)) {
            return false;
        }

        // Проверка типа isOpen
        if (!is_bool($hours['isOpen'])) {
            return false;
        }
    }

    return true;
}

// Обработка запросов
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Получение данных
        if (file_exists($DATA_FILE)) {
            $data = file_get_contents($DATA_FILE);
            $json_data = json_decode($data, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                // Добавляем метаданные
                $response = [
                    'success' => true,
                    'data' => $json_data,
                    'last_updated' => filemtime($DATA_FILE),
                    'server_time' => time()
                ];

                logRequest('Data retrieved successfully');
                echo json_encode($response);
            } else {
                logRequest('JSON decode error', json_last_error_msg());
                http_response_code(500);
                echo json_encode(['error' => 'Ошибка чтения данных']);
            }
        } else {
            // Возвращаем данные по умолчанию
            $default_data = [
                'workingHours' => [
                    'monday' => ['open' => '11:00', 'close' => '22:00', 'isOpen' => true, 'status' => 'green'],
                    'tuesday' => ['open' => '11:00', 'close' => '22:00', 'isOpen' => true, 'status' => 'green'],
                    'wednesday' => ['open' => '11:00', 'close' => '22:00', 'isOpen' => true, 'status' => 'green'],
                    'thursday' => ['open' => '11:00', 'close' => '22:00', 'isOpen' => true, 'status' => 'green'],
                    'friday' => ['open' => '11:00', 'close' => '23:00', 'isOpen' => true, 'status' => 'green'],
                    'saturday' => ['open' => '11:00', 'close' => '23:00', 'isOpen' => true, 'status' => 'green'],
                    'sunday' => ['open' => '12:00', 'close' => '21:00', 'isOpen' => true, 'status' => 'yellow']
                ]
            ];

            $response = [
                'success' => true,
                'data' => $default_data,
                'last_updated' => null,
                'server_time' => time(),
                'note' => 'Default data - no custom hours set'
            ];

            logRequest('Returned default data');
            echo json_encode($response);
        }
        break;

    case 'POST':
        // Сохранение данных
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            logRequest('Invalid JSON input', json_last_error_msg());
            http_response_code(400);
            echo json_encode(['error' => 'Неверный формат JSON']);
            exit();
        }

        // Валидация данных
        if (!validateWorkingHours($data)) {
            logRequest('Invalid data format', $data);
            http_response_code(400);
            echo json_encode(['error' => 'Неверный формат данных']);
            exit();
        }

        // Добавляем метаданные
        $data['last_updated'] = time();
        $data['updated_by'] = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

        // Сохранение в файл
        if (file_put_contents($DATA_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
            logRequest('Data saved successfully', $data);

            $response = [
                'success' => true,
                'message' => 'Данные сохранены',
                'timestamp' => time()
            ];
            echo json_encode($response);
        } else {
            logRequest('File write error', $DATA_FILE);
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка сохранения данных']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Метод не поддерживается']);
        break;
}

// Тестовый endpoint для проверки работоспособности
if (strpos($_SERVER['REQUEST_URI'], '/api/test') !== false) {
    $response = [
        'status' => 'ok',
        'message' => 'API работает',
        'timestamp' => time(),
        'server' => $_SERVER['SERVER_NAME'] ?? 'unknown',
        'php_version' => PHP_VERSION
    ];
    echo json_encode($response);
}
?>
