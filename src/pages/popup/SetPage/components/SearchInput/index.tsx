import {
  ispositiveAndNegativereturnColor,
  priceConverter,
  priceConverterK,
} from '@/utils';
import { BlockOutlined } from '@ant-design/icons';
import { Divider, Empty, Image, List, message, Select, Spin } from 'antd';
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
  const inputValueRef = useRef<any>(null);

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

  const urlhandle = (data: string) => {
    try {
      let url = data;
      if (url.indexOf('undefined') != -1) return 'error';
      return url;
    } catch (e) {
      return 'error';
    }
  };

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
                  <div>#</div>
                  <div style={{ paddingLeft: 8 }}>代币</div>
                  <div>价格</div>
                  <div>24h跌幅</div>
                  <div>所属链</div>
                  <div>合约地址</div>
                  <div>持币人数</div>
                </div>
              }
              className={styles.listall}
              footer={<Divider plain>主银！以上是全部搜索内容了 🤐</Divider>}
              renderItem={(item: any, index: any) => (
                <List.Item
                  key={item?.current_price_usd}
                  className={styles.listitem}
                  title={'点击添加观察列表'}
                >
                  <div style={{ zIndex: 9999 }}>{index + 1}</div>
                  <div className={styles.symbolstyle}>
                    <Image
                      width={20}
                      height={20}
                      style={{ marginRight: '10px' }}
                      preview={false}
                      className={styles.icon1}
                      src={urlhandle(`${window?.iconUrl}${item?.logo_url}`)}
                      fallback={require('/public/img/icon-default.png')}
                    />
                    <div className={styles.symbolname}>
                      {item?.symbol ?? '-'}
                    </div>
                  </div>
                  <div>
                    ${priceConverter(item?.current_price_usd, item?.decimal)}/USDT
                  </div>
                  <div
                    style={{
                      color: ispositiveAndNegativereturnColor(
                        item?.price_change ?? 0,
                      ),
                    }}
                  >
                    {item?.price_change < 0
                      ? `${item?.price_change ?? 0}%`
                      : `+${item?.price_change ?? 0}` + '%'}
                  </div>
                  <div>{item?.chain ?? '-'}</div>
                  <div
                    title={'点击复制当前合约'}
                    onClick={() => {
                      //复制到粘贴板
                      navigator.clipboard.writeText(`${item?.token ?? '-'}`);
                      message.success('复制成功');
                    }}
                    className={styles.tokenstyle}
                  >
                    {item?.token ?? '-'} <BlockOutlined />
                  </div>
                  <div>{priceConverterK(item?.holders ?? 0)}</div>
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
      popupMatchSelectWidth={758}
      autoClearSearchValue={false}
      // open={true}
      ref={inputValueRef}
      popupClassName={styles.popupdropdown}
      {...props}
    />
  );
}

export default DebounceSelect;
