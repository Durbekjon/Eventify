import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import Home from './Pages/Home';
import { AuthProvider } from './Auth/AuthContext';
import Register from './Components/Auth/Register';
import Verification from './Components/Auth/Verification';
import Subscriptions from './Components/Subscriptions/Subscriptions';
import SignIn from './Components/Auth/Login';
import CreateCompany from './Components/Company/CreateCompany';
import ProtectedRoute from './Components/Routes/ProtectedRoutes';
import RestoreVerification from './Components/Auth/ResetPas';
import Dashboard from './Pages/Dashboard/Dashboard';
import Workspace from './Pages/Dashboard/Workspace/Workspace';
import WelcomeDashboard from './Components/WelcomeDashboard';
import ProfilePage from './Components/Profile/ProfilePage';
import NotificationsPage from './Components/Notifications/NotificationsPage';

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/register",
      element:<AuthProvider><Register /></AuthProvider> ,
    },
    {
      path: "/login",
      element:<AuthProvider><SignIn /></AuthProvider> ,
    },
    {
      path: "/verification",
      element:<AuthProvider><Verification /></AuthProvider> ,
    },
    {
      path: "/reset-password",
      element:<AuthProvider><RestoreVerification /></AuthProvider> ,
    },
    {
      path: "/createcompany",
      element:<AuthProvider><ProtectedRoute element={<CreateCompany />} /></AuthProvider> ,
    },
    {
      path: "/subscriptions",
      element:<AuthProvider><ProtectedRoute element={<Subscriptions />} /></AuthProvider> ,
    },
    {
      path: "/profile",
      element: <AuthProvider> <ProtectedRoute element={<ProfilePage />} /></AuthProvider>,
    },
    {
      path: "/notifications",
      element: <AuthProvider> <ProtectedRoute element={<NotificationsPage />} /></AuthProvider>,
    },
    {
      path: "/dashboard",
      element:<AuthProvider><ProtectedRoute element={<Dashboard />} /></AuthProvider> ,
      children:[
        {
          path:'/dashboard',
          element:<AuthProvider><ProtectedRoute element={<WelcomeDashboard />} /></AuthProvider>
        },
        {
          path: "/dashboard/workspace/:id",
          element: <ProtectedRoute element={<Workspace />} />,
        },
        {
          path: "/dashboard/workspace/:id/:sheetId",
          element: <ProtectedRoute element={<Workspace />} />,
        },
      ]
    },
  ]);
  return (
    <div className="custom-scrollbar">
      <RouterProvider router={router} />
    </div>
  )
}

export default App