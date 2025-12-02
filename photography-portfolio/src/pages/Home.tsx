import UploadPhotos from '../components/UploadPhotos';
import ImageGallery from '../components/ImageGallery';
import { HOME_FOLDER } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useFolderPhotos } from '../hooks/useFolderPhotos';

const Home = () => {
  const { user } = useAuth();
  const { photos, setPhotos, loading } = useFolderPhotos(HOME_FOLDER);

  return (
    <div className="home-page">

    {!user && (
      <ImageGallery folder={HOME_FOLDER} photos={photos} />
    )}
      

      {loading && <p className="text-muted">Cargando galería...</p>}
      {!user && <p className="text-muted mb-4">Inicia sesión para gestionar las fotos. Mientras tanto, disfruta la galería.</p>}

      {user && (
        <section className="mb-4">
          <UploadPhotos folder={HOME_FOLDER} photos={photos} onPhotosChange={(next) => setPhotos(next)} />
        </section>
      )}

      <footer className="home-footer text-uppercase"></footer>
    </div>
  );
};

export default Home;
