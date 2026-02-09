import { useMemo } from 'react';
import { Typography, Row, Col, Card, Statistic, Table, Tag, Skeleton } from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  WarningOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Column, Line } from '@ant-design/charts';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { reportsApi } from '../../api/endpoints/reports';
import { productsApi } from '../../api/endpoints/products';
import type { ProductLocation } from '../../types/models';

const { Title, Text } = Typography;

// ─── Helpers ────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, #1a1a1a 0%, #141414 100%)',
  border: '1px solid #1f1f1f',
  borderRadius: 12,
  overflow: 'hidden',
};

const chartCardStyle: React.CSSProperties = {
  ...cardStyle,
  padding: 0,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Component ──────────────────────────────────────────────────────

export default function DashboardPage() {
  // Parallel data fetching
  const todayStr = dayjs().startOf('day').toISOString();

  const {
    data: lowStockItems,
    isLoading: loadingLowStock,
  } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => reportsApi.getLowStock(),
  });

  const {
    data: inventoryValue,
    isLoading: loadingInventoryValue,
  } = useQuery({
    queryKey: ['inventoryValue'],
    queryFn: () => reportsApi.getInventoryValue(),
  });

  const {
    data: movementHistory,
    isLoading: loadingMovements,
  } = useQuery({
    queryKey: ['movementHistory', { fromDate: todayStr }],
    queryFn: () =>
      reportsApi.getMovementHistory({
        fromDate: todayStr,
        limit: '500',
      }),
  });

  const {
    data: recentMovements,
    isLoading: loadingRecentMovements,
  } = useQuery({
    queryKey: ['movementHistory', { last7days: true }],
    queryFn: () =>
      reportsApi.getMovementHistory({
        fromDate: dayjs().subtract(7, 'day').startOf('day').toISOString(),
        limit: '500',
      }),
  });

  const {
    data: products,
    isLoading: loadingProducts,
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
  });

  // ─── Derived stats ────────────────────────────────────────────────

  const totalProducts = products?.length ?? 0;
  const totalValue = inventoryValue?.total ?? 0;
  const lowStockCount = lowStockItems?.length ?? 0;
  const movementsToday = movementHistory?.length ?? 0;

  // ─── Column chart data (inventory value by location) ──────────────

  const columnData = useMemo(() => {
    if (!inventoryValue?.byLocation) return [];
    return inventoryValue.byLocation.map((loc) => ({
      ubicacion: loc.locationName,
      valor: Math.round(loc.value),
    }));
  }, [inventoryValue]);

  // ─── Line chart data (movements last 7 days by type) ─────────────

  const lineData = useMemo(() => {
    if (!recentMovements) return [];

    const typeMap: Record<string, string> = {
      ENTRY: 'Entrada',
      EXIT: 'Salida',
      ADJUSTMENT: 'Ajuste',
      TRANSFER: 'Transferencia',
    };

    // Group by date + type
    const grouped: Record<string, Record<string, number>> = {};
    for (let i = 6; i >= 0; i--) {
      const dateKey = dayjs().subtract(i, 'day').format('DD/MM');
      grouped[dateKey] = { Entrada: 0, Salida: 0, Ajuste: 0, Transferencia: 0 };
    }

    recentMovements.forEach((m) => {
      const dateKey = dayjs(m.createdAt).format('DD/MM');
      const typeLabel = typeMap[m.type] || m.type;
      if (grouped[dateKey]) {
        grouped[dateKey][typeLabel] = (grouped[dateKey][typeLabel] || 0) + 1;
      }
    });

    const result: { fecha: string; cantidad: number; tipo: string }[] = [];
    Object.entries(grouped).forEach(([fecha, types]) => {
      Object.entries(types).forEach(([tipo, cantidad]) => {
        result.push({ fecha, cantidad, tipo });
      });
    });

    return result;
  }, [recentMovements]);

  // ─── Low stock table columns ──────────────────────────────────────

  const lowStockColumns = [
    {
      title: 'Producto',
      dataIndex: ['product', 'name'],
      key: 'product',
      render: (_: unknown, record: ProductLocation) => (
        <div>
          <Text strong style={{ color: '#e0e0e0' }}>
            {record.product?.name}
          </Text>
          <br />
          <Text style={{ color: '#666', fontSize: 12 }}>
            {record.product?.sku}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ubicacion',
      dataIndex: ['location', 'name'],
      key: 'location',
      render: (_: unknown, record: ProductLocation) => (
        <Tag color="blue">{record.location?.name}</Tag>
      ),
    },
    {
      title: 'Stock Actual',
      dataIndex: 'currentStock',
      key: 'currentStock',
      align: 'center' as const,
      render: (val: number) => (
        <Text strong style={{ color: val === 0 ? '#ff4d4f' : '#faad14' }}>
          {val}
        </Text>
      ),
    },
    {
      title: 'Stock Minimo',
      dataIndex: 'minimumStock',
      key: 'minimumStock',
      align: 'center' as const,
      render: (val: number) => <Text style={{ color: '#999' }}>{val}</Text>,
    },
    {
      title: 'Deficit',
      key: 'deficit',
      align: 'center' as const,
      render: (_: unknown, record: ProductLocation) => {
        const deficit = record.minimumStock - record.currentStock;
        return (
          <Tag color="red" style={{ fontWeight: 700 }}>
            -{deficit}
          </Tag>
        );
      },
    },
  ];

  // ─── Chart configs ────────────────────────────────────────────────

  const columnConfig = {
    data: columnData,
    xField: 'ubicacion',
    yField: 'valor',
    autoFit: true,
    theme: 'classicDark' as const,
    colorField: 'ubicacion',
    axis: {
      x: {
        label: { style: { fill: '#999', fontSize: 11 } },
        title: false as const,
      },
      y: {
        label: { style: { fill: '#666', fontSize: 11 } },
        title: false as const,
      },
    },
    style: {
      radiusTopLeft: 6,
      radiusTopRight: 6,
      maxWidth: 48,
    },
    tooltip: {
      items: [
        {
          channel: 'y',
          valueFormatter: (v: number) => formatCurrency(v),
        },
      ],
    },
  };

  const lineConfig = {
    data: lineData,
    xField: 'fecha',
    yField: 'cantidad',
    colorField: 'tipo',
    autoFit: true,
    theme: 'classicDark' as const,
    shapeField: 'smooth',
    scale: {
      color: {
        range: ['#52c41a', '#ff4d4f', '#faad14', '#1890ff'],
      },
    },
    point: {
      shapeField: 'circle',
      sizeField: 3,
    },
    axis: {
      x: {
        label: { style: { fill: '#999', fontSize: 11 } },
        title: false as const,
      },
      y: {
        label: { style: { fill: '#666', fontSize: 11 } },
        title: false as const,
      },
    },
    legend: {
      color: {
        position: 'top' as const,
        itemLabelFill: '#999',
      },
    },
  };

  // ─── Loading state ────────────────────────────────────────────────

  const isLoadingStats = loadingProducts || loadingInventoryValue || loadingLowStock || loadingMovements;

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Title level={3} style={{ margin: 0, color: '#f0f0f0', letterSpacing: '-0.02em' }}>
          Dashboard
        </Title>
        <Text style={{ color: '#555' }}>
          Resumen general del inventario
        </Text>
      </div>

      {/* ─── Row 1: Stat Cards ─────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} hoverable>
            {isLoadingStats ? (
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
            ) : (
              <Statistic
                title={<span style={{ color: '#888', fontSize: 13 }}>Total Productos</span>}
                value={totalProducts}
                prefix={<ShoppingOutlined style={{ color: '#3b82f6' }} />}
                valueStyle={{ color: '#e0e0e0', fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} hoverable>
            {isLoadingStats ? (
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
            ) : (
              <Statistic
                title={<span style={{ color: '#888', fontSize: 13 }}>Valor Total Inventario</span>}
                value={totalValue}
                prefix={<DollarOutlined style={{ color: '#10b981' }} />}
                valueStyle={{ color: '#e0e0e0', fontWeight: 700 }}
                formatter={(val) => formatCurrency(Number(val))}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} hoverable>
            {isLoadingStats ? (
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
            ) : (
              <Statistic
                title={<span style={{ color: '#888', fontSize: 13 }}>Alertas Stock Bajo</span>}
                value={lowStockCount}
                prefix={<WarningOutlined style={{ color: lowStockCount > 0 ? '#ff4d4f' : '#faad14' }} />}
                valueStyle={{ color: lowStockCount > 0 ? '#ff4d4f' : '#e0e0e0', fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={cardStyle} hoverable>
            {isLoadingStats ? (
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
            ) : (
              <Statistic
                title={<span style={{ color: '#888', fontSize: 13 }}>Movimientos Hoy</span>}
                value={movementsToday}
                prefix={<SwapOutlined style={{ color: '#8b5cf6' }} />}
                valueStyle={{ color: '#e0e0e0', fontWeight: 700 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ─── Row 2: Charts ─────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ color: '#d4d4d4', fontSize: 14, fontWeight: 600 }}>
                Valor Inventario por Ubicacion
              </span>
            }
            style={chartCardStyle}
            styles={{ header: { borderBottom: '1px solid #1f1f1f' }, body: { padding: '16px 16px 8px' } }}
          >
            {loadingInventoryValue ? (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : columnData.length === 0 ? (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#555' }}>Sin datos de inventario</Text>
              </div>
            ) : (
              <div style={{ height: 300 }}>
                <Column {...columnConfig} />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ color: '#d4d4d4', fontSize: 14, fontWeight: 600 }}>
                Movimientos Ultimos 7 Dias
              </span>
            }
            style={chartCardStyle}
            styles={{ header: { borderBottom: '1px solid #1f1f1f' }, body: { padding: '16px 16px 8px' } }}
          >
            {loadingRecentMovements ? (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton active paragraph={{ rows: 6 }} />
              </div>
            ) : (
              <div style={{ height: 300 }}>
                <Line {...lineConfig} />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ─── Row 3: Low Stock Table ────────────────────────────────── */}
      <Card
        title={
          <span style={{ color: '#d4d4d4', fontSize: 14, fontWeight: 600 }}>
            <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Productos con Stock Bajo
          </span>
        }
        style={{ ...chartCardStyle, marginTop: 16 }}
        styles={{ header: { borderBottom: '1px solid #1f1f1f' }, body: { padding: 0 } }}
      >
        <Table
          dataSource={lowStockItems}
          columns={lowStockColumns}
          rowKey="id"
          loading={loadingLowStock}
          pagination={false}
          size="small"
          locale={{ emptyText: 'No hay productos con stock bajo' }}
          style={{ background: 'transparent' }}
        />
      </Card>
    </div>
  );
}
