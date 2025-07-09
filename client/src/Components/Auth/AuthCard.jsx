import React from "react";

const AuthCard = ({ children }) => (
  <div className="bg-darkBlue w-full max-w-md rounded-2xl shadow-lg p-8 sm:p-10 md:p-12 flex flex-col gap-6">
    {children}
  </div>
);

export default AuthCard;
