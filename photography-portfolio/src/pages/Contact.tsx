import { useState } from 'react';
import type React from 'react';

type Form = { name: string; email: string; subject: string; message: string };

const Contact: React.FC = () => {
  const [form, setForm] = useState<Form>({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return setStatus('error');
    setStatus('sending');
    setTimeout(() => {
      console.log('Contact form:', form);
      setStatus('sent');
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 1500);
    }, 600);
  };

  return (
    <div className='font-monospace'>
      <h2 className="h3 mb-1">Contacto</h2>
      <p className="text-secondary">Completa el formulario para ponerte en contacto.</p>
      <form onSubmit={onSubmit} className="row g-3" style={{ maxWidth: 640 }}>
        <div className="col-12">
          <input className="form-control" name="name" placeholder="Nombre" value={form.name} onChange={onChange} />
        </div>
        <div className="col-12">
          <input className="form-control" name="email" placeholder="Email" type="email" value={form.email} onChange={onChange} />
        </div>
        <div className="col-12">
          <input className="form-control" name="subject" placeholder="Asunto (opcional)" value={form.subject} onChange={onChange} />
        </div>
        <div className="col-12">
          <textarea className="form-control" name="message" placeholder="Mensaje" value={form.message} onChange={onChange} style={{ minHeight: 160 }} />
        </div>
        <div className="col-12 d-flex align-items-center gap-2">
          <button disabled={status==='sending'} className="btn btn-primary">{status==='sending' ? 'Enviando…' : 'Enviar'}</button>
          {status === 'error' && <span className="text-danger">Completa los campos obligatorios.</span>}
          {status === 'sent' && <span className="text-success">¡Enviado!</span>}
        </div>
      </form>
    </div>
  );
};

export default Contact;
