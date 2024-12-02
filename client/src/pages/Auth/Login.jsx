import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { useCookies } from 'react-cookie';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export const Login = () => {
  const { t } = useTranslation();
  const router = useNavigate();
  const [, setCookie] = useCookies(['token']);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axiosInstance('/user/login', 'post', {
        email: event.target.email.value,
        password: event.target.password.value,
      });

      if (response.status === 200) {
        toast.success(t('Login successful'));

        setCookie('token', response.data.accessToken, {
          expires: new Date(response.data.expires_at),
        });
        router('/dashboard');
      } else {
        console.log(123456);

        toast.error('you have entered an invalid email or password');
      }
    } catch (err) {
      console.log(123456);

      console.error(err);
    }
  };

  return (
    <div className='bg-gray-50 font-[sans-serif]'>
      <div className='min-h-screen flex flex-col items-center justify-center py-6 px-4'>
        <div className='max-w-md w-full'>
          <Link href='#'>
            <img
              src='https://readymadeui.com/readymadeui.svg'
              alt='logo'
              className='w-40 mb-8 mx-auto block'
            />
          </Link>

          <div className='p-8 rounded-2xl bg-white shadow'>
            <h2 className='text-gray-800 text-center text-2xl font-bold'>Sign in</h2>
            <form className='mt-8 space-y-4' onSubmit={onSubmit}>
              <div>
                <label className='text-gray-800 text-sm mb-2 block'>Email</label>
                <div className='relative flex items-center'>
                  <input
                    name='email'
                    type='email'
                    required
                    className='w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600'
                    placeholder='Enter user name'
                  />
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='#bbb'
                    stroke='#bbb'
                    className='w-4 h-4 absolute right-4'
                    viewBox='0 0 24 24'
                  >
                    <circle cx='10' cy='7' r='6' data-original='#000000'></circle>
                    <path
                      d='M14 15H6a5 5 0 0 0-5 5 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 5 5 0 0 0-5-5zm8-4h-2.59l.3-.29a1 1 0 0 0-1.42-1.42l-2 2a1 1 0 0 0 0 1.42l2 2a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-.3-.29H22a1 1 0 0 0 0-2z'
                      data-original='#000000'
                    ></path>
                  </svg>
                </div>
              </div>

              <div>
                <label className='text-gray-800 text-sm mb-2 block'>Password</label>
                <div className='relative flex items-center'>
                  <input
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    className='w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600'
                    placeholder='Enter password'
                  />
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='#bbb'
                    stroke='#bbb'
                    className='w-4 h-4 absolute right-4 cursor-pointer'
                    viewBox='0 0 128 128'
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    <path
                      d='M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z'
                      data-original='#000000'
                    ></path>
                  </svg>
                </div>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div className='flex items-center'>
                  <input
                    id='remember-me'
                    name='remember-me'
                    type='checkbox'
                    className='h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <label htmlFor='remember-me' className='ml-3 block text-[13px] text-gray-800'>
                    Remember me
                  </label>
                </div>
              </div>

              <div className='!mt-8'>
                <button
                  type='submit'
                  className='w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none'
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
