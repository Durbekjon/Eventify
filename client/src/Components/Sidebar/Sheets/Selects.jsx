import React from 'react'
import { RiCheckboxBlankCircleFill } from 'react-icons/ri'

const Selects = ({bgSelect,value,textColor}) => {
  return (

    <div className={`flex items-center gap-[3px] rounded-[3px] pl-[6px]  w-[120px] py-[2px] font-radioCanada font-[500] `}  style={{backgroundColor:bgSelect,color:textColor}}>
      <RiCheckboxBlankCircleFill />{value}
    </div>
  )
}

export default Selects