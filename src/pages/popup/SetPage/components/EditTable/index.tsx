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
import { Form, Input, Popconfirm, Table } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ColumnsType } from 'antd/es/table';
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

  const save = async () => {
    try {
      const values = await form.validateFields();

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
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
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
  const [dataSource, setDataSource] = useState([
    {
      key: '0',
      name: 'Edward King 0',
      age: 32,
      address: 'London, Park Lane no. 0',
    },
    {
      key: '1',
      name: 'Edward King 1',
      age: 33,
      address: 'London, Park Lane no. 1',
    },
    {
      key: '2',
      name: 'Edward King 1',
      age: 34,
      address: 'London, Park Lane no. 1',
    },
    {
      key: '3',
      name: 'Edward King 1',
      age: 35,
      address: 'London, Park Lane no. 1',
    },
    {
      key: '4',
      name: 'Edward King 1',
      age: 36,
      address: 'London, Park Lane no. 1',
    },
  ]);

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  };

  interface DataType {
    key: string;
    name: string;
    age: number;
    address: string;
    editable?: boolean;
    dataIndex: string;
  }

  const defaultColumns: ColumnsType<DataType> = [
    {
      title: '拖拽',
      key: 'sort',
      width: 50,
      align: 'center',
    },
    {
      title: 'name',
      dataIndex: 'name',
      width: '30%',
      editable: true,
      align: 'center',
    },
    {
      title: 'age',
      dataIndex: 'age',
      align: 'center',
    },
    {
      title: 'address',
      dataIndex: 'address',
      align: 'center',
    },
    {
      title: 'operation',
      dataIndex: 'operation',
      render: (_, record: { key: React.Key }) =>
        dataSource.length >= 1 ? (
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => handleDelete(record.key)}
          >
            <a>Delete</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

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
      setDataSource((previous) => {
        const activeIndex = previous.findIndex((i) => i.key === active.id);
        const overIndex = previous.findIndex((i) => i.key === over?.id);
        return arrayMove(previous, activeIndex, overIndex);
      });
    }
  };

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        // rowKey array
        items={dataSource.map((i) => i.key)}
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
