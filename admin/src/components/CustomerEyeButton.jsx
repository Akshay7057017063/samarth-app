import { Eye } from "lucide-react";

const CustomerEyeButton = ({ onClick, title = "View Customer" }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
    >
      <Eye className="h-4 w-4" />
    </button>
  );
};

export default CustomerEyeButton;