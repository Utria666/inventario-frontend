import { Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

export default function UbicacionesPage() {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <EnvironmentOutlined style={{ fontSize: 48, color: '#3b82f6', marginBottom: 16 }} />
      <Typography.Title level={3} style={{ color: '#e0e0e0' }}>
        Ubicaciones
      </Typography.Title>
      <Typography.Text style={{ color: '#666' }}>
        Próximamente — Gestión de ubicaciones
      </Typography.Text>
    </div>
  );
}
