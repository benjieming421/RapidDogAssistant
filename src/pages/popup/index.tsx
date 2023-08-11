import { verifyToken } from '@/axios/api';
import {
  getCaptcha,
  ispositiveAndNegativereturnColor,
  verifyCaptcha,
} from '@/utils';
import { PoweroffOutlined } from '@ant-design/icons';
import { Button, Image, Input, message, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import styles from './style.less';

interface DataType {
  key: React.Key;
  name: string;
  price: number;
  increase: number;
  date: string;
}

const modeData = {
  name: 'BTCUSDT',
  price: 23044.23,
  wave: -11.6,
  wavep: -0.36,
};

const columns: ColumnsType<DataType> = [
  {
    title: '货币',
    dataIndex: 'name',
  },
  {
    title: '价格',
    dataIndex: 'price',
  },
  {
    title: '涨跌幅',
    dataIndex: 'increase',
    align: 'center',
    render: (price) => (
      <div style={{ color: ispositiveAndNegativereturnColor(price) }}>
        {price + '%'}
      </div>
    ),
  },
  {
    title: '更新时间',
    dataIndex: 'date',
    align: 'right',
    width: 80,
  },
];

const data: DataType[] = [
  {
    key: '1',
    name: 'BTC',
    price: 32231,
    increase: -1.67,
    date: '14:59',
  },
  {
    key: '2',
    name: 'ETH',
    price: 2800,
    increase: -1.67,
    date: '14:59',
  },
  {
    key: '3',
    name: 'DOGE',
    price: 0.0232,
    increase: 1.67,
    date: '14:59',
  },
  {
    key: '4',
    name: 'LUNA',
    price: 32231,
    increase: -1.67,
    date: '14:59',
  },
  {
    key: '5',
    name: 'ATC',
    price: 2800,
    increase: -1.67,
    date: '14:59',
  },
  {
    key: '6',
    name: 'X',
    price: 0.0232,
    increase: 1.67,
    date: '14:59',
  },
];

const Popup = () => {
  //验证码弹出框状态
  const [isModalOpen, setIsModalOpen] = useState(false);

  //验证码数据
  const [verificationImage, setVerificationImage] = useState({
    id: '',
    image: '',
    value: '',
  });

  //验证码输入框的状态
  const [inputType, setInputType] = useState('');

  //token验证按钮的状态
  const [tokendanger, setTokendanger] = useState(true);

  //验证全局提醒
  const [messageApi, contextHolder] = message.useMessage();
  const key = 'updatable';

  //弹出验证码
  const ejectModal = async () => {
    const capcha = await getCaptcha();
    console.log(capcha, 'capcha');
    setVerificationImage({
      id: capcha.id,
      image: capcha.image,
      value: '',
    });
    setIsModalOpen(true);
  };

  //验证验证码
  const validate = async () => {
    const capcha = await verifyCaptcha({
      id: verificationImage.id,
      value: verificationImage.value,
    });
    messageApi.open({
      key,
      type: 'loading',
      content: 'Loading...',
    });
    if (capcha?.is_verified) {
      if (!chrome.runtime.lastError) {
        chrome.storage.local.set({ token: capcha.ave_token }, function () {
          console.log('Data saved.', capcha.ave_token);
        });
        const verifyData = await verifyToken();
        if (verifyData?.status == 1) {
          setIsModalOpen(false);
          setTokendanger(false);
          messageApi.open({
            key,
            type: 'success',
            content: 'Success!',
            duration: 2,
          });
        } else {
          messageApi.open({
            key,
            type: 'error',
            content: '请联系管理员!',
            duration: 2,
          });
          setTokendanger(true);
        }
      }
    } else {
      setInputType('error');
    }
  };

  useEffect(() => {
    (async () => {
      let resolut = await verifyToken();
      console.log(resolut);
    })();
  }, []);

  // //监听token
  // useEffect(() => {
  //   if (!chrome.runtime.lastError) {
  //     chrome.storage.onChanged.addListener(function (changes, namespace) {
  //       for (let key in changes) {
  //         if (key == 'token') {
  //           let storageResoult = changes[key].newValue;
  //         }
  //       }
  //     });
  //   }
  // }, []);

  return (
    <div className={styles.app}>
      {contextHolder}
      <div className={styles.top}>
        {new Array(4).fill(0).map((item, index) => {
          return <Card {...modeData} key={index} />;
        })}
      </div>

      <div className={styles.tablex}>
        <Table
          columns={columns}
          dataSource={data}
          size="small"
          pagination={false}
          bordered={false}
          className={styles.column}
          rowClassName={styles.row}
          scroll={{ y: '46vh' }}
        />
      </div>

      <Button
        danger={tokendanger}
        icon={<PoweroffOutlined />}
        size={'small'}
        onClick={() => ejectModal()}
        style={{ width: '5.3vw', height: '8.3vh' }}
        type="primary"
      />

      <Modal
        title="验证"
        open={isModalOpen}
        onOk={() => {
          validate();
        }}
        onCancel={() => {
          setIsModalOpen(false);
        }}
        style={{ top: 20 }}
        width={'60vw'}
        okText={'validate'}
        cancelButtonProps={{ style: { display: 'none' } }}
        className={styles.validate_modal}
      >
        <div className={styles.validate_content}>
          <Image
            width={'100%'}
            height={77}
            preview={false}
            title="点击刷新"
            key={verificationImage.id}
            src={verificationImage.image}
            onClick={() => ejectModal()}
            fallback="data:image/png;base64,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"
          />
          <Input
            placeholder="结果"
            className={styles.inputnumber}
            status={inputType}
            onChange={(e: any) => {
              setVerificationImage((item: any) => {
                return {
                  ...item,
                  value: e.target.value.toString(),
                };
              });
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Popup;

interface carprops {
  name: string;
  price: number;
  wave: number;
  wavep: number;
}

const Card = (data: carprops) => {
  return (
    <div
      className={styles.cardx}
      style={{ color: ispositiveAndNegativereturnColor(data.wave) }}
    >
      <div className={styles.title}>{data.name}</div>
      <div className={styles.price}>${data.price}</div>
      <div className={styles.footer}>
        {data.wave}&nbsp;&nbsp;{data.wavep + '%'}
      </div>
    </div>
  );
};
