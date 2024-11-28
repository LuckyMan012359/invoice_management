import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import axiosInstance from '../../utils/axiosInstance';

const ColumnChartComponent = ({ type }) => {
  const { t } = useTranslation();
  const isDarkMode = useSelector((state) => state.darkMode.isDarkMode);

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance('/customer/get_only_customers', 'get', {
          pageNum: '',
          pageSize: '',
          keyword: '',
        });

        const data = response.data?.data || [];

        const sortedData =
          type === 'invoice'
            ? data.sort((a, b) => (b.totalPurchase || 0) - (a.totalPurchase || 0))
            : type === 'payment'
            ? data.sort((a, b) => (b.totalPayment || 0) - (a.totalPayment || 0))
            : data.sort((a, b) => (b.totalReturn || 0) - (a.totalReturn || 0));

        setChartData(sortedData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [type, t]);

  const chartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
    },
    colors: ['#008FFB', '#00E396'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => val?.toLocaleString() || '0',
      style: {
        colors: isDarkMode ? ['#FFFFFF'] : ['#000000'],
      },
    },
    xaxis: {
      categories: chartData.length
        ? chartData.map((item) => item.firstName || t('Unknown'))
        : [t('No Data')],
      labels: {
        style: {
          colors: isDarkMode ? ['#FFFFFF'] : ['#000000'],
        },
      },
    },
    yaxis: {
      title: {
        text:
          type === 'invoice'
            ? t('Total Purchases')
            : type === 'payment'
            ? t('Total Payments')
            : t('Total Returns'),
        style: {
          color: isDarkMode ? '#FFFFFF' : '#0D1526',
        },
      },
      labels: {
        formatter: (val) => val?.toLocaleString() || '0', // Safely format values
        style: {
          colors: isDarkMode ? ['#FFFFFF'] : ['#000000'],
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val) => val?.toLocaleString() || '0', // Safely format tooltip values
      },
    },
  };

  const seriesData = [
    {
      name:
        type === 'invoice'
          ? t('Total Purchases')
          : type === 'payment'
          ? t('Total Payments')
          : t('Total Returns'),
      data: chartData.length
        ? type === 'invoice'
          ? chartData.map((item) => item.totalPurchase || 0)
          : type === 'payment'
          ? chartData.map((item) => item.totalPayment || 0)
          : chartData.map((item) => item.totalReturn || 0)
        : [0], // Fallback when no data
    },
  ];

  return (
    <>
      <div className='w-full text-center text-[#000] text-[20px] mt-[50px] mb-[20px] dark:text-[#fff]'>
        {type === 'invoice'
          ? t('Total Purchases')
          : type === 'payment'
          ? t('Total Payments')
          : t('Total Returns')}
      </div>
      <div className='dark:text-white overflow-auto'>
        <div className='w-full max-xl:w-[1180px]'>
          <Chart options={chartOptions} series={seriesData} type='bar' height={350} />
        </div>
      </div>
    </>
  );
};

export default ColumnChartComponent;
