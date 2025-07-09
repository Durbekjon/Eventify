import React from "react";
import { RiFileList3Line } from "react-icons/ri";
import { IoAddCircleOutline } from "react-icons/io5";

const NoDataAvailable = ({ message, onAddClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] bg-grayDash rounded-[12px] font-radioCanada">
      <div className="flex flex-col items-center gap-4">
        <RiFileList3Line className="text-[64px] text-gray4" />
        <p className="text-[20px] text-gray4 font-medium">
          {message || "No Data Available"}
        </p>
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 mt-4 text-white bg-primary hover:bg-primary/90 rounded-[8px] transition-colors"
          >
            <IoAddCircleOutline className="text-[20px]" />
            <span>Add New Column</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NoDataAvailable;
