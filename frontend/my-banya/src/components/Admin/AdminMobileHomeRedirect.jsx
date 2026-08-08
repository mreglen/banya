import { Navigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MOBILE_HOME_PATH } from '../../config/adminNavConfig';

/**
 * На телефоне главная /admin перенаправляет на документы реализации.
 * На desktop показывает обычную сводку (children).
 */
function AdminMobileHomeRedirect({ children }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <Navigate to={MOBILE_HOME_PATH} replace />;
  }

  return children;
}

export default AdminMobileHomeRedirect;
