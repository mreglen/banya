import { useEffect, lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, logOut } from './redux/slices/authSlice';
import { getProfile } from './redux/slices/adminApi';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import RoleBasedRoute from './pages/Admin/Company/RoleBasedRoute/RoleBasedRoute';
import { Toaster } from 'react-hot-toast';

const AdminReservations = lazy(() => import('./pages/Admin/Reservations/AdminReservationsNew'));
const AdminBookings = lazy(() => import('./pages/Admin/AdminBookings/AdminBookings'));
const AdminBathsList = lazy(() => import('./pages/Admin/AdminBaths/AdminBathsList'));
const BathForm = lazy(() => import('./pages/Admin/AdminBaths/BathForm'));
const DocumentEntrance = lazy(() => import('./pages/Admin/Documents/DocumentsEntrance/DocumentEntrance'));
const AddDocumentEntrance = lazy(() => import('./pages/Admin/Documents/DocumentsEntrance/AddDocumentEntrance'));
const EntranceDrafts = lazy(() => import('./pages/Admin/Documents/DocumentsEntrance/EntranceDrafts'));
const ProductRequestsList = lazy(() => import('./pages/Admin/Documents/ProductRequests/ProductRequestsList'));
const AddProductRequest = lazy(() => import('./pages/Admin/Documents/ProductRequests/AddProductRequest'));
const ProductRequestReview = lazy(() => import('./pages/Admin/Documents/ProductRequests/ProductRequestReview'));
const Clients = lazy(() => import('./pages/Admin/Company/Clients/Clients'));
const ClientForm = lazy(() => import('./pages/Admin/Company/Clients/ClientsForm'));
const Partner = lazy(() => import('./pages/Admin/Company/Partners/Partner'));
const PartnerForm = lazy(() => import('./pages/Admin/Company/Partners/PartnerForm'));
const AddProduct = lazy(() => import('./pages/Admin/Services/AddProduct'));
const Storage = lazy(() => import('./pages/Admin/Storage/Storage'));
const Product = lazy(() => import('./pages/Admin/Storage/Product'));
const AddStorageProduct = lazy(() => import('./pages/Admin/Storage/AddStorageProduct'));
const DocumentsRealization = lazy(() => import('./pages/Admin/Documents/DocumentsRealization/DocumentsRealization'));
const DeletionRequestsPage = lazy(() => import('./pages/Admin/DeletionRequestsPage/DeletionRequestsPage'));
const Users = lazy(() => import('./pages/Admin/Company/Staffs/Users'));
const UserForm = lazy(() => import('./pages/Admin/Company/Staffs/UserForm'));
const Organization = lazy(() => import('./pages/Admin/Company/Organization/Organization'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const PasswordResetRequest = lazy(() => import('./pages/Admin/AdminLogin/PasswordResetRequest'));
const PasswordResetVerify = lazy(() => import('./pages/Admin/AdminLogin/PasswordResetVerify'));
const PasswordResetComplete = lazy(() => import('./pages/Admin/AdminLogin/PasswordResetComplete'));
const AdministratorHubPage = lazy(() => import('./pages/Admin/Administrator/AdministratorHubPage'));
const AdministratorAuditPage = lazy(() => import('./pages/Admin/Administrator/AdministratorPageNew'));
const Roles = lazy(() => import('./pages/Admin/Company/Staffs/Roles/Roles'));
const Promotions = lazy(() => import('./pages/Admin/Promotions/Promotions'));
const SettingsPage = lazy(() => import('./pages/Admin/Settings/SettingsPage'));
const SupportPage = lazy(() => import('./pages/Admin/Support/SupportPage'));
const CreateTicketForm = lazy(() => import('./pages/Admin/Support/CreateTicketForm'));
const ChatPage = lazy(() => import('./pages/Admin/Support/ChatPage'));
const ReservationPrintDocument = lazy(() => import('./pages/Admin/Reservations/ReservationPrintDocument'));
const AdminNotFound = lazy(() => import('./pages/Admin/AdminNotFound/AdminNotFound'));
const Finance = lazy(() => import('./pages/Admin/Finance/Finance'));

const AdminPageFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-gray-500">Загрузка...</div>
);

const withAdminSuspense = (element) => (
  <Suspense fallback={<AdminPageFallback />}>{element}</Suspense>
);

const isPwaStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

function AppWithLayout() {
  const dispatch = useDispatch();
  const token = localStorage.getItem('access_token');
  const location = useLocation();
  const navigate = useNavigate();
  const hideHeader = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isPwaStandalone() && location.pathname === '/') {
      navigate('/admin', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const isAdminSessionRoute =
      location.pathname.startsWith('/admin') &&
      location.pathname !== '/admin/login' &&
      !location.pathname.startsWith('/admin/reset-password');

    if (token && isAdminSessionRoute) {
      getProfile()
        .then((res) => {
          dispatch(setCredentials({ access_token: token, user: res.data }));
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            dispatch(logOut());
          }
        });
    }
  }, [dispatch, token, location.pathname]);

  return (
    <>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: '#059669',
            },
          },
          error: {
            style: {
              background: '#dc2626',
            },
          },
        }}
      />
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
          <Route index element={withAdminSuspense(<AdminDashboard />)} />

          <Route path="administrator" element={withAdminSuspense(<RoleBasedRoute adminOnly><AdministratorHubPage /></RoleBasedRoute>)} />
          <Route path="administrator/audit" element={withAdminSuspense(<RoleBasedRoute adminOnly><AdministratorAuditPage /></RoleBasedRoute>)} />
          <Route path="administrator/roles" element={withAdminSuspense(<RoleBasedRoute adminOnly><Roles /></RoleBasedRoute>)} />
          <Route path="reservations" element={withAdminSuspense(<RoleBasedRoute requiredPermission="reservations:view"><AdminReservations /></RoleBasedRoute>)} />
          <Route path="reservations/print/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="reservations:view"><ReservationPrintDocument /></RoleBasedRoute>)} />
          <Route path="bookings" element={withAdminSuspense(<RoleBasedRoute requiredPermission="bookings:view"><AdminBookings /></RoleBasedRoute>)} />
          <Route path="baths" element={withAdminSuspense(<RoleBasedRoute requiredPermission="baths:view"><AdminBathsList /></RoleBasedRoute>)} />
          <Route path="baths/add" element={withAdminSuspense(<RoleBasedRoute requiredPermission="baths:manage"><BathForm /></RoleBasedRoute>)} />
          <Route path="baths/edit/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="baths:manage"><BathForm /></RoleBasedRoute>)} />
          <Route path="promotions" element={withAdminSuspense(<RoleBasedRoute requiredPermission="promotions:view"><Promotions /></RoleBasedRoute>)} />
          <Route path="documents/entrance" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:view"><DocumentEntrance /></RoleBasedRoute>)} />
          <Route path="documents/entrance/drafts" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:view"><EntranceDrafts /></RoleBasedRoute>)} />
          <Route path="documents/entrance/add" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:manage"><AddDocumentEntrance /></RoleBasedRoute>)} />
          <Route path="documents/entrance/edit/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission={['documents:edit', 'documents:manage']}><AddDocumentEntrance /></RoleBasedRoute>)} />
          <Route path="documents/product-requests" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:view"><ProductRequestsList /></RoleBasedRoute>)} />
          <Route path="documents/product-requests/add" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:manage"><AddProductRequest /></RoleBasedRoute>)} />
          <Route path="documents/product-requests/edit/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:manage"><AddProductRequest /></RoleBasedRoute>)} />
          <Route path="documents/product-requests/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:view"><ProductRequestReview /></RoleBasedRoute>)} />
          <Route path="documents/realization" element={withAdminSuspense(<RoleBasedRoute requiredPermission="documents:view"><DocumentsRealization /></RoleBasedRoute>)} />
          <Route path="company/client" element={withAdminSuspense(<RoleBasedRoute requiredPermission="clients:view"><Clients /></RoleBasedRoute>)} />
          <Route path="company/client/edit/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="clients:manage"><ClientForm /></RoleBasedRoute>)} />
          <Route path="company/client/add" element={withAdminSuspense(<RoleBasedRoute requiredPermission="clients:manage"><ClientForm /></RoleBasedRoute>)} />
          <Route path="company/user" element={withAdminSuspense(<RoleBasedRoute requiredPermission="staff:view"><Users /></RoleBasedRoute>)} />
          <Route path="company/user/edit/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="staff:manage"><UserForm /></RoleBasedRoute>)} />
          <Route path="company/user/add" element={withAdminSuspense(<RoleBasedRoute requiredPermission="staff:manage"><UserForm /></RoleBasedRoute>)} />
          <Route path="company/partner" element={withAdminSuspense(<RoleBasedRoute requiredPermission="partners:view"><Partner /></RoleBasedRoute>)} />
          <Route path="company/partner/edit/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="partners:manage"><PartnerForm /></RoleBasedRoute>)} />
          <Route path="company/partner/add" element={withAdminSuspense(<RoleBasedRoute requiredPermission="partners:manage"><PartnerForm /></RoleBasedRoute>)} />
          <Route path="company/organization" element={withAdminSuspense(<Organization />)} />
          <Route path="storage/nomenclature" element={withAdminSuspense(<RoleBasedRoute requiredPermission="storage:view"><Storage /></RoleBasedRoute>)} />
          <Route path="storage/nomenclature/add/product" element={withAdminSuspense(<RoleBasedRoute requiredPermission="storage:manage"><AddStorageProduct /></RoleBasedRoute>)} />
          <Route path="storage/product/:id" element={withAdminSuspense(<RoleBasedRoute requiredPermission="storage:view"><Product /></RoleBasedRoute>)} />
          <Route path="deletion-requests" element={withAdminSuspense(<RoleBasedRoute requiredPermission="staff:manage"><DeletionRequestsPage /></RoleBasedRoute>)} />
          <Route path="add-product" element={withAdminSuspense(<RoleBasedRoute requiredPermission="storage:manage"><AddProduct /></RoleBasedRoute>)} />
          <Route path="settings" element={withAdminSuspense(<RoleBasedRoute adminOnly><SettingsPage /></RoleBasedRoute>)} />
          <Route path="finance" element={withAdminSuspense(<RoleBasedRoute requiredPermission="finance:view"><Finance /></RoleBasedRoute>)} />
          <Route path="support" element={withAdminSuspense(<SupportPage />)} />
          <Route path="support/create" element={withAdminSuspense(<CreateTicketForm />)} />
          <Route path="support/ticket/:id" element={withAdminSuspense(<ChatPage />)} />
          <Route path="*" element={withAdminSuspense(<AdminNotFound />)} />
        </Route>


        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/reset-password" element={withAdminSuspense(<PasswordResetRequest />)} />
        <Route path="/admin/reset-password/verify" element={withAdminSuspense(<PasswordResetVerify />)} />
        <Route path="/admin/reset-password/complete" element={withAdminSuspense(<PasswordResetComplete />)} />
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