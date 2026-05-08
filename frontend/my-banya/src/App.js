import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, logOut } from './redux/slices/authSlice';
import { getProfile } from './redux/slices/adminApi';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/Header/Header';
import Home from './pages/Home/Home';
import WebsiteCategoryProductsPage from './pages/Home/WebsiteCategoryProductsPage/WebsiteCategoryProductsPage';
import LandingNotFound from './pages/Home/LandingNotFound/LandingNotFound';
import Baths from './pages/Baths/Baths';
import Booking from './pages/Booking/Booking';
import BathsCard from './pages/Baths/BathsCard/BathsCard';
import AdminLogin from './pages/Admin/AdminLogin/AdminLogin';
import PrivateRoute from './components/PrivateRoute';
import Admin from './pages/Admin/Admin';
import AdminReservations from './pages/Admin/Reservations/AdminReservationsNew';
import AdminBookings from './pages/Admin/AdminBookings/AdminBookings';
import AdminBathsList from './pages/Admin/AdminBaths/AdminBathsList';
import BathForm from './pages/Admin/AdminBaths/BathForm';
import DocumentEntrance from './pages/Admin/Documents/DocumentsEntrance/DocumentEntrance';
import AddDocumentEntrance from './pages/Admin/Documents/DocumentsEntrance/AddDocumentEntrance';
import Clients from './pages/Admin/Company/Clients/Clients';
import ClientForm from './pages/Admin/Company/Clients/ClientsForm';
import Partner from './pages/Admin/Company/Partners/Partner';
import PartnerForm from './pages/Admin/Company/Partners/PartnerForm'
import AddProduct from './pages/Admin/Services/AddProduct';
import Storage from './pages/Admin/Storage/Storage';
import Product from './pages/Admin/Storage/Product';
import AddStorageProduct from './pages/Admin/Storage/AddStorageProduct';
import DocumentsRealization from './pages/Admin/Documents/DocumentsRealization/DocumentsRealization';
import DeletionRequestsPage from './pages/Admin/DeletionRequestsPage/DeletionRequestsPage';
import Users from './pages/Admin/Company/Staffs/Users';
import UserForm from './pages/Admin/Company/Staffs/UserForm';
import RoleBasedRoute from './pages/Admin/Company/RoleBasedRoute/RoleBasedRoute';
import Organization from './pages/Admin/Company/Organization/Organization';
import AdminDashboard from './pages/Admin/AdminDashboard';
import PasswordResetRequest from './pages/Admin/AdminLogin/PasswordResetRequest';
import PasswordResetVerify from './pages/Admin/AdminLogin/PasswordResetVerify';
import PasswordResetComplete from './pages/Admin/AdminLogin/PasswordResetComplete';
import AdministratorHubPage from './pages/Admin/Administrator/AdministratorHubPage';
import AdministratorAuditPage from './pages/Admin/Administrator/AdministratorPageNew';
import Roles from './pages/Admin/Company/Staffs/Roles/Roles';
import Promotions from './pages/Admin/Promotions/Promotions';
import SettingsPage from './pages/Admin/Settings/SettingsPage';
import SupportPage from './pages/Admin/Support/SupportPage';
import CreateTicketForm from './pages/Admin/Support/CreateTicketForm';
import ChatPage from './pages/Admin/Support/ChatPage';
import ReservationPrintDocument from './pages/Admin/Reservations/ReservationPrintDocument';
import AdminNotFound from './pages/Admin/AdminNotFound/AdminNotFound';
import Finance from './pages/Admin/Finance/Finance';




