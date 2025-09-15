import { useState } from "react";
import FormModal from "./FormModal";
import LevelCard from "./LevelCard";

function LevelsList({ levelsData = [] }) {
    const [levels] = useState(levelsData);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const handleOpenModal = (props) => {
        setModalProps(props);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 md:mt-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex flex-row md:flex-row items-center gap-4 w-full md:w-auto">
                    <h1 className="font-semibold text-2xl">Liste de mes niveaux</h1>
                    {role === "admin" && (
                        <button
                            onClick={() =>
                                handleOpenModal({
                                    table: "level",
                                    type: "create",
                                })
                            }
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-3 py-1 h-8 flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Nouveau
                        </button>
                    )}
                </div>
            </div>
            <div className="container mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {levels.map((level) => (
                        <LevelCard
                            key={level.id}
                            level={level}
                            onDelete={() =>
                                handleOpenModal({
                                    table: "level",
                                    type: "delete",
                                    data: level,
                                    id: level.id,
                                    route: "othersettings",
                                })
                            }
                        />
                    ))}
                </div>
            </div>

            {modalOpen && (
                <FormModal {...modalProps} onClose={handleCloseModal} />
            )}
        </div>
    );
}

export default LevelsList;
