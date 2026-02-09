import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProTable, ModalForm, ProFormText } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, App, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { suppliersApi } from '../../api/endpoints/suppliers';
import { useAuthStore } from '../../store/authStore';
import type { Supplier } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';

export default function ProveedoresPage() {
  const { user } = useAuthStore();
  const { message: messageApi } = App.useApp();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: suppliersApi.getSuppliers,
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      contactName?: string;
      phone?: string;
      email?: string;
    }) => suppliersApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      messageApi.success('Proveedor creado exitosamente');
      setIsModalVisible(false);
      setEditingSupplier(null);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al crear proveedor';
      messageApi.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      id: number;
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
    }) =>
      suppliersApi.updateSupplier(data.id, {
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      messageApi.success('Proveedor actualizado exitosamente');
      setIsModalVisible(false);
      setEditingSupplier(null);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al actualizar proveedor';
      messageApi.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      messageApi.success('Proveedor eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.error?.message || 'No se puede eliminar: tiene productos asociados';
      messageApi.error(errorMsg);
    },
  });

  const isAdmin = user?.role === 'ADMIN';

  const columns: ProColumns<Supplier>[] = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      search: true,
    },
    {
      title: 'Contacto',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 150,
      search: false,
      render: (text) => text || '-',
    },
    {
      title: 'Teléfono',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      search: false,
      render: (text) => text || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
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
                  setEditingSupplier(record);
                  setIsModalVisible(true);
                }}
              >
                Editar
              </Button>
              <Popconfirm
                title="Eliminar proveedor"
                description="¿Eliminar este proveedor?"
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
      <ProTable<Supplier>
        columns={columns}
        dataSource={suppliers}
        rowKey="id"
        loading={isLoading}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} proveedores`,
        }}
        toolBarRender={() => [
          isAdmin && (
            <Button
              key="button"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingSupplier(null);
                setIsModalVisible(true);
              }}
            >
              Nuevo Proveedor
            </Button>
          ),
        ]}
        locale={{
          emptyText: <Empty description="Sin proveedores" />,
        }}
      />

      <ModalForm
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        open={isModalVisible}
        onOpenChange={(open) => {
          setIsModalVisible(open);
          if (!open) setEditingSupplier(null);
        }}
        onFinish={async (values: any) => {
          if (editingSupplier) {
            await updateMutation.mutateAsync({
              id: editingSupplier.id,
              ...values,
            });
          } else {
            await createMutation.mutateAsync(values);
          }
          return true;
        }}
        initialValues={editingSupplier || {}}
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
          placeholder="Ingrese el nombre del proveedor"
          rules={[{ required: true, message: 'El nombre es requerido' }]}
        />
        <ProFormText
          name="contactName"
          label="Nombre de Contacto"
          placeholder="Ingrese el nombre de contacto (opcional)"
          rules={[{ required: false }]}
        />
        <ProFormText
          name="phone"
          label="Teléfono"
          placeholder="Ingrese el teléfono (opcional)"
          rules={[{ required: false }]}
        />
        <ProFormText
          name="email"
          label="Email"
          placeholder="Ingrese el email (opcional)"
          rules={[
            { required: false },
            { type: 'email', message: 'Email inválido' },
          ]}
        />
      </ModalForm>
    </div>
  );
}
