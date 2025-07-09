import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiBell,
  FiUserPlus,
  FiUser,
  FiFileText,
  FiCheck,
} from "react-icons/fi";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { format } from "date-fns";

const getNotificationIcon = (type) => {
  switch (type) {
    case "INVITATION":
      return <FiUserPlus className="text-lg text-pink2" />;
    case "MENTION":
      return <FiUser className="text-lg text-blue-400" />;
    case "UPDATE":
      return <FiFileText className="text-lg text-purple-400" />;
    case "TASK":
      return <FiCheck className="text-lg text-pink2" />;
    default:
      return <FiBell className="text-lg text-[#777C9D]" />;
  }
};

const NotificationDetailModal = ({ notificationId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!notificationId || !isOpen) return;
    setLoading(true);
    setError(null);
    setNotification(null);
    axiosInstance
      .get(`/notification/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setNotification(res.data || null);
      })
      .catch((err) => {
        setError("Failed to load notification.");
      })
      .finally(() => setLoading(false));
  }, [notificationId, isOpen, token]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#1E1E1E] rounded-xl shadow-xl w-full max-w-md mx-4 sm:mx-0 p-6 relative overflow-y-auto max-h-[90vh]"
          initial={{ scale: 0.95, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 40 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-[#777C9D] hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={22} />
          </button>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-[#777C9D]">
              Loading...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-red-400">
              {error}
            </div>
          ) : !notification ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-[#777C9D]">
              No details available.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {getNotificationIcon(notification.type)}
                <h2 className="text-lg font-semibold text-white">
                  Notification Details
                </h2>
              </div>
              <div className="text-white text-base break-words whitespace-pre-line">
                {notification.text}
              </div>
              <div className="text-xs text-[#777C9D]">
                {notification.createdAt &&
                  format(
                    new Date(notification.createdAt),
                    "MMM d, yyyy h:mm a"
                  )}
              </div>
              {/* Additional fields */}
              <div className="mt-2 flex flex-col gap-2">
                {notification.from && (
                  <div className="text-sm text-[#B0B0B0]">
                    <span className="font-semibold text-white">From:</span>{" "}
                    {notification.from}
                  </div>
                )}
                {notification.companyId && (
                  <div className="text-sm text-[#B0B0B0]">
                    <span className="font-semibold text-white">
                      Company ID:
                    </span>{" "}
                    {notification.companyId}
                  </div>
                )}
                {/* Member details */}
                {notification.member && (
                  <div className="bg-[#23232a] rounded-lg p-3 mt-2">
                    <div className="font-semibold text-pink2 mb-1">
                      Member Details
                    </div>
                    <div className="text-xs text-[#B0B0B0] flex flex-col gap-1">
                      <div>
                        <span className="font-semibold text-white">ID:</span>{" "}
                        {notification.member.id}
                      </div>
                      <div>
                        <span className="font-semibold text-white">Type:</span>{" "}
                        {notification.member.type}
                      </div>
                      <div>
                        <span className="font-semibold text-white">
                          Status:
                        </span>{" "}
                        {notification.member.status}
                      </div>
                      <div>
                        <span className="font-semibold text-white">View:</span>{" "}
                        {notification.member.view}
                      </div>
                      {/* <div>
                        <span className="font-semibold text-white">
                          Company ID:
                        </span>{" "}
                        {notification.member.companyId}
                      </div>
                      <div>
                        <span className="font-semibold text-white">
                          User ID:
                        </span>{" "}
                        {notification.member.userId}
                      </div> */}
                      {notification.member.permissions && (
                        <div>
                          <span className="font-semibold text-white">
                            Permissions:
                          </span>{" "}
                          {notification.member.permissions.join(", ")}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-white">
                          Created At:
                        </span>{" "}
                        {notification.member.createdAt &&
                          format(
                            new Date(notification.member.createdAt),
                            "MMM d, yyyy h:mm a"
                          )}
                      </div>
                      {/* <div>
                        <span className="font-semibold text-white">
                          Updated At:
                        </span>{" "}
                        {notification.member.updatedAt &&
                          format(
                            new Date(notification.member.updatedAt),
                            "MMM d, yyyy h:mm a"
                          )}
                      </div> */}
                    </div>
                  </div>
                )}
              </div>
              {/* Optionally, render more fields if available */}
              {notification.details && (
                <div className="mt-2 text-sm text-[#B0B0B0]">
                  {notification.details}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationDetailModal;
