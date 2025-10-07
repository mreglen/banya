import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './pages/Home/Home';
import Booking from './pages/Booking/Booking';
import Baths from './pages/Baths/Baths';
import Contacts from './pages/Contacts/Contacts';
import Massages from './pages/Massages/Massages';
import BathsCard from './pages/Baths/BathsCard/BathsCard';
import AdminLogin from './pages/Admin/AdminLogin/AdminLogin';
import PrivateRoute from './components/PrivateRoute';

import Admin from './pages/Admin/Admin';
import AdminReservations from './pages/Admin/Reservations/AdminReservations';
import AdminBookings from './pages/Admin/AdminBookings/AdminBookings';
import Kitchen from './pages/Kitchen/Kitchen';
import AdminBrooms from './pages/Admin/AdminBrooms/AdminBrooms'; 
import AdminMassages from './pages/Admin/AdminMassages/AdminMassages';
import AdminBathsList from './pages/Admin/AdminBaths/AdminBathsList';
import AdminKitchen from './pages/Admin/AdminMenu/AdminKitchen';


function AppWithLayout() {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/baths" element={<Baths />} />
        <Route path="/baths/:id" element={<BathsCard />} />
        <Route path="/contact" element={<Contacts />} />
        <Route path="/massages" element={<Massages />} />
        <Route path="/kitchen" element={<Kitchen />} />

        <Route path="/admin" element={
          <PrivateRoute>
            <Admin />
          </PrivateRoute>
        }>
          <Route index element={<div>Добро пожаловать в админ-панель</div>} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="brooms" element={<AdminBrooms />} />
          <Route path="massages" element={<AdminMassages />} />
          <Route path="baths" element={<AdminBathsList />} />
          <Route path="kitchen" element={<AdminKitchen />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWithLayout />
    </BrowserRouter>
  );
}

export default App;