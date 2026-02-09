import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Button, Popconfirm, Space, App, Empty, Modal, Descriptions, Table, Tag } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { productsApi } from '../../api/endpoints/products';
import { categoriesApi } from '../../api/endpoints/categories';
import { suppliersApi } from '../../api/endpoints/suppliers';
import { useAuthStore } from '../../store/authStore';
import type { Product } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';
import type { CreateProductInput, UpdateProductInput } from '../../api/endpoints/products';

export default function ProductosPage() {
  const { user } = useAuthStore();
  const { message: messageApi } = App.useApp();
  const queryClient = useQueryClient();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [filters, setFilters] = useState<{
    categoryId?: number;
    supplierId?: number;
    search?: string;
  }>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getSuppliers,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductInput) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      messageApi.success('Producto creado exitosamente');
      setIsModalVisible(false);
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message || 'Error al crear producto';
      messageApi.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number } & UpdateProductInput) =>
      productsApi.updateProduct(data.id, {
        sku: data.sku,
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      messageApi.success('Producto actualizado exitosamente');
      setIsModalVisible(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message || 'Error al actualizar producto';
      messageApi.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      messageApi.success('Producto eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message ||
        'No se puede eliminar: el producto tiene stock';
      messageApi.error(errorMsg);
    },
  });

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailVisible(true);
    try {
      const product = await productsApi.getProduct(id);
      setDetailProduct(product);
    } catch {
      messageApi.error('Error al cargar detalle del producto');
      setDetailVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const supplierOptions = suppliers.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const columns: ProColumns<Product>[] = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      copyable: true,
      search: false,
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      search: false,
    },
    {
      title: 'Buscar',
      dataIndex: 'search',
      key: 'search',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Buscar por nombre o SKU...',
      },
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      search: false,
      render: (text) => text || '-',
    },
    {
      title: 'Precio',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      search: false,
      render: (_text, record) => {
        const price = typeof record.price === 'string' ? parseFloat(record.price) : record.price;
        return `$${price.toFixed(2)}`;
      },
      sorter: (a, b) => {
        const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
        return priceA - priceB;
      },
    },
    {
      title: 'Categoría',
      dataIndex: 'categoryId',
      key: 'categoryId',
      width: 160,
      render: (_text, record) => record.category?.name || '-',
      valueType: 'select',
      fieldProps: {
        options: categoryOptions,
        placeholder: 'Filtrar categoría',
        allowClear: true,
      },
    },
    {
      title: 'Proveedor',
      dataIndex: 'supplierId',
      key: 'supplierId',
      width: 160,
      render: (_text, record) => record.supplier?.name || <Tag color="default">Sin proveedor</Tag>,
      valueType: 'select',
      fieldProps: {
        options: supplierOptions,
        placeholder: 'Filtrar proveedor',
        allowClear: true,
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 220,
      search: false,
      render: (_text, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            Ver
          </Button>
          {isAdmin && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingProduct(record);
                  setIsModalVisible(true);
                }}
              >
                Editar
              </Button>
              <Popconfirm
                title="Eliminar producto"
                description="¿Eliminar este producto?"
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

  const stockColumns = [
    {
      title: 'Ubicación',
      dataIndex: ['location', 'name'],
      key: 'location',
    },
    {
      title: 'Stock Actual',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (value: number) => (
        <Tag color={value > 0 ? 'green' : 'red'}>{value}</Tag>
      ),
    },
    {
      title: 'Stock Mínimo',
      dataIndex: 'minimumStock',
      key: 'minimumStock',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <ProTable<Product>
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1200 }}
        search={{
          labelWidth: 'auto',
        }}
        form={{
          syncToUrl: false,
        }}
        onSubmit={(params: Record<string, any>) => {
          setFilters({
            search: params.search || undefined,
            categoryId: params.categoryId || undefined,
            supplierId: params.supplierId || undefined,
          });
        }}
        onReset={() => {
          setFilters({});
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} productos`,
        }}
        toolBarRender={() => [
          isAdmin && (
            <Button
              key="button"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingProduct(null);
                setIsModalVisible(true);
              }}
            >
              Nuevo Producto
            </Button>
          ),
        ]}
        locale={{
          emptyText: <Empty description="Sin productos" />,
        }}
      />

      <ModalForm
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        open={isModalVisible}
        onOpenChange={(open) => {
          setIsModalVisible(open);
          if (!open) setEditingProduct(null);
        }}
        onFinish={async (values: Record<string, any>) => {
          if (editingProduct) {
            await updateMutation.mutateAsync({
              id: editingProduct.id,
              sku: values.sku,
              name: values.name,
              description: values.description,
              price: values.price,
              categoryId: values.categoryId,
              supplierId: values.supplierId || undefined,
            });
          } else {
            await createMutation.mutateAsync({
              sku: values.sku,
              name: values.name,
              description: values.description,
              price: values.price,
              categoryId: values.categoryId,
              supplierId: values.supplierId || undefined,
            });
          }
          return true;
        }}
        initialValues={
          editingProduct
            ? {
                sku: editingProduct.sku,
                name: editingProduct.name,
                description: editingProduct.description,
                price:
                  typeof editingProduct.price === 'string'
                    ? parseFloat(editingProduct.price)
                    : editingProduct.price,
                categoryId: editingProduct.categoryId,
                supplierId: editingProduct.supplierId,
              }
            : {}
        }
        layout="vertical"
        modalProps={{ destroyOnClose: true }}
        submitter={{
          submitButtonProps: {
            loading: createMutation.isPending || updateMutation.isPending,
          },
        }}
      >
        <ProFormText
          name="sku"
          label="SKU"
          placeholder="Ej: PROD-001"
          rules={[{ required: true, message: 'El SKU es requerido' }]}
        />
        <ProFormText
          name="name"
          label="Nombre"
          placeholder="Nombre del producto"
          rules={[{ required: true, message: 'El nombre es requerido' }]}
        />
        <ProFormTextArea
          name="description"
          label="Descripción"
          placeholder="Descripción del producto (opcional)"
        />
        <ProFormDigit
          name="price"
          label="Precio"
          placeholder="0.00"
          min={0.01}
          fieldProps={{
            prefix: '$',
            precision: 2,
            style: { width: '100%' },
          }}
          rules={[{ required: true, message: 'El precio es requerido' }]}
        />
        <ProFormSelect
          name="categoryId"
          label="Categoría"
          placeholder="Seleccione una categoría"
          options={categoryOptions}
          rules={[{ required: true, message: 'La categoría es requerida' }]}
        />
        <ProFormSelect
          name="supplierId"
          label="Proveedor"
          placeholder="Seleccione un proveedor (opcional)"
          options={supplierOptions}
          fieldProps={{
            allowClear: true,
          }}
        />
      </ModalForm>

      <Modal
        title={detailProduct ? `Producto: ${detailProduct.name}` : 'Detalle del Producto'}
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setDetailProduct(null);
        }}
        footer={null}
        width={700}
        loading={detailLoading}
      >
        {detailProduct && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="SKU">{detailProduct.sku}</Descriptions.Item>
              <Descriptions.Item label="Nombre">{detailProduct.name}</Descriptions.Item>
              <Descriptions.Item label="Precio" span={2}>
                ${typeof detailProduct.price === 'string'
                  ? parseFloat(detailProduct.price).toFixed(2)
                  : detailProduct.price.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="Categoría">
                {detailProduct.category?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Proveedor">
                {detailProduct.supplier?.name || 'Sin proveedor'}
              </Descriptions.Item>
              <Descriptions.Item label="Descripción" span={2}>
                {detailProduct.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha Creación">
                {dayjs(detailProduct.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Última Actualización">
                {dayjs(detailProduct.updatedAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {(detailProduct as any).productLocations && (
              <>
                <h4 style={{ marginBottom: 12 }}>Stock por Ubicación</h4>
                <Table
                  dataSource={(detailProduct as any).productLocations}
                  columns={stockColumns}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  locale={{
                    emptyText: <Empty description="Sin stock registrado" />,
                  }}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
