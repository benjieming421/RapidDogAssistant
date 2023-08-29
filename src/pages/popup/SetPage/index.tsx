import { searchToken } from '@/axios/api';
import sessionT from '@/utils/session';
import { Slider } from 'antd';
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
      rootDu?.setAttribute('style', `filter: grayscale(${jmhd_hc}%);opacity: ${1 - (tmd_hc / 100)}`);
    })();
  }, [jmhd,tmd]);

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
