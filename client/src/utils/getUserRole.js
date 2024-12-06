import axiosInstance from './axiosInstance';

const getUserRole = async () => {
  const response = await axiosInstance('/user/get_user_info', 'get');

  if (response.data.user) {
    return response.data.user.role;
  } else {
    return '';
  }
};

export default getUserRole;
