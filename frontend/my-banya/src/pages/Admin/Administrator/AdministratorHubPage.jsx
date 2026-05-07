import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';

const tiles = [
  {
    id: 'audit',
    title: 'Журнал аудита',
    description: 'Просмотр действий сотрудников и изменений в системе',
    path: '/admin/administrator/audit',
  },
  {
    id: 'roles',
    title: 'Роли',
    description: 'Список ролей, редактирование и назначение прав доступа',
    path: '/admin/administrator/roles',
  },
];

function AdministratorHubPage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  if (!user?.is_admin) {
    return <Navigate to="/admin/reservations" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          Панель администратора
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => navigate(tile.path)}
              className="text-left bg-white rounded-2xl shadow p-6 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition"
            >
              <h2 className="text-xl font-semibold text-gray-800">{tile.title}</h2>
              <p className="text-gray-600 mt-2">{tile.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdministratorHubPage;
