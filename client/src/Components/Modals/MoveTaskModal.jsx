import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { GoFileSymlinkFile } from "react-icons/go";
import axiosInstance from '../../AxiosInctance/AxiosInctance';
import CustomSelect from '../Common/CustomSelect';

const MoveTaskModal = ({ isOpen, onClose, taskId, onTaskMoved }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchSheets(selectedWorkspace);
    }
  }, [selectedWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      const response = await axiosInstance.get('/workspace', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const fetchSheets = async (workspaceId) => {
    try {
      const response = await axiosInstance.get(`/sheet/workspace/${workspaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSheets(response.data);
    } catch (error) {
      console.error('Error fetching sheets:', error);
    }
  };

  const handleMove = async () => {
    if (!selectedSheet) return;

    try {
      await axiosInstance.patch('/task/move', {
        taskId: taskId,
        sheetId: selectedSheet
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Call the callback to update the task list
      if (onTaskMoved) {
        onTaskMoved(taskId);
      }
      
      onClose();
    } catch (error) {
      console.error('Error moving task:', error);
    }
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
            onClick={onClose}
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
                onClick={onClose}
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
                  <GoFileSymlinkFile className="text-pink2 text-2xl" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">Move Task</h2>
                  <p className="text-[#777C9D] text-sm">Move task to another sheet</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#777C9D]">
                    Select Workspace
                  </label>
                  <CustomSelect
                    placeholder="Choose workspace"
                    value={selectedWorkspace}
                    onChange={(value) => {
                      setSelectedWorkspace(value);
                      setSelectedSheet(null);
                    }}
                    options={workspaces.map(workspace => ({
                      value: workspace.id,
                      label: workspace.name
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#777C9D]">
                    Select Sheet
                  </label>
                  <CustomSelect
                    placeholder="Choose sheet"
                    value={selectedSheet}
                    onChange={setSelectedSheet}
                    options={sheets.map(sheet => ({
                      value: sheet.id,
                      label: sheet.name
                    }))}
                    disabled={!selectedWorkspace}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 bg-[#2A2A2A] text-[#777C9D] rounded-xl py-3.5 font-medium transition-all duration-300 hover:bg-[#3A3A3A] hover:text-white"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleMove}
                    disabled={!selectedSheet}
                    className={`flex-1 bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl py-3.5 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink2/20 relative overflow-hidden group ${!selectedSheet ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="relative z-10">Move</span>
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

export default MoveTaskModal;
