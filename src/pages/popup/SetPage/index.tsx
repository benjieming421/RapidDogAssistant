import { searchToken } from '@/axios/api';
import { useEffect, useState } from 'react';
import DebounceSelect from './components/SearchInput';
import styles from './index.less';

const index = () => {
  const [value, setValue] = useState([]);

  useEffect(() => {}, []);

  async function fetchUserList(keyword: string): Promise<UserValue[]> {
    return searchToken(keyword);
  }

  return (
    <div className={styles.setpage}>
      <div className={styles.search_content}>
        <div className={styles.tip}>添加新代币：</div>
        <DebounceSelect
          mode="multiple"
          value={value}
          placeholder={'请输入合约地址或代币名称'}
          fetchOptions={fetchUserList}
          onChange={(newValue) => {
            // setValue(newValue);
          }}
          className={styles.search_input}
        />
      </div>
    </div>
  );
};

export default index;
