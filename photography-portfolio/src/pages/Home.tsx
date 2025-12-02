import { useEffect, useState } from 'react';
import UploadPhotos from '../components/UploadPhotos';
import ImageGallery from '../components/ImageGallery';
import { listPhotos, type StoredPhoto } from '../utils/photoStorage';
import { HOME_FOLDER } from '../constants';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<StoredPhoto[]>(() => listPhotos(HOME_FOLDER));

  useEffect(() => {
    setPhotos(listPhotos(HOME_FOLDER));
  }, []);

  return (
    <div className="home-page">

      <ImageGallery photos={photos} />

      {!user && <p className="text-muted mb-4">Inicia sesión para gestionar las fotos. Mientras tanto, disfruta la galería.</p>}

      {user && (
        <section className="mb-4">
          <UploadPhotos folder={HOME_FOLDER} onPhotosChange={setPhotos} />
        </section>
      )}

      <footer className="home-footer text-uppercase">Matsuya</footer>
    </div>
  );
};

export default Home;
