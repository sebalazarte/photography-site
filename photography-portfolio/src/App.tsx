import React from 'react';
import './App.css';
import './components/UploadPhotos.css';
import UploadPhotos from './components/UploadPhotos';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My Photography Portfolio</h1>
        <p>Minimalist and visually appealing design for showcasing photography work</p>
      </header>
      <main>
        <UploadPhotos />
      </main>
    </div>
  );
}

export default App;