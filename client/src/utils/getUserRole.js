import axiosInstance from './axiosInstance';

const getUserRole = async () => {
  const response = await axiosInstance('/user/get_user_info', 'get');

  return response.data.user.role;
};

export default getUserRole;
