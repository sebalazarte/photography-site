import type React from 'react';
import UploadPhotos from '../components/UploadPhotos';

const Home: React.FC = () => {
  return (
    <div>
      <h2>Subir Fotos Seleccionadas</h2>
      <p>Arrastra y suelta o selecciona imágenes para subir.</p>
      <UploadPhotos />
    </div>
  );
};

export default Home;
