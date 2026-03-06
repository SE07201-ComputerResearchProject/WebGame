/**
 * Health Check Utility
 * Kiểm tra kết nối Backend/Frontend
 */

import { API_BASE_URL, SOCKET_URL } from './config';

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      return {
        status: 'error',
        statusCode: response.status,
        message: `Backend returned status ${response.status}`,
      };
    }
    
    const data = await response.json();
    return {
      status: 'ok',
      statusCode: 200,
      message: data.message || 'Backend is running',
      data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      statusCode: 0,
      message: `Failed to connect to backend: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

export async function checkSocketIOHealth() {
  try {
    // Kiểm tra bằng cách gửi request đến Socket.IO engine.io endpoint
    const response = await fetch(`${SOCKET_URL}/socket.io/?EIO=4&transport=polling`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      return {
        status: 'ok',
        statusCode: 200,
        message: 'Socket.IO is running',
      };
    }
    
    return {
      status: 'error',
      statusCode: response.status,
      message: `Socket.IO returned status ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 'error',
      statusCode: 0,
      message: `Failed to connect to Socket.IO: ${errorMessage}`,
      error: errorMessage,
    };
  }
}

export async function checkAllConnections() {
  const backend = await checkBackendHealth();
  const socketio = await checkSocketIOHealth();
  
  return {
    timestamp: new Date().toISOString(),
    backend,
    socketio,
    allHealthy: backend.status === 'ok' && socketio.status === 'ok',
  };
}

export default {
  checkBackendHealth,
  checkSocketIOHealth,
  checkAllConnections,
};
