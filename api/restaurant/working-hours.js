// api/restaurant/working-hours.js - Vercel serverless function
import fs from 'fs';
import path from 'path';

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

  // For POST requests, check authorization
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Отсутствует токен авторизации' });
    }

    const token = authHeader.substring(7);
    if (token !== API_KEY) {
      return res.status(403).json({ error: 'Неверный API ключ' });
    }
  }

  // Validate working hours data
  function validateWorkingHours(data) {
    if (!data || !data.workingHours || typeof data.workingHours !== 'object') {
      return false;
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const statuses = ['green', 'yellow', 'red'];

    for (const day of days) {
      const hours = data.workingHours[day];
      if (!hours) return false;

      if (!hours.hasOwnProperty('open') || !hours.hasOwnProperty('close') ||
          !hours.hasOwnProperty('isOpen') || !hours.hasOwnProperty('status')) {
        return false;
      }

      if (!/^\d{2}:\d{2}$/.test(hours.open) || !/^\d{2}:\d{2}$/.test(hours.close)) {
        return false;
      }

      if (!statuses.includes(hours.status) || typeof hours.isOpen !== 'boolean') {
        return false;
      }
    }

    return true;
  }

  // Handle GET requests
  if (req.method === 'GET') {
    // Return default data (can be enhanced to read from database)
    const defaultData = {
      workingHours: {
        monday: { open: '11:00', close: '22:00', isOpen: true, status: 'green' },
        tuesday: { open: '11:00', close: '22:00', isOpen: true, status: 'green' },
        wednesday: { open: '11:00', close: '22:00', isOpen: true, status: 'green' },
        thursday: { open: '11:00', close: '22:00', isOpen: true, status: 'green' },
        friday: { open: '11:00', close: '23:00', isOpen: true, status: 'green' },
        saturday: { open: '11:00', close: '23:00', isOpen: true, status: 'green' },
        sunday: { open: '12:00', close: '21:00', isOpen: true, status: 'yellow' }
      }
    };

    const response = {
      success: true,
      data: defaultData,
      last_updated: null,
      server_time: Math.floor(Date.now() / 1000),
      note: 'Default data - using Vercel serverless function'
    };

    return res.status(200).json(response);
  }

  // Handle POST requests
  if (req.method === 'POST') {
    const data = req.body;

    if (!validateWorkingHours(data)) {
      return res.status(400).json({ error: 'Неверный формат данных' });
    }

    // Add metadata
    data.last_updated = Math.floor(Date.now() / 1000);
    data.updated_by = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    // In a real implementation, you would save to a database
    // For now, we just return success
    const response = {
      success: true,
      message: 'Данные сохранены',
      timestamp: Math.floor(Date.now() / 1000)
    };

    return res.status(200).json(response);
  }

  // Method not allowed
  return res.status(405).json({ error: 'Метод не поддерживается' });
}
