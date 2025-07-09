import React from "react";
import Sheets from "../../../Components/Sidebar/Sheets/Sheets";
const Workspace = () => {
  return (
    <div className="h-full max-w-[1500px] font-radioCanada m-auto">
      <Sheets />

      <div className="workSpaceForm"></div>
      <div className="pagination"></div>
    </div>
  );
};

export default Workspace;
