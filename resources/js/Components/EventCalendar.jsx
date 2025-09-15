import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// TEMPORARY EVENTS (These should be dynamic, fetched from an API)
const events = [
    {
        id: 1,
        title: "Lorem ipsum dolor",
        time: "12:00 PM - 2:00 PM",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        date: new Date(2025, 1, 23), // Example date
    },
    {
        id: 2,
        title: "Lorem ipsum dolor",
        time: "12:00 PM - 2:00 PM",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        date: new Date(2025, 1, 23), // Example date
    },
    {
        id: 3,
        title: "Lorem ipsum dolor",
        time: "12:00 PM - 2:00 PM",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        date: new Date(2025, 1, 24), // Example date
    },
];

const EventCalendar = () => {
    const [value, onChange] = useState(new Date());
    const selectedDate = new Date(value);

    // Filter events for the selected date
    const filteredEvents = events.filter(
        (event) =>
            event.date.getDate() === selectedDate.getDate() &&
            event.date.getMonth() === selectedDate.getMonth() &&
            event.date.getFullYear() === selectedDate.getFullYear(),
    );

    return (
        <div className="bg-white p-4 rounded-md shadow-md">
            <Calendar
                onChange={onChange}
                minDate={new Date("2022-01-01")}
                value={value}
                tileClassName={({ date }) => {
                    const isEventDay = events.some(
                        (event) =>
                            event.date.getDate() === date.getDate() &&
                            event.date.getMonth() === date.getMonth() &&
                            event.date.getFullYear() === date.getFullYear(),
                    );
                    return isEventDay ? "bg-blue-100" : ""; // Highlight days with events
                }}
                // All static UI strings and calendar labels/messages should be in French.
                // Remove all console logs and irrelevant comments.
            />
            <div className="flex items-center justify-between my-4">
                <h1 className="text-xl font-semibold">Événements</h1>
                <img src="/moreDark.png" alt="Plus" width={20} height={20} />
            </div>
            {filteredEvents.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {filteredEvents.map((event) => (
                        <div
                            className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-lamaSky even:border-t-lamaPurple"
                            key={event.id}
                        >
                            <div className="flex items-center justify-between">
                                <h1 className="font-semibold text-gray-600">
                                    {event.title}
                                </h1>
                                <span className="text-gray-300 text-xs">
                                    {event.time}
                                </span>
                            </div>
                            <p className="mt-2 text-gray-400 text-sm">
                                {event.description}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Aucun événement pour ce jour.</p>
            )}
        </div>
    );
};

export default EventCalendar;
