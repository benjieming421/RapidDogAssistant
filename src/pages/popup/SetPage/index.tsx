import { searchToken } from '@/axios/api';
import { useEffect } from 'react';
import EditTable from './components/EditTable';
import DebounceSelect from './components/SearchInput';
import styles from './index.less';

const index = () => {
  useEffect(() => {}, []);

  async function fetchUserList(keyword: string): Promise<any> {
    return searchToken(keyword);
  }

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
    </div>
  );
};

export default index;
