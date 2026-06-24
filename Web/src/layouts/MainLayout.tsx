import * as React from "react";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full bg-[#000000] text-[#FAFAFA] overflow-hidden p-3 gap-3">
      {children}
    </div>
  );
};
