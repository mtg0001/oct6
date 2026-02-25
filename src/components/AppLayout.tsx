import { AppSidebar } from "./AppSidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 lg:ml-[260px] min-h-screen">
        <div className="p-4 sm:p-5 lg:p-6 max-w-[1600px] mx-auto pt-14 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
