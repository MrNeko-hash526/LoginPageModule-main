import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '../src/components/NavBar';
import SideBar from '../src/components/sideBar';

export default function Layout(): React.ReactElement {
  const location = useLocation();
  const hideNavPaths = ['/login']; // add more paths to hide navbar & sidebar on them

  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showNav && <NavBar />}

      <div className="pt-0 w-full">
        {showNav ? (
          // allow horizontal scrolling when layout becomes wider than viewport
          <div className="flex min-h-[calc(100vh-64px)] w-full overflow-x-auto">
            {/* sidebar shouldn't shrink; main can shrink and allow scrolling */}
            <SideBar />
            <main className="flex-1 p-6 min-w-0">
              {/* content container - min-w-0 ensures proper flex shrink behavior */}
              <div className="w-full">
                <Outlet />
              </div>
            </main>
          </div>
        ) : (
          <main className="w-full">
            <Outlet />
          </main>
        )}
      </div>
    </div>
  );
}