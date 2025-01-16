import React from 'react';
import { useTranslation } from 'react-i18next';
import ColumnChartComponent from '../../components/Chat/ColumnChartComponent';
import axiosInstance from '../../utils/axiosInstance';

export const Dashboard = () => {
  const { t } = useTranslation();
  const [totalPurchase, setTotalPurchase] = React.useState(0);
  const [totalPayment, setTotalPayment] = React.useState(0);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance('/transaction/total_transaction_value', 'get');

        setTotalPurchase(response.data.TotalPurchases);
        setTotalPayment(response.data.TotalPayments);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className='w-full h-auto flex flex-col items-center gap-3 px-[100px] pb-[50px] pt-[200px] max-2xl:px-[50px] bg-gray-300 dark:bg-gray-900'>
      <div className='grid grid-cols-3 w-full max-2xl:grid-cols-3 max-xl:grid-cols-2 max-lg:grid-cols-1 gap-[70px] m-5 dark:text-white'>
        <div className='rounded-md h-24 border-2 bg-white dark:bg-gray-800 flex flex-col shadow-xl'>
          <p className='p-2'>{t('Total Sales')}</p>
          <p className='flex items-center justify-center text-2xl'>
            ${totalPurchase.toLocaleString()}
          </p>
        </div>
        <div className='rounded-md h-24 border-2 bg-white dark:bg-gray-800 shadow-xl'>
          <p className='p-2'>{t('Total Payments')}</p>
          <p className='flex items-center justify-center text-2xl'>
            ${totalPayment.toLocaleString()}
          </p>
        </div>
        <div className='rounded-md h-24 border-2 bg-white dark:bg-gray-800 shadow-xl'>
          <p className='p-2'>{t('Total Balance')}</p>
          <p className='flex items-center justify-center text-2xl'>
            ${(totalPurchase - totalPayment).toLocaleString()}
          </p>
        </div>
      </div>
      <ColumnChartComponent type='invoice' />
      <ColumnChartComponent type='payment' />
    </div>
  );
};
