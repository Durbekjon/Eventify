import React from "react";
import noDataImage from "../../../../assets/no-data.svg";

const NoDataDisplay = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <img
        src={noDataImage}
        alt="No Data"
        className="w-[240px] h-[200px] mb-6"
      />
      <p className="text-[20px] text-gray4 font-medium">{message}</p>
    </div>
  );
};

export default NoDataDisplay;
