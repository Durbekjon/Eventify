import { Input, DatePicker, Select } from "antd";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import Selects from "../Selects";
import moment from "moment";
import { Draggable } from "react-beautiful-dnd";

const SheetTableItem = ({
  task,
  columns,
  onChange,
  onEdit,
  index,
  isSelected,
  onSelect,
}) => {
  const handleInputChange = (taskKey, e) => {
    let value = e?.target?.value;
    if (
      taskKey.toLowerCase() === "price" ||
      taskKey.toLowerCase() === "order" ||
      taskKey.toLowerCase() === "number1" ||
      taskKey.toLowerCase() === "number2" ||
      taskKey.toLowerCase() === "number3" ||
      taskKey.toLowerCase() === "number4" ||
      taskKey.toLowerCase() === "number5"
    ) {
      value = parseFloat(value) || 0;
      onChange(task.id, taskKey, value);
    }

    if (
      ["date1", "date2", "date3", "date4", "date5"].includes(
        taskKey.toLowerCase()
      )
    ) {
      value = moment(e._d).format("YYYY-MM-DD");
      onChange(task.id, taskKey, value);
    }

    onChange(task.id, taskKey, value);
  };

  const renderField = (columnKey) => {
    if (
      [
        "status",
        "select",
        "select1",
        "select2",
        "select3",
        "select4",
        "select5",
      ].includes(columnKey.toLowerCase())
    ) {
      return (
        <Select
          suffixIcon={null}
          onChange={(value) =>
            handleInputChange(columnKey.toLowerCase(), { target: { value } })
          }
          defaultValue={task[columnKey.toLowerCase()] || "Select value"}
        >
          <Select.Option value="Pending">
            <Selects
              bgSelect={"#C6C8D6"}
              value={"Pending"}
              textColor={"#2E3142"}
            >
              Pending
            </Selects>
          </Select.Option>
          <Select.Option value="In progres">
            <Selects
              bgSelect={"#B296F5"}
              value={"In progres"}
              textColor={"#11042F"}
            >
              In progres
            </Selects>
          </Select.Option>
          <Select.Option value="Rejected">
            <Selects
              bgSelect={"#DC5091"}
              value={"Rejected"}
              textColor={"#801949"}
            >
              Rejected
            </Selects>
          </Select.Option>
          <Select.Option value="Done">
            <Selects bgSelect={"#0EC359"} value={"Done"} textColor={"#064B23"}>
              Done
            </Selects>
          </Select.Option>
        </Select>
      );
    }

    if (
      ["date1", "date2", "date3", "date4", "date5"].includes(
        columnKey.toLowerCase()
      )
    ) {
      return (
        <DatePicker
          value={task[columnKey] ? moment(task[columnKey]) : null}
          onChange={(date) =>
            handleInputChange(columnKey, date ? date.toISOString() : null)
          }
          format="YYYY-MM-DD"
          className="w-[80%]"
        />
      );
    }

    return (
      <Input
        className="bg-grayDash border-none focus:bg-gray3 hover:bg-grayDash text-white text-[18px]"
        value={task[columnKey.toLowerCase()] || ""}
        onChange={(e) => handleInputChange(columnKey.toLowerCase(), e)}
        type="text"
      />
    );
  };

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <tr
          className="task flex text-white border-b border-[black] font-radioCanada"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <td className="w-[48px] py-[16px] px-[11px] flex items-center justify-center border-r border-r-[black]">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(task.id);
              }}
              className="cursor-pointer w-[20px] h-[20px] flex items-center justify-center"
            >
              {isSelected ? (
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

          {columns?.map(
            (column, idx) =>
              column.show && (
                <td
                  key={idx}
                  className="w-[180px] flex items-center justify-between py-[16px] border-l border-l-[black] px-[11px]"
                  onClick={() => onEdit && onEdit()}
                >
                  {renderField(column.key)}
                </td>
              )
          )}
        </tr>
      )}
    </Draggable>
  );
};

export default SheetTableItem;
