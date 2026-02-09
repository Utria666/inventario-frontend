import { Typography } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

export default function StockPage() {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <DatabaseOutlined style={{ fontSize: 48, color: '#3b82f6', marginBottom: 16 }} />
      <Typography.Title level={3} style={{ color: '#e0e0e0' }}>
        Stock por Ubicación
      </Typography.Title>
      <Typography.Text style={{ color: '#666' }}>
        Próximamente — Consulta de stock por ubicación
      </Typography.Text>
    </div>
  );
}
