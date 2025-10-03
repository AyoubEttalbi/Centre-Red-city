import { Link, usePage } from "@inertiajs/react";
import React from "react";

const menuItems = [
    {
        title: "MENU",
        items: [
            {
                icon: "/home.png",
                label: "Accueil",
                href: "/dashboard",
                visible: ["admin", "teacher", "assistant"],
            },
            {
                icon: "/student.png",
                label: "Enseignants",
                href: "/teachers",
                visible: ["admin", "assistant"],
            },
            {
                icon: "/teacher.png",
                label: "Élèves",
                href: "/students",
                visible: ["admin", "teacher", "assistant"],
            },
            {
                icon: "/assistant.png",
                label: "Assistants",
                href: "/assistants",
                visible: ["admin"],
            },
            {
                icon: "/class.png",
                label: "Classes",
                href: "/classes",
                visible: ["admin", "teacher", "assistant"],
            },
            {
                icon: "/class.png",
                label: "Classe-Enseignant",
                href: "/teacher-classes",
                visible: ["admin"],
            },
            {
                icon: "/offer.png",
                label: "Offres",
                href: "/offers",
                visible: ["admin"],
            },
            {
                icon: "/credit-card.png",
                label: "Paiements",
                href: "/transactions",
                visible: ["admin", "assistant"],
            },
            {
                icon: "/cashier.png",
                label: "Caisse",
                href: "/cashier",
                visible: ["admin", "assistant"],
            },
            {
                icon: "/result.png",
                label: "Résultats",
                href: "/results",
                visible: ["admin", "teacher", "assistant"],
            },
            {
                icon: "/attendance.png",
                label: "Présences",
                href: "/attendances",
                visible: ["admin", "teacher", "assistant"],
                dropdown: [
                    {
                        label: "Présences",
                        href: "/attendances",
                    },
                    {
                        label: "Absence Log",
                        href: "/absence-log",
                    },
                    {
                        label: "Liste de présence",
                        href: "/absence-list",
                    },
                ],
            },
            {
                icon: "/announcement.png",
                label: "Annonces",
                href: "/announcements",
                visible: ["admin"],
            },
            {
                icon: "/other_settings.png",
                label: "Autres paramètres",
                href: "/othersettings",
                visible: ["admin"],
            },
        ],
    },
    {
        title: "AUTRE",
        items: [
            {
                icon: "/profile.png",
                label: "Profil",
                href: "/profile",
                visible: ["admin", "teacher", "assistant"],
            },
            {
                icon: "/setting.png",
                label: "Paramètres",
                href: `/setting`,
                visible: ["admin"],
            },
            {
                method: "post",
                as: "button",
                icon: "/logout.png",
                label: "Déconnexion",
                href: `${route("logout")}`,
                visible: ["admin", "teacher", "assistant"],
            },
        ],
    },
];

const Menu = () => {
    const role = usePage().props.auth.user.role;
    const [openDropdown, setOpenDropdown] = React.useState(null);
    // Add a ref to detect outside clicks
    const dropdownRef = React.useRef();
    const page = usePage();

    React.useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close dropdown on route change
    React.useEffect(() => {
        setOpenDropdown(null);
    }, [page.url]);

    return (
        <div className="mt-4 text-sm">
            {menuItems.map((i) => (
                <div className="flex flex-col gap-2" key={i.title}>
                    <span className="hidden lg:block text-gray-400 font-light my-4">
                        {i.title}
                    </span>
                    {i.items.map((item) => {
                        if (item.visible.includes(role)) {
                            if (item.dropdown && ["admin", "assistant"].includes(role)) {
                                return (
                                    <div
                                        key={item.label}
                                        className="relative"
                                        ref={dropdownRef}
                                    >
                                        <div
                                            className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight cursor-pointer"
                                            onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                                        >
                                            <img
                                                src={item.icon}
                                                alt=""
                                                width={20}
                                                height={20}
                                                className={`${item.label === "Assistants" ? "w-6 h-6 -ml-1" : ""}`}
                                            />
                                            <span className="hidden lg:block">
                                                {item.label}
                                            </span>
                                            <svg className="w-3 h-3 ml-1 hidden lg:block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                        {openDropdown === item.label && (
                                            <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                                                {item.dropdown.map((drop) => (
                                                    <Link
                                                        href={drop.href}
                                                        key={drop.label}
                                                        className="block px-4 py-2 text-gray-700 hover:bg-lamaSkyLight"
                                                        onClick={() => setOpenDropdown(null)}
                                                    >
                                                        {drop.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <Link
                                    as={item.as}
                                    method={item.method}
                                    href={item.href}
                                    key={item.label}
                                    className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight"
                                >
                                    <img
                                        src={item.icon}
                                        alt=""
                                        width={20}
                                        height={20}
                                        className={`${item.label === "Assistants" ? "w-6 h-6 -ml-1" : ""}`}
                                    />
                                    <span className="hidden lg:block">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        }
                    })}
                </div>
            ))}
        </div>
    );
};

export default Menu;
