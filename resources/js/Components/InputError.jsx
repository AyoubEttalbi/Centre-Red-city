export default function InputError({ message, className = "", ...props }) {
    return message ? (
        <p
            {...props}
            className={
                "text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-1 mt-1 font-medium shadow-sm " + className
            }
            role="alert"
        >
            {message}
        </p>
    ) : null;
}
