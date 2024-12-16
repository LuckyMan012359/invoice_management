import { useTranslation } from 'react-i18next';
import 'react-datepicker/dist/react-datepicker.css';
import { useState } from 'react';
import { Badge, Tabs } from 'antd';
import { TransactionTable } from '../../components/Tables/transactionTable';
import { TransactionPendingTable } from '../../components/Tables/transactionPendingTable';
import { TransactionCreateApproveTable } from '../../components/Tables/transactionCreateApproveTable';
import { TransactionUpdateApproveTable } from '../../components/Tables/transactionUpdateApproveTable';

const { TabPane } = Tabs;

export const Transactions = () => {
  const { t } = useTranslation();

  const [isChanged, setIsChanged] = useState(false);
  const [tabNum, setTabNum] = useState('1'); // Tracks the selected tab

  return (
    <div className='min-h-screen px-[100px] pb-[50px] pt-[200px] max-xl:px-[50px] max-sm:px-[15px] bg-gray-100 dark:bg-gray-900'>
      <div className='mx-auto bg-white shadow-md rounded-lg p-6 space-y-6 dark:bg-gray-800'>
        <Tabs
          activeKey={tabNum}
          onChange={(key) => setTabNum(key)} // Updates the active tab
        >
          <TabPane
            tab={
              <Badge
                dot={false}
                className={`dark:!text-[#fff] ${
                  tabNum === '1'
                    ? '!text-[#1677ff] dark:!text-[#1677ff]'
                    : '!text-[#000] dark:!text-[#fff]'
                }`}
              >
                {t('Transactions')}
              </Badge>
            }
            key='1'
          >
            <TransactionTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={
              <Badge
                count={10}
                showZero={false}
                overflowCount={99}
                className={`dark:!text-[#fff] ${
                  tabNum === '2'
                    ? '!text-[#1677ff] dark:!text-[#1677ff]'
                    : '!text-[#000] dark:!text-[#fff]'
                }`}
              >
                {t('Pending Transactions')}
              </Badge>
            }
            key='2'
          >
            <TransactionPendingTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={
              <Badge
                count={10}
                showZero={false}
                overflowCount={99}
                className={`dark:!text-[#fff] ${
                  tabNum === '3'
                    ? '!text-[#1677ff] dark:!text-[#1677ff]'
                    : '!text-[#000] dark:!text-[#fff]'
                }`}
              >
                {t('Approve Create Transaction')}
              </Badge>
            }
            key='3'
          >
            <TransactionCreateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
          <TabPane
            tab={
              <Badge
                count={10}
                showZero={false}
                overflowCount={99}
                className={`dark:!text-[#fff] ${
                  tabNum === '4'
                    ? '!text-[#1677ff] dark:!text-[#1677ff]'
                    : '!text-[#000] dark:!text-[#fff]'
                }`}
              >
                {t('Approve Update Transaction')}
              </Badge>
            }
            key='4'
          >
            <TransactionUpdateApproveTable isChanged={isChanged} setIsChanged={setIsChanged} />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};
