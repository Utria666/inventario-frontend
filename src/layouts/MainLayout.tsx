import { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import { Dropdown, Avatar, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TagsOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  TeamOutlined,
  DatabaseOutlined,
  SwapOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types/models';

const { Text } = Typography;

function getMenuItems(role: string): MenuDataItem[] {
  const allItems: (MenuDataItem & { adminOnly?: boolean })[] = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <DashboardOutlined />,
    },
    {
      path: '/productos',
      name: 'Productos',
      icon: <ShoppingOutlined />,
    },
    {
      path: '/categorias',
      name: 'Categorías',
      icon: <TagsOutlined />,
      adminOnly: true,
    },
    {
      path: '/ubicaciones',
      name: 'Ubicaciones',
      icon: <EnvironmentOutlined />,
      adminOnly: true,
    },
    {
      path: '/proveedores',
      name: 'Proveedores',
      icon: <ShopOutlined />,
      adminOnly: true,
    },
    {
      path: '/usuarios',
      name: 'Usuarios',
      icon: <TeamOutlined />,
      adminOnly: true,
    },
    {
      path: '/stock',
      name: 'Stock por Ubicación',
      icon: <DatabaseOutlined />,
    },
    {
      path: '/movimientos',
      name: 'Movimientos',
      icon: <SwapOutlined />,
    },
    {
      path: '/reportes',
      name: 'Reportes',
      icon: <BarChartOutlined />,
    },
  ];

  if (role === Role.ADMIN) {
    return allItems;
  }

  return allItems.filter((item) => !item.adminOnly);
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user?.role ?? Role.USER;
  const menuItems = getMenuItems(userRole);

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <ProLayout
      title="Sistema de Inventario"
      layout="side"
      fixSiderbar
      collapsed={collapsed}
      onCollapse={setCollapsed}
      location={{ pathname: location.pathname }}
      route={{
        path: '/',
        children: menuItems,
      }}
      token={{
        sider: {
          colorMenuBackground: '#0d0d0d',
          colorMenuItemDivider: '#1a1a1a',
          colorTextMenu: '#a0a0a0',
          colorTextMenuSelected: '#ffffff',
          colorBgMenuItemSelected: 'rgba(99, 178, 255, 0.08)',
          colorTextMenuActive: '#ffffff',
          colorBgMenuItemHover: 'rgba(255, 255, 255, 0.04)',
          colorTextMenuItemHover: '#d0d0d0',
          colorBgMenuItemActive: 'rgba(99, 178, 255, 0.06)',
        },
        header: {
          colorBgHeader: '#0a0a0a',
          colorTextRightActionsItem: '#d0d0d0',
        },
        pageContainer: {
          colorBgPageContainer: '#0a0a0a',
          paddingBlockPageContainerContent: 24,
          paddingInlinePageContainerContent: 32,
        },
      }}
      bgLayoutImgList={[]}
      menuItemRender={(item, dom) => (
        <Link to={item.path ?? '/'}>{dom}</Link>
      )}
      headerTitleRender={(logo, title) => (
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          {logo}
          {!collapsed && (
            <span style={{
              color: '#f0f0f0',
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}>
              {title}
            </span>
          )}
        </Link>
      )}
      logo={
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#fff',
          flexShrink: 0,
        }}>
          I
        </div>
      }
      avatarProps={{
        render: () => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile-info',
                  label: (
                    <Space direction="vertical" size={0} style={{ padding: '4px 0' }}>
                      <Text strong style={{ color: '#f0f0f0', fontSize: 13 }}>
                        {user?.name ?? 'Usuario'}
                      </Text>
                      <Text style={{ color: '#666', fontSize: 11 }}>
                        {user?.email ?? ''}
                      </Text>
                      <Text style={{ color: '#444', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {userRole}
                      </Text>
                    </Space>
                  ),
                  disabled: true,
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Cerrar Sesión',
                  danger: true,
                  onClick: handleLogout,
                },
              ],
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space style={{ cursor: 'pointer', padding: '0 8px' }} size={8}>
              <Avatar
                size={30}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
                icon={!user?.name ? <UserOutlined /> : undefined}
              >
                {user?.name ? userInitial : undefined}
              </Avatar>
              {!collapsed && (
                <Text style={{ color: '#c0c0c0', fontSize: 13 }}>
                  {user?.name ?? 'Usuario'}
                </Text>
              )}
            </Space>
          </Dropdown>
        ),
      }}
      contentStyle={{
        margin: 0,
        minHeight: 'calc(100vh - 56px)',
      }}
      siderWidth={240}
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
      }}
    >
      <Outlet />
    </ProLayout>
  );
}
