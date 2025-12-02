import ImageGallery from '../components/ImageGallery';
import { HOME_FOLDER } from '../constants';
import { useFolderPhotos } from '../hooks/useFolderPhotos';

const Home = () => {
  const { photos, loading } = useFolderPhotos(HOME_FOLDER);

  return (
    <div className="home-page">
      <ImageGallery folder={HOME_FOLDER} photos={photos} />
      {loading && <p className="text-muted">Cargando galería...</p>}
      <footer className="home-footer text-uppercase">Matsuya</footer>
    </div>
  );
};

export default Home;
