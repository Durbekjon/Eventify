import React from "react";
// import { useNavigate } from "react-router-dom";

// const AuthNavbar = () => {
//   const navigate = useNavigate();
//   // Check if user is authenticated (token in localStorage)
//   const isAuthenticated = Boolean(localStorage.getItem("token"));
//   const handleBack = () => {
//     if (isAuthenticated) {
//       navigate("/dashboard");
//     } else {
//       navigate("/home");
//     }
//   };
//   return (
//     <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-darkBlue">
//       <div className="text-2xl font-bold text-yellow tracking-tight select-none">
//         Eventify
//       </div>
//       <button
//         onClick={handleBack}
//         className="text-sm px-4 py-2 rounded-md bg-pink2 text-white font-semibold hover:bg-pink-600 transition"
//       >
//         Back
//       </button>
//     </nav>
//   );
// };

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray">
      {/* <AuthNavbar /> */}
      <main className="flex-1 flex items-center justify-center px-2 py-8">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
