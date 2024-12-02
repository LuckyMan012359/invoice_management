import axios from 'axios';
import { Cookies } from 'react-cookie';

const axiosInstance = async (url, method, data, config = {}) => {
  const cookies = new Cookies();

  // Axios configuration
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api', // Fallback to local API
    validateStatus: (status) => {
      return true;
    },
  });

  // Request interceptor to add Authorization header
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

  // Configure the request
  const requestConfig = {
    ...config,
    method,
    url,
    ...(method !== 'get' && method !== 'delete' ? { data } : { params: data }),
  };

  // Execute the request
  try {
    const response = await instance.request(requestConfig);
    return response; // Return data directly
  } catch (error) {
    console.error('Network Error:', error); // Log the error for debugging
    throw error; // Re-throw for proper error handling
  }
};

export default axiosInstance;
