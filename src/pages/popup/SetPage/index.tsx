/*
 * @Author: benjieming421
 * @Date: 2023-08-28 19:57:13
 * @LastEditTime: 2023-10-20 00:51:43
 * @FilePath: \RapidDogAssistant\src\pages\popup\SetPage\index.tsx
 * @Description:
 *
 * Copyright (c) 2023 by hzsdezhanghao@gmail.com, All Rights Reserved.
 */
import { searchToken } from '@/axios/api';
import sessionT from '@/utils/session';
import { message, Slider } from 'antd';
import throttle from 'lodash.throttle';
import { useEffect, useState } from 'react';
import EditTable from './components/EditTable';
import DebounceSelect from './components/SearchInput';
import styles from './index.less';

const index = () => {
  const [jmhd, setJmhd] = useState<number>(0);
  const [tmd, setTmd] = useState<number>(0);

  useEffect(() => {
    (async () => {
      let jmhd_hc = (await sessionT.get('jmhd')) ?? 0;
      let tmd_hc = (await sessionT.get('tmd')) ?? 0;
      setJmhd(jmhd_hc);
      setTmd(tmd_hc);

      //react 获取id为root的div
      let rootDu = document.getElementById('root');
      rootDu?.setAttribute(
        'style',
        `filter: grayscale(${jmhd_hc}%);opacity: ${1 - tmd_hc / 100}`,
      );
    })();
  }, [jmhd, tmd]);

  async function fetchUserList(keyword: string): Promise<any> {
    return searchToken(keyword);
  }

  const changeSliderValue = (value: number, index: number) => {
    const beouncefun = throttle(() => {
      if (index == 0) {
        //界面灰度
        setJmhd(value);
        sessionT.set('jmhd', value);
      } else {
        //透明度
        setTmd(value);
        sessionT.set('tmd', value);
      }
    }, 800);

    beouncefun();
  };

  /** 新增代币到列表 给session ‘coinList’ 
   *  添加格式
   *   {
        symbol: 'BTC',
        contract: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c',
        chain: 'bsc',
        },
   */
  const addCoin = async (data: any) => {
    try {
      let coinList: any = await sessionT.get('coinList');
      let result = isRepalce(data, coinList);
      if(result) {
        coinList.push({ ...data });
        await sessionT.set('coinList', coinList);
        message.success(`添加代币 ${data?.symbol} 成功`);
      }else {
        message.error(`代币 ${data?.symbol} 已经存在`); 
      }
    } catch (error) {
      message.error(`添加代币 ${data?.symbol} 失败`);
    }
  };

  //判断是否已经存在代币 true代表不存在 false代表代币已经存在
  const isRepalce = (data: any, coinList: any) => {
    let key = data.symbol + data.contract + data.chain;
    let result = true;
    for (let i = 0; i < coinList.length; i++) {
      let key2 = coinList[i].symbol + coinList[i].contract + coinList[i].chain;
      if (key == key2) {
        result = false;
        break;
      }
    }
    return result;
  };

  return (
    <div className={styles.setpage}>
      <div className={styles.search_content}>
        <div className={styles.tip}>添加新代币：</div>
        <DebounceSelect
          mode="multiple"
          placeholder={'请输入合约地址或代币名称'}
          fetchOptions={fetchUserList}
          onChange={(newValue) => {
            // setValue(newValue);
          }}
          className={styles.search_input}
          addCoinFun={addCoin}
        />
      </div>
      <div className={styles.edittable}>
        <EditTable />
      </div>
      <div className={styles.sbms}>
        <div className={styles.title}>上班模式设置：</div>
        <div className={styles.jmhd}>
          <div>界面灰度：</div>
          <div>
            <Slider
              defaultValue={0}
              value={jmhd}
              onChange={(value) => changeSliderValue(value, 0)}
            />
          </div>
        </div>
        <div className={styles.tmd} style={{ marginLeft: '20px' }}>
          <div>透明度：</div>
          <div>
            <Slider
              defaultValue={0}
              value={tmd}
              onChange={(value) => changeSliderValue(value, 1)}
              max={90}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
