import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createCustomerAccount,
  fetchCustomers,
  updateCustomerAccount,
  type CustomerRecord,
} from '../api/users';
import CustomerGrid from '../components/customers/CustomerGrid';
import CustomerForm, { type CustomerFormValues } from '../components/customers/CustomerForm';

const AdminCustomers = () => {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes('admin'));

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      if (data.every(customer => customer.id !== selectedId)) {
        setSelectedId(null);
      }
    } catch (err) {
      console.error('No se pudieron cargar los clientes', err);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const selectedCustomer = useMemo(
    () => customers.find(customer => customer.id === selectedId) ?? null,
    [customers, selectedId]
  );

  const handleSubmit = async (values: CustomerFormValues) => {
    const basePayload = {
      email: values.email,
      name: values.name,
      phone: values.phone,
      whatsapp: values.whatsapp,
      about: values.about,
    };

    if (selectedCustomer) {
      const updated = await updateCustomerAccount(selectedCustomer.id, {
        ...basePayload,
        password: values.password || undefined,
      });
      await loadCustomers();
      setSelectedId(updated.id);
      return updated;
    }

    const created = await createCustomerAccount({
      username: values.username,
      password: values.password,
      ...basePayload,
    });
    await loadCustomers();
    setSelectedId(null);
    return created;
  };

  const handleNew = () => {
    setSelectedId(null);
  };

  const handleSelect = (customerId: string | null) => {
    setSelectedId(customerId);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="font-monospace">
      <header className="mb-4">
        <h1 className="h4 mb-1">Gestión de clientes</h1>
        <p className="text-secondary mb-0">Administrá los usuarios con rol de cliente.</p>
      </header>

      <div className="row g-4 align-items-start">
        <section className="col-12 col-lg-7">
          <CustomerGrid
            customers={customers}
            loading={loading}
            selectedId={selectedId}
            error={error}
            onSelect={handleSelect}
            onRefresh={() => {
              void loadCustomers();
            }}
            onCreateNew={handleNew}
          />
        </section>
        <section className="col-12 col-lg-5">
          <CustomerForm
            mode={selectedCustomer ? 'edit' : 'create'}
            customer={selectedCustomer}
            onSubmit={handleSubmit}
            onCancelEdit={() => setSelectedId(null)}
          />
        </section>
      </div>
    </div>
  );
};

export default AdminCustomers;
