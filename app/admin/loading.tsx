import { Loader2 } from "lucide-react";

export default function AdminLoader() {
  return (
    <div className="flex justify-center flex-col items-center h-screen">
      <Loader2 className="size-24 animate-spin" />
    </div>
  );
}
