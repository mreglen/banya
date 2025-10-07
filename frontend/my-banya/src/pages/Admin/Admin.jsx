// src/pages/Admin/Admin.jsx
import { NavLink, Outlet } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Админ панель</h1>
          <NavLink to="/" className="text-sm text-gray-500 mt-1 hover:underline">
            Николаевские бани
          </NavLink>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/admin/reservations"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            Записи
          </NavLink>

          <NavLink
            to="/admin/bookings"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            Заявки
          </NavLink>

          <NavLink
            to="/admin/brooms"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            Веники
          </NavLink>
          <NavLink
            to="/admin/massages"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            Массаж
          </NavLink>
          <NavLink
            to="/admin/baths"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            Бани
          </NavLink>
          <NavLink
            to="/admin/kitchen"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl transition ${isActive
                ? 'bg-green-100 text-green-800 border border-green-200 font-medium'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`
            }
          >
            Кухня
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Admin;