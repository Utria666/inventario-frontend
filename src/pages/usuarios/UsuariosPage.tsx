import { Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

export default function UsuariosPage() {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <TeamOutlined style={{ fontSize: 48, color: '#3b82f6', marginBottom: 16 }} />
      <Typography.Title level={3} style={{ color: '#e0e0e0' }}>
        Usuarios
      </Typography.Title>
      <Typography.Text style={{ color: '#666' }}>
        Próximamente — Gestión de usuarios
      </Typography.Text>
    </div>
  );
}
