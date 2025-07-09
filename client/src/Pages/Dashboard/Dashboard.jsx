import React, { useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import Navbar from "../../Components/Navbar/Navbar";
import { Outlet } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-[100vh] w-full bg-background dashboard-container">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed z-50 top-4 left-4 p-2 rounded-md bg-pink2 text-white"
      >
        <HiMenuAlt2 className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative w-[280px] xl:w-[300px] 2xl:w-[323px] h-full transition-transform duration-300 ease-in-out z-40`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="lg:pl-0 pl-12">
          <Navbar />
        </div>
        <div className="flex-grow border-none w-full max-w-[1920px] mx-auto px-4 xl:px-6">
          <Outlet />
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
