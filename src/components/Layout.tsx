import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { FloatingChatbot } from './FloatingChatbot';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <FloatingChatbot />
    </div>
  );
}
