import { NavLink } from 'react-router-dom';
import type React from 'react';
import { useAuth } from '../context/AuthContext';
import { CONTACT_NAME } from '../config/contact';

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="App-header mb-4">
      <nav className="navbar navbar-expand-md bg-body-tertiary">
        <div className="container">
          <NavLink to="/" className="navbar-brand">
            <div className="nav nav-name text-uppercase">{CONTACT_NAME}</div>
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav ms-auto mb-2 mb-md-0">
              <li className="nav-item">
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Inicio
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/galleries" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Galerías
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  Contacto
                </NavLink>
              </li>
              {!user && (
                <li className="nav-item">
                  <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Login
                  </NavLink>
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
                    {user.name}
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
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={logout}>
                        Salir
                      </button>
                    </li>
                  </ul>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default AppHeader;
