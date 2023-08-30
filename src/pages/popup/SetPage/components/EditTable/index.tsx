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
import type { InputRef } from 'antd';
import { Button, Form, Input, message, Switch, Table } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ColumnsType } from 'antd/es/table';
import clonedeep from 'lodash.clonedeep';
import React, { useContext, useEffect, useRef, useState } from 'react';
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
      values = { cysl: parseFloat(values.cysl) };
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

const App: React.FC = () => {
  const [dataSource, setDataSource] = useState<any>([]);
  const [dataSource_recode, setDataSource_recode] = useState<any>([]);

  //特别关注按钮
  const [tbgz, setTbgz] = useState<number>(-1);

  //初始化
  useEffect(() => {
    (async () => {
      //初始化特别关注
      let tbgzType = await sessionT.get('tbgz');
      tbgzType && setTbgz(parseInt(tbgzType));

      const items = setTimeout(async () => {
        let dataSourceType = await sessionT.get('coinList-detail');
        setDataSource_recode(dataSourceType);
        clearTimeout(items);
      }, 4000);

    })();
  }, []);

  useEffect(() => {
    //初始化表格数据
    initdataSoure();

    console.log(dataSource_recode,'dataSource_recode 移动后的数据');
  }, [dataSource_recode]);

  //从储存coinList-detail拿值给datasource
  const initdataSoure = () => {
    const items = setTimeout(async () => {
      let dataSourceType = await sessionT.get('coinList-detail');
      let datasourceFunResult = await datasourceFun(dataSourceType);
      setDataSource(datasourceFunResult);

      clearTimeout(items);
    }, 4000);
  };

  //清洗数据返回给datasource
  const datasourceFun = async (data: any) => {
    let setListList = (await sessionT.get('coinList-detail-setList')) ?? {};
    let arr: any[] = [];
    data.forEach((item: any, index: number) => {
      let setListSpare =  setListList?.[`${item?.token+'-'+item?.chain}`] ?? {};
      let obj = {
        key: item?.key ?? index,
        symbol: item?.symbol ?? '-',
        token: item?.token ?? '-',
        chain: item?.chain ?? '未知链',
        cysl: setListSpare?.cysl ?? 0,
      };
      arr.push(obj);
    });
    return arr;
  };

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  };

  interface DataType {
    key: string;
    symbol: string;
    token: number;
    cysl: string;
    editable?: boolean;
    dataIndex: string;
  }

  const tbgzFun = (checked: boolean, index: number) => {
    if (checked) {
      setTbgz(index);
      sessionStorage.setItem('tbgz', index.toString());
    } else {
      setTbgz(-1);
      sessionStorage.setItem('tbgz', '-1');
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
    addSession(`${item.token+'-'+item.chain}`,{cysl:row.cysl});
  };

  //根据key数据保存到session -> coinList-detail 函数
  const addSession = async (key:string,data:any) => {
    try {
      const recoList = (await sessionT.get('coinList-detail-setList')) ?? {};
      let backupsData = clonedeep((recoList?.[key] ?? {}));
      recoList[key] = { ...backupsData,...data  }
      await sessionT.set('coinList-detail-setList', recoList);
      console.log(recoList,'保存数据成功');
    } catch (error) {
      console.log(error, '保存数据失败');
      message.error('保存数据失败');
    }
  };

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
      title: '特别关注',
      dataIndex: 'tbgz',
      align: 'center',
      render: (text, record, index) => (
        <Switch
          checkedChildren="开启"
          unCheckedChildren="关闭"
          checked={tbgz == index}
          onClick={(checked: boolean, event) => tbgzFun(checked, index)}
        />
      ),
    },
    {
      title: '删除',
      dataIndex: 'delete',
      align: 'center',
      render: (text, record, index) => (
        <Button type="text">
          <span style={{color: '#1677ff'}}>delete</span>
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
      setDataSource((previous:any) => {
        const activeIndex = previous.findIndex((i) => i.key === active.id);
        const overIndex = previous.findIndex((i) => i.key === over?.id);
        return arrayMove(previous, activeIndex, overIndex);
      });

      // setDataSource_recode((previous:any) => {
      //   const newPrevious = clonedeep(previous);
      //   const activeIndex = newPrevious.findIndex((i) => i?.key === active?.id);
      //   const overIndex = newPrevious.findIndex((i) => i?.key === over?.id);
      //   // return arrayMove(newPrevious, activeIndex, overIndex);
      //   newPrevious.splice(activeIndex,1 ,newPrevious[overIndex]);
      //   newPrevious.splice(overIndex,1 ,newPrevious[activeIndex]);
      //   return newPrevious;
      // });
    }
  };

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        // rowKey array
        items={dataSource?.map((i:any) => i.key)}
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
};

export default App;
