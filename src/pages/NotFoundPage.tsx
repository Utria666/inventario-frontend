import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 56px)',
    }}>
      <Result
        status="404"
        title="404"
        subTitle="La página que buscas no existe."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        }
      />
    </div>
  );
}
