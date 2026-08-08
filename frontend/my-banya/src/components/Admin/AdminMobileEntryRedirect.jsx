import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MOBILE_HOME_PATH } from '../../config/adminNavConfig';

/**
 * После входа в админку на телефоне открывает реализацию вместо сводки.
 */
function AdminMobileEntryRedirect() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isMobile) return;
    const path = location.pathname.replace(/\/$/, '') || '/admin';
    if (path === '/admin') {
      navigate(MOBILE_HOME_PATH, { replace: true });
    }
  }, [isMobile, location.pathname, navigate]);

  return null;
}

export default AdminMobileEntryRedirect;
