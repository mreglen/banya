import { Navigate, useLocation } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  if (!token) {

    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

export default PrivateRoute;