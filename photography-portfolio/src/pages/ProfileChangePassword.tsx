import { Navigate } from 'react-router-dom';
import type React from 'react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordForm from '../components/profile/ChangePasswordForm';

const ProfileChangePassword: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="vstack gap-4 font-monospace">
      <header>
        <h1 className="h4 mb-1">Cambiar contraseña</h1>
        <p className="text-secondary mb-0">Elegí una nueva contraseña segura para tu cuenta.</p>
      </header>

      <ChangePasswordForm />
    </div>
  );
};

export default ProfileChangePassword;
