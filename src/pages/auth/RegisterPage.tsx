import { useState } from 'react';
import { Form, Input, Button, Typography, App } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/endpoints/auth';
import { useAuthStore } from '../../store/authStore';
import type { RegisterInput } from '../../types/models';
import { AxiosError } from 'axios';
import type { ApiError } from '../../types/models';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { message } = App.useApp();

  const onFinish = async (values: RegisterInput) => {
    setLoading(true);
    try {
      const response = await authApi.register(values);
      setAuth(response.token, response.user);
      message.success('Cuenta creada exitosamente');
      navigate('/');
    } catch (err) {
      const error = err as AxiosError<ApiError>;
      const msg = error.response?.data?.error?.message ?? 'Error al crear la cuenta';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          padding: '48px 36px',
          borderRadius: 16,
          background: 'linear-gradient(145deg, #1a1a1a 0%, #111111 100%)',
          border: '1px solid #2a2a2a',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1668dc 0%, #1890ff 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              letterSpacing: -1,
            }}
          >
            IN
          </div>
          <Title level={3} style={{ margin: 0, color: '#f0f0f0', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Crear Cuenta
          </Title>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 8, display: 'block' }}>
            Regístrate para gestionar el inventario
          </Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            rules={[
              { required: true, message: 'Ingresa tu nombre' },
              { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#555' }} />}
              placeholder="Nombre completo"
              autoComplete="name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Ingresa tu correo electrónico' },
              { type: 'email', message: 'Correo electrónico no válido' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#555' }} />}
              placeholder="Correo electrónico"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Ingresa una contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#555' }} />}
              placeholder="Contraseña"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16, marginTop: 32 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Crear Cuenta
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ color: '#555' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: '#1890ff', fontWeight: 500 }}>
                Iniciar Sesión
              </Link>
            </Text>
          </div>
        </Form>
      </div>
    </div>
  );
}
