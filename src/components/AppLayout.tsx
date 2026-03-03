import { AppSidebar } from "./AppSidebar";
import NotificationPrompt from "./NotificationPrompt";
import { useRealtimeNotifications } from "@/hooks/useNotifications";
import { useGlobalPresence } from "@/hooks/usePresence";

export function AppLayout({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  useGlobalPresence();

  return (
    <div className="min-h-screen flex w-full">
      <div className="print:hidden">
        <AppSidebar />
      </div>
      <main className="flex-1 lg:ml-[260px] print:!ml-0 min-h-screen">
        <div className="p-4 sm:p-5 lg:p-6 max-w-[1600px] mx-auto pt-14 lg:pt-6 print:!p-2 print:!pt-2">
          {children}
        </div>
      </main>
      <NotificationPrompt />
    </div>
  );
}
