/*
 * @Author: benjieming421
 * @Date: 2023-08-28 19:57:13
 * @LastEditTime: 2023-10-21 15:31:01
 * @FilePath: \RapidDogAssistant\src\pages\popup\SetPage\index.tsx
 * @Description:
 *
 * Copyright (c) 2023 by hzsdezhanghao@gmail.com, All Rights Reserved.
 */
import { searchToken } from '@/axios/api';
import sessionT from '@/utils/session';
import { message, Slider,Button } from 'antd';
import throttle from 'lodash.throttle';
import { useEffect, useRef, useState } from 'react';
import EditTable from './components/EditTable';
import DebounceSelect from './components/SearchInput';
import styles from './index.less';

const index = ({setPagename}:any) => {
  const [jmhd, setJmhd] = useState<number>(0);
  const [tmd, setTmd] = useState<number>(0);
  const [editTabledataSource, setEditTabledataSource] = useState<any>([]);

  const tableRef = useRef<any>(null);
  useEffect(() => {
    (() => {
      initdataSoure();
    })();
  }, []);
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
      if (result) {
        coinList.push({ ...data });
        await sessionT.set('coinList', coinList);
        addeditTabledataSourceFun(data);
        message.success(`添加代币 ${data?.symbol} 成功`);
      } else {
        message.error(`代币 ${data?.symbol} 已经存在`);
      }
    } catch (error) {
      message.error(`添加代币 ${data?.symbol} 失败`);
    }
  };

  //给editTabledataSource加代币数据，让表格直接刷新出来
  const addeditTabledataSourceFun = (data:any) => {
    let obj = {
      token: data.contract,
      symbol: data.symbol,
      key: `${data.contract}-${data.chain}`,
      cysl: 0,
      cyjg: 0,
      chain: data.chain,
    };
    setEditTabledataSource((editTabledataSource:any) => [...editTabledataSource, obj]);
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

  //清洗数据返回给datasource
  const datasourceFun = async (data: any) => {
    let setListList = (await sessionT.get('coinList-detail-setList')) ?? {};
    let arr: any[] = [];
    data.forEach((item: any, index: number) => {
      let setListSpare =
        setListList?.[`${item?.token + '-' + item?.chain}`] ?? {};
      let obj = {
        key: item?.key ?? index,
        symbol: item?.symbol ?? '-',
        token: item?.token ?? '-',
        chain: item?.chain ?? '未知链',
        cysl: setListSpare?.cysl ?? 0,
        cyjg: setListSpare?.cyjg ?? 0,
      };
      arr.push(obj);
    });
    return arr;
  };

  //从储存coinList-detail拿值给datasource
  const initdataSoure = async () => {
    let dataSourceType = await sessionT.get('coinList-detail');
    let datasourceFunResult = await datasourceFun(dataSourceType);
    setEditTabledataSource(datasourceFunResult);
    console.log('datasourceFunResult', datasourceFunResult);
  };

  //对表格操作完的完成按钮 执行子组件的函数（handleSaveOperation）
  const completeFun = () => {
    tableRef.current.handleSaveOperation();
    setPagename('');
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
        <EditTable initdataSources={editTabledataSource} ref={tableRef}/>
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
        <Button onClick={completeFun}>完成</Button>
      </div>
    </div>
  );
};

export default index;
