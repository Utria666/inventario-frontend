import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ProTable,
  ModalForm,
  ProFormSelect,
  ProFormDigit,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, App, Empty, Tag, Form, Alert, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { movementsApi } from '../../api/endpoints/movements';
import { productLocationsApi } from '../../api/endpoints/productLocations';
import type { Movement, MovementType } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';
import type { CreateMovementInput } from '../../api/endpoints/movements';

const { RangePicker } = DatePicker;

const MOVEMENT_TYPE_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  ENTRY: { color: 'green', label: 'Entrada' },
  EXIT: { color: 'red', label: 'Salida' },
  ADJUSTMENT: { color: 'gold', label: 'Ajuste' },
  TRANSFER: { color: 'blue', label: 'Transferencia' },
};

const MOVEMENT_TYPE_OPTIONS = [
  { label: 'Entrada', value: 'ENTRY' },
  { label: 'Salida', value: 'EXIT' },
  { label: 'Ajuste', value: 'ADJUSTMENT' },
  { label: 'Transferencia', value: 'TRANSFER' },
];

export default function MovimientosPage() {
  const { message: messageApi } = App.useApp();
  const queryClient = useQueryClient();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filters, setFilters] = useState<{
    type?: MovementType;
    fromDate?: string;
    toDate?: string;
    productLocationId?: number;
  }>({});

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements', filters],
    queryFn: () => movementsApi.getMovements(filters),
  });

  const { data: productLocations = [] } = useQuery({
    queryKey: ['productLocations'],
    queryFn: () => productLocationsApi.getProductLocations(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMovementInput) => movementsApi.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['productLocations'] });
      messageApi.success('Movimiento creado exitosamente');
      setIsModalVisible(false);
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message || 'Error al crear movimiento';
      if (errorMsg.includes('Insufficient stock')) {
        const plId = (error.config?.data && JSON.parse(error.config.data)?.productLocationId);
        const pl = productLocations.find((p) => p.id === plId);
        const stock = pl?.currentStock ?? '?';
        messageApi.error(`Stock insuficiente. Stock actual: ${stock}`);
      } else if (errorMsg.includes('Source and target')) {
        messageApi.error('El origen y destino no pueden ser iguales');
      } else if (errorMsg.includes('negative stock')) {
        messageApi.error('El ajuste resultaría en stock negativo');
      } else {
        messageApi.error(errorMsg);
      }
    },
  });

  const plOptions = useMemo(
    () =>
      productLocations.map((pl) => ({
        label: `${pl.product?.name ?? '?'} (${pl.product?.sku ?? '?'}) — ${pl.location?.name ?? '?'}`,
        value: pl.id,
        stock: pl.currentStock,
      })),
    [productLocations],
  );

  const columns: ProColumns<Movement>[] = [
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (_text, record) => {
        const config = MOVEMENT_TYPE_CONFIG[record.type] || {
          color: 'default',
          label: record.type,
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
      valueType: 'select',
      fieldProps: {
        options: MOVEMENT_TYPE_OPTIONS,
        placeholder: 'Filtrar tipo',
        allowClear: true,
      },
    },
    {
      title: 'Producto',
      key: 'product',
      width: 200,
      search: false,
      render: (_text, record) =>
        record.productLocation?.product?.name || '-',
    },
    {
      title: 'Ubicación',
      key: 'location',
      width: 160,
      search: false,
      render: (_text, record) => {
        const origin = record.productLocation?.location?.name || '-';
        if (record.type === 'TRANSFER' && record.targetProductLocation) {
          return (
            <span>
              {origin} → {record.targetProductLocation.location?.name || '-'}
            </span>
          );
        }
        return origin;
      },
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      search: false,
      render: (_text, record) => {
        const qty = record.quantity;
        let color = '#fff';
        let prefix = '';
        if (record.type === 'ENTRY') {
          color = '#52c41a';
          prefix = '+';
        } else if (record.type === 'EXIT') {
          color = '#ff4d4f';
          prefix = '-';
        } else if (record.type === 'ADJUSTMENT') {
          color = qty >= 0 ? '#52c41a' : '#ff4d4f';
          prefix = qty >= 0 ? '+' : '';
        } else if (record.type === 'TRANSFER') {
          color = '#1677ff';
          prefix = '';
        }
        return (
          <span style={{ fontWeight: 600, color }}>
            {prefix}{qty}
          </span>
        );
      },
    },
    {
      title: 'Usuario',
      key: 'user',
      width: 140,
      search: false,
      render: (_text, record) => record.user?.name || '-',
    },
    {
      title: 'Notas',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      search: false,
      ellipsis: true,
      render: (_text, record) => record.notes || '-',
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      search: false,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend',
      render: (_text, record) =>
        dayjs(record.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Rango de fechas',
      key: 'dateRange',
      hideInTable: true,
      renderFormItem: () => (
        <RangePicker
          style={{ width: '100%' }}
          format="DD/MM/YYYY"
          placeholder={['Desde', 'Hasta']}
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setFilters((prev) => ({
                ...prev,
                fromDate: dates[0]!.startOf('day').toISOString(),
                toDate: dates[1]!.endOf('day').toISOString(),
              }));
            } else {
              setFilters((prev) => ({
                ...prev,
                fromDate: undefined,
                toDate: undefined,
              }));
            }
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <ProTable<Movement>
        columns={columns}
        dataSource={movements}
        rowKey="id"
        loading={isLoading}
        headerTitle="Movimientos de Inventario"
        search={{
          labelWidth: 'auto',
        }}
        form={{
          syncToUrl: false,
        }}
        onSubmit={(params: Record<string, any>) => {
          setFilters((prev) => ({
            ...prev,
            type: params.type || undefined,
          }));
        }}
        onReset={() => {
          setFilters({});
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} movimientos`,
        }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            Nuevo Movimiento
          </Button>,
        ]}
        locale={{
          emptyText: <Empty description="Sin movimientos registrados" />,
        }}
      />

      <MovementModal
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        plOptions={plOptions}
        productLocations={productLocations}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values);
          return true;
        }}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}

interface PLOption {
  label: string;
  value: number;
  stock: number;
}

interface MovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plOptions: PLOption[];
  productLocations: { id: number; currentStock: number }[];
  onSubmit: (values: CreateMovementInput) => Promise<boolean>;
  isSubmitting: boolean;
}

function MovementModal({
  open,
  onOpenChange,
  plOptions,
  productLocations,
  onSubmit,
  isSubmitting,
}: MovementModalProps) {
  const [form] = Form.useForm();
  const selectedType: MovementType | undefined = Form.useWatch('type', form);

  const selectedPlId: number | undefined = Form.useWatch('productLocationId', form);
  const selectedPl = productLocations.find((p) => p.id === selectedPlId);

  const sourceId: number | undefined = Form.useWatch('sourceProductLocationId', form);
  const sourcePl = productLocations.find((p) => p.id === sourceId);

  const isEntry = selectedType === 'ENTRY';
  const isExit = selectedType === 'EXIT';
  const isAdjustment = selectedType === 'ADJUSTMENT';
  const isTransfer = selectedType === 'TRANSFER';

  const showProductLocationField = isEntry || isExit || isAdjustment;
  const showQuantity = !!selectedType;

  return (
    <ModalForm
      title="Nuevo Movimiento"
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      layout="vertical"
      modalProps={{ destroyOnClose: true }}
      onFinish={async (values: Record<string, any>) => {
        let input: CreateMovementInput;

        if (values.type === 'TRANSFER') {
          input = {
            type: 'TRANSFER',
            sourceProductLocationId: values.sourceProductLocationId,
            targetProductLocationId: values.targetProductLocationId,
            quantity: values.quantity,
            notes: values.notes || undefined,
          };
        } else {
          input = {
            type: values.type,
            productLocationId: values.productLocationId,
            quantity: values.quantity,
            notes: values.notes || undefined,
          } as CreateMovementInput;
        }

        return onSubmit(input);
      }}
      submitter={{
        submitButtonProps: { loading: isSubmitting },
        searchConfig: { submitText: 'Crear Movimiento', resetText: 'Cancelar' },
      }}
    >
      <ProFormSelect
        name="type"
        label="Tipo de Movimiento"
        placeholder="Seleccione el tipo"
        options={MOVEMENT_TYPE_OPTIONS}
        rules={[{ required: true, message: 'El tipo es requerido' }]}
        fieldProps={{
          onChange: () => {
            form.setFieldsValue({
              productLocationId: undefined,
              sourceProductLocationId: undefined,
              targetProductLocationId: undefined,
              quantity: undefined,
              notes: undefined,
            });
          },
        }}
      />

      {showProductLocationField && (
        <ProFormSelect
          name="productLocationId"
          label="Producto — Ubicación"
          placeholder="Seleccione producto y ubicación"
          options={plOptions}
          rules={[{ required: true, message: 'Producto-Ubicación es requerido' }]}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          }}
        />
      )}

      {isExit && selectedPl && (
        <Alert
          message={`Stock actual: ${selectedPl.currentStock}`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {isTransfer && (
        <ProFormSelect
          name="sourceProductLocationId"
          label="Origen (Producto — Ubicación)"
          placeholder="Seleccione origen"
          options={plOptions}
          rules={[{ required: true, message: 'El origen es requerido' }]}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          }}
        />
      )}

      {isTransfer && sourcePl && (
        <Alert
          message={`Stock en origen: ${sourcePl.currentStock}`}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {isTransfer && (
        <ProFormSelect
          name="targetProductLocationId"
          label="Destino (Producto — Ubicación)"
          placeholder="Seleccione destino"
          options={plOptions.filter((o) => o.value !== sourceId)}
          rules={[
            { required: true, message: 'El destino es requerido' },
            {
              validator: async (_rule: unknown, value: number) => {
                if (value && value === sourceId) {
                  throw new Error('El origen y destino no pueden ser iguales');
                }
              },
            },
          ]}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          }}
        />
      )}

      {showQuantity && (
        <ProFormDigit
          name="quantity"
          label={
            isAdjustment
              ? 'Cantidad (positiva o negativa)'
              : 'Cantidad'
          }
          placeholder={isAdjustment ? 'Ej: 5 o -3' : 'Cantidad'}
          fieldProps={{
            precision: 0,
            style: { width: '100%' },
          }}
          min={isAdjustment ? undefined : 1}
          rules={[
            { required: true, message: 'La cantidad es requerida' },
            {
              validator: async (_rule: unknown, value: number) => {
                if (value === 0) {
                  throw new Error('La cantidad no puede ser 0');
                }
                if (!isAdjustment && value < 0) {
                  throw new Error('La cantidad debe ser positiva');
                }
              },
            },
          ]}
        />
      )}

      {showQuantity && (
        <ProFormTextArea
          name="notes"
          label="Notas"
          placeholder="Notas opcionales del movimiento"
          fieldProps={{
            rows: 3,
            maxLength: 500,
            showCount: true,
          }}
        />
      )}
    </ModalForm>
  );
}
