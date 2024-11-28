import React from 'react';
import { useTranslation } from 'react-i18next';
import ColumnChartComponent from '../../components/Chat/ColumnChartComponent';
import getUserRole from '../../utils/getUserRole';
import axiosInstance from '../../utils/axiosInstance';

export const Dashboard = () => {
  const { t } = useTranslation();

  const [userRole, setUserRole] = React.useState('');
  const [userInfo, setUserInfo] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const role = await getUserRole();
      setUserRole(role);
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance('/user/get_user_info', 'get');
        setUserInfo(response.data.user);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    if (userRole === 'customer') fetchData();
  }, [userRole]);

  return (
    <div className='w-full h-auto px-[100px] pb-[50px] pt-[200px] max-2xl:px-[50px]'>
      <div className='grid grid-cols-3 max-xl:grid-cols-2 max-lg:grid-cols-1 gap-[70px] m-5 dark:text-white'>
        {userRole === 'customer' && userInfo && (
          <>
            <div className='rounded-md h-24 border-2 flex flex-col shadow-md'>
              <p className='p-2'>{t('Total Sales')}</p>
              <p className='flex items-center justify-center text-2xl'>
                ${userInfo.totalPurchase.toLocaleString()}
              </p>
            </div>
            <div className='rounded-md h-24 border-2 shadow-md'>
              <p className='p-2'>{t('Total Payments')}</p>
              <p className='flex items-center justify-center text-2xl'>
                ${userInfo.totalPayment.toLocaleString()}
              </p>
            </div>
            <div className='rounded-md h-24 border-2 shadow-md'>
              <p className='p-2'>{t('Total Balance')}</p>
              <p className='flex items-center justify-center text-2xl'>
                ${userInfo.totalBalance.toLocaleString()}
              </p>
            </div>
          </>
        )}
      </div>
      <ColumnChartComponent type='invoice' />
      <ColumnChartComponent type='payment' />
    </div>
  );
};
