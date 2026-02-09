import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProTable } from '@ant-design/pro-components';
import {
  Tabs,
  Tag,
  Card,
  Statistic,
  Select,
  DatePicker,
  Empty,
  Table,
  Row,
  Col,
  Typography,
  Space,
} from 'antd';
import {
  WarningOutlined,
  SwapOutlined,
  DollarOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportsApi } from '../../api/endpoints/reports';
import { productsApi } from '../../api/endpoints/products';
import { locationsApi } from '../../api/endpoints/locations';
import type { ProductLocation, Movement, MovementType } from '../../types/models';
import type { ProColumns } from '@ant-design/pro-components';
import type { InventoryValueByLocation } from '../../api/endpoints/reports';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const MOVEMENT_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  ENTRY: { color: 'green', label: 'Entrada' },
  EXIT: { color: 'red', label: 'Salida' },
  ADJUSTMENT: { color: 'gold', label: 'Ajuste' },
  TRANSFER: { color: 'blue', label: 'Transferencia' },
};

const MOVEMENT_TYPE_OPTIONS = [
  { label: 'Entrada', value: 'ENTRY' },
  { label: 'Salida', value: 'EXIT' },
  { label: 'Ajuste', value: 'ADJUSTMENT' },
  { label: 'Transferencia', value: 'TRANSFER' },
];

// ─── Tab 1: Stock Bajo ────────────────────────────────────────────────

