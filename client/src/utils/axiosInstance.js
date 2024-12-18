import axios from 'axios';
import { Cookies } from 'react-cookie';

const axiosInstance = async (url, method, data, config = {}) => {
  const cookies = new Cookies();

  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', // Fallback to local API
    validateStatus: (status) => {
      return true;
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const token = cookies.get('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  const requestConfig = {
    ...config,
    method,
    url,
    ...(method !== 'get' && method !== 'delete' ? { data } : { params: data }),
  };

  try {
    const response = await instance.request(requestConfig);

    if (response.status === 404) {
      cookies.remove('token');

      window.location.href = '/login';

      return;
    }

    return response;
  } catch (error) {
    console.error('Network Error:', error);

    throw error;
  }
};

export default axiosInstance;
