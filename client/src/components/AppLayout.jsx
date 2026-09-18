import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const AppLayout = ({ searchQuery, onSearch }) => (
  <>
    <Navbar searchQuery={searchQuery} onSearch={onSearch} />
    <main className="min-h-screen bg-[#0a0a0a]">
      <Outlet />
    </main>
  </>
);

export default AppLayout;