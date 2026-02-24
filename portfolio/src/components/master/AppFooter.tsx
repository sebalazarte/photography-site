import type React from 'react';
import { useSite } from '../../context/SiteContext';
import { formatWhatsappLink } from '../../utils/contact';

const AppFooter: React.FC = () => {
  const { site, loading } = useSite();
  const contactName = site?.name ?? site?.name ?? 'Portfolio';
  const email = site?.email;
  const phoneLabel = site?.phone ?? site?.whatsapp;
  const whatsappLink = formatWhatsappLink(site?.whatsapp);

  return (
    <footer className="App-footer border-top mt-5 pt-4">
      <div className="container d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div>
          <span className="text-uppercase fw-semibold">{contactName}</span>
        </div>
        {!loading && (
          <div className="d-flex flex-column flex-md-row gap-2">
            {whatsappLink && phoneLabel && (
              <a className="link-dark text-decoration-none" href={whatsappLink} target="_blank" rel="noopener noreferrer">
                WhatsApp: {phoneLabel}
              </a>
            )}
            {email && (
              <a className="link-dark text-decoration-none" href={`mailto:${email}`}>
                Email: {email}
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};

export default AppFooter;
