import React from "react";
import testMemImg from "../../assets/da562fcd7191cd36e0cb665c80152064.png";
const Viewers = () => {
  return (
    <div className="bg-grayDash py-[16px] px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
      <div className="frLine flex justify-between items-center">
        <h1 className="text-gray2 font-radioCanada text-[16px]">Viewers</h1>
        {/* Replace with dynamic check when viewers are fetched from API */}
        {false && (
          <button className="text-white text-[13px] bg-black py-[7px] px-[15px] rounded-[9px]">
            see all
          </button>
        )}
      </div>
      <div className="secLine my-[12px] space-y-[4px]">
        <div className="viewer flex items-center gap-[12px]">
          <div className="memImg">
            <img src={testMemImg} alt="" className="w-[28.8px] rounded-[50%]" />
          </div>
          <div className="memText">
            <p className="text-[14px] text-white">Marina - Eli Robinson</p>
            <p className="text-[11px] text-gray2">marina@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewers;
