<?php
/**
 * Тестовый endpoint для проверки соединения с админ панелью
 */

// Настройки
$API_KEY = 'A555018A876E816C1C37DBC84C425B8A'; // Тот же ключ что и в working-hours-api.php
$ALLOWED_ORIGINS = [
    'https://adminpanel-iota-sage.vercel.app',    // Домен админ панели
    'https://htmlstanica.vercel.app',             // Домен основного сайта
    'http://localhost:3000',                      // Для разработки
    'http://localhost:5173'                       // Для разработки Vite
];

// CORS заголовки
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Проверка авторизации
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (!$authHeader || !preg_match('/Bearer\s+(.*)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Отсутствует токен авторизации']);
    exit();
}

$token = $matches[1];
if ($token !== $API_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Неверный API ключ']);
    exit();
}

// Успешный ответ
$response = [
    'status' => 'success',
    'message' => 'Соединение успешно установлено',
    'timestamp' => time(),
    'server' => $_SERVER['SERVER_NAME'] ?? 'unknown',
    'php_version' => PHP_VERSION,
    'api_version' => '1.0'
];

echo json_encode($response);
?>
