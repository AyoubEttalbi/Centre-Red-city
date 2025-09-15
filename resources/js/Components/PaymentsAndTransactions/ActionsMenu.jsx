import React from "react";
import { Menu } from "@headlessui/react";
import {
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    BanknotesIcon,
} from "@heroicons/react/24/outline";

const ActionsMenu = ({
    onView,
    onEdit,
    onMakePayment,
    showMakePayment = false,
}) => {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
                <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={onView}
                                className={`${active ? "bg-gray-100" : ""} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                            >
                                <EyeIcon
                                    className="mr-3 h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                                Voir l'historique
                            </button>
                        )}
                    </Menu.Item>
                    <Menu.Item>
                        {({ active }) => (
                            <button
                                onClick={onEdit}
                                className={`${active ? "bg-gray-100" : ""} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                            >
                                <PencilIcon
                                    className="mr-3 h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                                Éditer
                            </button>
                        )}
                    </Menu.Item>
                    {showMakePayment && (
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={onMakePayment}
                                    className={`${active ? "bg-gray-100" : ""} flex items-center px-4 py-2 text-sm text-gray-700 w-full text-left`}
                                >
                                    <BanknotesIcon
                                        className="mr-3 h-5 w-5 text-green-500"
                                        aria-hidden="true"
                                    />
                                    Effectuer le paiement
                                </button>
                            )}
                        </Menu.Item>
                    )}
                </div>
            </Menu.Items>
        </Menu>
    );
};

export default ActionsMenu;
