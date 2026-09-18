import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './routes/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import Favorites from './pages/Favorites';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Navbar searchQuery={searchQuery} onSearch={setSearchQuery} />
                  <Home searchQuery={searchQuery} />
                </PrivateRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <Navbar searchQuery={searchQuery} onSearch={setSearchQuery} />
                  <Favorites />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
