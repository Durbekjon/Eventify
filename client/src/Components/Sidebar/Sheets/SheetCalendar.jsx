import React, { useState } from "react";
import Calendar from "react-calendar";
import { Badge, Popover, Tooltip, Avatar } from "antd";
import "react-calendar/dist/Calendar.css";

const SheetCalendar = ({ tasks }) => {
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);
  const [calendarPopoverOpen, setCalendarPopoverOpen] = useState(false);
  const [calendarPopoverDate, setCalendarPopoverDate] = useState(null);

  return (
    <div className="calendar-view mt-4 bg-grayDash rounded-xl p-4 relative">
      <Calendar
        tileContent={({ date, view }) => {
          const dayTasks = tasks.filter(
            (task) =>
              task.date1 &&
              new Date(task.date1).toDateString() === date.toDateString()
          );
          if (dayTasks.length > 0) {
            return (
              <Badge
                count={dayTasks.length}
                style={{ backgroundColor: "#e11d48", marginTop: 2 }}
              >
                <ul className="list-none p-0 m-0">
                  {dayTasks.slice(0, 2).map((task) => (
                    <li
                      key={task.id}
                      className="text-xs text-pink2 font-medium truncate"
                    >
                      {task.name}
                    </li>
                  ))}
                  {dayTasks.length > 2 && (
                    <li className="text-xs text-gray4">
                      +{dayTasks.length - 2} more
                    </li>
                  )}
                </ul>
              </Badge>
            );
          }
          return null;
        }}
        onClickDay={(date, e) => {
          const dayTasks = tasks.filter(
            (task) =>
              task.date1 &&
              new Date(task.date1).toDateString() === date.toDateString()
          );
          if (dayTasks.length > 0) {
            setSelectedDateTasks(dayTasks);
            setCalendarPopoverDate(date);
            setCalendarPopoverOpen(true);
          }
        }}
      />
      <Popover
        open={calendarPopoverOpen}
        onOpenChange={setCalendarPopoverOpen}
        content={
          <div className="min-w-[220px] max-w-[320px]">
            <div className="font-bold text-pink2 mb-2">
              Tasks for{" "}
              {calendarPopoverDate
                ? calendarPopoverDate.toLocaleDateString()
                : ""}
            </div>
            <ul className="divide-y divide-gray3">
              {selectedDateTasks.map((task) => (
                <li key={task.id} className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {task.name}
                    </span>
                    <span
                      className={`text-xs rounded px-2 py-1 ${
                        task.status === "done"
                          ? "bg-green-200 text-green-700"
                          : task.status === "in progress"
                          ? "bg-yellow-200 text-yellow-700"
                          : task.status === "todo"
                          ? "bg-gray-300 text-gray-700"
                          : "bg-pink2/10 text-pink2"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="text-gray2 text-xs">{task.description}</div>
                  <div className="flex gap-2 mt-1 text-xs text-gray4 items-center">
                    <span>
                      Due:{" "}
                      {task.date1
                        ? new Date(task.date1).toLocaleDateString()
                        : "N/A"}
                    </span>
                    {task.assignee && (
                      <Tooltip title={task.assignee}>
                        <Avatar
                          size={18}
                          className="ml-2 bg-pink2/80 text-white font-bold"
                        >
                          {typeof task.assignee === "string"
                            ? task.assignee[0]?.toUpperCase()
                            : "?"}
                        </Avatar>
                      </Tooltip>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        }
        title={null}
        trigger="click"
        placement="right"
        arrow={false}
      >
        {/* Hidden trigger, popover is controlled by state */}
        <span style={{ display: "none" }} />
      </Popover>
    </div>
  );
};

export default SheetCalendar;
