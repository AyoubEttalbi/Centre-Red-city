import React, { useState, useRef, useEffect, useMemo } from "react";
import { Smile, Search } from "lucide-react";

const emojiCategories = [
    {
        name: "Frequently Used",
        emojis: [
            "😀",
            "😂",
            "😊",
            "👍",
            "❤️",
            "🙏",
            "🔥",
            "🎉",
            "📚",
            "✏️",
            "📝",
            "✅",
            "⭐",
            "🎓",
            "📋",
            "📌",
        ],
    },
    {
        name: "Smileys & People",
        emojis: [
            "😀",
            "😃",
            "😄",
            "😁",
            "😆",
            "😅",
            "😂",
            "🤣",
            "😊",
            "😇",
            "🙂",
            "🙃",
            "😉",
            "😌",
            "😍",
            "🥰",
            "😘",
            "😗",
            "😙",
            "😚",
            "😋",
            "😛",
            "😝",
            "😜",
            "🤪",
            "🤨",
            "🧐",
            "🤓",
            "😎",
            "🤩",
            "🥳",
        ],
    },
    {
        name: "Objects",
        emojis: [
            "⌚",
            "📱",
            "💻",
            "⌨️",
            "🖥️",
            "🖨️",
            "🖱️",
            "🖲️",
            "🕹️",
            "🗜️",
            "💽",
            "💾",
            "💿",
            "📀",
            "📼",
            "📷",
            "📸",
            "📹",
            "🎥",
            "📽️",
            "🎞️",
            "📞",
            "☎️",
            "📟",
            "📠",
            "📺",
            "📻",
            "🎙️",
            "🎚️",
            "🎛️",
        ],
    },
    {
        name: "Symbols",
        emojis: [
            "❤️",
            "🧡",
            "💛",
            "💚",
            "💙",
            "💜",
            "🖤",
            "🤍",
            "🤎",
            "💔",
            "❣️",
            "💕",
            "💞",
            "💓",
            "💗",
            "💖",
            "💘",
            "💝",
            "💟",
        ],
    },
    {
        name: "Education",
        emojis: [
            "📚",
            "✏️",
            "📝",
            "📖",
            "📕",
            "📗",
            "📘",
            "📙",
            "📓",
            "📔",
            "📒",
            "📑",
            "📋",
            "📌",
            "✂️",
            "📎",
            "📏",
            "📐",
            "🎓",
            "🎒",
            "🏫",
            "📊",
            "📈",
            "📉",
            "📋",
            "📌",
            "✍️",
            "📝",
            "📄",
            "📃",
        ],
    },
    {
        name: "Status & Feedback",
        emojis: [
            "✅",
            "❌",
            "⚠️",
            "⭐",
            "🌟",
            "💫",
            "✨",
            "🎯",
            "🎨",
            "🎭",
            "🎪",
            "🎟️",
            "🎠",
            "🎡",
            "🎢",
            "🎣",
            "🎤",
            "🎥",
            "🎦",
            "🎧",
            "🎨",
            "🎩",
            "🎪",
            "🎫",
            "🎬",
            "🎭",
            "🎪",
            "🎯",
            "🎲",
            "🎳",
        ],
    },
    {
        name: "People & Emotions",
        emojis: [
            "👨‍🏫",
            "👩‍🏫",
            "👨‍🎓",
            "👩‍🎓",
            "👨‍💼",
            "👩‍💼",
            "👨‍💻",
            "👩‍💻",
            "👨‍🔬",
            "👩‍🔬",
            "👨‍🔧",
            "👩‍🔧",
            "👨‍🎨",
            "👩‍🎨",
            "👨‍🚀",
            "👩‍🚀",
            "👨‍⚕️",
            "👩‍⚕️",
            "👨‍⚖️",
            "👩‍⚖️",
            "👨‍🌾",
            "👩‍🌾",
            "👨‍🍳",
            "👩‍🍳",
            "👨‍🏭",
            "👩‍🏭",
            "👨‍💼",
            "👩‍💼",
            "👨‍🔧",
            "👩‍🔧",
        ],
    },
    {
        name: "Activities & Events",
        emojis: [
            "🏃",
            "⚽",
            "🏀",
            "🏈",
            "⚾",
            "🎾",
            "🏐",
            "🏉",
            "🎱",
            "🏓",
            "🏸",
            "🏒",
            "🏑",
            "🏏",
            "🥅",
            "⛳",
            "🏹",
            "🎣",
            "🥊",
            "🥋",
            "🎽",
            "🛹",
            "🛷",
            "⛸",
            "🥌",
            "🎿",
            "⛷",
            "🏂",
            "🏋️",
            "🤸",
        ],
    },
];

const EmojiPicker = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [frequentEmojis, setFrequentEmojis] = useState([]);
    const pickerRef = useRef(null);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter emojis based on search query
    const filteredCategories = useMemo(() => {
        if (!searchQuery) return emojiCategories;

        const searchLower = searchQuery.toLowerCase();
        return emojiCategories
            .map((category) => ({
                ...category,
                emojis: category.emojis.filter((emoji) => {
                    // Get emoji name from a mapping or use the emoji itself
                    const emojiName = getEmojiName(emoji);
                    return emojiName.toLowerCase().includes(searchLower);
                }),
            }))
            .filter((category) => category.emojis.length > 0);
    }, [searchQuery]);

    const handleEmojiClick = (emoji) => {
        onSelect(emoji);
        setIsOpen(false);

        setFrequentEmojis((prev) => {
            const newEmojis = prev.filter((e) => e !== emoji);
            return [emoji, ...newEmojis].slice(0, 8);
        });
    };

    // Helper function to get emoji name for search
    const getEmojiName = (emoji) => {
        // This is a simple mapping - you might want to use a proper emoji library
        const emojiMap = {
            "📚": "books",
            "✏️": "pencil",
            "📝": "note",
            "📖": "book",
            "🎓": "graduation",
            "🏫": "school",
            "✅": "check",
            "❌": "cross",
            "⭐": "star",
            "👨‍🏫": "male teacher",
            "👩‍🏫": "female teacher",
            "👨‍🎓": "male student",
            "👩‍🎓": "female student",
            // Add more mappings as needed
        };
        return emojiMap[emoji] || emoji;
    };

    return (
        <div className="relative" ref={pickerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Open emoji picker"
            >
                <Smile className="w-5 h-5 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute bottom-10 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-[calc(100vw-2rem)] max-w-64 h-80 overflow-hidden flex flex-col sm:w-64">
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search emojis..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {frequentEmojis.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-xs font-medium text-gray-500 mb-2">
                                    Frequently Used
                                </h3>
                                <div className="grid grid-cols-8 gap-1">
                                    {frequentEmojis.map((emoji, index) => (
                                        <button
                                            key={`frequent-${index}`}
                                            onClick={() =>
                                                handleEmojiClick(emoji)
                                            }
                                            className="text-xl p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            aria-label={`Select ${getEmojiName(emoji)} emoji`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredCategories.map((category) => (
                            <div key={category.name} className="mb-4">
                                <h3 className="text-xs font-medium text-gray-500 mb-2">
                                    {category.name}
                                </h3>
                                <div className="grid grid-cols-8 gap-1">
                                    {category.emojis.map((emoji, index) => (
                                        <button
                                            key={`${category.name}-${index}`}
                                            onClick={() =>
                                                handleEmojiClick(emoji)
                                            }
                                            className="text-xl p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            aria-label={`Select ${getEmojiName(emoji)} emoji`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmojiPicker;
