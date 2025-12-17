import type React from 'react';
import type { CustomerRecord } from '../../api/users';

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const EditIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M4 17v3h3l11-11-3-3L4 17z" />
    <path d="M13 6l3 3" />
  </svg>
);

const TrashIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M5 7h14" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M7 7l1 12h8l1-12" />
    <path d="M9 7V5h6v2" />
  </svg>
);

const PendingIcon = () => (
  <svg {...iconProps} aria-hidden="true">
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.5 2.5" />
  </svg>
);

interface CustomerGridProps {
  customers: CustomerRecord[];
  loading: boolean;
  selectedId: string | null;
  error?: string | null;
  onSelect: (customerId: string | null) => void;
  onRefresh: () => void;
  onCreateNew: () => void;
  onDelete: (customerId: string) => void;
  deletingId: string | null;
}

const CustomerGrid: React.FC<CustomerGridProps> = ({
  customers,
  loading,
  selectedId,
  error,
  onSelect,
  onRefresh,
  onCreateNew,
  onDelete,
  deletingId,
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
                  const isDeleting = deletingId === customer.id;
                  const customerLabel = customer.name || customer.username;
                  return (
                    <tr key={customer.id} className={isSelected ? 'table-active' : undefined}>
                      <td>{customer.username}</td>
                      <td>{customer.name ?? '—'}</td>
                      <td>{customer.email ?? '—'}</td>
                      <td>{customer.phone ?? '—'}</td>
                      <td className="text-end">
                        <div className="d-inline-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary icon-button"
                            onClick={() => onSelect(customer.id)}
                            aria-label={`Editar ${customerLabel}`}
                            disabled={loading || Boolean(deletingId)}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger icon-button"
                            onClick={() => {
                              if (isDeleting) return;
                              const confirmed = window.confirm(`¿Eliminar al cliente "${customerLabel}"? Esta acción no se puede deshacer.`);
                              if (confirmed) {
                                onDelete(customer.id);
                              }
                            }}
                            aria-label={`Eliminar ${customerLabel}`}
                            disabled={isDeleting || loading}
                          >
                            {isDeleting ? <PendingIcon /> : <TrashIcon />}
                          </button>
                        </div>
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
