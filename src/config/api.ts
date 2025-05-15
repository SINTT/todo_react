import axios from 'axios';

export const API_URL = 'http://10.0.2.2:3000'; // For Android Emulator
// export const API_URL = 'http://localhost:3000'; // For iOS Simulator

export const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkServerConnection = async () => {
  try {
    await api.get('/health');
    return true;
  } catch (error) {
    console.error('Server connection failed:', error);
    return false;
  }
};
