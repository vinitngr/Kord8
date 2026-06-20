import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  dark?: boolean;
  noPadding?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  footer,
  dark: darkProp,
  noPadding,
}: ModalProps) {
  const isDark = darkProp || className?.includes("bg-[#09090B]") || className?.includes("bg-[#000]");

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-[8px] z-[90]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-full shadow-2xl flex flex-col h-fit max-h-[90vh] overflow-hidden border z-[100]",
              isDark 
                ? "bg-[#09090B] border-[#18181B] rounded-[12px]" 
                : "bg-white border-[#F5F5F5] rounded-[12px]",
              className
            )}
          >
            {/* Conditional Global Close Button (if no title) */}
            {!title && (
              <div className="absolute top-6 right-6 z-[110]">
                <Button variant="ghost" size="icon" onClick={onClose} className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-300",
                  isDark ? "text-[#52525B] hover:text-[#FAFAFA] hover:bg-[#18181B] bg-[#000]/20" : "text-[#999] hover:bg-[#F5F5F5]"
                )}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}

            {title && (
              <div className={cn(
                "flex items-center justify-between px-8 py-5 border-b shrink-0",
                isDark ? "border-[#27272A] bg-[#09090B]" : "border-[#F5F5F5] bg-white"
              )}>
                <h2 className={cn(
                  "text-[15px] font-bold tracking-tight",
                  isDark ? "text-[#FAFAFA]" : "text-[#111]"
                )}>{title}</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className={cn(
                  "h-9 w-9 rounded-xl transition-all duration-300",
                  isDark ? "text-[#52525B] hover:text-[#FAFAFA] hover:bg-[#18181B]" : "text-[#999] hover:bg-[#F5F5F5]"
                )}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            <div className={cn(
              "flex-1 overflow-y-auto custom-scrollbar",
              noPadding ? "p-0" : "p-8"
            )}>
              {children}
            </div>

            {footer && (
              <div className={cn(
                "px-8 py-5 border-t flex justify-end gap-3 shrink-0",
                isDark ? "border-[#27272A] bg-[#09090B]/50" : "border-[#F5F5F5] bg-[#FAFAFA]"
              )}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
