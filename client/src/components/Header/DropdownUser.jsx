import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import UserOne from '../../images/user/user-01.png';
import { useCookies } from 'react-cookie';
import { UserOutlined } from '@ant-design/icons';
import { TbLogout2 } from 'react-icons/tb';
import axiosInstance from '../../utils/axiosInstance';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

const DropdownUser = () => {
  const { t } = useTranslation();
  const [, , removeCookie] = useCookies(['token']);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [userData, setUserData] = useState({});

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance('/user/get_user_info', 'get');
        console.log(response.data.user);

        setUserData(response.data.user);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className='relative w-full'>
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className='flex items-center gap-4'
        to='#'
      >
        <span className='hidden text-right lg:block'>
          <span className='block text-sm font-medium text-black dark:text-white'>
            {userData.firstName} {userData.lastName}
          </span>
          <span className='block text-xs dark:text-white'>
            {userData.role === 'admin' ? t('Administrator') : t('Customer')}
          </span>
        </span>

        <span className='h-12 w-12 rounded-full'>
          <img src={UserOne} alt='User' className='rounded-full' />
        </span>

        <MdKeyboardArrowDown className='hidden fill-current sm:block text-[20px]' />
      </Link>

      {dropdownOpen && (
        <div
          className={`absolute right-0 mt-4 flex w-[220px] flex-col rounded-md z-[1] border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-[#fff]`}
        >
          <ul className='flex flex-col py-4 gap-5 border-b border-stroke px-6 py-7.5 dark:border-strokedark'>
            <li>
              <Link
                to='/profile'
                className='flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-primary lg:text-base'
              >
                <UserOutlined className='text-[20px]' />
                {t('My profile')}
              </Link>
            </li>
          </ul>
          <button
            className='flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-blue-500 lg:text-base'
            onClick={() => removeCookie('token', { path: '/' })}
          >
            <TbLogout2 className='text-[23px]' />
            {t('Log out')}
          </button>
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownUser;
