import { Navigate } from 'react-router-dom';
import UploadPhotos from '../components/UploadPhotos';
import { HOME_FOLDER } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useFolderPhotos } from '../hooks/useFolderPhotos';

const AdminHome = () => {
  const { user } = useAuth();
  const { photos, setPhotos } = useFolderPhotos(HOME_FOLDER);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="vstack gap-4 font-monospace">
      <header>
        <h1 className="h4 mb-1">Administrar Home</h1>
        <p className="text-secondary mb-0">Sube fotos destacadas para la portada.</p>
      </header>

      <UploadPhotos folder={HOME_FOLDER} photos={photos} onPhotosChange={(next) => setPhotos(next)} />
    </div>
  );
};

export default AdminHome;
