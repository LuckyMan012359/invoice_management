import axiosInstance from './axiosInstance';

const getUserRole = async () => {
  const response = await axiosInstance('/user/user_role', 'get');

  console.log(response);

  return response.data.role;
};

export default getUserRole;
