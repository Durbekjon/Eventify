import React, { useCallback, useContext, useState } from "react";
import { AuthContext } from "../../../Auth/AuthContext";
import { useParams } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import { IoMdCheckbox } from "react-icons/io";
import { RiCheckboxBlankLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { BsTable } from "react-icons/bs";
import axiosInstance from "../../../AxiosInctance/AxiosInctance";
import swal from "sweetalert";

const ColumnType = {
  SELECT: "SELECT",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  DATE: "DATE",
  CHECK: "CHECK",
};

const CreateSheetFormModal = ({
  handleToggleModal,
  isOpen,
  refetch,
  isEditing,
  editingSheetId,
  editingSheetOrder,
  editingSheetName,
  onSheetCreated, // Add this prop
}) => {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const { sheetId } = useParams();
  const [columns, setColumns] = useState([
    {
      name: "Name",
      type: ColumnType.TEXT,
      show: true,
      isDefault: true,
      sheetId: sheetId,
    },
    {
      name: "Status",
      type: ColumnType.SELECT,
      show: true,
      isDefault: true,
      sheetId: sheetId,
      selects: [
        {
          title: "Select the status",
          color: "black",
          options: [{ name: "Pending", color: "#C6C8D6" }],
        },
      ],
    },
    {
      name: "Priority",
      type: ColumnType.SELECT,
      show: true,
      isDefault: true,
      sheetId: sheetId,
    },
    {
      name: "Link",
      type: ColumnType.TEXT,
      show: true,
      isDefault: true,
      sheetId: sheetId,
    },
    {
      name: "Price",
      type: ColumnType.NUMBER,
      show: true,
      isDefault: true,
      sheetId: sheetId,
    },
    {
      name: "Order",
      type: ColumnType.CHECK,
      show: false,
      isDefault: true,
      sheetId: sheetId,
    },
  ]);
  const [sheet, setSheet] = useState({
    name: !isEditing ? "" : editingSheetName,
    workspaceId: id,
    columns: columns,
  });
  const { createSheet } = useContext(AuthContext);

  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        name: "",
        type: ColumnType.TEXT,
        show: true,
        isDefault: false,
        sheetId: sheetId,
      },
    ]);
  };

  const handleColumnChange = (index, key, value) => {
    const updatedColumns = [...columns];
    updatedColumns[index][key] = value;
    setColumns(updatedColumns);
  };

  const handleToggleColumn = (index) => {
    const updatedColumns = [...columns];
    updatedColumns[index].show = !updatedColumns[index].show;
    setColumns(updatedColumns);
  };

  const handleDeleteColumn = (index) => {
    const updatedColumns = columns.filter((_, i) => i !== index);
    setColumns(updatedColumns);
  };

  const handleSubmit = async () => {
    // Validate workspaceId
    if (!sheet.workspaceId) {
      swal({
        title: "Error !",
        text: `No workspace selected. Please select or create a workspace first.`,
        icon: "error",
        button: "close",
      });
      return;
    }
    const updatedSheet = {
      ...sheet,
      columns: columns.filter((column) => column.show),
    };
    const newSheet = await createSheet(updatedSheet);
    setSheet({ name: "", workspaceId: id, columns });
    const resetColumns = columns.map((column) => ({ ...column, show: true }));
    setColumns(resetColumns);
    refetch();
    if (onSheetCreated && newSheet) {
      onSheetCreated(newSheet);
    }
    handleToggleModal();
  };

  const handleEditSheet = useCallback(async () => {
    try {
      await axiosInstance.put(
        `/sheet/${editingSheetId}`,
        { name: sheet.name, order: editingSheetOrder },
        {
          headers: {
            Authorization: ` Bearer ${token}`,
          },
        }
      );

      setSheet({ name: "", sheetId: id });
      handleToggleModal();
      refetch();
    } catch (error) {
      console.error("Error creating/updating workspace:", error);
    }
  }, [
    createSheet,
    sheet,
    isEditing,
    editingSheetId,
    handleToggleModal,
    id,
    editingSheetOrder,
    token,
    refetch,
  ]);

  const handleChange = (e) => {
    setSheet((prevSheet) => ({
      ...prevSheet,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleToggleModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-[#1E1E1E] rounded-2xl w-full max-w-md overflow-hidden"
          >
            {/* Glass effect top banner */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />

            <div className="relative p-6">
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <FiX size={24} />
              </motion.button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink2/20 to-pink2/10 flex items-center justify-center"
                >
                  <BsTable className="text-pink2 text-2xl" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    {!isEditing ? "Create New Sheet" : "Edit Sheet"}
                  </h2>
                  <p className="text-[#777C9D] text-sm">
                    {!isEditing
                      ? "Add a new sheet to your workspace"
                      : "Update your sheet details"}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#777C9D]">
                    Sheet Name
                  </label>
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    className="relative group"
                  >
                    <input
                      type="text"
                      name="name"
                      value={sheet.name}
                      onChange={handleChange}
                      className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
                      placeholder="Enter sheet name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.div>
                </div>

                {!isEditing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg text-white font-semibold">
                        Columns
                      </h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddColumn}
                        className="text-pink2 hover:text-pink2/80 transition-colors text-sm font-medium"
                      >
                        + Add Column
                      </motion.button>
                    </div>

                    <div className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                      {columns.map((column, colIndex) => (
                        <motion.div
                          key={colIndex}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            {column.isDefault ? (
                              <span className="text-white">{column.name}</span>
                            ) : (
                              <input
                                type="text"
                                value={column.name}
                                onChange={(e) =>
                                  handleColumnChange(
                                    colIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="bg-transparent border-b border-[#3A3A3A] text-white focus:outline-none focus:border-pink2 w-full"
                                placeholder="Column name"
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleToggleColumn(colIndex)}
                                className="text-[#777C9D] hover:text-white transition-colors"
                              >
                                {column.show ? (
                                  <IoMdCheckbox size={20} />
                                ) : (
                                  <RiCheckboxBlankLine size={20} />
                                )}
                              </motion.button>
                              {!column.isDefault && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteColumn(colIndex)}
                                  className="text-red-500 hover:text-red-400 transition-colors"
                                >
                                  <FaTrash size={16} />
                                </motion.button>
                              )}
                            </div>
                          </div>
                          {!column.isDefault && (
                            <select
                              value={column.type}
                              onChange={(e) =>
                                handleColumnChange(
                                  colIndex,
                                  "type",
                                  e.target.value
                                )
                              }
                              className="w-full bg-[#1E1E1E] text-[#777C9D] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-pink2/50"
                            >
                              {Object.values(ColumnType).map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleModal}
                    className="flex-1 bg-[#2A2A2A] text-[#777C9D] rounded-xl py-3.5 font-medium transition-all duration-300 hover:bg-[#3A3A3A] hover:text-white"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={isEditing ? handleEditSheet : handleSubmit}
                    className="flex-1 bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl py-3.5 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink2/20 relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {isEditing ? "Save Changes" : "Create Sheet"}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink2/0 via-white/20 to-pink2/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateSheetFormModal;
