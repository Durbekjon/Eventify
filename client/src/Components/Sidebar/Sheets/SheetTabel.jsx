import React, { useState, useCallback, useContext, useEffect } from "react";
import axiosInstance from "../../../AxiosInctance/AxiosInctance";
import { AuthContext } from "../../../Auth/AuthContext";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { MdDragIndicator } from "react-icons/md";
import { IoAddCircleOutline } from "react-icons/io5";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import SheetTableItem from "./SheetsSmallComps/SheetTableItem";
import CustomModal from "./SheetsSmallComps/CustomModal";
import { IoIosArrowForward } from "react-icons/io";
import noDataImage from "../../../assets/no-data.svg";
import Selecter from "../../../Components/Pagination and selecter/Selecter";
import { GoFileSymlinkFile } from "react-icons/go";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import AnimatedNoData from "./SheetsSmallComps/AnimatedNoData";
import MoveTaskModal from "../../../Components/Modals/MoveTaskModal";
import swal from "sweetalert";
import { AnimatePresence, motion } from "framer-motion";

const SheetTabel = ({ tasks = [], isEditing }) => {
  const { sheetId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [column, setColumn] = useState({
    key: "",
    type: "TEXT",
    sheetId,
    show: true,
  });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [taskList, setTaskList] = useState(tasks);
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [columnOrder, setColumnOrder] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const token = localStorage.getItem("token");
  const { createColumn, dndOrdersTasks } = useContext(AuthContext);

  const {
    isLoading,
    error,
    data: sheets,
    refetch,
  } = useQuery({
    queryKey: ["sheets", sheetId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/sheet/${sheetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  useEffect(() => {
    if (tasks) {
      setTaskList(tasks);
      setFilteredTasks(tasks);
    }
    if (sheets?.columns) {
      setColumnOrder(sheets.columns.map((_, index) => index));
    }
  }, [tasks, sheets]);

  // Handle task reordering (drag and drop)
  const handleOnDragEnd = useCallback(
    (result) => {
      const { source, destination, type } = result;

      if (!destination) return; // No destination means no movement

      if (type === "TASK") {
        // Handle task reordering
        const reorderedTasks = Array.from(filteredTasks);
        const [movedTask] = reorderedTasks.splice(source.index, 1);
        reorderedTasks.splice(destination.index, 0, movedTask);

        setFilteredTasks(reorderedTasks);

        const taskIds = reorderedTasks.map((task) => task.id);
        const orders = reorderedTasks.map((_, index) => index + 1);

        const resultData = { taskId: taskIds, orders };
        dndOrdersTasks(resultData);
      } else if (type === "COLUMN") {
        // Handle column reordering
        const reorderedColumns = Array.from(sheets.columns);
        const [movedColumn] = reorderedColumns.splice(source.index, 1);
        reorderedColumns.splice(destination.index, 0, movedColumn);

        setColumnOrder(reorderedColumns.map((_, idx) => idx)); // Update columnOrder based on the new order
        sheets.columns = reorderedColumns; // Update the columns array locally
      }
    },
    [filteredTasks, sheets, dndOrdersTasks]
  );

  // Handle task changes
  const handleColumnChange = (taskId, taskKey, value) => {
    if (taskId === editingTaskId) {
      setFilteredTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, [taskKey]: value } : task
        )
      );
    }
  };

  useEffect(() => {
    if (!editingTaskId) return; // If no task is being edited, skip the update logic

    const intervalId = setInterval(() => {
      const editedTask = filteredTasks.find(
        (task) => task.id === editingTaskId
      );
      if (editedTask) {
        // Send the updated task to the server
        axiosInstance
          .patch(`/task/${editingTaskId}`, editedTask, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((response) => {
            console.log("Task updated successfully:", response.data);
          })
          .catch((error) => {
            console.error("Error updating task:", error);
          });
      }
    }, 5000); // Every 5 seconds
    // Cleanup the interval when the component is unmounted or task editing changes
    return () => clearInterval(intervalId);
  }, [editingTaskId, filteredTasks, token]);

  // Modal logic for adding a new column
  const handleToggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [isOpen]);

  const handleOk = async () => {
    if (!column.type || !column.sheetId || !column.name) {
      console.log({
        type: column.type,
        sheetId: column.sheetId,
        key: column.key,
      });
      swal({
        title: "Error !",
        text: `Please fill all required fields (name, type)`,
        icon: "error",
        button: "close",
      });
      return;
    }
    await createColumn({ ...column, sheetId });
    refetch();
    handleToggleModal();
    setColumn({ key: "", type: "TEXT", sheetId, show: true }); // Reset with default type
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value);
    setColumn((prevColumn) => ({
      ...prevColumn,
      [name]: value,
    }));
  };

  // Handle task selection
  const handleTaskSelect = (taskId) => {
    setSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      }
      return [...prev, taskId];
    });
  };

  // Handle select all tasks
  const handleSelectAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map((task) => task.id));
    }
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  // Modified function to handle task deletion without page reload
  const handleDeleteSelectedTasks = async () => {
    try {
      // Delete tasks one by one asynchronously
      for (const taskId of selectedTasks) {
        try {
          await axiosInstance.delete(`/task/${taskId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // Update both selectedTasks and filteredTasks arrays
          setSelectedTasks((prev) => prev.filter((id) => id !== taskId));
          setFilteredTasks((prev) => prev.filter((task) => task.id !== taskId));
          setTaskList((prev) => prev.filter((task) => task.id !== taskId));
        } catch (error) {
          console.error(`Error deleting task ${taskId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in deletion process:", error);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const handleMoveTask = () => {
    if (selectedTasks.length === 1) {
      setIsMoveModalOpen(true);
    }
  };

  const handleTaskMoved = (taskId) => {
    // Remove the moved task from the list
    setTaskList((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    setFilteredTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== taskId)
    );
    setSelectedTasks((prevSelected) =>
      prevSelected.filter((id) => id !== taskId)
    );
  };

  if (isLoading) {
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

  if (error) {
    return (
      <div className="mt-[26px] custom-scrollbar">
        <div className="bg-grayDash rounded-[12px] font-radioCanada">
          <AnimatedNoData message="No Data" />
        </div>
      </div>
    );
  }

  // if (!sheets?.columns?.length) {
  //   return (
  //     <div className="mt-[26px] custom-scrollbar">
  //       <CustomModal
  //         isOpen={isOpen}
  //         handleToggleModal={handleToggleModal}
  //         column={column}
  //         isEditing={isEditing}
  //         handleChange={handleChange}
  //         handleOk={handleOk}
  //       />
  //       <div className="bg-grayDash rounded-[12px] font-radioCanada">
  //         <AnimatedNoData message="No columns available. Add a new column to get started." />
  //       </div>
  //     </div>
  //   );
  // }

  if (!filteredTasks?.length) {
    return (
      <div className="mt-[26px] custom-scrollbar">
        <CustomModal
          isOpen={isOpen}
          handleToggleModal={handleToggleModal}
          column={column}
          isEditing={isEditing}
          handleChange={handleChange}
          handleOk={handleOk}
        />
        <DragDropContext onDragEnd={handleOnDragEnd}>
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
                      {selectedTasks.length === filteredTasks.length ? (
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
                  <td>
                    <Droppable
                      droppableId="droppableColumns"
                      direction="horizontal"
                      type="COLUMN"
                    >
                      {(provided) => (
                        <div
                          className="flex"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {sheets?.columns.map((column, index) => {
                            const showColumn = column.show;
                            return (
                              showColumn && (
                                <Draggable
                                  key={column.id}
                                  draggableId={`column-${column.id}`}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      className="w-[180px] flex items-center justify-between py-[16px] border-r border-[black] px-[11px] hide"
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      {column.name}
                                      <MdDragIndicator className="text-gray4 cursor-grab" />
                                    </div>
                                  )}
                                </Draggable>
                              )
                            );
                          })}
                          {provided.placeholder}
                          <div
                            className="w-[50px] flex items-center justify-center py-[16px] border-r border-[black] px-[11px] cursor-pointer"
                            onClick={handleToggleModal}
                          >
                            <IoAddCircleOutline className="text-[20px] text-gray4" />
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="100%" className="text-center">
                    <AnimatedNoData message="No tasks available in this sheet." />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DragDropContext>

        <AnimatePresence mode="wait">
          {(selectedTasks.length > 0 || true) && (
            <motion.div
              key={
                selectedTasks.length > 0
                  ? "actions-selected"
                  : "actions-pagination"
              }
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="mt-[21px] flex gap-[10px]"
            >
              {selectedTasks.length > 0 && (
                <div className="w-1/2">
                  <div className="font-radioCanada flex deleter bg-grayDash rounded-[14px] h-[64px]">
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
                </div>
              )}
              <div
                className={`${selectedTasks.length > 0 ? "w-1/2" : "w-full"}`}
              >
                <div className="pagination bg-grayDash flex items-center rounded-[14px] px-[18px] justify-between h-[64px]">
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
                      Page {currentPage} of{" "}
                      {Math.ceil(filteredTasks.length / itemsPerPage)}
                    </p>
                    <div>
                      <div className="flex items-center gap-[6px]">
                        <div
                          className="prev bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                          onClick={() =>
                            currentPage > 1 &&
                            setCurrentPage((prev) => prev - 1)
                          }
                        >
                          <IoIosArrowForward className="text-white2 rotate-180 text-[20px]" />
                        </div>
                        <div
                          className="next bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                          onClick={() =>
                            currentPage <
                              Math.ceil(filteredTasks.length / itemsPerPage) &&
                            setCurrentPage((prev) => prev + 1)
                          }
                        >
                          <IoIosArrowForward className="text-pink2 text-[20px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="mt-[26px] custom-scrollbar">
      <CustomModal
        isOpen={isOpen}
        handleToggleModal={handleToggleModal}
        column={column}
        isEditing={isEditing}
        handleChange={handleChange}
        handleOk={handleOk}
      />

      {isMoveModalOpen && selectedTasks.length === 1 && (
        <MoveTaskModal
          isOpen={isMoveModalOpen}
          onClose={() => {
            setIsMoveModalOpen(false);
            setSelectedTasks([]);
          }}
          taskId={selectedTasks[0]}
          onTaskMoved={handleTaskMoved}
        />
      )}

      <DragDropContext onDragEnd={handleOnDragEnd}>
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
                    {selectedTasks.length === filteredTasks.length ? (
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
                <td>
                  <Droppable
                    droppableId="droppableColumns"
                    direction="horizontal"
                    type="COLUMN"
                  >
                    {(provided) => (
                      <div
                        className="flex"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {sheets?.columns.map((column, index) => {
                          const showColumn = column.show;
                          return (
                            showColumn && (
                              <Draggable
                                key={column.id}
                                draggableId={`column-${column.id}`}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    className="w-[180px] flex items-center justify-between py-[16px] border-r border-[black] px-[11px] hide"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    {column.name}
                                    <MdDragIndicator className="text-gray4 cursor-grab" />
                                  </div>
                                )}
                              </Draggable>
                            )
                          );
                        })}
                        {provided.placeholder}
                        <div
                          className="w-[50px] flex items-center justify-center py-[16px] border-r border-[black] px-[11px] cursor-pointer"
                          onClick={handleToggleModal}
                        >
                          <IoAddCircleOutline className="text-[20px] text-gray4" />
                        </div>
                      </div>
                    )}
                  </Droppable>
                </td>
              </tr>
            </thead>
            <Droppable droppableId="droppable" direction="vertical" type="TASK">
              {(provided) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {paginatedTasks?.map((task, index) => (
                    <SheetTableItem
                      key={task.id}
                      task={task}
                      columns={sheets?.columns.filter((_, idx) =>
                        columnOrder.includes(idx)
                      )}
                      index={index}
                      isSelected={selectedTasks.includes(task.id)}
                      onSelect={handleTaskSelect}
                      onEdit={() => setEditingTaskId(task.id)}
                      onChange={handleColumnChange}
                    />
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </div>
      </DragDropContext>

      <AnimatePresence mode="wait">
        {(selectedTasks.length > 0 || true) && (
          <motion.div
            key={
              selectedTasks.length > 0
                ? "actions-selected"
                : "actions-pagination"
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="mt-[21px] flex gap-[10px]"
          >
            {selectedTasks.length > 0 && (
              <div className="w-1/2">
                <div className="font-radioCanada flex deleter bg-grayDash rounded-[14px] h-[64px]">
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
              </div>
            )}
            <div className={`${selectedTasks.length > 0 ? "w-1/2" : "w-full"}`}>
              <div className="pagination bg-grayDash flex items-center rounded-[14px] px-[18px] justify-between h-[64px]">
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
                    Page {currentPage} of{" "}
                    {Math.ceil(filteredTasks.length / itemsPerPage)}
                  </p>
                  <div>
                    <div className="flex items-center gap-[6px]">
                      <div
                        className="prev bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                        onClick={() =>
                          currentPage > 1 && setCurrentPage((prev) => prev - 1)
                        }
                      >
                        <IoIosArrowForward className="text-white2 rotate-180 text-[20px]" />
                      </div>
                      <div
                        className="next bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                        onClick={() =>
                          currentPage <
                            Math.ceil(filteredTasks.length / itemsPerPage) &&
                          setCurrentPage((prev) => prev + 1)
                        }
                      >
                        <IoIosArrowForward className="text-pink2 text-[20px]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SheetTabel;