function AppWithLayout() {
  const dispatch = useDispatch();
  const token = localStorage.getItem('access_token');
  const location = useLocation();
  const hideHeader = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (token) {
      console.log('\n=== RESTORING USER SESSION ===');
      console.log('Token present:', !!token);
      getProfile()
        .then((res) => {
          console.log("✅ User loaded:", res.data);
          dispatch(setCredentials({ access_token: token, user: res.data }));
        })
        .catch((err) => {
          console.error('❌ Failed to restore user:', err.message);
          console.error('Response status:', err.response?.status);
          console.error('Response data:', err.response?.data);
          // Don't log out immediately on error - keep stored user data
          // Only clear if it's a 401 (token expired/invalid)
          if (err.response?.status === 401) {
            console.log('🔐 Token expired, logging out');
            dispatch(logOut());
          } else {
            console.log('⚠️ Network error, keeping stored user data');
          }
        });
    }
  }, [dispatch, token]);

  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories/:categoryId/products" element={<WebsiteCategoryProductsPage />} />
        <Route path="/baths" element={<Baths />} />
        <Route path="/baths/:slug" element={<BathsCard />} />
        {/* Оставляем как резерв, но убираем из меню */}
        <Route path="/booking" element={<Booking />} />

        <Route path="/admin" element={
          <PrivateRoute>
            <Admin />
          </PrivateRoute>
        }>
          {/* <Route index element={<div>Добро пожаловать в админ-панель</div>} /> */}
          <Route index element={<AdminDashboard />} />

          <Route path="administrator" element={<AdministratorHubPage />} />
          <Route path="administrator/audit" element={<AdministratorAuditPage />} />
          <Route path="administrator/roles" element={<Roles />} />
          <Route path="reservations" element={<RoleBasedRoute requiredPermission="reservations:view"><AdminReservations /></RoleBasedRoute>} />
          <Route path="reservations/print/:id" element={<RoleBasedRoute requiredPermission="reservations:view"><ReservationPrintDocument /></RoleBasedRoute>} />
          <Route path="bookings" element={<RoleBasedRoute requiredPermission="bookings:view"><AdminBookings /></RoleBasedRoute>} />
          <Route path="baths" element={<RoleBasedRoute requiredPermission="baths:view"><AdminBathsList /></RoleBasedRoute>} />
          <Route path="baths/add" element={<RoleBasedRoute requiredPermission="baths:manage"><BathForm /></RoleBasedRoute>} />
          <Route path="baths/edit/:id" element={<RoleBasedRoute requiredPermission="baths:manage"><BathForm /></RoleBasedRoute>} />
          <Route path="promotions" element={<RoleBasedRoute requiredPermission="promotions:view"><Promotions /></RoleBasedRoute>} />
          <Route path="documents/entrance" element={<RoleBasedRoute requiredPermission="documents:view"><DocumentEntrance /></RoleBasedRoute>} />
          <Route path="documents/entrance/add" element={<RoleBasedRoute requiredPermission="documents:manage"><AddDocumentEntrance /></RoleBasedRoute>} />
          <Route path="documents/entrance/edit/:id" element={<RoleBasedRoute requiredPermission="documents:manage"><AddDocumentEntrance /></RoleBasedRoute>} />
          <Route path="documents/realization" element={<RoleBasedRoute requiredPermission="documents:view"><DocumentsRealization /></RoleBasedRoute>} />
          <Route path="company/client" element={<RoleBasedRoute requiredPermission="clients:view"><Clients /></RoleBasedRoute>} />
          <Route path="company/client/edit/:id" element={<RoleBasedRoute requiredPermission="clients:manage"><ClientForm /></RoleBasedRoute>} />
          <Route path="company/client/add" element={<RoleBasedRoute requiredPermission="clients:manage"><ClientForm /></RoleBasedRoute>} />
          <Route path="company/user" element={<RoleBasedRoute requiredPermission="staff:view"><Users /></RoleBasedRoute>} />
          <Route path="company/user/edit/:id" element={<RoleBasedRoute requiredPermission="staff:manage"><UserForm /></RoleBasedRoute>} />
          <Route path="company/user/add" element={<RoleBasedRoute requiredPermission="staff:manage"><UserForm /></RoleBasedRoute>} />
          <Route path="company/partner" element={<RoleBasedRoute requiredPermission="partners:view"><Partner /></RoleBasedRoute>} />
          <Route path="company/partner/edit/:id" element={<RoleBasedRoute requiredPermission="partners:manage"><PartnerForm /></RoleBasedRoute>} />
          <Route path="company/partner/add" element={<RoleBasedRoute requiredPermission="partners:manage"><PartnerForm /></RoleBasedRoute>} />
          <Route path="company/organization" element={<Organization />} />
          <Route path="storage/nomenclature" element={<RoleBasedRoute requiredPermission="storage:view"><Storage /></RoleBasedRoute>} />
          <Route path="storage/nomenclature/add/product" element={<RoleBasedRoute requiredPermission="storage:manage"><AddStorageProduct /></RoleBasedRoute>} />
          <Route path="storage/product/:id" element={<RoleBasedRoute requiredPermission="storage:view"><Product /></RoleBasedRoute>} />
          <Route path="deletion-requests" element={<RoleBasedRoute requiredPermission="staff:manage"><DeletionRequestsPage /></RoleBasedRoute>} />
          <Route path="add-product" element={<RoleBasedRoute requiredPermission="storage:manage"><AddProduct /></RoleBasedRoute>} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="finance" element={<RoleBasedRoute requiredPermission="finance:view"><Finance /></RoleBasedRoute>} />
          <Route path="support" element={<SupportPage />} />
          <Route path="support/create" element={<CreateTicketForm />} />
          <Route path="support/ticket/:id" element={<ChatPage />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>


        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={<PasswordResetRequest />} />
        <Route path="/admin/reset-password/verify" element={<PasswordResetVerify />} />
        <Route path="/admin/reset-password/complete" element={<PasswordResetComplete />} />
        <Route path="*" element={<LandingNotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppWithLayout />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;