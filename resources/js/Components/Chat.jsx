import React, { useState, useRef, useEffect } from "react";

// Simple avatar component
const Avatar = ({ src, status }) => {
    const statusColors = {
        online: "bg-green-500",
        away: "bg-yellow-500",
        offline: "bg-gray-400",
        busy: "bg-red-500",
    };

    return (
        <div className="relative">
            <img
                src={src || "/chatprofile.jpg"}
                alt="avatar"
                className="rounded-full w-12 h-12 object-cover border border-gray-200"
            />
            {status && (
                <span
                    className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} rounded-full border-2 border-white`}
                ></span>
            )}
        </div>
    );
};

// Chat message component
const ChatMessage = ({ sender, message, time, isUser, isRead }) => {
    return (
        <div
            className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {!isUser && (
                <div className="mr-2">
                    <Avatar src={sender.avatar || "/chatprofile.jpg"} />
                </div>
            )}
            <div className={`max-w-xs ${isUser ? "order-1" : "order-2"}`}>
                <div
                    className={`p-3 rounded-lg ${
                        isUser
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                >
                    <p className="text-sm">{message}</p>
                </div>
                <div className="flex items-center mt-1">
                    <p className="text-xs text-gray-500">{time}</p>
                    {isUser && (
                        <span className="ml-1">
                            {isRead ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 text-blue-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path
                                        fillRule="evenodd"
                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 text-gray-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </span>
                    )}
                </div>
            </div>
            {isUser && (
                <div className="ml-2">
                    <Avatar src={sender.avatar || "/chatprofile.jpg"} />
                </div>
            )}
        </div>
    );
};

// Contact list item component
const ContactItem = ({ contact, active, onClick }) => {
    return (
        <div
            className={`flex items-center p-3 cursor-pointer transition-colors ${
                active ? "bg-blue-50" : "hover:bg-gray-50"
            }`}
            onClick={onClick}
        >
            <Avatar
                src={contact.avatar || "/chatprofile.jpg"}
                status={contact.status}
            />
            <div className="ml-3 flex-grow overflow-hidden">
                <div className="flex justify-between items-center">
                    <p className="font-medium text-gray-800 truncate">
                        {contact.name}
                    </p>
                    <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {contact.time}
                    </p>
                </div>
                <div className="flex items-center">
                    <p className="text-sm text-gray-500 truncate w-5/6">
                        {contact.typing ? (
                            <span className="italic text-blue-600">
                                typing...
                            </span>
                        ) : (
                            contact.lastMessage
                        )}
                    </p>
                    {contact.unread > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 ml-auto text-xs font-semibold text-white bg-blue-600 rounded-full">
                            {contact.unread}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// Online user component
const OnlineUser = ({ user, onClick }) => {
    return (
        <div className="text-center m-3 cursor-pointer" onClick={onClick}>
            <div className="relative inline-block">
                <img
                    src={user.avatar || "/chatprofile.jpg"}
                    alt={user.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <p className="text-xs font-medium mt-1 truncate max-w-[60px] mx-auto">
                {user.name}
            </p>
        </div>
    );
};

const ChatPopup = ({ isOpen, onClose, initialContact = null }) => {
    // Demo data
    const [contacts, setContacts] = useState([
        {
            id: 1,
            name: "Marie Horwitz",
            avatar: "/chatprofile.jpg",
            lastMessage: "Hello, Are you there?",
            time: "Just now",
            unread: 3,
            status: "online",
            typing: false,
        },
        {
            id: 2,
            name: "Alexa Chung",
            avatar: "/chatprofile.jpg",
            lastMessage: "I'm working on the project now.",
            time: "5 mins ago",
            unread: 2,
            status: "away",
            typing: true,
        },
        {
            id: 3,
            name: "Danny McChain",
            avatar: "/chatprofile.jpg",
            lastMessage: "Thanks for your help yesterday!",
            time: "Yesterday",
            unread: 0,
            status: "online",
            typing: false,
        },
        {
            id: 4,
            name: "Ashley Olsen",
            avatar: "/chatprofile.jpg",
            lastMessage: "Let's schedule a meeting for tomorrow.",
            time: "Yesterday",
            unread: 0,
            status: "offline",
            typing: false,
        },
        {
            id: 5,
            name: "Kate Moss",
            avatar: "/chatprofile.jpg",
            lastMessage: "The client loved our presentation!",
            time: "Yesterday",
            unread: 0,
            status: "busy",
            typing: false,
        },
    ]);

    const [activeContact, setActiveContact] = useState(initialContact || 1);
    const [messagesByContact, setMessagesByContact] = useState({
        1: [
            {
                id: 1,
                sender: { name: "Marie Horwitz", avatar: "/chatprofile.jpg" },
                message: "Hi there! How's your day going?",
                time: "10:23 AM",
                isUser: false,
                isRead: true,
            },
            {
                id: 2,
                sender: { name: "You", avatar: "/chatprofile.jpg" },
                message:
                    "Pretty good, thanks for asking! Working on some new designs.",
                time: "10:25 AM",
                isUser: true,
                isRead: true,
            },
            {
                id: 3,
                sender: { name: "Marie Horwitz", avatar: "/chatprofile.jpg" },
                message: "That sounds exciting! Can you share some previews?",
                time: "10:28 AM",
                isUser: false,
                isRead: true,
            },
        ],
        2: [
            {
                id: 1,
                sender: { name: "Alexa Chung", avatar: "/chatprofile.jpg" },
                message: "I've sent you the project files.",
                time: "Yesterday",
                isUser: false,
                isRead: true,
            },
            {
                id: 2,
                sender: { name: "You", avatar: "/chatprofile.jpg" },
                message: "Got them, thank you!",
                time: "Yesterday",
                isUser: true,
                isRead: true,
            },
            {
                id: 3,
                sender: { name: "Alexa Chung", avatar: "/chatprofile.jpg" },
                message: "I'm working on the project now.",
                time: "5 mins ago",
                isUser: false,
                isRead: false,
            },
        ],
        3: [
            {
                id: 1,
                sender: { name: "Danny McChain", avatar: "/chatprofile.jpg" },
                message:
                    "Hi there! I've reviewed the project requirements and have some thoughts to share.",
                time: "10:23 AM",
                isUser: false,
                isRead: true,
            },
            {
                id: 2,
                sender: { name: "You", avatar: "/chatprofile.jpg" },
                message:
                    "Great! I'm particularly interested in your thoughts about the timeline.",
                time: "10:25 AM",
                isUser: true,
                isRead: true,
            },
            {
                id: 3,
                sender: { name: "Danny McChain", avatar: "/chatprofile.jpg" },
                message:
                    "I think we need to allocate more time for the testing phase. Quality assurance is critical for this client.",
                time: "10:28 AM",
                isUser: false,
                isRead: true,
            },
            {
                id: 4,
                sender: { name: "You", avatar: "/chatprofile.jpg" },
                message:
                    "I agree. How much additional time would you recommend?",
                time: "10:30 AM",
                isUser: true,
                isRead: true,
            },
        ],
    });

    const [newMessage, setNewMessage] = useState("");
    const popupRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeContact, messagesByContact]);

    // Close the popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (initialContact) {
            setActiveContact(initialContact);
        }
    }, [initialContact]);

    const handleContactClick = (contactId) => {
        setActiveContact(contactId);

        // Mark messages as read
        setContacts((prevContacts) =>
            prevContacts.map((contact) =>
                contact.id === contactId ? { ...contact, unread: 0 } : contact,
            ),
        );
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === "") return;

        // Add the new message
        const newId = messagesByContact[activeContact]
            ? Math.max(...messagesByContact[activeContact].map((m) => m.id)) + 1
            : 1;

        const newMsg = {
            id: newId,
            sender: { name: "You", avatar: "/chatprofile.jpg" },
            message: newMessage,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isUser: true,
            isRead: false,
        };

        setMessagesByContact((prev) => ({
            ...prev,
            [activeContact]: prev[activeContact]
                ? [...prev[activeContact], newMsg]
                : [newMsg],
        }));

        setNewMessage("");

        // Simulate a reply after a delay (in a real app, this would come from the backend)
        if (Math.random() > 0.5) {
            setTimeout(() => {
                const activeContactData = contacts.find(
                    (c) => c.id === activeContact,
                );

                // Show typing indicator
                setContacts((prevContacts) =>
                    prevContacts.map((contact) =>
                        contact.id === activeContact
                            ? { ...contact, typing: true }
                            : contact,
                    ),
                );

                // After another delay, add the response
                setTimeout(() => {
                    const replyId = messagesByContact[activeContact]
                        ? Math.max(
                              ...messagesByContact[activeContact].map(
                                  (m) => m.id,
                              ),
                          ) + 1
                        : 1;

                    const reply = {
                        id: replyId,
                        sender: {
                            name: activeContactData.name,
                            avatar: activeContactData.avatar,
                        },
                        message: getRandomReply(),
                        time: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        isUser: false,
                        isRead: true,
                    };

                    setMessagesByContact((prev) => ({
                        ...prev,
                        [activeContact]: [...prev[activeContact], reply],
                    }));

                    // Remove typing indicator
                    setContacts((prevContacts) =>
                        prevContacts.map((contact) =>
                            contact.id === activeContact
                                ? { ...contact, typing: false }
                                : contact,
                        ),
                    );
                }, 2000);
            }, 1000);
        }
    };

    const getRandomReply = () => {
        const replies = [
            "Got it, thanks!",
            "I'll look into this ASAP.",
            "Sounds good to me.",
            "Can we discuss this further in the meeting?",
            "Great! When do you want to start?",
            "I'll need some more information about this.",
            "I appreciate your quick response!",
            "Let me check with the team and get back to you.",
        ];
        return replies[Math.floor(Math.random() * replies.length)];
    };

    // Get online contacts for the horizontal scroll
    const onlineContacts = contacts.filter((c) => c.status === "online");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                ref={popupRef}
                className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
            >
                <div className="flex flex-col h-[600px]">
                    {/* Header with close button */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Messages
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition duration-150"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    <div className="flex flex-row flex-1 overflow-hidden">
                        {/* Contact List */}
                        <div className="w-1/3 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b border-gray-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    <button className="absolute right-3 top-2 text-gray-500">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Online users horizontal scroll */}
                            <div className="p-3 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-xs font-semibold text-gray-600 mb-2 px-1">
                                    ONLINE NOW
                                </h3>
                                <div className="flex overflow-x-auto pb-2 scrollbar-hide">
                                    {onlineContacts.map((contact) => (
                                        <OnlineUser
                                            key={contact.id}
                                            user={contact}
                                            onClick={() =>
                                                handleContactClick(contact.id)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Contact list */}
                            <div className="overflow-y-auto flex-grow">
                                <div className="divide-y divide-gray-200">
                                    {contacts.map((contact) => (
                                        <ContactItem
                                            key={contact.id}
                                            contact={contact}
                                            active={
                                                activeContact === contact.id
                                            }
                                            onClick={() =>
                                                handleContactClick(contact.id)
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="w-2/3 flex flex-col">
                            {/* Chat Header */}
                            {activeContact && (
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center bg-white">
                                    <Avatar
                                        src={
                                            contacts.find(
                                                (c) => c.id === activeContact,
                                            )?.avatar || "/chatprofile.jpg"
                                        }
                                        status={
                                            contacts.find(
                                                (c) => c.id === activeContact,
                                            )?.status
                                        }
                                    />
                                    <div className="ml-3">
                                        <p className="font-medium text-gray-800">
                                            {contacts.find(
                                                (c) => c.id === activeContact,
                                            )?.name || "Select a contact"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {contacts.find(
                                                (c) => c.id === activeContact,
                                            )?.status === "online" && (
                                                <span className="text-green-500">
                                                    Online
                                                </span>
                                            )}
                                            {contacts.find(
                                                (c) => c.id === activeContact,
                                            )?.status === "away" && (
                                                <span className="text-yellow-500">
                                                    Away
                                                </span>
                                            )}
                                            {contacts.find(
                                                (c) => c.id === activeContact,
                                            )?.status === "busy" && (
                                                <span className="text-red-500">
                                                    Busy
                                                </span>
                                            )}
                                            {contacts.find(
                                                (c) => c.id === activeContact,
                                            )?.status === "offline" && (
                                                <span className="text-gray-500">
                                                    Last seen 2h ago
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="ml-auto flex">
                                        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                        </button>
                                        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                                            </svg>
                                        </button>
                                        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                                {activeContact &&
                                messagesByContact[activeContact] ? (
                                    messagesByContact[activeContact].map(
                                        (message) => (
                                            <ChatMessage
                                                key={message.id}
                                                sender={message.sender}
                                                message={message.message}
                                                time={message.time}
                                                isUser={message.isUser}
                                                isRead={message.isRead}
                                            />
                                        ),
                                    )
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-gray-500">
                                            Select a contact to start chatting
                                        </p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="border-t border-gray-200 p-4 bg-white">
                                <form
                                    onSubmit={handleSendMessage}
                                    className="flex items-center"
                                >
                                    <button
                                        type="button"
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className="p-2 ml-1 rounded-full hover:bg-gray-100 text-gray-600"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        className="flex-grow mx-3 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={newMessage}
                                        onChange={(e) =>
                                            setNewMessage(e.target.value)
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                    <button
                                        type="submit"
                                        className="ml-2 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition duration-150"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Dropdown chat version
const ChatDropdown = ({
    isOpen,
    onClose,
    buttonRef,
    onOpenFullChat,
    onContactSelect,
}) => {
    const [activeTab, setActiveTab] = useState("recent");
    const dropdownRef = useRef(null);

    // Calculate dropdown position
    const [position, setPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top:
                    rect.top +
                    window.scrollY -
                    (dropdownRef.current
                        ? dropdownRef.current.offsetHeight
                        : 0),
                right: window.innerWidth - rect.right - window.scrollX,
            });
        }
    }, [isOpen, buttonRef]);

    // Close the dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose, buttonRef]);

    // Demo data for recent messages
    const recentMessages = [
        {
            id: 1,
            name: "Marie Horwitz",
            avatar: "/chatprofile.jpg",
            message: "Hello, Are you there?",
            time: "Just now",
            unread: true,
            status: "online",
        },
        {
            id: 2,
            name: "Alexa Chung",
            avatar: "/chatprofile.jpg",
            message: "I'm working on the project now.",
            time: "5 mins ago",
            unread: true,
            status: "away",
        },
        {
            id: 3,
            name: "Danny McChain",
            avatar: "/chatprofile.jpg",
            message: "Thanks for your help yesterday!",
            time: "Yesterday",
            unread: false,
            status: "online",
        },
    ];

    // Demo data for online users
    const onlineUsers = [
        {
            id: 1,
            name: "Marie Horwitz",
            avatar: "/chatprofile.jpg",
            status: "online",
        },
        {
            id: 3,
            name: "Danny McChain",
            avatar: "/chatprofile.jpg",
            status: "online",
        },
        {
            id: 5,
            name: "Kate Moss",
            avatar: "/chatprofile.jpg",
            status: "online",
        },
    ];

    const handleContactClick = (contactId) => {
        onContactSelect(contactId);
    };

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute bg-white rounded-lg shadow-lg overflow-hidden w-80 z-50"
            style={{ top: `${position.top}px`, right: `${position.right}px` }}
        >
            <div className="border-b border-gray-200">
                <div className="flex">
                    <button
                        className={`flex-1 py-3 text-sm font-medium ${
                            activeTab === "recent"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActiveTab("recent")}
                    >
                        Recent Messages
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium ${
                            activeTab === "online"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setActiveTab("online")}
                    >
                        Online Now
                    </button>
                </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {activeTab === "recent" ? (
                    <div>
                        {recentMessages.map((message) => (
                            <div
                                key={message.id}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                                onClick={() => handleContactClick(message.id)}
                            >
                                <div className="flex items-center">
                                    <Avatar
                                        src={message.avatar}
                                        status={message.status}
                                    />
                                    <div className="ml-3 flex-grow overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium text-gray-800">
                                                {message.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {message.time}
                                            </p>
                                        </div>
                                        <p
                                            className={`text-sm truncate ${message.unread ? "font-semibold text-gray-800" : "text-gray-500"}`}
                                        >
                                            {message.message}
                                        </p>
                                    </div>
                                    {message.unread && (
                                        <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 p-3">
                        {onlineUsers.map((user) => (
                            <div
                                key={user.id}
                                className="flex flex-col items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                                onClick={() => handleContactClick(user.id)}
                            >
                                <Avatar src={user.avatar} status="online" />
                                <p className="mt-2 text-xs font-medium text-gray-800 text-center truncate w-full">
                                    {user.name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={onOpenFullChat}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition duration-150"
                >
                    View All Messages
                </button>
            </div>
        </div>
    );
};

// Main Chat Component
const Chat = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFullChatOpen, setIsFullChatOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const chatButtonRef = useRef(null);

    // Notification count (would be dynamic in a real app)
    const notificationCount = 2;

    const handleChatButtonClick = () => {
        if (isFullChatOpen) {
            setIsFullChatOpen(false);
        } else {
            setIsDropdownOpen(!isDropdownOpen);
        }
    };

    const handleOpenFullChat = () => {
        setIsDropdownOpen(false);
        setIsFullChatOpen(true);
    };

    const handleContactSelect = (contactId) => {
        setSelectedContact(contactId);
        setIsDropdownOpen(false);
        setIsFullChatOpen(true);
    };

    return (
        <div>
            {/* Chat Button */}
            <button
                ref={chatButtonRef}
                onClick={handleChatButtonClick}
                className="fixed bottom-6 right-6 p-3 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700 transition duration-150 z-30"
            >
                <div className="relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>

                    {notificationCount > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {notificationCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Dropdown for quick messages */}
            <ChatDropdown
                isOpen={isDropdownOpen}
                onClose={() => setIsDropdownOpen(false)}
                buttonRef={chatButtonRef}
                onOpenFullChat={handleOpenFullChat}
                onContactSelect={handleContactSelect}
            />

            {/* Full Chat Popup */}
            <ChatPopup
                isOpen={isFullChatOpen}
                onClose={() => setIsFullChatOpen(false)}
                initialContact={selectedContact}
            />
        </div>
    );
};

export default Chat;
