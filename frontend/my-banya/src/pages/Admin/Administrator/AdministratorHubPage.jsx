import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  History,
  Shield,
  Settings,
  HelpCircle,
  Trash2,
  ChevronRight,
} from 'lucide-react';

const tiles = [
  {
    id: 'audit',
    title: 'Аудит',
    description: 'Действия сотрудников',
    path: '/admin/administrator/audit',
    icon: History,
    color: 'text-purple-600 bg-purple-50',
  },
  {
    id: 'roles',
    title: 'Роли',
    description: 'Права доступа',
    path: '/admin/administrator/roles',
    icon: Shield,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'settings',
    title: 'Настройки',
    description: 'Система и QR оплаты',
    path: '/admin/settings',
    icon: Settings,
    color: 'text-gray-700 bg-gray-100',
  },
  {
    id: 'deletion',
    title: 'Удаление',
    description: 'Запросы на удаление',
    path: '/admin/deletion-requests',
    icon: Trash2,
    color: 'text-red-600 bg-red-50',
  },
  {
    id: 'support',
    title: 'Поддержка',
    description: 'Обращения',
    path: '/admin/support',
    icon: HelpCircle,
    color: 'text-indigo-600 bg-indigo-50',
  },
];

function AdministratorHubPage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  if (!user?.is_admin) {
    return <Navigate to="/admin/documents/realization" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Панель администратора
          </h1>
        </div>

        <div className="md:hidden space-y-2 pb-2">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => navigate(tile.path)}
                className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-left active:scale-[0.99] transition"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tile.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{tile.title}</p>
                  <p className="text-xs text-gray-500 truncate">{tile.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
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
