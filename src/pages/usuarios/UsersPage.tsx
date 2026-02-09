import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProTable, ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, message, Empty, Tag, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { usersApi } from '../../api/endpoints/users';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; email: string; role: 'ADMIN' | 'USER' }) =>
      usersApi.createUser(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setTempPassword(response.tempPassword);
      setShowPasswordModal(true);
      setIsModalVisible(false);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al crear usuario';
      messageApi.error(errorMsg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name?: string; email?: string; role?: 'ADMIN' | 'USER' }) =>
      usersApi.updateUser(data.id, { name: data.name, email: data.email, role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      messageApi.success('Usuario actualizado exitosamente');
      setIsModalVisible(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al actualizar usuario';
      messageApi.error(errorMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      messageApi.success('Usuario eliminado exitosamente');
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Error al eliminar usuario';
      messageApi.error(errorMsg);
    },
  });

  const isAdmin = currentUser?.role === 'ADMIN';

  const getRoleColor = (role: string) => {
    return role === 'ADMIN' ? 'blue' : 'default';
  };

  const columns: ProColumns<User>[] = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      search: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      search: true,
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      search: false,
      render: (_: any, record: User) => <Tag color={getRoleColor(record.role)}>{record.role}</Tag>,
    },
    {
      title: 'Fecha Creación',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      search: false,
      render: (_: any, record: User) => dayjs(record.createdAt).format('DD/MM/YYYY HH:mm'),
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
                  setEditingUser(record);
                  setIsModalVisible(true);
                }}
              >
                Editar
              </Button>
              <Popconfirm
                title="Eliminar usuario"
                description="¿Eliminar este usuario?"
                onConfirm={() => deleteMutation.mutate(record.id)}
                okText="Sí"
                cancelText="No"
                disabled={record.id === currentUser?.id}
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending}
                  disabled={record.id === currentUser?.id}
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

  const handleCopyPassword = async () => {
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword);
        messageApi.success('Contraseña copiada al portapapeles');
      } catch (err) {
        messageApi.error('Error al copiar contraseña');
      }
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <ProTable<User>
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} usuarios`,
        }}
        toolBarRender={() => [
          isAdmin && (
            <Button
              key="button"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingUser(null);
                setIsModalVisible(true);
              }}
            >
              Nuevo Usuario
            </Button>
          ),
        ]}
        locale={{
          emptyText: <Empty description="Sin usuarios" />,
        }}
      />

      <ModalForm
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        open={isModalVisible}
        onOpenChange={setIsModalVisible}
        onFinish={async (values: any) => {
          if (editingUser) {
            await updateMutation.mutateAsync({
              id: editingUser.id,
              name: values.name,
              email: values.email,
              role: values.role,
            });
          } else {
            await createMutation.mutateAsync({
              name: values.name,
              email: values.email,
              role: values.role,
            });
          }
          return true;
        }}
        initialValues={editingUser || {}}
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
          placeholder="Ingrese el nombre del usuario"
          rules={[{ required: true, message: 'El nombre es requerido' }]}
        />
        <ProFormText
          name="email"
          label="Email"
          placeholder="Ingrese el email"
          rules={[
            { required: true, message: 'El email es requerido' },
            { type: 'email', message: 'Email inválido' },
          ]}
        />
        <ProFormSelect
          name="role"
          label="Rol"
          placeholder="Seleccione un rol"
          rules={[{ required: true, message: 'El rol es requerido' }]}
          initialValue={editingUser?.role || 'USER'}
          options={[
            { label: 'USER', value: 'USER' },
            { label: 'ADMIN', value: 'ADMIN' },
          ]}
        />
      </ModalForm>

      <Modal
        title="Usuario Creado Exitosamente"
        open={showPasswordModal}
        onCancel={() => {
          setShowPasswordModal(false);
          setTempPassword(null);
        }}
        footer={[
          <Button
            key="copy"
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyPassword}
          >
            Copiar Contraseña
          </Button>,
          <Button
            key="close"
            onClick={() => {
              setShowPasswordModal(false);
              setTempPassword(null);
            }}
          >
            Cerrar
          </Button>,
        ]}
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Contraseña Temporal:</p>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              userSelect: 'all',
            }}
          >
            {tempPassword}
          </div>
        </div>
        <p style={{ color: '#666', fontSize: '12px' }}>
          El usuario debe cambiar esta contraseña en su primer acceso.
        </p>
      </Modal>
    </div>
  );
}
