import { Spinner } from "@/components/ui";

export default function CitizenLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <Spinner size={24} />
        <span className="text-body-sm text-muted">Loading...</span>
      </div>
    </div>
  );
}
