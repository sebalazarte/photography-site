import type React from 'react';
import { CONTACT_EMAIL, CONTACT_NAME, CONTACT_PHONE, CONTACT_PHONE_WHATSAPP } from '../config/contact';

const AppFooter: React.FC = () => (
  <footer className="App-footer border-top mt-5 pt-4">
    <div className="container d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
      <div>
        <span className="text-uppercase fw-semibold">{CONTACT_NAME}</span>
      </div>
      <div className="d-flex flex-column flex-md-row gap-2">
        <a
          className="link-dark text-decoration-none"
          href={CONTACT_PHONE_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp: {CONTACT_PHONE}
        </a>
        <a className="link-dark text-decoration-none" href={`mailto:${CONTACT_EMAIL}`}>
          Email: {CONTACT_EMAIL}
        </a>
      </div>
    </div>
  </footer>
);

export default AppFooter;
