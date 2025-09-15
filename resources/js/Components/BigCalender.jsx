import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { calendarEvents } from "@/lib/data";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";

const localizer = momentLocalizer(moment);

const BigCalendar = () => {
    const [view, setView] = useState(Views.WEEK); // Use week, month, day, or agenda

    const handleOnChangeView = (selectedView) => {
        setView(selectedView);
    };

    return (
        <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            views={["month", "week", "day", "agenda"]} // Use valid views
            view={view}
            style={{ height: "98%" }}
            onView={handleOnChangeView}
            min={new Date(2025, 1, 0, 8, 0, 0)}
            max={new Date(2025, 1, 0, 17, 0, 0)}
        />
    );
};

export default BigCalendar;
