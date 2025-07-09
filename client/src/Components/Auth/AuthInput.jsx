import React from "react";

const AuthInput = ({
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  right,
  ...props
}) => (
  <div className="relative w-full">
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="rounded-lg w-full h-14 bg-[#122434] placeholder:text-lg text-lg text-textGray font-semibold pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-pink2 transition"
      {...props}
    />
    {right && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer select-none">
        {right}
      </div>
    )}
  </div>
);

export default AuthInput;
