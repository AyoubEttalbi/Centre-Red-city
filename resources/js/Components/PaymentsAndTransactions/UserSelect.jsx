import {
    CheckIcon,
    ChevronUpDownIcon,
    UserIcon,
} from "@heroicons/react/24/solid";
import { Fragment, useState, useEffect } from "react";
import { Combobox, Transition } from "@headlessui/react";

const UserSelect = ({ users = [], selectedUserId = null, onChange, error }) => {
    const [query, setQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (selectedUserId && users) {
            const user = users.find((user) => user.id === selectedUserId);
            if (user) {
                setSelectedUser(user);
            }
        }
    }, [selectedUserId, users]);

    const filteredUsers =
        query === ""
            ? users
            : users.filter((user) => {
                  return (
                      user.name.toLowerCase().includes(query.toLowerCase()) ||
                      (user.email &&
                          user.email
                              .toLowerCase()
                              .includes(query.toLowerCase()))
                  );
              });

    const handleChange = (user) => {
        setSelectedUser(user);
        onChange({
            target: { id: "user_id", name: "user_id", value: user.id },
        });
    };

    const getFinancialInfo = (user) => {
        if (user.role === "teacher" && user.wallet) {
            return `Portefeuille : ${user.wallet}`;
        } else if (
            ["assistant", "admin", "staff"].includes(user.role) &&
            user.salary !== undefined
        ) {
            return `Salaire : ${user.salary}`;
        }
        return "";
    };

    return (
        <div className="w-full">
            <Combobox value={selectedUser} onChange={handleChange}>
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-300 sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                            displayValue={(user) => user?.name}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Rechercher par nom ou email..."
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Transition
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery("")}
                    >
                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredUsers.length === 0 && query !== "" ? (
                                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                    Aucun utilisateur trouvé.
                                </div>
                            ) : (
                                filteredUsers.map((user) => (
                                    <Combobox.Option
                                        key={user.id}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                                active
                                                    ? "bg-indigo-600 text-white"
                                                    : "text-gray-900"
                                            }`
                                        }
                                        value={user}
                                    >
                                        {({ selected, active }) => (
                                            <>
                                                <div className="flex items-center">
                                                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <UserIcon className="h-4 w-4 text-gray-500" />
                                                    </span>
                                                    <div className="ml-3">
                                                        <span
                                                            className={`block truncate ${
                                                                selected
                                                                    ? "font-medium"
                                                                    : "font-normal"
                                                            }`}
                                                        >
                                                            {user.role
                                                                ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ${user.name}`
                                                                : user.name}
                                                        </span>
                                                        <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-1">
                                                            {user.email && (
                                                                <span
                                                                    className={`text-${active ? "indigo-100" : "gray-500"}`}
                                                                >
                                                                    {user.email}
                                                                </span>
                                                            )}
                                                            {getFinancialInfo(
                                                                user,
                                                            ) && (
                                                                <span
                                                                    className={`font-medium text-${active ? "indigo-100" : "indigo-600"}`}
                                                                >
                                                                    {getFinancialInfo(
                                                                        user,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {selected ? (
                                                    <span
                                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                            active
                                                                ? "text-white"
                                                                : "text-indigo-600"
                                                        }`}
                                                    >
                                                        <CheckIcon
                                                            className="h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Combobox.Option>
                                ))
                            )}
                        </Combobox.Options>
                    </Transition>
                </div>
            </Combobox>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default UserSelect;
