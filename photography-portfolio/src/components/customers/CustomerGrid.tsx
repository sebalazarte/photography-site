import type React from 'react';
import type { CustomerRecord } from '../../api/users';

interface CustomerGridProps {
  customers: CustomerRecord[];
  loading: boolean;
  selectedId: string | null;
  error?: string | null;
  onSelect: (customerId: string | null) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
}

const CustomerGrid: React.FC<CustomerGridProps> = ({
  customers,
  loading,
  selectedId,
  error,
  onSelect,
  onRefresh,
  onCreateNew,
}) => {
  const hasCustomers = customers.length > 0;

  return (
    <div className="card shadow-sm h-100">
      <div className="card-header d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div>
          <h2 className="h6 mb-1">Clientes registrados</h2>
          <span className="text-secondary small">{customers.length} usuarios de tipo customer</span>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={onCreateNew}>
            Nuevo cliente
          </button>
        </div>
      </div>
      <div className="card-body p-0">
        {error && (
          <div className="alert alert-danger rounded-0 mb-0" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-center text-secondary my-4">Cargando clientes…</p>
        ) : hasCustomers ? (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Email</th>
                  <th scope="col">Teléfono</th>
                  <th scope="col" className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => {
                  const isSelected = selectedId === customer.id;
                  return (
                    <tr key={customer.id} className={isSelected ? 'table-active' : undefined}>
                      <td>{customer.username}</td>
                      <td>{customer.name ?? '—'}</td>
                      <td>{customer.email ?? '—'}</td>
                      <td>{customer.phone ?? '—'}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onSelect(customer.id)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-secondary my-4">Aún no hay clientes registrados.</p>
        )}
      </div>
    </div>
  );
};

export default CustomerGrid;
