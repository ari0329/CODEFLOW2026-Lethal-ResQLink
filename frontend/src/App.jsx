import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store/store';
import './styles/global.css';

// Pages & components (fill these in as you build them)
import AlertFeed from './components/Dashboard/AlertFeed';
import SeverityBadge from './components/Dashboard/SeverityBadge'

import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AlertFeed />} />
            <Route path="/severitybadge" element={<SeverityBadge/>}/>
       
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}