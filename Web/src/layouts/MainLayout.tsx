import * as React from "react";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full bg-[#FAFAFA] text-[#111] overflow-hidden font-sans">
      {children}
    </div>
  );
};
