import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CataloguePage from './pages/CataloguePage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import ResourceGroupPage from './pages/ResourceGroupPage';
import './global.css';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketStatsPage from './pages/TicketStatsPage';
import TechniciansPage from './pages/TechniciansPage';

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
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/stats" element={<TicketStatsPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/technicians" element={<TechniciansPage />} />
        </Routes>
      </BrowserRouter>
    </RoleContext.Provider>
  );
}

export default App;