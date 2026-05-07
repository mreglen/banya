// RoleBasedRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { memo } from 'react';

function RoleBasedRoute({ children, requiredPermission }) {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Проверяем, есть ли у пользователя нужное право
  if (requiredPermission) {
    // Раздел администратора доступен только системному админу
    if (requiredPermission.startsWith('administrator:') && !user.is_admin) {
      return (
        <div className="p-8 text-red-600">
          <h2 className="text-xl font-bold">Доступ запрещён</h2>
          <p>Раздел администратора доступен только администратору системы.</p>
        </div>
      );
    }

    // Админ и директор имеют все остальные права
    if (user.is_admin || user.is_director) {
      return children;
    }

    const hasPermission = user.permissions?.some(
      p => p.code === requiredPermission
    );
    
    if (!hasPermission) {
      return (
        <div className="p-8 text-red-600">
          <h2 className="text-xl font-bold">Доступ запрещён</h2>
          <p>У вас нет прав для доступа к этой странице.</p>
        </div>
      );
    }
  }

  return children;
}

export default memo(RoleBasedRoute);