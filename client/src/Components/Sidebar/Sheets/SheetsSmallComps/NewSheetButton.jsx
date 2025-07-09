import React from "react";
import { IoAddCircleOutline } from "react-icons/io5";

const NewSheetButton = ({ handleToggleModal }) => {
  return (
    <div
      className="sheet flex items-center gap-[6px] bg-grayDash rounded-[9px] hover:bg-gray transition-all duration-1000 px-[6px] py-[7px] cursor-pointer"
      onClick={handleToggleModal}
    >
      <IoAddCircleOutline className="text-[20px]" />
    </div>
  );
};

export default NewSheetButton;
