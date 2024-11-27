import axios from 'axios';
import { Cookies } from 'react-cookie';

const axiosInstance = async (url, method, data, config = {}) => {
  const cookies = new Cookies();
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    validateStatus: (status) => {
      return true;
    },
  });

  instance.interceptors.request.use(
    (config) => {
      if (cookies.get('token')) {
        config.headers.Authorization = `Bearer ${cookies.get('token')}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  const requestConfig = {
    ...config,
    method,
    url,
    ...(method !== 'get' && method !== 'delete' ? { data } : { params: data }),
  };

  return await instance.request(requestConfig);
};

export default axiosInstance;
