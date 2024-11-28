import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClickOutside from '../ClickOutside';
import UserOne from '../../images/user/user-01.png';
import { useCookies } from 'react-cookie';
import { UserOutlined } from '@ant-design/icons';
import { TbLogout2 } from 'react-icons/tb';

const DropdownUser = () => {
  const [, , removeCookie] = useCookies(['token']);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <ClickOutside onClick={() => setDropdownOpen(false)} className='relative w-full'>
      <Link
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className='flex items-center gap-4'
        to='#'
      >
        <span className='hidden text-right lg:block'>
          <span className='block text-sm font-medium text-black dark:text-white'>Thomas Anree</span>
          <span className='block text-xs dark:text-white'>UX Designer</span>
        </span>

        <span className='h-12 w-12 rounded-full'>
          <img src={UserOne} alt='User' />
        </span>

        <svg
          className='hidden fill-current sm:block'
          width='12'
          height='8'
          viewBox='0 0 12 8'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            fillRule='evenodd'
            clipRule='evenodd'
            d='M0.410765 0.910734C0.736202 0.585297 1.26384 0.585297 1.58928 0.910734L6.00002 5.32148L10.4108 0.910734C10.7362 0.585297 11.2638 0.585297 11.5893 0.910734C11.9147 1.23617 11.9147 1.76381 11.5893 2.08924L6.58928 7.08924C6.26384 7.41468 5.7362 7.41468 5.41077 7.08924L0.410765 2.08924C0.0853277 1.76381 0.0853277 1.23617 0.410765 0.910734Z'
            fill=''
          />
        </svg>
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
                My Profile
              </Link>
            </li>
          </ul>
          <button
            className='flex items-center gap-3.5 px-6 py-4 text-sm font-medium duration-300 ease-in-out hover:text-blue-500 lg:text-base'
            onClick={() => removeCookie('token', { path: '/' })}
          >
            <TbLogout2 className='text-[23px]' />
            Log Out
          </button>
        </div>
      )}
    </ClickOutside>
  );
};

export default DropdownUser;
