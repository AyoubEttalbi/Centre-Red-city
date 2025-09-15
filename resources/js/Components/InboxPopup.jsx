import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    FiSend,
    FiSearch,
    FiX,
    FiMoreVertical,
    FiPaperclip,
    FiSmile,
    FiMic,
} from "react-icons/fi";
import Avatar from "./Avatar";
import ChatMessage from "./ChatMessage";
import ContactItem from "./ContactItem";
import EmojiPicker from "./EmojiPicker";
// Main InboxPopup Component

export default function InboxPopup({ auth, users = [], onClose }) {
    const userId = auth?.user?.id;
    const webSocketChannel = userId ? `message.${userId}` : null;
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const [lastMessages, setLastMessages] = useState({});
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showContactList, setShowContactList] = useState(true);
    const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const selectedUserRef = useRef(selectedUser);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);
    const [unreadMessages, setUnreadMessages] = useState(() => {
        const saved = localStorage.getItem("unreadMessages");
        return saved ? JSON.parse(saved) : {};
    });

    // Add new effect for initial data fetch and periodic sync
    useEffect(() => {
        // Initial fetch
        fetchInitialData();

        // Set up periodic sync
        const interval = setInterval(() => {
            axios
                .get("/unread-count")
                .then((response) => {
                    const newUnreadCounts = response.data.unread_count;
                    setUnreadMessages((prev) => {
                        const updated = { ...prev, ...newUnreadCounts };
                        // Save to localStorage whenever counts are updated
                        localStorage.setItem(
                            "unreadMessages",
                            JSON.stringify(updated),
                        );
                        return updated;
                    });
                })
                .catch((error) => {
                    console.error("Failed to fetch unread counts:", error);
                });
        }, 10000); // Sync every 10 seconds

        return () => clearInterval(interval);
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setShowContactList(true);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch initial data
    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [unreadResponse, lastMessagesData] = await Promise.all([
                axios.get("/unread-count"),
                fetchLastMessages(),
            ]);

            // Initialize with all users to prevent missing counts
            const initializedUnreadCounts = users.reduce((acc, user) => {
                acc[user.id] = unreadResponse.data.unread_count?.[user.id] || 0;
                return acc;
            }, {});

            setUnreadMessages(initializedUnreadCounts);
            // Save to localStorage after initialization
            localStorage.setItem(
                "unreadMessages",
                JSON.stringify(initializedUnreadCounts),
            );
            setLastMessages(lastMessagesData);
        } catch (err) {
            console.error("Failed to fetch initial data", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLastMessages = async () => {
        try {
            const response = await axios.get("/messages/last-messages", {
                params: {
                    contact_ids: users.map((user) => user.id),
                },
            });

            // Ensure the response is correctly formatted
            if (!response.data || !response.data.lastMessages) {
                throw new Error("Invalid response format");
            }

            const formattedMessages = {};
            Object.entries(response.data.lastMessages).forEach(
                ([contactId, message]) => {
                    formattedMessages[contactId] = {
                        id: message.id,
                        sender_id: message.sender_id,
                        recipient_id: message.recipient_id,
                        message: message.message,
                        is_read: message.is_read,
                        created_at: message.created_at,
                    };
                },
            );

            return formattedMessages;
        } catch (err) {
            console.error("Error fetching last messages:", err);
            return {};
        }
    };

    // Handle visibility and focus changes

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (
                document.visibilityState === "visible" &&
                document.hasFocus() &&
                selectedUserRef.current
            ) {
                markMessagesAsRead();
            }
        };

        const handleFocus = () => {
            if (selectedUserRef.current) {
                markMessagesAsRead();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    // WebSocket connection
    const connectWebSocket = () => {
        const channel = window.Echo.private(webSocketChannel);

        channel
            .listen(".MessageSent", async (e) => {
                if (e.message.sender_id === userId) return;

                const isViewingChat =
                    selectedUserRef.current?.id === e.message.sender_id;

                // Always update last message
                setLastMessages((prev) => ({
                    ...prev,
                    [e.message.sender_id]: e.message,
                }));

                if (isViewingChat && document.hasFocus()) {
                    try {
                        await axios.post(
                            `/message/${e.message.sender_id}/read`,
                            {
                                message_ids: [e.message.id],
                            },
                        );
                        e.message.is_read = true;

                        // Decrement unread count if we're viewing
                        setUnreadMessages((prev) => {
                            const updated = {
                                ...prev,
                                [e.message.sender_id]: Math.max(
                                    0,
                                    (prev[e.message.sender_id] || 0) - 1,
                                ),
                            };
                            localStorage.setItem(
                                "unreadMessages",
                                JSON.stringify(updated),
                            );
                            return updated;
                        });
                    } catch (error) {
                        console.error("Failed to mark message as read", error);
                    }
                } else if (!isViewingChat) {
                    // Increment unread count if not viewing
                    setUnreadMessages((prev) => {
                        const updated = {
                            ...prev,
                            [e.message.sender_id]:
                                (prev[e.message.sender_id] || 0) + 1,
                        };
                        localStorage.setItem(
                            "unreadMessages",
                            JSON.stringify(updated),
                        );
                        return updated;
                    });
                }

                if (isViewingChat) {
                    setCurrentMessages((prev) => [...prev, e.message]);
                    scrollToBottom();
                }
            })
            .listen(".MessagesRead", (e) => {
                console.log("📩 MessagesRead event received:", e);

                // Update current messages if in chat
                setCurrentMessages((prev) =>
                    prev.map((msg) =>
                        e.message_ids.includes(msg.id)
                            ? { ...msg, is_read: true }
                            : msg,
                    ),
                );

                // Update lastMessages for all affected conversations
                setLastMessages((prev) => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach((senderId) => {
                        const lastMsg = updated[senderId];
                        if (lastMsg && e.message_ids.includes(lastMsg.id)) {
                            updated[senderId] = {
                                ...lastMsg,
                                is_read: true,
                            };
                        }
                    });
                    return updated;
                });

                // Clear unread count if it's the current chat
                if (selectedUserRef.current?.id === e.sender_id) {
                    setUnreadMessages((prev) => {
                        const updated = { ...prev };
                        delete updated[e.sender_id];
                        localStorage.setItem(
                            "unreadMessages",
                            JSON.stringify(updated),
                        );
                        return updated;
                    });
                }
            })
            .listenForWhisper("typing", (e) => {
                if (e.userId === selectedUserRef.current?.id) {
                    setIsTyping(e.isTyping);
                    clearTimeout(typingTimeoutRef.current);
                    if (e.isTyping) {
                        typingTimeoutRef.current = setTimeout(() => {
                            setIsTyping(false);
                        }, 2000);
                    }
                }
            });

        return () =>
            channel
                .stopListening(".MessageSent")
                .stopListening(".MessagesRead");
    };

    // Get messages for selected user
    const getMessages = async () => {
        if (!selectedUserRef.current?.id) return;

        try {
            setLoading(true);
            const { data } = await axios.get(
                `/message/${selectedUserRef.current.id}`,
            );

            setCurrentMessages(data);
            setLastMessages((prev) => ({
                ...prev,
                [selectedUserRef.current.id]: data[data.length - 1] || null,
            }));

            if (selectedUserRef.current.id !== userId) {
                await markMessagesAsRead();
            }
        } catch (err) {
            setError("Failed to load messages");
            console.error("Error:", err);
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    // Send message
    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedUserRef.current?.id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post(
                `/message/${selectedUserRef.current.id}`,
                {
                    message: messageInput,
                },
                {
                    headers: {
                        "X-Socket-ID": window.Echo.socketId(),
                    },
                },
            );

            setMessageInput("");
            const newMessage = response.data.message;

            setCurrentMessages((prev) => [...prev, newMessage]);
            setLastMessages((prev) => ({
                ...prev,
                [selectedUserRef.current.id]: newMessage,
            }));

            scrollToBottom();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send message");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Mark messages as read
    const markMessagesAsRead = async (forceAll = false) => {
        if (!selectedUserRef.current) return;

        try {
            const params = forceAll ? {} : { is_read: false };
            const { data: messages } = await axios.get(
                `/message/${selectedUserRef.current.id}`,
                { params },
            );

            const messagesToMark = forceAll
                ? messages
                : messages.filter(
                      (msg) => !msg.is_read && msg.sender_id !== userId,
                  );

            if (messagesToMark.length === 0) return;

            const messageIds = messagesToMark.map((msg) => msg.id);

            // Optimistic updates
            setCurrentMessages((prev) =>
                prev.map((msg) =>
                    messageIds.includes(msg.id)
                        ? { ...msg, is_read: true }
                        : msg,
                ),
            );

            setLastMessages((prev) => ({
                ...prev,
                [selectedUserRef.current.id]: {
                    ...(prev[selectedUserRef.current.id] || {}),
                    is_read: true,
                },
            }));

            // Clear unread count for this contact
            setUnreadMessages((prev) => ({
                ...prev,
                [selectedUserRef.current.id]: 0,
            }));

            await axios.post(`/message/${selectedUserRef.current.id}/read`, {
                message_ids: messageIds,
                force_all: forceAll,
            });
        } catch (error) {
            console.error("Failed to mark messages as read", error);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const sortedUsers = [...users].sort((a, b) => {
        const aUnread = unreadMessages[a.id] || 0;
        const bUnread = unreadMessages[b.id] || 0;

        if (aUnread !== bUnread) return bUnread - aUnread;

        const aTime = lastMessages[a.id]?.created_at || 0;
        const bTime = lastMessages[b.id]?.created_at || 0;
        return new Date(bTime) - new Date(aTime);
    });

    const filteredUsers = sortedUsers.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleTyping = () => {
        if (!selectedUserRef.current?.id) return;
        const channel = window.Echo.private(webSocketChannel);
        channel.whisper("typing", {
            userId: auth.user.id,
            isTyping: true,
        });
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            channel.whisper("typing", {
                userId: auth.user.id,
                isTyping: false,
            });
            setIsTyping(false);
        }, 2000);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Initialize
    useEffect(() => {
        if (userId) {
            fetchInitialData();
            const cleanup = connectWebSocket();
            return () => {
                cleanup();
                window.Echo.leave(webSocketChannel);
            };
        }
    }, [userId]);

    // Handle user selection
    useEffect(() => {
        selectedUserRef.current = selectedUser;
        if (selectedUser) {
            getMessages();
            if (isMobileView) setShowContactList(false);
        }
    }, [selectedUser]);

    // Scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [currentMessages]);

    if (!userId) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        {isMobileView && !showContactList && (
                            <button
                                onClick={() => setShowContactList(true)}
                                className="mr-2 p-1 rounded-full hover:bg-gray-100 text-gray-600 transition duration-150"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        )}
                        <h2 className="text-lg font-semibold text-gray-800">
                            Messages
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition duration-150"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Contact List */}
                    {(showContactList || !isMobileView) && (
                        <div
                            className={`${isMobileView ? "absolute inset-0 z-10 bg-white" : "w-1/3"} border-r border-gray-200 flex flex-col`}
                        >
                            <div className="p-4 border-b border-gray-200">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 pl-10"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                    />
                                    <FiSearch className="absolute left-3 top-3 text-gray-500" />
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-grow">
                                <div className="divide-y divide-gray-200">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <ContactItem
                                                key={user.id}
                                                user={user}
                                                isActive={
                                                    selectedUser?.id === user.id
                                                }
                                                onClick={() =>
                                                    setSelectedUser(user)
                                                }
                                                unreadCount={
                                                    unreadMessages[user.id] || 0
                                                }
                                                lastMessage={
                                                    lastMessages[user.id]
                                                }
                                                currentUserId={userId}
                                            />
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-gray-500">
                                            No contacts found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Area */}
                    <div
                        className={`${isMobileView && showContactList ? "hidden" : "flex"} w-full md:w-2/3 flex flex-col`}
                    >
                        {selectedUser ? (
                            <>
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
                                    <div className="flex items-center">
                                        {isMobileView && (
                                            <button
                                                onClick={() =>
                                                    setShowContactList(true)
                                                }
                                                className="mr-2 p-1 rounded-full hover:bg-gray-100 text-gray-600 transition duration-150"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                        <Avatar
                                            src={selectedUser.profile_image}
                                            status={selectedUser.status}
                                        />
                                        <div className="ml-3">
                                            <p className="font-medium text-gray-800">
                                                {selectedUser.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {isTyping ? (
                                                    <span className="text-blue-500">
                                                        Typing...
                                                    </span>
                                                ) : selectedUser.status ===
                                                  "online" ? (
                                                    <span className="text-green-500">
                                                        Online
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">
                                                        Last seen{" "}
                                                        {selectedUser.last_online
                                                            ? new Date(
                                                                  selectedUser.last_online,
                                                              ).toLocaleTimeString(
                                                                  [],
                                                                  {
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                  },
                                                              )
                                                            : "unknown"}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="p-1 rounded-full hover:bg-gray-100 text-gray-600 transition duration-150">
                                        <FiMoreVertical className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                                    {loading && currentMessages.length === 0 ? (
                                        <div className="flex justify-center items-center h-full">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : currentMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-12 w-12 mb-2"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                />
                                            </svg>
                                            <p>No messages yet</p>
                                            <p className="text-sm">
                                                Start the conversation
                                            </p>
                                        </div>
                                    ) : (
                                        [...currentMessages].map(
                                            (message, index) => (
                                                <ChatMessage
                                                    key={
                                                        message.id ||
                                                        `msg-${index}`
                                                    }
                                                    message={message}
                                                    isUser={
                                                        message.sender_id ===
                                                        userId
                                                    }
                                                />
                                            ),
                                        )
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="border-t border-gray-200 p-2 bg-white">
                                    {attachmentMenuOpen && (
                                        <div className="absolute bottom-16 left-0 right-0 bg-white shadow-lg rounded-lg p-2 mx-2 sm:mx-4">
                                            <div className="grid grid-cols-4 gap-2">
                                                <button className="p-3 rounded-lg hover:bg-gray-100 flex flex-col items-center">
                                                    <FiPaperclip className="h-5 w-5 mb-1" />
                                                    <span className="text-xs">
                                                        Document
                                                    </span>
                                                </button>
                                                <button className="p-3 rounded-lg hover:bg-gray-100 flex flex-col items-center">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mb-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    <span className="text-xs">
                                                        Photo
                                                    </span>
                                                </button>
                                                <button className="p-3 rounded-lg hover:bg-gray-100 flex flex-col items-center">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mb-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    <span className="text-xs">
                                                        Video
                                                    </span>
                                                </button>
                                                <button className="p-3 rounded-lg hover:bg-gray-100 flex flex-col items-center">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mb-1"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                                        />
                                                    </svg>
                                                    <span className="text-xs">
                                                        Audio
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            sendMessage();
                                        }}
                                        className="flex items-center gap-1 sm:gap-2"
                                    >
                                        {/* <button
                                            type="button"
                                            className="p-2 text-gray-500 hover:text-gray-700"
                                            onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                                        >
                                            <FiPaperclip className="h-5 w-5" />
                                        </button> */}

                                        {/* Emoji Picker - positioned differently on mobile */}
                                        <div className="relative hidden sm:block">
                                            <EmojiPicker
                                                onSelect={(emoji) => {
                                                    setMessageInput(
                                                        (prev) => prev + emoji,
                                                    );
                                                    inputRef.current?.focus();
                                                }}
                                            />
                                        </div>

                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            className="flex-grow mx-1 px-3 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base sm:mx-3 sm:px-4"
                                            value={messageInput}
                                            onChange={(e) => {
                                                setMessageInput(e.target.value);
                                                handleTyping();
                                            }}
                                            onKeyDown={handleKeyDown}
                                            disabled={loading}
                                            ref={inputRef}
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                loading || !messageInput.trim()
                                            }
                                            className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition duration-150 disabled:opacity-50"
                                        >
                                            <FiSend className="h-5 w-5" />
                                        </button>
                                    </form>
                                    {error && (
                                        <div className="text-red-500 text-sm mt-1 text-center sm:mt-2">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center bg-gray-50">
                                <div className="text-center p-6">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-12 w-12 mx-auto text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                                        No conversation selected
                                    </h3>
                                    <p className="mt-1 text-gray-500">
                                        Select a contact to start chatting
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
