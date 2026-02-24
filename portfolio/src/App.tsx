import './App.css';
import './components/photos/UploadPhotos.css';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Galleries from './pages/Galleries';
import Contact from './pages/Contact';
import Login from './pages/Login';
import AdminHome from './pages/AdminHome';
import AdminGalleries from './pages/AdminGalleries';
import AdminCustomers from './pages/AdminCustomers';
import AppHeader from './components/master/AppHeader';
import AppFooter from './components/master/AppFooter';
import { SiteProvider } from './context/SiteContext';
import { ContactProfileProvider } from './context/ContactProfileContext';
import ProfilePersonalData from './pages/ProfilePersonalData';
import ProfileChangePassword from './pages/ProfileChangePassword';

function App() {
  return (
    <SiteProvider>
      <ContactProfileProvider>
        <div className="App">
          <AppHeader />
          <main>
            <div className="container py-3">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/galleries" element={<Galleries />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin/home" element={<AdminHome />} />
                <Route path="/admin/galleries" element={<AdminGalleries />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/profile/details" element={<ProfilePersonalData />} />
                <Route path="/profile/password" element={<ProfileChangePassword />} />
              </Routes>
            </div>
          </main>
          <AppFooter />
        </div>
      </ContactProfileProvider>
    </SiteProvider>
  );
}

export default App;