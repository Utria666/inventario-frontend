import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProTable, ModalForm, ProFormText } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, App, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { categoriesApi } from '../../api/endpoints/categories';
import { useAuthStore } from '../../store/authStore';
import type { Category } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const { message: messageApi } = App.useApp();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      categoriesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      messageApi.success('Categoría creada exitosamente');
      setIsModalVisible(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al crear categoría';
      messageApi.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name?: string; description?: string }) =>
      categoriesApi.updateCategory(data.id, { name: data.name, description: data.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      messageApi.success('Categoría actualizada exitosamente');
      setIsModalVisible(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al actualizar categoría';
      messageApi.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      messageApi.success('Categoría eliminada exitosamente');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'No se puede eliminar: tiene productos asociados';
      messageApi.error(errorMsg);
    },
  });

  const isAdmin = user?.role === 'ADMIN';

  const columns: ProColumns<Category>[] = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      search: true,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      search: false,
      render: (text) => text || '-',
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      search: false,
      render: (_text, record) => dayjs(record.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 150,
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
                  setEditingCategory(record);
                  setIsModalVisible(true);
                }}
              >
                Editar
              </Button>
              <Popconfirm
                title="Eliminar categoría"
                description="¿Eliminar esta categoría?"
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
      <ProTable<Category>
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={isLoading}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} categorías`,
        }}
        toolBarRender={() => [
          isAdmin && (
            <Button
              key="button"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingCategory(null);
                setIsModalVisible(true);
              }}
            >
              Nueva Categoría
            </Button>
          ),
        ]}
        locale={{
          emptyText: <Empty description="Sin categorías" />,
        }}
      />

      <ModalForm
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        open={isModalVisible}
        onOpenChange={(open) => {
          setIsModalVisible(open);
          if (!open) setEditingCategory(null);
        }}
        onFinish={async (values: Record<string, any>) => {
          if (editingCategory) {
            await updateMutation.mutateAsync({
              id: editingCategory.id,
              name: values.name,
              description: values.description,
            });
          } else {
            await createMutation.mutateAsync({
              name: values.name,
              description: values.description,
            });
          }
          return true;
        }}
        initialValues={editingCategory || {}}
        modalProps={{ destroyOnClose: true }}
        layout="vertical"
        submitter={{
          submitButtonProps: {
            loading: createMutation.isPending || updateMutation.isPending,
          },
        }}
      >
        <ProFormText
          name="name"
          label="Nombre"
          placeholder="Ingrese el nombre de la categoría"
          rules={[{ required: true, message: 'El nombre es requerido' }]}
        />
        <ProFormText
          name="description"
          label="Descripción"
          placeholder="Ingrese la descripción (opcional)"
          rules={[{ required: false }]}
        />
      </ModalForm>
    </div>
  );
}