function LowStockTab() {
  const { data: lowStockItems = [], isLoading } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => reportsApi.getLowStock(),
  });

  // Sort by deficit descending (most critical first)
  const sortedItems = useMemo(() => {
    return [...lowStockItems].sort((a, b) => {
      const deficitA = a.minimumStock - a.currentStock;
      const deficitB = b.minimumStock - b.currentStock;
      return deficitB - deficitA;
    });
  }, [lowStockItems]);

  const columns: ProColumns<ProductLocation>[] = [
    {
      title: 'Producto',
      key: 'product',
      width: 200,
      render: (_text, record) => (
        <Text strong style={{ color: '#e0e0e0' }}>
          {record.product?.name || '-'}
        </Text>
      ),
    },
    {
      title: 'SKU',
      key: 'sku',
      width: 130,
      render: (_text, record) => (
        <Tag style={{ fontFamily: 'monospace' }}>{record.product?.sku || '-'}</Tag>
      ),
    },
    {
      title: 'Ubicación',
      key: 'location',
      width: 160,
      render: (_text, record) => record.location?.name || '-',
    },
    {
      title: 'Stock Actual',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 120,
      align: 'center' as const,
      render: (_text, record) => (
        <span style={{ fontWeight: 600, color: '#ff4d4f' }}>
          {record.currentStock}
        </span>
      ),
    },
    {
      title: 'Stock Mínimo',
      dataIndex: 'minimumStock',
      key: 'minimumStock',
      width: 120,
      align: 'center' as const,
      render: (_text, record) => (
        <span style={{ fontWeight: 600, color: '#faad14' }}>
          {record.minimumStock}
        </span>
      ),
    },
    {
      title: 'Déficit',
      key: 'deficit',
      width: 140,
      align: 'center' as const,
      sorter: (a, b) =>
        (a.minimumStock - a.currentStock) - (b.minimumStock - b.currentStock),
      defaultSortOrder: 'descend',
      render: (_text, record) => {
        const deficit = record.minimumStock - record.currentStock;
        const deficitPercent = record.minimumStock > 0
          ? (deficit / record.minimumStock) * 100
          : 0;
        const isUrgent = deficitPercent > 50;

        return (
          <Tag
            color={isUrgent ? 'red' : 'gold'}
            icon={isUrgent ? <AlertOutlined /> : undefined}
            style={{ fontWeight: 600, fontSize: 13 }}
          >
            -{deficit}
          </Tag>
        );
      },
    },
  ];

  return (
    <ProTable<ProductLocation>
      columns={columns}
      dataSource={sortedItems}
      rowKey="id"
      loading={isLoading}
      scroll={{ x: 900 }}
      search={false}
      options={false}
      headerTitle={
        <Space>
          <WarningOutlined style={{ color: '#ff4d4f' }} />
          <span>Productos con stock bajo ({sortedItems.length})</span>
        </Space>
      }
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} productos`,
      }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No hay productos con stock bajo"
          />
        ),
      }}
    />
  );
}

// ─── Tab 2: Historial de Movimientos ──────────────────────────────────

function MovementHistoryTab() {
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<{
    type?: MovementType;
    productId?: number;
    locationId?: number;
    fromDate?: string;
    toDate?: string;
  }>({});

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getLocations(),
  });

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movementHistory', filters, currentPage],
    queryFn: () =>
      reportsApi.getMovementHistory({
        ...(filters.type && { type: filters.type }),
        ...(filters.productId && { productId: String(filters.productId) }),
        ...(filters.locationId && { locationId: String(filters.locationId) }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        limit: String(PAGE_SIZE),
        offset: String((currentPage - 1) * PAGE_SIZE),
      }),
  });

  const productOptions = useMemo(
    () => products.map((p) => ({ label: `${p.name} (${p.sku})`, value: p.id })),
    [products],
  );

  const locationOptions = useMemo(
    () => locations.map((l) => ({ label: l.name, value: l.id })),
    [locations],
  );

  const columns: ProColumns<Movement>[] = [
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (_text, record) =>
        dayjs(record.createdAt).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (_text, record) => {
        const config = MOVEMENT_TYPE_CONFIG[record.type] || {
          color: 'default',
          label: record.type,
        };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Producto',
      key: 'product',
      width: 200,
      render: (_text, record) =>
        record.productLocation?.product?.name || '-',
    },
    {
      title: 'Ubicación',
      key: 'location',
      width: 160,
      render: (_text, record) => {
        const origin = record.productLocation?.location?.name || '-';
        if (record.type === 'TRANSFER' && record.targetProductLocation) {
          return (
            <span>
              {origin} → {record.targetProductLocation.location?.name || '-'}
            </span>
          );
        }
        return origin;
      },
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center' as const,
      render: (_text, record) => {
        const qty = record.quantity;
        let color = '#fff';
        let prefix = '';
        if (record.type === 'ENTRY') {
          color = '#52c41a';
          prefix = '+';
        } else if (record.type === 'EXIT') {
          color = '#ff4d4f';
          prefix = '-';
        } else if (record.type === 'ADJUSTMENT') {
          color = qty >= 0 ? '#52c41a' : '#ff4d4f';
          prefix = qty >= 0 ? '+' : '';
        } else if (record.type === 'TRANSFER') {
          color = '#1677ff';
        }
        return (
          <span style={{ fontWeight: 600, color }}>
            {prefix}{qty}
          </span>
        );
      },
    },
    {
      title: 'Usuario',
      key: 'user',
      width: 140,
      render: (_text, record) => record.user?.name || '-',
    },
    {
      title: 'Notas',
      dataIndex: 'notes',
      key: 'notes',
      width: 200,
      ellipsis: true,
      render: (_text, record) => record.notes || '-',
    },
  ];

  return (
    <div>
      <Card
        size="small"
        style={{
          marginBottom: 16,
          background: '#141414',
          border: '1px solid #1f1f1f',
        }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Tipo de movimiento"
              allowClear
              style={{ width: '100%' }}
              options={MOVEMENT_TYPE_OPTIONS}
              value={filters.type}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, type: val }));
                setCurrentPage(1);
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Producto"
              allowClear
              showSearch
              style={{ width: '100%' }}
              options={productOptions}
              value={filters.productId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, productId: val }));
                setCurrentPage(1);
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Ubicación"
              allowClear
              showSearch
              style={{ width: '100%' }}
              options={locationOptions}
              value={filters.locationId}
              onChange={(val) => {
                setFilters((prev) => ({ ...prev, locationId: val }));
                setCurrentPage(1);
              }}
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Desde', 'Hasta']}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setFilters((prev) => ({
                    ...prev,
                    fromDate: dates[0]!.startOf('day').toISOString(),
                    toDate: dates[1]!.endOf('day').toISOString(),
                  }));
                } else {
                  setFilters((prev) => ({
                    ...prev,
                    fromDate: undefined,
                    toDate: undefined,
                  }));
                }
                setCurrentPage(1);
              }}
            />
          </Col>
        </Row>
      </Card>

      <ProTable<Movement>
        columns={columns}
        dataSource={movements}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1100 }}
        search={false}
        options={false}
        headerTitle={
          <Space>
            <SwapOutlined style={{ color: '#1677ff' }} />
            <span>Historial de Movimientos</span>
          </Space>
        }
        pagination={{
          current: currentPage,
          pageSize: PAGE_SIZE,
          onChange: (page) => setCurrentPage(page),
          showSizeChanger: false,
          showTotal: () => `Mostrando ${movements.length} movimientos`,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Sin movimientos para los filtros seleccionados"
            />
          ),
        }}
      />
    </div>
  );
}

// ─── Tab 3: Valor del Inventario ──────────────────────────────────────

function InventoryValueTab() {
  const { data: inventoryValue, isLoading } = useQuery({
    queryKey: ['inventoryValue'],
    queryFn: () => reportsApi.getInventoryValue(),
  });

  const locationColumns = [
    {
      title: 'Ubicación',
      dataIndex: 'locationName',
      key: 'locationName',
    },
    {
      title: 'Valor Total ($)',
      dataIndex: 'value',
      key: 'value',
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ fontWeight: 600, color: '#52c41a', fontSize: 14 }}>
          ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
      sorter: (a: InventoryValueByLocation, b: InventoryValueByLocation) =>
        a.value - b.value,
      defaultSortOrder: 'descend' as const,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #0d2818 0%, #141414 100%)',
              border: '1px solid #1a3a28',
            }}
          >
            <Statistic
              title={
                <span style={{ color: '#8fbc8f', fontSize: 16 }}>
                  Valor Total del Inventario
                </span>
              }
              value={inventoryValue?.total ?? 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{
                color: '#52c41a',
                fontSize: 36,
                fontWeight: 700,
              }}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Table
        columns={locationColumns}
        dataSource={inventoryValue?.byLocation ?? []}
        rowKey="locationId"
        loading={isLoading}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Sin datos de inventario"
            />
          ),
        }}
      />
    </div>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────

export default function ReportesPage() {
  const tabItems = [
    {
      key: 'low-stock',
      label: (
        <span>
          <WarningOutlined />
          {' '}Stock Bajo
        </span>
      ),
      children: <LowStockTab />,
    },
    {
      key: 'movement-history',
      label: (
        <span>
          <SwapOutlined />
          {' '}Historial de Movimientos
        </span>
      ),
      children: <MovementHistoryTab />,
    },
    {
      key: 'inventory-value',
      label: (
        <span>
          <DollarOutlined />
          {' '}Valor del Inventario
        </span>
      ),
      children: <InventoryValueTab />,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#f0f0f0' }}>
          Reportes
        </Title>
        <Text style={{ color: '#666' }}>
          Informes y análisis del inventario
        </Text>
      </div>

      <Tabs
        defaultActiveKey="low-stock"
        items={tabItems}
        size="large"
        type="card"
      />
    </div>
  );
}
