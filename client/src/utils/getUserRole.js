import axiosInstance from './axiosInstance';

const getUserRole = async () => {
  const response = await axiosInstance('/user/user_role', 'get');

  return response.data.role;
};

export default getUserRole;
