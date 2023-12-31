import sessionT from '@/utils/session';
import { MenuOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGetState } from 'ahooks';
import type { InputRef } from 'antd';
import { Button, Form, Input, message, Switch, Table } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ColumnsType } from 'antd/es/table';
import clonedeep from 'lodash.clonedeep';
import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({
  children,
  ...props
}: any) => {
  const [form] = Form.useForm();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
          {React.Children.map(children, (child) => {
            if ((child as React.ReactElement).key === 'sort') {
              return React.cloneElement(child as React.ReactElement, {
                children: (
                  <MenuOutlined
                    ref={setActivatorNodeRef}
                    style={{ touchAction: 'none', cursor: 'move' }}
                    {...listeners}
                  />
                ),
              });
            }
            return child;
          })}
        </tr>
      </EditableContext.Provider>
    </Form>
  );
};

interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current!.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const inputsave = async () => {
    try {
      let values = await form.validateFields();
      values = {
        [Object.keys(values)[0]]: parseFloat(values[Object.keys(values)[0]]),
      };
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} 必须填写`,
          },
        ]}
      >
        <Input
          ref={inputRef}
          onPressEnter={inputsave}
          onBlur={inputsave}
          type={'text'}
        />
      </Form.Item>
    ) : (
      <div
        className={styles.editable_cell_value_wrap}
        style={{ paddingRight: 24 }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  name: string;
  age: string;
  address: string;
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

const App: React.FC = forwardRef((props: any, ref: any) => {
  const [dataSource, setDataSource, getDataSource] = useGetState<any>([
    ...props.initdataSources,
  ]);

  //特别关注按钮
  const [tbgz, setTbgz] = useState<any>('');

  const coreDragEndData = useRef<any>([]);

  //对父组件暴露的子组件方法
  useImperativeHandle(
    ref,
    () => {
      return {
        handleSaveOperation: handleSaveOperation,
      };
    },
    [],
  );

  useEffect(() => {
    setDataSource(props.initdataSources);
  }, [props.initdataSources]);

  useEffect(() => {
    (async () => {
      //初始化特别关注
      let tbgzType = (await sessionT.get('tbgz')) ?? '';
      setTbgz(tbgzType);
    })();
  }, []);

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  };

  interface DataType {
    key: string;
    symbol: string;
    token: number;
    cysl: string;
    cyjg: string;
    editable?: boolean;
    dataIndex: string;
    chain: string;
  }

  const tbgzFun = async (checked: boolean, key: string) => {
    if (checked) {
      setTbgz(key);
      await sessionT.set('tbgz', key);
      chrome.runtime.sendMessage({ restartBadge: true });
    } else {
      setTbgz('');
      await sessionT.set('tbgz', '');
      chrome.runtime.sendMessage({ restartBadge: true });
    }
  };

  //持有数量input保存函数
  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
    addSession(`${item.token + '-' + item.chain}`, {
      cysl: row.cysl,
      cyjg: row.cyjg,
    });
  };

  //根据key数据保存到session -> coinList-detail 函数
  const addSession = async (key: string, data: any) => {
    try {
      const recoList = (await sessionT.get('coinList-detail-setList')) ?? {};
      let backupsData = clonedeep(recoList?.[key] ?? {});
      recoList[key] = { ...backupsData, ...data };
      await sessionT.set('coinList-detail-setList', recoList);
      console.log(recoList, '保存数据成功');
    } catch (error) {
      console.log(error, '保存数据失败');
      message.error('保存数据失败');
    }
  };

  //删除代币列表 不存入缓存
  const delectSomeCoinList_nosession = async (key: string) => {
    let dataSourceCore = clonedeep(dataSource);
    let tablesouceDataFindindex = dataSourceCore.findIndex(
      (idx: any) => `${idx?.token}-${idx?.chain}` === key,
    );
    tablesouceDataFindindex !== -1 &&
      dataSourceCore.splice(tablesouceDataFindindex, 1);
    setDataSource(dataSourceCore);
  };

  useEffect(() => {
    console.log(dataSource, 'dataSource值的变化');
  }, [dataSource]);

  // 需要解决的是 根据dataSource的数据进行缓存数据的删除
  //功能：删除代币列表 根据token（contract）-chain 生成key值查找删除 存入缓存
  const delectSomeCoinList_addsession = useCallback(async () => {
    try {
      let dataSourceCore = clonedeep(getDataSource());

      let coinList = await sessionT.get('coinList');
      let coinListDetail = await sessionT.get('coinList-detail');
      let coinListDetailSetList = await sessionT.get('coinList-detail-setList');

      let coinListobjCore = clonedeep(coinList);
      let coinListDetailCore = clonedeep(coinListDetail);
      let coinListDetailSetListCore = clonedeep(coinListDetailSetList);

      let coinListobjCore_back = [];
      let coinListDetailCore_back = [];
      let coinListDetailSetListCore_back: any = {};

      for (let i = 0; i < dataSourceCore.length; i++) {
        let key = dataSourceCore[i].token + '-' + dataSourceCore[i].chain;

        let bgfindindex = coinListobjCore.findIndex(
          (idx: any) => `${idx?.contract}-${idx?.chain}` === key,
        );
        bgfindindex !== -1 &&
          coinListobjCore_back.push(coinListobjCore[bgfindindex]);

        let coinListDetailFindindex = coinListDetailCore.findIndex(
          (idx: any) => `${idx?.token}-${idx?.chain}` === key,
        );
        coinListDetailFindindex !== -1 &&
          coinListDetailCore_back.push(
            coinListDetailCore[coinListDetailFindindex],
          );

        if (coinListDetailSetListCore?.[key]) {
          coinListDetailSetListCore_back.key = coinListDetailSetListCore[key];
        }
      }
      await sessionT.set('coinList', coinListobjCore_back);
      await sessionT.set('coinList-detail', coinListDetailCore_back);
      await sessionT.set('coinList-detail-setList', coinListDetailSetListCore_back);
    } catch (error) {
      message.error('执行删除代码失败，保存表格失败');
    }
  }, [dataSource]);

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const defaultColumns: ColumnsType<DataType> = [
    {
      title: '拖拽',
      key: 'sort',
      width: 50,
      align: 'center',
    },
    {
      title: '代币',
      dataIndex: 'symbol',
      align: 'center',
      render: (text, record, index) => {
        return <span>{text}/USDT</span>;
      },
    },
    {
      title: '合约地址-所属链',
      dataIndex: 'token',
      width: '30%',
      align: 'center',
      render: (text, record, index) => {
        return (
          <span>
            {record.token}-{record.chain}
          </span>
        );
      },
    },
    {
      title: '持有数量',
      dataIndex: 'cysl',
      align: 'center',
      editable: true,
    },
    {
      title: '持有价格',
      dataIndex: 'cyjg',
      align: 'center',
      editable: true,
    },
    {
      title: '特别关注',
      dataIndex: 'tbgz',
      align: 'center',
      render: (text, record, index) => (
        <Switch
          checkedChildren="开启"
          unCheckedChildren="关闭"
          checked={tbgz == `${record.token}-${record.chain}`}
          onClick={(checked: boolean, event) =>
            tbgzFun(checked, `${record.token}-${record.chain}`)
          }
        />
      ),
    },
    {
      title: '删除',
      dataIndex: 'delete',
      align: 'center',
      render: (text, record, index) => (
        <Button
          type="text"
          onClick={() =>
            delectSomeCoinList_nosession(`${record.token}-${record.chain}`)
          }
        >
          <span style={{ color: '#1677ff' }} title="点击删除">
            delete
          </span>
        </Button>
      ),
    },
  ];

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      let core: any = [];
      setDataSource((previous: any) => {
        const activeIndex = previous.findIndex((i) => i.key === active.id);
        const overIndex = previous.findIndex((i) => i.key === over?.id);
        core = arrayMove(previous, activeIndex, overIndex);
        console.log(core, 'dataSource 移动的数据');
        return core;
      });
      coreDragEndData.current = core;
    }
  };

  //保存对拖拽的操作 存入缓存
  const handleSaveDrag_addsession = async () => {
    //coinListRef.current数据根据key值按照core的key值排序
    let coinList = await sessionT.get('coinList');
    let coinListobj = clonedeep(coinList);
    let coinListRefCurrentObj: Array<any> = [];
    coreDragEndData.current.forEach((d: any) => {
      let result = coinListobj.filter(
        (idx: any) => `${idx?.contract}-${idx?.chain}` === d.key,
      );
      coinListRefCurrentObj.push(result?.[0] ?? {});
    });
    await sessionT.set('coinList', coinListRefCurrentObj);
    console.log(coinListRefCurrentObj, 'coinList 移动后的默认列表数据');
  };

  //保存对表格的操作init
  const handleSaveOperation = () => {
    handleSaveDrag_addsession();
    delectSomeCoinList_addsession();
  };

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        // rowKey array
        items={dataSource?.map((i: any) => i.key)}
        strategy={verticalListSortingStrategy}
      >
        <Table
          components={components}
          rowClassName={() => styles.editable_row}
          className={styles.column}
          dataSource={dataSource}
          columns={columns as ColumnTypes}
          bordered={false}
          size="middle"
          pagination={false}
          scroll={{ y: '55vh' }}
        />
      </SortableContext>
    </DndContext>
  );
});

export default App;
