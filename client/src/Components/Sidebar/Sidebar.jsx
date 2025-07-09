import React from "react";
import logo from "../../assets/b4a0bd5e0894dd27c9b0053b36ac6208.png";
import { IoSettingsSharp } from "react-icons/io5";
import Workspaces from "./Workspaces";
import Members from "./Members";
import Viewers from "./Viewers";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../AxiosInctance/AxiosInctance";

const Sidebar = () => {
  const token = localStorage.getItem("token");
  const { data, isLoading, error } = useQuery({
    queryKey: ["sidebar-userinfo"],
    queryFn: async () =>
      await axiosInstance.get("/user/info", {
        headers: { Authorization: `Bearer ${token}` },
      }),
  });
  const user = data?.data || {};
  const role = user?.roles
    ?.find((i) => i.id === user.selectedRole)
    .type?.toLowerCase();
  console.log(role);
  return (
    <div className="h-full py-4 lg:py-5 xl:py-[22px] px-4 lg:px-5 xl:px-[31px] border-r border-1 border-grayDash overflow-y-auto sidebar-container custom-scrollbar">
      <div className="brand flex items-center justify-between bg-pink rounded-[16px] p-4 lg:p-5 xl:p-6 w-full">
        <div className="flex items-center gap-3 lg:gap-4 xl:gap-[23px]">
          <div className="flex-shrink-0">
            <img
              src={logo}
              alt="Logo"
              className="w-7 h-7 lg:w-[28px] xl:w-[30px] lg:h-[28px] xl:h-[30px] rounded-[5px] object-contain"
            />
          </div>
          <h1 className="text-responsive-xl font-bold text-white whitespace-nowrap">
            Eventify
          </h1>
        </div>
      </div>

      <div className="workspaces mt-6 lg:mt-8">
        <Workspaces />
      </div>

      {/* Only show members/viewers for author or admin */}
      {(role === "author" || role === "admin") && (
        <>
          <div className="members mt-6 lg:mt-8">
            <Members />
          </div>
          <div className="viewers mt-6 lg:mt-8">
            <Viewers />
          </div>
        </>
      )}

      <div className="settings mt-8 lg:mt-[90px] xl:mt-[108px]">
        <button className="flex w-full bg-white rounded-[9px] py-2 lg:py-3 xl:py-[10px] px-4 lg:px-5 xl:pl-[20px] gap-2 lg:gap-[3px] items-center font-radioCanada hover:bg-gray-100 transition-colors">
          <IoSettingsSharp className="text-lg lg:text-xl xl:text-[22px] text-grayDash" />
          <p className="text-responsive-sm">Settings</p>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
