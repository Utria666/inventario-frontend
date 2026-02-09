import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProTable, ModalForm, ProFormText } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, App, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { locationsApi } from '../../api/endpoints/locations';
import { useAuthStore } from '../../store/authStore';
import type { Location } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';

export default function LocationsPage() {
  const { user } = useAuthStore();
  const { message: messageApi } = App.useApp();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getLocations,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; address?: string }) =>
      locationsApi.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      messageApi.success('Ubicación creada exitosamente');
      setIsModalVisible(false);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al crear ubicación';
      messageApi.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name?: string; address?: string }) =>
      locationsApi.updateLocation(data.id, { name: data.name, address: data.address }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      messageApi.success('Ubicación actualizada exitosamente');
      setIsModalVisible(false);
      setEditingLocation(null);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al actualizar ubicación';
      messageApi.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => locationsApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      messageApi.success('Ubicación eliminada exitosamente');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'No se puede eliminar: tiene productos en esta ubicación';
      messageApi.error(errorMsg);
    },
  });

  const isAdmin = user?.role === 'ADMIN';

  const columns: ProColumns<Location>[] = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      search: true,
    },
    {
      title: 'Dirección',
      dataIndex: 'address',
      key: 'address',
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
                  setEditingLocation(record);
                  setIsModalVisible(true);
                }}
              >
                Editar
              </Button>
              <Popconfirm
                title="Eliminar ubicación"
                description="¿Eliminar esta ubicación?"
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
      <ProTable<Location>
        columns={columns}
        dataSource={locations}
        rowKey="id"
        loading={isLoading}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} ubicaciones`,
        }}
        toolBarRender={() => [
          isAdmin && (
            <Button
              key="button"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingLocation(null);
                setIsModalVisible(true);
              }}
            >
              Nueva Ubicación
            </Button>
          ),
        ]}
        locale={{
          emptyText: <Empty description="Sin ubicaciones" />,
        }}
      />

      <ModalForm
        title={editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        onFinish={async (values: { name?: string; address?: string }) => {
          if (editingLocation) {
            await updateMutation.mutateAsync({
              id: editingLocation.id,
              ...values,
            });
          } else {
            await createMutation.mutateAsync(values as { name: string; address?: string });
          }
          return true;
        }}
        initialValues={editingLocation || {}}
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
          placeholder="Ingrese el nombre de la ubicación"
          rules={[{ required: true, message: 'El nombre es requerido' }]}
        />
        <ProFormText
          name="address"
          label="Dirección"
          placeholder="Ingrese la dirección (opcional)"
          rules={[{ required: false }]}
        />
      </ModalForm>
    </div>
  );
}
