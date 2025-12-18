import HomeImageGallery from '../components/photos/HomeImageGallery';
import { HOME_FOLDER } from '../constants';
import { useFolderPhotos } from '../hooks/useFolderPhotos';

const Home = () => {
  const { photos, loading } = useFolderPhotos(HOME_FOLDER);

  return (
    <div className="home-page">
      <HomeImageGallery photos={photos} loading={loading} />
    </div>
  );
};

export default Home;
