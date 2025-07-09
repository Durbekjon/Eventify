import React from 'react';

const ColumnSelect = ({ handleChange, column }) => {
  return (
    <div className="relative group">
      <select
        name="type"
        onChange={handleChange}
        value={column.type}
        className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white 
          appearance-none cursor-pointer
          focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 
          transition-all duration-300"
      >
        {/* <option value="SELECT">Select</option> */}
        <option value="TEXT">Text</option>
        <option value="NUMBER">Number</option>
        <option value="DATE">Date</option>
        <option value="CHECK">Check</option>
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#777C9D] group-hover:text-pink2 transition-colors">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default ColumnSelect;
