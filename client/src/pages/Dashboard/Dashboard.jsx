import React from 'react';
import { useTranslation } from 'react-i18next';
import ColumnChartComponent from '../../components/Chat/ColumnChartComponent';
import getUserRole from '../../utils/getUserRole';
import axiosInstance from '../../utils/axiosInstance';

export const Dashboard = () => {
  const { t } = useTranslation();

  const [userRole, setUserRole] = React.useState('');

  const [userInfo, setUserInfo] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      const role = await getUserRole();

      setUserRole(role);
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      const response = await axiosInstance('/user/get_user_info', 'get');

      console.log(response);

      setUserInfo(response.data.user);
    };

    if (userRole === 'customer') fetchData();
  }, [userRole]);

  return (
    <div className='h-full w-full px-[100px]'>
      <div className='grid grid-cols-3 gap-[70px] m-5 dark:text-white'>
        {userRole === 'customer' && (
          <>
            <div className='rounded-md h-24 border-2 flex flex-col shadow-md'>
              <p className='p-2'>{t('Total Sales')}</p>
              <p className='flex items-center justify-center text-2xl'>${userInfo.totalPurchase}</p>
            </div>
            <div className='rounded-md h-24 border-2 shadow-md'>
              <p className='p-2'>{t('Total Payments')}</p>
              <p className='flex items-center justify-center text-2xl'>${userInfo.totalPayment}</p>
            </div>
            <div className='rounded-md h-24 border-2 shadow-md'>
              <p className='p-2'>{t('Total Balance')}</p>
              <p className='flex items-center justify-center text-2xl'>${userInfo.totalBalance}</p>
            </div>
          </>
        )}
      </div>
      <ColumnChartComponent type='invoice' />
      <ColumnChartComponent type='payment' />
    </div>
  );
};
