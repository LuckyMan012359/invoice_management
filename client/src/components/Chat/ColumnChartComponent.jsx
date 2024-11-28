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

        const data = response.data.data;

        const sortedData =
          type === 'invoice'
            ? data.sort((a, b) => b.totalPurchase - a.totalPurchase)
            : data.sort((a, b) => b.totalPayment - a.totalPayment);

        setChartData(sortedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [type]);

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
      style: {
        colors: isDarkMode ? ['#FFFFFF'] : ['#000000'],
      },
    },
    xaxis: {
      categories: chartData.map((item) => item.firstName),
      labels: {
        style: {
          colors: isDarkMode
            ? ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']
            : ['#000000', '#000000', '#000000', '#000000'],
        },
      },
    },
    yaxis: {
      title: {
        text: type === 'invoice' ? t('Total Purchases') : t('Total Payments'),
        style: {
          color: isDarkMode ? '#FFFFFF' : '#0D1526',
        },
      },
      labels: {
        style: {
          colors: isDarkMode ? ['#FFFFFF'] : '#000000',
        },
      },
    },
    title: {
      text: type === 'invoice' ? `${t('Invoices Data')}` : `${t('Payments Data')}`,
      align: 'center',
      style: {
        color: isDarkMode ? '#FFFFFF' : '#0D1526',
      },
    },
  };

  const seriesData = [
    {
      name: type === 'invoice' ? t('Total Purchases') : t('Total Payments'),
      data:
        type === 'invoice'
          ? chartData.map((item) => item.totalPurchase)
          : chartData.map((item) => item.totalPayment),
    },
  ];

  return (
    <div className='dark:text-white'>
      <Chart options={chartOptions} series={seriesData} type='bar' height={350} />
    </div>
  );
};

export default ColumnChartComponent;
