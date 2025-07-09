import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBell,
  FiCheck,
  FiUser,
  FiUserPlus,
  FiFileText,
  FiStar,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import NotificationDetailModal from "./NotificationDetailModal";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const itemsPerPage = 5;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/notification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response?.data?.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const filters = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "mentions", label: "Mentions" },
  ];

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

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedFilter === "unread") return !notification.isRead;
    if (selectedFilter === "mentions") return notification.type === "MENTION";
    return true;
  });

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(
    startIndex,
    endIndex
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/notification/${notificationId}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.post("/notification/read-all", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleInvitation = async (notification, status) => {
    try {
      await axiosInstance.patch(
        `/member/status/${notification.member.id}`,
        {
          status: status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update notification UI to show the action was taken
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notification.id ? { ...notif, actionTaken: true } : notif
        )
      );

      // Mark notification as read
      markAsRead(notification.id);
    } catch (error) {
      console.error("Error handling invitation:", error);
    }
  };

  const renderNotificationActions = (notification) => {
    if (notification.member.status === "NEW" && !notification.actionTaken) {
      return (
        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInvitation(notification, "ACTIVE");
            }}
            className="px-3 py-1.5 bg-pink2 hover:bg-pink2/90 text-white text-sm rounded-lg transition-colors"
          >
            Accept
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleInvitation(notification, "DECLINED");
            }}
            className="px-3 py-1.5 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#777C9D] text-sm rounded-lg transition-colors"
          >
            Decline
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 hover:bg-[#2A2A2A] rounded-full transition-colors"
            >
              <FiArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-semibold">Notifications</h1>
          </div>
          {notifications.some((n) => !n.isRead) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={markAllAsRead}
              className="px-4 py-2 bg-[#2A2A2A] text-[#777C9D] rounded-xl hover:bg-[#3A3A3A] hover:text-white transition-all duration-300"
            >
              Mark all as read
            </motion.button>
          )}
        </div>

        <div className="bg-[#2A2A2A] rounded-xl overflow-hidden">
          {/* Filters */}
          <div className="flex gap-2 p-4 border-b border-[#3A3A3A]">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter.id
                    ? "bg-pink2 text-white"
                    : "bg-[#1E1E1E] text-[#777C9D] hover:bg-[#3A3A3A] hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-[#3A3A3A]">
            {loading ? (
              <div className="p-8 text-center text-[#777C9D]">
                Loading notifications...
              </div>
            ) : currentNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#777C9D]">
                No notifications found
              </div>
            ) : (
              currentNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 flex items-start gap-3 hover:bg-[#2A2A2A] transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-[#2A2A2A]/50" : ""
                  }`}
                  onClick={() => {
                    setSelectedNotificationId(notification.id);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="mt-1 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm break-words">
                      {notification.text}
                    </p>
                    <p className="text-[#777C9D] text-xs mt-1">
                      {format(
                        new Date(notification.createdAt),
                        "MMM d, yyyy h:mm a"
                      )}
                    </p>
                    {renderNotificationActions(notification)}
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-pink2 mt-2 flex-shrink-0" />
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t border-[#3A3A3A]">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-pink2 text-white"
                        : "hover:bg-[#3A3A3A] text-[#777C9D]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-[#3A3A3A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
      <NotificationDetailModal
        notificationId={selectedNotificationId}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};

export default NotificationsPage;
