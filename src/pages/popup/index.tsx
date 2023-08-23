import { getToken, verifyToken } from '@/axios/api';
import {
  clearTimeoutList,
  getCaptcha,
  getNowTime,
  ispositiveAndNegativereturnColor,
  priceConverter,
  verifyCaptcha,
} from '@/utils';
import sessionT from '@/utils/session';
import {
  ExportOutlined,
  PoweroffOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Image,
  Input,
  message,
  Modal,
  Skeleton,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import Marquee from 'react-fast-marquee';
import styles from './style.less';

import SetPage from './SetPage';

interface DataType {
  symbol: string;
  current_price_usd: number;
  price_change: number;
  time: string;
  dexname: string;
}

const alertTitle = `注意！！！数据来源于链上各大平台如：uniswap、pancakeswap等一级市场，与币安、ok等各大交易所的二级市场代币价格有所波动。`;

const columns: ColumnsType<DataType> = [
  {
    title: '货币',
    dataIndex: 'symbol',
    align: 'center',
    className: styles.symbolcolumns,
    render: (text, record, index) => {
      const urlhandle = (data: string) => {
        try {
          let url = data;
          if (url.indexOf('undefined') != -1) return 'error';
          return url;
        } catch (e) {
          return 'error';
        }
      };
      return (
        <div className={styles.symbol_index}>
          <div className={styles.icon_aggregate}>
            <Image
              preview={false}
              className={styles.icon1}
              src={urlhandle(`${window?.iconUrl}${record?.logo_url}`)}
              fallback="data:image/png;base64,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"
            />
            <Image
              preview={false}
              className={styles.icon2}
              src={urlhandle(`${window?.iconUrl}chain/${record?.chain}.png`)}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="
            />
          </div>
          <div className={styles.symboltext}>
            {text}&nbsp;&nbsp;
            <div className={styles.transmit}>
              <ExportOutlined
                onClick={() => {
                  //复制到粘贴板
                  navigator.clipboard.writeText(
                    `${window?.tokenUrl}${record?.token}-${record?.chain}`,
                  );
                  message.success('复制代币链接成功~，到浏览器打开吧');
                }}
              />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    title: '价格',
    dataIndex: 'current_price_usd',
    align: 'center',
  },
  {
    title: '涨跌幅',
    dataIndex: 'price_change',
    align: 'center',
    render: (price) => (
      <div style={{ color: ispositiveAndNegativereturnColor(price) }}>
        {price < 0 ? `${price}%` : `+${price}` + '%'}
      </div>
    ),
  },
  {
    title: '更新时间',
    dataIndex: 'time',
    align: 'right',
    width: 80,
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

  //实时更新 | 暂停更新
  const [ssgxType, SetssgxType] = useState(false);

  //验证全局提醒
  const [messageApi, contextHolder] = message.useMessage();
  const key = 'updatable';

  //定时器列表
  const timesListRef: any = useRef([]);

  //首页coin列表信息
  const [coinContent, setCoinContent] = useState([]);

  //刷新按钮状态
  const [syncOutlinedType, setSyncOutlinedType] = useState(false);

  //alert公告框状态
  const [alertType, setAlertType] = useState(false);

  //骨架屏状态
  const [skeletonType, setSkeletonType] = useState<number>(0);

  //当前主页显示的组件名称
  const [pagename, setPagename] = useState('SetPage');

  useEffect(() => {
    (async () => {
      try {
        //测试是否联通
        let verifyData = await verifyToken();
        if (verifyData?.status == 1) {
          setTokendanger(false);
          chrome.runtime.connect({ name: 'popup' });
          console.log('popup has been open', getNowTime());
          //打开popup页面默认执行的函数
          openPopupFun();
          //alert公告框弹出判断
          alterModalshowFun();
          //默认读取的coinList列表
          updateCoinList();
        } else {
          ejectModal();
        }
      } catch (error) {
        ejectModal();
      }
    })();
  }, []);

  //监听coinList ---待更新的coin列表
  useEffect(() => {
    if (!chrome.runtime.lastError) {
      chrome.storage.onChanged.addListener(function (changes, namespace) {
        for (let key in changes) {
          if (key == 'coinList-detail') {
            console.log(changes, `changes local 更新时间${getNowTime()}`);
            updateCoinList();
          }
        }
      });
    }
    return () => {
      //页面退出停止监听列表
      chrome.runtime.sendMessage({ endfetchDataAndUpdate: true });
      //页面退出清除定时器
      clearTimeoutList(timesListRef.current);
      //重置骨架屏设置
      setSkeletonType(0);
      //重置主页名称
      setPagename('');
    };
  }, []);

  //更新页面显示的coinList列表
  const updateCoinList = async () => {
    const coinListDetail = await sessionT.get('coinList-detail');
    setCoinContent(coinListDetail || []);
  };

  //打开popup页面执行的函数
  const openPopupFun = async () => {
    const updateBtn = await sessionT.get('updateBtn');
    SetssgxType(updateBtn || false);
    SendupdateBtnFun(updateBtn);
    coinListreq();
  };

  //弹出验证码
  const ejectModal = async (num = 0) => {
    try {
      const capcha = await getCaptcha();
      console.log(capcha, 'capcha');
      setVerificationImage({
        id: capcha.id,
        image: capcha.image,
        value: '',
      });
      setIsModalOpen(true);
    } catch (error) {
      if (num == 0) {
        //第一次请求失败 重新请求
        ejectModal(1);
        return;
      } else {
        console.log(error);
        messageApi.open({
          key,
          type: 'error',
          content: '当前ip可能被暂时风控，请尝试切换你的VPN节点',
          duration: 10,
        });
        setTokendanger(false);
      }
    }
  };

  //验证验证码
  const validate = async () => {
    try {
      const capcha = await verifyCaptcha({
        id: verificationImage.id,
        value: verificationImage.value,
      });
      messageApi.open({
        key,
        type: 'loading',
        content: 'Loading...',
        duration: 0,
      });
      if (capcha?.is_verified) {
        await sessionT.set('token', capcha.ave_token);
        const verifyData = await verifyToken({ 'X-Auth': capcha.ave_token });
        if (verifyData?.status == 1) {
          setIsModalOpen(false);
          setTokendanger(false);
          coinListreq();
          messageApi.open({
            key,
            type: 'success',
            content: '连接成功！',
            duration: 2,
          });
        } else {
          messageApi.open({
            key,
            type: 'error',
            content: '请点击图片重新验证！',
            duration: 5,
          });
          setTokendanger(true);
        }
      } else {
        setInputType('error');
        messageApi.open({
          key,
          type: 'error',
          content: '请联系管理员!',
          duration: 5,
        });
      }
    } catch (e: any) {
      messageApi.open({
        key,
        type: 'error',
        content: '请联系管理员!',
        duration: 5,
      });
      setTokendanger(true);
    }
  };

  const SendupdateBtnFun = (updateBtn: any) => {
    // true为发送开始 false发送暂停
    updateBtn
      ? chrome.runtime.sendMessage({ startfetchDataAndUpdate: true })
      : chrome.runtime.sendMessage({ endfetchDataAndUpdate: true });
  };

  //刷新按钮状态改变
  const syncOutlinedFun = () => {
    setSyncOutlinedType(true);
    let items = setTimeout(() => {
      setSyncOutlinedType(false);
      messageApi.success({
        content: '刷新成功',
        duration: 1,
      });
      clearTimeout(items);
    }, 1000);
  };

  //默认请求的coinList列表
  const coinListreq = async (index = 0) => {
    try {
      let apilist: Array<any> = (await sessionT.get('coinList')) || [];
      if (index >= apilist.length) {
        //清除定时器
        clearTimeoutList(timesListRef.current);
        return;
      }
      let coinListDetail = (await sessionT.get('coinList-detail')) || [];
      // 发起接口请求
      const result = await getToken(
        apilist[index].contract,
        apilist[index].chain,
      );
      coinListDetail[index] = result?.data?.token || {};
      coinListDetail[index].time = getNowTime();
      coinListDetail[index].timespare = new Date().getTime();
      coinListDetail[index].dexname =
        result?.data?.pairs?.[0]?.show_name || '-';
      await sessionT.set('coinList-detail', coinListDetail);
      console.log(getNowTime(), '默认请求');
      //骨架屏设置
      setSkeletonType((item: number) => item + 1);
      // 等待一段时间后再次调用该函数（不定时）
      const randomDelay = Math.floor(Math.random() * 100) + 500; // 5毫秒到6毫秒之间的随机延迟
      let times = setTimeout(() => {
        coinListreq((index || 0) + 1);
        clearTimeout(times);
      }, randomDelay);
      timesListRef.current.push(times);
    } catch (error) {
      //清除定时器
      clearTimeoutList(timesListRef.current);
      //请求出现错误中断 弹出验证码
      console.log(error);
      ejectModal();
    }
  };

  const tableDataSourceHandle = (data: any) => {
    let dataSource = data.map((item: any) => {
      return {
        key: item?.token || '-',
        symbol: item?.symbol || '请重新刷新',
        current_price_usd: priceConverter(
          item?.current_price_usd,
          item?.decimal,
        ),
        price_change: item?.price_change || 0,
        time: item?.time || '-',
        dexname: item?.dexname || '-',
        token: item?.token || '-',
        chain: item?.chain || '-',
        logo_url: item?.logo_url || '-',
      };
    });
    return dataSource;
  };

  const alterModalshowFun = async () => {
    let days7agoTimestamp = (await sessionT.get('alertShowTime')) ?? 0;
    const newTimestamp = dayjs().valueOf();
    if (newTimestamp >= days7agoTimestamp) {
      return setAlertType(true);
    } else {
      return setAlertType(false);
    }
  };

  return (
    <>
      {pagename == 'SetPage' && <SetPage />}
      {pagename == '' && (
        <div className={styles.app}>
          {contextHolder}
          <div className={styles.top}>
            {coinContent.slice(0, 3).map((item, index) => {
              return (
                <Card
                  data={item}
                  key={index}
                  skeletonType={skeletonType}
                  index={index + 1}
                />
              );
            })}
          </div>

          <div
            className={styles.tablex}
            style={{
              paddingTop: skeletonType < 4 ? '23px' : '0px',
            }}
          >
            {skeletonType >= 4 ? (
              <Table
                columns={columns}
                dataSource={tableDataSourceHandle(coinContent.slice(3))}
                size="small"
                pagination={false}
                bordered={false}
                className={styles.column}
                rowClassName={styles.row}
                scroll={{ y: '40vh' }}
                onRow={(record) => {
                  return {
                    onClick: (event) => {
                      console.log(record);
                    }, // 点击行
                    title: `价格来源：${record?.dexname || '-'}`,
                  };
                }}
              />
            ) : (
              <Skeleton active title={false} paragraph={{ rows: 4 }} />
            )}
          </div>

          <div className={styles.btnarray}>
            <Button
              danger={tokendanger}
              icon={<PoweroffOutlined />}
              size={'small'}
              onClick={() => ejectModal()}
              style={{ width: '22px', height: '22px', marginLeft: '8px' }}
              type="primary"
            />

            <Button
              danger={!ssgxType}
              size={'small'}
              title={
                !ssgxType
                  ? '点击按钮，数据开始更新！'
                  : '数据实时更新中···，点击按钮暂停'
              }
              onClick={() => {
                SetssgxType((item: boolean) => {
                  SendupdateBtnFun(!item);
                  return !item;
                });
              }}
              style={{ height: '22px', marginLeft: '8px' }}
              type="primary"
            >
              {!ssgxType ? '实时更新' : '暂停更新'}
            </Button>

            <div className={styles.shuaxinbox} title="手动刷新数据">
              <SyncOutlined
                spin={syncOutlinedType}
                style={{ fontSize: 20 }}
                onClick={() => {
                  coinListreq();
                  syncOutlinedFun();
                  sessionT.remove('alertShowTime');
                }}
              />
            </div>
          </div>

          {alertType && (
            <div className={styles.alertdiv}>
              <Alert
                className={styles.alertchild}
                message={
                  <Marquee pauseOnHover gradient={false}>
                    <span style={{ color: 'red' }} title={alertTitle}>
                      {alertTitle}
                    </span>
                  </Marquee>
                }
                type="success"
                closable
                onClose={() => {
                  setAlertType(false);
                  // 获取未来第7天的时间戳
                  const futureDate = dayjs().add(7, 'day');
                  const futureTimestamp = futureDate.valueOf();
                  sessionT.set('alertShowTime', futureTimestamp);
                }}
              />
            </div>
          )}

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
      )}
    </>
  );
};

export default Popup;

const Card = (datarposp: any) => {
  let data = datarposp.data;
  return datarposp?.skeletonType >= datarposp?.index ? (
    <div
      className={styles.cardx}
      style={{
        color: ispositiveAndNegativereturnColor(data?.price_change),
      }}
      title={`${data?.symbol} 价格更新时间：${data?.time}\n价格来源：${data?.dexname}`}
    >
      <div className={styles.title}>{data?.symbol || '请重新刷新'}</div>
      <div className={styles.price}>
        ${priceConverter(data?.current_price_usd, data?.decimal)}
      </div>
      <div className={styles.footer}>
        {data?.price_change < 0
          ? `${data?.price_change || 0}%`
          : `+${data?.price_change || 0}` + '%'}
      </div>
    </div>
  ) : (
    <Skeleton
      active
      title={{ width: '24vw' }}
      paragraph={{ width: '24vw', rows: 1 }}
      className={styles.skeletonx}
    />
  );
};
