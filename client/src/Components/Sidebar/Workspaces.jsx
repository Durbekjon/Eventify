import { Dropdown, Space } from "antd";
import React, { useContext, useState, useCallback, useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoAddCircleOutline } from "react-icons/io5";
import { AuthContext } from "../../Auth/AuthContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { MdDelete, MdEdit } from "react-icons/md";
import { Link, useNavigate, useParams } from "react-router-dom";
import WorkspaceFormModal from "../Modals/WorkspaceFormModal";

const Workspaces = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track whether creating or editing
  const [showAll, setShowAll] = useState(false);
  const { createWorkspace, dndOrders } = useContext(AuthContext);
  const [workspaceName, setWorkspaceName] = useState({ name: "" });
  const [editingWorkspaceOrder, setEditingWorkspaceOrder] = useState(null); // Store the id of workspace being edited
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null); // Store the id of workspace being edited
  const token = localStorage.getItem("token");
  const { id: activeWorkspaceId } = useParams();
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    data: workspacesData,
    refetch,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await axiosInstance.get("/workspace", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // 1. On data load or route change, ensure the URL is valid
  useEffect(() => {
    if (!workspacesData) return;
    // If no workspaces, always go to /dashboard
    if (workspacesData.length === 0) {
      if (activeWorkspaceId) navigate("/dashboard", { replace: true });
      return;
    }
    // If URL is invalid or missing, go to first workspace
    const exists = workspacesData.some((w) => w.id === activeWorkspaceId);
    if (!activeWorkspaceId || !exists) {
      navigate(`/dashboard/workspace/${workspacesData[0].id}`, {
        replace: true,
      });
    }
  }, [workspacesData, activeWorkspaceId, navigate]);

  const handleChange = (e) => {
    setWorkspaceName({ ...workspaceName, [e.target.name]: e.target.value });
  };

  const handleToggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setIsEditing(false); // Reset state when modal closes
      setWorkspaceName({ name: "" });
      setEditingWorkspaceId(null);
    }
  }, [isOpen]);

  // 2. Workspace creation: after creating, navigate to new workspace
  const handleOk = useCallback(async () => {
    try {
      if (isEditing) {
        await axiosInstance.put(
          `/workspace/${editingWorkspaceId}`,
          { name: workspaceName.name, order: editingWorkspaceOrder },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const newWorkspace = await createWorkspace(workspaceName);
        if (newWorkspace && newWorkspace.id) {
          navigate(`/dashboard/workspace/${newWorkspace.id}`);
        }
      }
      setWorkspaceName({ name: "" });
      handleToggleModal();
      refetch();
    } catch (error) {
      console.error("Error creating/updating workspace:", error);
    }
  }, [
    createWorkspace,
    workspaceName,
    isEditing,
    editingWorkspaceId,
    handleToggleModal,
    refetch,
    navigate,
    token,
    editingWorkspaceOrder,
  ]);

  // 3. Workspace deletion: after deleting, refetch and redirect if needed
  const handleDelete = async (workspaceId) => {
    try {
      await axiosInstance.delete(`/workspace/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refetch();
      // After refetch, the useEffect above will handle redirection if needed
    } catch (error) {
      console.error("Error deleting workspace:", error);
    }
  };

  // Drag and drop logic (unchanged, but use workspacesData as source)
  const handleOnDragEnd = useCallback(
    (result) => {
      if (!result.destination || !workspacesData) return;
      const reorderedWorkspaces = Array.from(workspacesData);
      const [movedWorkspace] = reorderedWorkspaces.splice(
        result.source.index,
        1
      );
      reorderedWorkspaces.splice(result.destination.index, 0, movedWorkspace);
      const workspaceIds = reorderedWorkspaces.map((workspace) => workspace.id);
      const orders = reorderedWorkspaces.map((_, index) => index + 1);
      const resultData = { workspaceIds, orders };
      dndOrders(resultData);
      updateWorkspaceOrder(resultData);
    },
    [workspacesData, dndOrders]
  );

  const updateWorkspaceOrder = async (data) => {
    try {
      await axiosInstance.post("/workspace/updateOrder", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refetch();
    } catch (error) {
      console.error("Error updating workspace order:", error);
    }
  };

  const handleEdit = (workspace) => {
    setIsEditing(true);
    setWorkspaceName({ name: workspace.name });
    setEditingWorkspaceId(workspace.id);
    setEditingWorkspaceOrder(workspace.order);
    setIsOpen(true);
  };

  const items = (workspaceId, workspaceOrder) => [
    {
      key: "1",
      label: (
        <div
          className="flex items-center gap-[20px]"
          onClick={() =>
            handleEdit({
              id: workspaceId,
              order: workspaceOrder,
              name: workspaceName.name,
            })
          }
        >
          <p className="text-[14px] font-radioCanada">Edit</p>
          <MdEdit />
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div
          className="flex items-center gap-[10px] text-red-500"
          onClick={() => handleDelete(workspaceId)}
        >
          <p className="text-[14px] font-radioCanada">Delete</p>
          <MdDelete />
        </div>
      ),
      disabled: false,
    },
  ];

  const visibleWorkspaces = workspacesData
    ? showAll
      ? workspacesData
      : workspacesData.slice(0, 3)
    : [];

  return (
    <div className="bg-grayDash py-[16px] px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
      <WorkspaceFormModal
        isOpen={isOpen}
        onClose={handleToggleModal}
        isEditing={isEditing}
        workspaceName={workspaceName}
        onWorkspaceNameChange={handleChange}
        onSubmit={handleOk}
      />
      <div className="frLine flex justify-between items-center">
        <h1 className="text-gray2 font-radioCanada text-[16px]">Workspaces</h1>
        {workspacesData && workspacesData.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-white text-[13px] bg-black py-[7px] px-[15px] rounded-[9px]"
          >
            {showAll ? "Show Less" : "See All"}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-red-500 py-[10px]">
          Error occurred at fetching workspaces
        </p>
      ) : (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="workspaces">
            {(provided) => (
              <div
                className={`secLine my-[12px] space-y-[4px] ${
                  showAll
                    ? "h-[200px] overflow-y-auto custom-scrollbar horizontal-scroll pr-1"
                    : ""
                }`}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {visibleWorkspaces.map((workspace, index) => (
                  <Draggable
                    key={workspace.id}
                    draggableId={workspace.id}
                    index={index}
                  >
                    {(provided) => (
                      <Link
                        to={`/dashboard/workspace/${workspace.id}`}
                        className={`workspace flex items-center text-white bg-grayDash justify-between py-[10px] pl-[21px] pr-[10px] rounded-[8px] ${
                          workspace.id === activeWorkspaceId
                            ? "bg-pink2"
                            : "bg-grayDash"
                        }`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div className="flex items-center gap-[8px]">
                          <p className="text-[18px]">#</p>
                          <p className="text-[14px]">
                            {!isLoading ? workspace.name : "Loading"}
                          </p>
                        </div>
                        <Dropdown
                          trigger={["click"]}
                          menu={{ items: items(workspace.id, workspace.order) }}
                        >
                          <a onClick={(e) => e.preventDefault()}>
                            <Space>
                              <BsThreeDotsVertical className="cursor-pointer" />
                            </Space>
                          </a>
                        </Dropdown>
                      </Link>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {/* Add workspace button */}
      <div className="addWorkspacebutton">
        <button
          className="flex items-center gap-0 text-white px-[19px] bg-white w-full justify-between py-[10px] rounded-[9px]"
          onClick={handleToggleModal}
        >
          <IoAddCircleOutline className="text-gray4 text-[18px]" />
          <p className="text-gray4 text-[14px]">
            {workspacesData && workspacesData.length === 0
              ? "Create Your first Workspace"
              : "Add worklist"}
          </p>
          {workspacesData && workspacesData.length > 0 && (
            <p className="text-pink2 text-[13px]">Pro+</p>
          )}
        </button>
      </div>
    </div>
  );
};

export default Workspaces;
