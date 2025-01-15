import { Button, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaRegSave, FaEye, FaEyeSlash } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { LoadingOutlined } from '@ant-design/icons';

const Profile = () => {
  const { t } = useTranslation();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const response = await axiosInstance('/user/get_user_info', 'get');

      const data = response.data.user;

      setFirstName(data.firstName);
      setLastName(data.lastName);
      setPhoneNumber(data.phoneNumber);
      setHomeAddress(data.homeAddress);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const onSubmit = async () => {
    if (updatePassword === true) {
      const passwordError = validatePassword(password);

      if (passwordError) {
        toast.error(passwordError);

        return;
      }
    }

    const response = await axiosInstance('/user/update_user', 'put', {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      homeAddress: homeAddress,
      password: password,
    });

    if (response.status === 200) {
      toast.success(t('Updated successfully'));
      window.location.reload();
    } else {
      toast.error(t(response.data.message));
    }
  };

  const validatePassword = (password) => {
    const minLength = /.{8,}/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;
    const number = /[0-9]/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;

    if (!minLength.test(password)) return t('Password must be at least 8 characters long.');
    if (!specialChar.test(password))
      return t('Password must include at least one special character.');
    if (!number.test(password)) return t('Password must include at least one number.');
    if (!upperCase.test(password)) return t('Password must include at least one uppercase letter.');
    if (!lowerCase.test(password)) return t('Password must include at least one lowercase letter.');
    return '';
  };

  return (
    <div className='min-h-screen px-[100px] pb-[50px] pt-[200px] max-xl:px-[50px] max-sm:px-[15px] bg-gray-300 dark:bg-gray-900 overflow-hidden'>
      <div className='max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        {isLoading ? (
          <div className='w-full h-[200px] flex justify-center items-center'>
            <LoadingOutlined className='text-[40px]' />
          </div>
        ) : (
          <>
            <div className='flex flex-col w-full'>
              <label className='block text-gray-700 dark:text-gray-300'>{t('First Name')}</label>
              <input
                type='text'
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={t('First Name')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className='flex flex-col w-full'>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Last Name')}</label>
              <input
                type='text'
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={t('Last Name')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className='flex flex-col w-full'>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Phone Number')}</label>
              <input
                type='text'
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={t('Phone Number')}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className='flex flex-col w-full'>
              <label className='block text-gray-700 dark:text-gray-300'>{t('Home Address')}</label>
              <input
                type='text'
                className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300'
                placeholder={t('Home Address')}
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
              />
            </div>
            <div className='flex w-full justify-between items-center'>
              <label className='block text-gray-700 dark:text-gray-300'>
                {t('Change Password')}
              </label>
              <Switch size='small' value={updatePassword} onChange={setUpdatePassword} />
            </div>
            {updatePassword === true && (
              <div className='flex flex-col w-full'>
                <label className='block text-gray-700 dark:text-gray-300'>
                  {t('New Password')}
                </label>
                <div className='flex items-center justify-end'>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    className='w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-300 pr-10'
                    name='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type='button'
                    onClick={() => setIsPasswordVisible((prev) => !prev)}
                    className='absolute mr-3'
                  >
                    {isPasswordVisible ? (
                      <FaEyeSlash className='dark:text-gray-400' />
                    ) : (
                      <FaEye className='dark:text-gray-400' />
                    )}
                  </button>
                </div>
              </div>
            )}
            <div className='flex justify-end items-center'>
              <Button type='primary' onClick={onSubmit}>
                <FaRegSave />
                Update
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
