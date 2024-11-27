import React from 'react';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const ColumnChartComponent = ({type}) => {
    const { t } = useTranslation();
    const isDarkMode = useSelector((state) => state.darkMode.isDarkMode)

    const chartOptions = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: false
            }
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
            categories: ['January', 'February', 'March', 'April'],
            labels: {
                style: {
                    colors: isDarkMode ? ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'] : ['#000000', '#000000', '#000000', '#000000']
                },
            },
        },
        yaxis: {
            title: {
                text: 'Sales',
                style: {
                    color: isDarkMode ? '#FFFFFF' : '#0D1526'
                }
            },
            labels: {
                style: {
                    colors: isDarkMode ? ['#FFFFFF'] : '#000000'
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
            name: 'Sales',
            data: [30, 40, 45, 50],
        },
    ];

    return (
        <div className='dark:text-white'>
            <Chart options={chartOptions} series={seriesData} type="bar" height={350} />
        </div>
    );
};

export default ColumnChartComponent;
