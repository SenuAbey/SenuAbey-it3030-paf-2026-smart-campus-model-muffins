import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import ResourceGroupPage from './pages/ResourceGroupPage';
import BookingsPage from "./pages/bookings/BookingsPage";
import AdminBookingsPage from "./pages/bookings/AdminBookingsPage";
import './global.css';

export const RoleContext = React.createContext('STUDENT');

function App() {
  const [role, setRole] = useState('STUDENT');

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CataloguePage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/resource-groups" element={<ResourceGroupPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        </Routes>
      </BrowserRouter>
    </RoleContext.Provider>
  );
}

export default App;