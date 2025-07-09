import React from "react";
import { GoFileSymlinkFile } from "react-icons/go";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { IoIosArrowForward } from "react-icons/io";

const Selecter = ({ 
  selectedCount, 
  onDelete, 
  onClearSelection, 
  itemsPerPage, 
  setItemsPerPage,
  currentPage,
  totalPages,
  onPageChange 
}) => {
  return (
    <div className="mt-[21px] flex gap-[10px]">
      {selectedCount > 0 && (
        <div className="font-radioCanada flex deleter bg-grayDash rounded-[14px] w-1/2">
          <div className="numberOfSelectedTasks bg-pink2 flex items-center rounded-s-[14px] px-[27px]">
            <p className="text-white">{selectedCount}</p>
          </div>
          <div className="actions flex items-center text-white justify-between w-full pl-[23px] pr-[15px] border-r my-[11px] border-gray">
            <div className="textPart">
              <h2>Selected tasks</h2>
            </div>
            <div className="iconPart flex gap-[24px]">
              <div className="moave text-pink2">
                <GoFileSymlinkFile className="m-auto" />
                <p className="text-[12px]">Move</p>
              </div>
              <div className="delete text-[#C6C8D6] cursor-pointer hover:text-pink2" onClick={onDelete}>
                <FaRegTrashAlt className="m-auto" />
                <p className="text-[12px]">Delete</p>
              </div>
            </div>
          </div>
          <div className="close flex items-center px-[16px]">
            <IoClose 
              className="text-[25px] text-white2 cursor-pointer hover:text-pink2" 
              onClick={onClearSelection}
            />
          </div>
        </div>
      )}
      <div className={`pagination bg-grayDash ${selectedCount > 0 ? 'w-1/2' : 'w-full'} flex items-center rounded-[14px] px-[18px] justify-between`}>
        <div className="shpp flex items-center gap-[12px]">
          <p className="text-white2">Show per page</p>
          <div className="select rounded-[14px]">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="rounded-[3px] bg-grayDash border border-gray text-white2 w-auto"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-[12px]">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-white2 disabled:opacity-50"
          >
            <IoIosArrowForward className="rotate-180" />
          </button>
          <span className="text-white2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="text-white2 disabled:opacity-50"
          >
            <IoIosArrowForward />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Selecter;
