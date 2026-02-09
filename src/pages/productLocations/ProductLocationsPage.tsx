import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ProTable,
  ModalForm,
  ProFormSelect,
  ProFormDigit,
} from '@ant-design/pro-components';
import { Button, Popconfirm, Space, App, Empty, Tag, Alert, Checkbox } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { productLocationsApi } from '../../api/endpoints/productLocations';
import { productsApi } from '../../api/endpoints/products';
import { locationsApi } from '../../api/endpoints/locations';
import { useAuthStore } from '../../store/authStore';
import type { ProductLocation } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';
import type { CreateProductLocationInput, UpdateProductLocationInput } from '../../api/endpoints/productLocations';

export default function ProductLocationsPage() {
  const { user } = useAuthStore();
  const { message: messageApi } = App.useApp();
  const queryClient = useQueryClient();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductLocation | null>(null);

  const [filters, setFilters] = useState<{
    productId?: number;
    locationId?: number;
    lowStock?: boolean;
  }>({});

  const { data: productLocations = [], isLoading } = useQuery({
    queryKey: ['productLocations', filters],
    queryFn: () => productLocationsApi.getProductLocations(filters),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getLocations,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductLocationInput) =>
      productLocationsApi.createProductLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productLocations'] });
      messageApi.success('Ubicación de producto creada exitosamente');
      setIsModalVisible(false);
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message || 'Error al crear ubicación de producto';
      messageApi.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number } & UpdateProductLocationInput) =>
      productLocationsApi.updateProductLocation(data.id, {
        minimumStock: data.minimumStock,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productLocations'] });
      messageApi.success('Ubicación de producto actualizada exitosamente');
      setIsModalVisible(false);
      setEditingRecord(null);
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message || 'Error al actualizar ubicación de producto';
      messageApi.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productLocationsApi.deleteProductLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productLocations'] });
      messageApi.success('Ubicación de producto eliminada exitosamente');
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message || 'No se puede eliminar: tiene stock asociado';
      messageApi.error(errorMsg);
    },
  });

  const isAdmin = user?.role === 'ADMIN';

  const productOptions = products.map((p) => ({
    label: `${p.name} (${p.sku})`,
    value: p.id,
  }));

  const locationOptions = locations.map((l) => ({
    label: l.name,
    value: l.id,
  }));

  const columns: ProColumns<ProductLocation>[] = [
    {
      title: 'Producto',
      dataIndex: 'productId',
      key: 'productId',
      width: 250,
      render: (_text, record) => {
        if (!record.product) return '-';
        return (
          <span>
            {record.product.name}{' '}
            <Tag style={{ marginLeft: 4 }}>{record.product.sku}</Tag>
          </span>
        );
      },
      valueType: 'select',
      fieldProps: {
        options: productOptions,
        placeholder: 'Filtrar producto',
        allowClear: true,
        showSearch: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: 'Ubicación',
      dataIndex: 'locationId',
      key: 'locationId',
      width: 180,
      render: (_text, record) => record.location?.name || '-',
      valueType: 'select',
      fieldProps: {
        options: locationOptions,
        placeholder: 'Filtrar ubicación',
        allowClear: true,
        showSearch: true,
        filterOption: (input: string, option: any) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      title: 'Stock Actual',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 130,
      search: false,
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (_text, record) => (
        <span style={{ fontWeight: 600 }}>{record.currentStock}</span>
      ),
    },
    {
      title: 'Stock Mínimo',
      dataIndex: 'minimumStock',
      key: 'minimumStock',
      width: 130,
      search: false,
      sorter: (a, b) => a.minimumStock - b.minimumStock,
    },
    {
      title: 'Estado',
      key: 'estado',
      width: 120,
      search: false,
      render: (_text, record) => {
        const isLow = record.currentStock < record.minimumStock;
        return (
          <Tag color={isLow ? 'red' : 'green'}>
            {isLow ? 'Bajo' : 'Normal'}
          </Tag>
        );
      },
    },
    {
      title: 'Solo stock bajo',
      dataIndex: 'lowStock',
      key: 'lowStock',
      hideInTable: true,
      renderFormItem: () => (
        <Checkbox
          checked={filters.lowStock || false}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, lowStock: e.target.checked || undefined }));
          }}
        >
          Solo stock bajo
        </Checkbox>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      search: false,
      render: (_text, record) => (
        <Space size="small">
          {isAdmin && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingRecord(record);
                  setIsModalVisible(true);
                }}
              >
                Editar
              </Button>
              <Popconfirm
                title="Eliminar ubicación de producto"
                description="¿Eliminar esta ubicación de producto?"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okText="Sí"
                cancelText="No"
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending}
                >
                  Eliminar
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <ProTable<ProductLocation>
        columns={columns}
        dataSource={productLocations}
        rowKey="id"
        loading={isLoading}
        headerTitle="Stock por Ubicación"
        search={{
          labelWidth: 'auto',
        }}
        form={{
          syncToUrl: false,
        }}
        onSubmit={(params: Record<string, any>) => {
          setFilters({
            productId: params.productId || undefined,
            locationId: params.locationId || undefined,
            lowStock: filters.lowStock || undefined,
          });
        }}
        onReset={() => {
          setFilters({});
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} registros`,
        }}
        toolBarRender={() => [
          isAdmin && (
            <Button
              key="button"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRecord(null);
                setIsModalVisible(true);
              }}
            >
              Nueva Ubicación de Producto
            </Button>
          ),
        ]}
        locale={{
          emptyText: <Empty description="Sin ubicaciones de producto" />,
        }}
      />

      <ModalForm
        title={editingRecord ? 'Editar Ubicación de Producto' : 'Nueva Ubicación de Producto'}
        open={isModalVisible}
        onOpenChange={(open) => {
          setIsModalVisible(open);
          if (!open) setEditingRecord(null);
        }}
        onFinish={async (values: Record<string, any>) => {
          if (editingRecord) {
            await updateMutation.mutateAsync({
              id: editingRecord.id,
              minimumStock: values.minimumStock,
            });
          } else {
            await createMutation.mutateAsync({
              productId: values.productId,
              locationId: values.locationId,
              minimumStock: values.minimumStock ?? 0,
            });
          }
          return true;
        }}
        initialValues={
          editingRecord
            ? {
                productId: editingRecord.productId,
                locationId: editingRecord.locationId,
                currentStock: editingRecord.currentStock,
                minimumStock: editingRecord.minimumStock,
              }
            : { minimumStock: 0 }
        }
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
        submitter={{
          submitButtonProps: {
            loading: createMutation.isPending || updateMutation.isPending,
          },
        }}
      >
        <ProFormSelect
          name="productId"
          label="Producto"
          placeholder="Seleccione un producto"
          options={productOptions}
          rules={[{ required: true, message: 'El producto es requerido' }]}
          disabled={!!editingRecord}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          }}
        />
        <ProFormSelect
          name="locationId"
          label="Ubicación"
          placeholder="Seleccione una ubicación"
          options={locationOptions}
          rules={[{ required: true, message: 'La ubicación es requerida' }]}
          disabled={!!editingRecord}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          }}
        />

        {editingRecord && (
          <>
            <ProFormDigit
              name="currentStock"
              label="Stock Actual"
              disabled
              fieldProps={{
                style: { width: '100%' },
              }}
            />
            <Alert
              message="El stock actual solo se modifica mediante movimientos de inventario"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          </>
        )}

        <ProFormDigit
          name="minimumStock"
          label="Stock Mínimo"
          placeholder="0"
          min={0}
          fieldProps={{
            precision: 0,
            style: { width: '100%' },
          }}
          rules={[{ required: true, message: 'El stock mínimo es requerido' }]}
        />
      </ModalForm>
    </div>
  );
}
