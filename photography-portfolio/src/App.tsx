import './App.css';
import './components/UploadPhotos.css';
import { NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Galleries from './pages/Galleries';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminHome from './pages/AdminHome';
import AdminGalleries from './pages/AdminGalleries';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="App">
      <header className="App-header mb-4">
        <nav className="navbar navbar-expand-md bg-body-tertiary">
          <div className="container">
            <NavLink to="/" className="navbar-brand"><div className="nav nav-name text-uppercase">Seba Lazarte</div></NavLink>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="mainNav">
              <ul className="navbar-nav ms-auto mb-2 mb-md-0">
                <li className="nav-item">
                  <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/galleries" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Galerías</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/about" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Acerca de mí</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/contact" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Contacto</NavLink>
                </li>
                {!user && (
                  <li className="nav-item">
                    <NavLink to="/login" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Login</NavLink>
                  </li>
                )}
              </ul>
              {user && (
                <ul className="navbar-nav ms-md-3">
                  <li className="nav-item dropdown">
                    <button
                      type="button"
                      className="nav-link dropdown-toggle btn btn-link text-decoration-none"
                      id="userMenu"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Hola, {user.name}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                      <li>
                        <NavLink to="/admin/home" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                          Adm. Home
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/admin/galleries" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                          Adm. Galerías
                        </NavLink>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={logout}>Salir</button>
                      </li>
                    </ul>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main>
        <div className="container py-3">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/galleries" element={<Galleries />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/home" element={<AdminHome />} />
            <Route path="/admin/galleries" element={<AdminGalleries />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;