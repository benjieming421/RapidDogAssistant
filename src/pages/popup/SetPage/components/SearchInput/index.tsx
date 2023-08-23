import { Divider, Empty, List, Select, Spin } from 'antd';
import type { SelectProps } from 'antd/es/select';
import debounce from 'lodash.debounce';
import React, { useMemo, useRef, useState } from 'react';
import styles from './index.less';

export interface DebounceSelectProps<ValueType = any>
  extends Omit<SelectProps<ValueType | ValueType[]>, 'options' | 'children'> {
  fetchOptions: (search: string) => Promise<ValueType[]>;
  debounceTimeout?: number;
}

function DebounceSelect<
  ValueType extends {
    key?: string;
    label: React.ReactNode;
    value: string | number;
  } = any,
>({
  fetchOptions,
  debounceTimeout = 800,
  ...props
}: DebounceSelectProps<ValueType>) {
  const [options, setOptions] = useState<ValueType[]>([]);
  const [loading, Setloading] = useState(false);
  const fetchRef = useRef(0);

  const debounceFetcher = useMemo(() => {
    const loadOptions = (value: string) => {
      if (value.length == 0) {
        setOptions([]);
        Setloading(false);
        return;
      }
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      Setloading(true);
      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) return;
        setOptions(newOptions);
        Setloading(false);
        console.log('搜索结果', newOptions);
      });
    };

    return debounce(loadOptions, debounceTimeout);
  }, [fetchOptions, debounceTimeout]);

  const dropdownRender = () => {
    return (
      <div className={styles.dropdown}>
        {options.length == 0 && (
          <div className={styles.empty}>
            {loading ? (
              <Spin tip="Loading..." size="large" className={styles.lodings}>
                <div />
              </Spin>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
        {options.length > 0 && (
          <div
            style={{
              height: 300,
              overflowX: 'hidden',
              padding: '0 16px',
            }}
          >
            <List
              dataSource={options}
              header={
                <div className={styles.listheader}>
                  <div>代币</div>
                  <div>价格</div>
                  <div>所属链</div>
                  <div>合约地址</div>
                  <div>风险分数</div>
                </div>
              }
              className={styles.listall}
              footer={<Divider plain>主银！以上是全部搜索内容了 🤐</Divider>}
              renderItem={(item: any) => (
                <List.Item
                  key={item?.current_price_usd}
                  className={styles.listitem}
                >
                  <div>{item?.chain ?? '-'}</div>
                  <div>{item?.current_price_usd ?? '-'}</div>
                  <div>{100 - item?.risk_score ?? '0'}</div>
                  <div>{item?.price_change ?? '-'}</div>
                </List.Item>
              )}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Select
      showSearch
      labelInValue
      loading={loading}
      filterOption={false}
      defaultActiveFirstOption={false}
      suffixIcon={null}
      onSearch={debounceFetcher}
      dropdownRender={dropdownRender}
      popupMatchSelectWidth={600}
      autoClearSearchValue={false}
      open={true}
      popupClassName={styles.popupdropdown}
      {...props}
    />
  );
}

export default DebounceSelect;
