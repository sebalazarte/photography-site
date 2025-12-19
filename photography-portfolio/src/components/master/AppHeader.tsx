import { NavLink } from 'react-router-dom';
import type React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSite } from '../../context/SiteContext';
import { GalleryIcon, HomeIcon, LogoutIcon, PasswordIcon, SiteDataIcon, UsersIcon } from '../../types/icons';

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { site } = useSite();
  const contactName = site?.name ?? site?.username ?? 'Portfolio';

  const isAdmin = Boolean(user?.roles?.includes('admin'));

  return (
    <header className="App-header mb-4">
      <nav className="navbar navbar-expand-md bg-body-tertiary">
        <div className="container">
          <NavLink to="/" className="navbar-brand">
            <div className="nav nav-name text-uppercase">{contactName}</div>
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
                    {user.username}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                    <li>
                      <NavLink to="/admin/home" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                        <span className="d-inline-flex align-items-center gap-2">
                          <HomeIcon aria-hidden="true" width={14} height={14} />
                          Inicio
                        </span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/galleries" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                        <span className="d-inline-flex align-items-center gap-2">
                          <GalleryIcon aria-hidden="true" width={14} height={14} />
                          Galerías
                        </span>
                      </NavLink>
                    </li>
                    {isAdmin && (
                      <li>
                        <NavLink to="/admin/customers" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                          <span className="d-inline-flex align-items-center gap-2">
                            <UsersIcon aria-hidden="true" width={14} height={14} />
                            Clientes
                          </span>
                        </NavLink>
                      </li>
                    )}
                    <li>
                      <NavLink to="/profile/details" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                        <span className="d-inline-flex align-items-center gap-2">
                          <SiteDataIcon aria-hidden="true" width={14} height={14} />
                          Datos del sitio
                        </span>
                      </NavLink>
                    </li>
                    
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <NavLink to="/profile/password" className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}>
                        <span className="d-inline-flex align-items-center gap-2">
                          <PasswordIcon aria-hidden="true" width={14} height={14} />
                          Cambiar contraseña
                        </span>
                      </NavLink>
                    </li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={() => { void logout(); }}>
                        <span className="d-inline-flex align-items-center gap-2">
                          <LogoutIcon aria-hidden="true" width={14} height={14} />
                          Salir
                        </span>
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
