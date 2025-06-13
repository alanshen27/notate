import { Sidebar } from "@/components/sidebar";

export default function NoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex">
      <div className="h-full flex-none">
        <Sidebar />
      </div>
      <div className="h-full flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 overflow-y-auto">
        {children}
        </div>
      </div>
    </div>
  );
}