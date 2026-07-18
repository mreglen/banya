// RoleBasedRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { memo } from 'react';

function RoleBasedRoute({ children, requiredPermission, adminOnly = false }) {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (adminOnly && !user.is_admin) {
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-bold">Доступ запрещён</h2>
        <p>Раздел доступен только администратору системы.</p>
      </div>
    );
  }

  const requiredPermissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : requiredPermission
      ? [requiredPermission]
      : [];

  // Проверяем, есть ли у пользователя нужное право
  if (requiredPermissions.length > 0) {
    // Раздел администратора доступен только системному админу
    if (requiredPermissions.some((code) => code.startsWith('administrator:')) && !user.is_admin) {
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

    const hasPermission = requiredPermissions.some((code) =>
      user.permissions?.some((p) => p.code === code)
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
