import HomeImageGallery from '../components/photos/HomeImageGallery';
import { HOME_FOLDER } from '../constants';
import { useFolderPhotos } from '../hooks/useFolderPhotos';

const Home = () => {
  const { photos, setPhotos, loading } = useFolderPhotos(HOME_FOLDER);

  return (
    <div className="home-page">
      <HomeImageGallery
        photos={photos}
        loading={loading}
        onPhotosChange={setPhotos}
      />
    </div>
  );
};

export default Home;
