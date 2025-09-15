import ApplicationLogo from "@/Components/ApplicationLogo";
import { Link } from "@inertiajs/react";

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen">
            {/* Left Section - Background Image */}
            <div
                className="hidden lg:flex w-1/2 h-screen bg-cover bg-center"
                style={{ backgroundImage: "url('background-image.jpg')" }}
            >
                {/* Overlay */}
                <div className="w-full h-full bg-black/40"></div>
            </div>

            {/* Right Section - Login Form */}
            <div className="flex w-full lg:w-1/2 justify-center items-center bg-white">
                <div className="w-full max-w-md p-8 bg-white border rounded-2xl shadow-lg">
                    <div className="flex justify-center">
                        <Link href="/">
                            <ApplicationLogo className="h-28 w-28 text-gray-500" />
                        </Link>
                    </div>
                    <div className="mt-6">{children}</div>
                </div>
            </div>
        </div>
    );
}
