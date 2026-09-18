import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { FavoritesProvider } from './context/FavoritesContext';
import PrivateRoute from './routes/PrivateRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Favorites from './pages/Favorites';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AuthProvider>
      <ToastProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<PrivateRoute />}>
                <Route
                  element={
                    <AppLayout searchQuery={searchQuery} onSearch={setSearchQuery} />
                  }
                >
                  <Route path="/" element={<Home searchQuery={searchQuery} />} />
                  <Route path="/favorites" element={<Favorites />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FavoritesProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;