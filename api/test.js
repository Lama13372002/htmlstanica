// api/test.js - Vercel serverless function
export default function handler(req, res) {
  const API_KEY = 'A555018A876E816C1C37DBC84C425B8A';

  const ALLOWED_ORIGINS = [
    'https://adminpanel-iota-sage.vercel.app',
    'https://htmlstanica.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];

  // CORS headers
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check authorization
  const authHeader = req.headers.authorization || '';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Отсутствует токен авторизации' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (token !== API_KEY) {
    return res.status(403).json({ error: 'Неверный API ключ' });
  }

  // Success response
  const response = {
    status: 'success',
    message: 'Соединение успешно установлено',
    timestamp: Math.floor(Date.now() / 1000),
    server: req.headers.host || 'unknown',
    node_version: process.version,
    api_version: '1.0'
  };

  res.status(200).json(response);
}
