import { Navigate } from 'react-router-dom';
import type React from 'react';
import { useAuth } from '../context/AuthContext';
import PersonalDataForm from '../components/profile/PersonalDataForm';

const ProfilePersonalData: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="vstack gap-4 font-monospace">
      <header>
        <h1 className="h4 mb-1">Datos personales</h1>
        <p className="text-secondary mb-0">Administra la información visible en tu portfolio.</p>
      </header>

      <PersonalDataForm />
    </div>
  );
};

export default ProfilePersonalData;
