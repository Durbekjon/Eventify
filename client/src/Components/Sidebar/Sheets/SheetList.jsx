import React, { useState } from "react";
import { Tooltip, Avatar } from "antd";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { GoFileSymlinkFile } from "react-icons/go";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import AnimatedNoData from "./SheetsSmallComps/AnimatedNoData";

const SheetList = ({
  tasks = [],
  onEditTask,
  onDeleteTask,
  onMoveTask,
  loading,
}) => {
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTasks = tasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(tasks.length / itemsPerPage);

  // Selection logic
  const handleTaskSelect = (taskId) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };
  const handleSelectAllTasks = () => {
    if (selectedTasks.length === paginatedTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(paginatedTasks.map((task) => task.id));
    }
  };

  // Bulk actions
  const handleDeleteSelectedTasks = () => {
    if (onDeleteTask) {
      selectedTasks.forEach((taskId) => onDeleteTask(taskId));
      setSelectedTasks([]);
    }
  };
  const handleMoveTask = () => {
    if (selectedTasks.length === 1 && onMoveTask) {
      onMoveTask(selectedTasks[0]);
      setSelectedTasks([]);
    }
  };

  if (loading) {
    return (
      <div className="mt-[26px]">
        <div className="animate-pulse bg-grayDash rounded-[12px] h-[400px] flex items-center justify-center">
          <div className="text-gray4 text-[20px] font-radioCanada">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!tasks.length) {
    return <AnimatedNoData message="No tasks found." />;
  }

  return (
    <div className="mt-[26px] custom-scrollbar">
      <div
        className="overflow-x-auto rounded-[12px] custom-scrollbar"
        style={{ maxWidth: "100%" }}
      >
        <table className="bg-grayDash font-radioCanada w-full min-w-max">
          <thead className="border-1 text-white">
            <tr className="flex border-[black] border-b">
              <td
                className="w-[48px] py-[16px] px-[11px] flex items-center justify-center border-r border-r-[black] cursor-pointer"
                onClick={handleSelectAllTasks}
              >
                <div className="w-[20px] h-[20px] flex items-center justify-center">
                  {selectedTasks.length === paginatedTasks.length &&
                  paginatedTasks.length > 0 ? (
                    <RiCheckboxLine
                      className="text-pink2 w-[20px] h-[20px]"
                      style={{ strokeWidth: "0.5" }}
                    />
                  ) : (
                    <RiCheckboxBlankLine
                      className="text-gray4 w-[20px] h-[20px]"
                      style={{ strokeWidth: "0.5" }}
                    />
                  )}
                </div>
              </td>
              <td className="flex-1 py-[16px] px-[11px] text-left">Task</td>
              <td className="py-[16px] px-[11px] text-left">Status</td>
              <td className="py-[16px] px-[11px] text-left">Due</td>
              <td className="py-[16px] px-[11px] text-left">Assignee</td>
              <td className="py-[16px] px-[11px] text-left">Actions</td>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.map((task) => (
              <tr
                key={task.id}
                className="flex border-b border-gray3 hover:bg-grayDash transition"
              >
                <td className="w-[48px] py-4 px-[11px] flex items-center justify-center">
                  <div onClick={() => handleTaskSelect(task.id)}>
                    {selectedTasks.includes(task.id) ? (
                      <RiCheckboxLine
                        className="text-pink2 w-[20px] h-[20px]"
                        style={{ strokeWidth: "0.5" }}
                      />
                    ) : (
                      <RiCheckboxBlankLine
                        className="text-gray4 w-[20px] h-[20px]"
                        style={{ strokeWidth: "0.5" }}
                      />
                    )}
                  </div>
                </td>
                <td className="flex-1 py-4 px-[11px] text-white font-semibold">
                  {task.name || "Untitled Task"}
                </td>
                <td className="py-4 px-[11px]">
                  <span
                    className={`text-xs rounded px-2 py-1 ${
                      task.status === "done"
                        ? "bg-green-200 text-green-700"
                        : task.status === "in progress"
                        ? "bg-yellow-200 text-yellow-700"
                        : task.status === "todo"
                        ? "bg-gray-300 text-gray-700"
                        : "bg-pink2/10 text-pink2"
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="py-4 px-[11px] text-gray2 text-sm">
                  {task.date1
                    ? new Date(task.date1).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="py-4 px-[11px]">
                  {task.assignee && (
                    <Tooltip title={task.assignee}>
                      <Avatar
                        size={20}
                        className="ml-2 bg-pink2/80 text-white font-bold"
                      >
                        {typeof task.assignee === "string"
                          ? task.assignee[0]?.toUpperCase()
                          : "?"}
                      </Avatar>
                    </Tooltip>
                  )}
                </td>
                <td className="py-4 px-[11px] flex gap-2">
                  <button
                    className="text-pink2 hover:underline text-xs"
                    onClick={() => onEditTask && onEditTask(task.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-400 hover:underline text-xs"
                    onClick={() => onDeleteTask && onDeleteTask(task.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Bulk actions and pagination */}
      <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {selectedTasks.length > 0 && (
          <div className="font-radioCanada flex deleter bg-grayDash rounded-[14px] h-[64px] w-full md:w-auto">
            <div className="numberOfSelectedTasks bg-pink2 flex items-center rounded-s-[14px] px-[27px]">
              <p className="text-white">{selectedTasks.length}</p>
            </div>
            <div className="actions flex items-center text-white justify-between w-full pl-[23px] pr-[15px] border-r my-[11px] border-gray">
              <div className="textPart">
                <h2>Selected tasks</h2>
              </div>
              <div className="iconPart flex gap-[24px]">
                <div
                  className="moave text-pink2 cursor-pointer hover:opacity-80"
                  onClick={handleMoveTask}
                >
                  <GoFileSymlinkFile className="m-auto" />
                  <p className="text-[12px]">Move</p>
                </div>
                <div
                  className="delete text-[#C6C8D6] cursor-pointer hover:text-pink2"
                  onClick={handleDeleteSelectedTasks}
                >
                  <FaRegTrashAlt className="m-auto" />
                  <p className="text-[12px]">Delete</p>
                </div>
              </div>
            </div>
            <div className="close flex items-center px-[16px]">
              <IoClose
                className="text-[25px] text-white2 cursor-pointer"
                onClick={() => setSelectedTasks([])}
              />
            </div>
          </div>
        )}
        {/* Pagination */}
        <div className="pagination bg-grayDash flex items-center rounded-[14px] px-[18px] justify-between h-[64px] w-full md:w-auto">
          <div className="shpp flex items-center gap-[12px]">
            <p className="text-white2">Show per page</p>
            <div className="select rounded-[14px]">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-[3px] bg-grayDash border border-gray text-white2 w-auto"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={80}>80</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="pages flex items-center gap-[12px]">
            <p className="text-white2">
              Page {currentPage} of {totalPages}
            </p>
            <div>
              <div className="flex items-center gap-[6px]">
                <div
                  className="prev bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                  onClick={() =>
                    currentPage > 1 && setCurrentPage((prev) => prev - 1)
                  }
                >
                  <span className="text-white2 rotate-180 text-[20px]">
                    &#8592;
                  </span>
                </div>
                <div
                  className="next bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                  onClick={() =>
                    currentPage < totalPages &&
                    setCurrentPage((prev) => prev + 1)
                  }
                >
                  <span className="text-pink2 text-[20px]">&#8594;</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetList;
