import { 
  SiNotion,
  SiGithub,
  SiOpenai,
  SiAnthropic,
  SiBrevo,
  SiGooglegemini,
} from "react-icons/si";
import { 
  FiGlobe,      
  FiZap, 
  FiLayers, 
  FiTerminal, 
  FiCpu
} from "react-icons/fi";
import { cn } from "../../lib/utils";
import { TestTube2 } from "lucide-react";
import { BsGoogle } from "react-icons/bs";

export type LogoService = "notion" | "brevo" | "network" | "serper" | "test" | "firecrawler" | string;

interface LogoProps {
  service: LogoService;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Logo({ service, size = "md", className }: LogoProps) {
  const serviceLower = service.toLowerCase();

  const sizeClasses = {
    xs: "h-4 w-4 text-[7px]",
    sm: "h-6 w-6 text-[8px]",
    md: "h-8 w-8 text-[10px]",
    lg: "h-10 w-10 text-xs",
    xl: "h-12 w-12 text-sm"
  };

  const iconSizeClasses = {
    xs: "h-2.5 w-2.5",
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-6 w-6"
  };

  const getLogoConfig = () => {
    switch (serviceLower) {
      case "notion":
        return {
          icon: SiNotion,
          bg: "bg-white border border-[#E5E5E5]",
          color: "text-black",
          label: "N"
        };
      case "brevo":
        return {
          icon: SiBrevo,
          bg: "bg-[#0092FF]",
          color: "text-white",
          label: "B"
        };
      case "network":
      case "curl":
        return {
          icon: FiGlobe,
          bg: "bg-[#10B981]",
          color: "text-white",
          label: "C"
        };
      case "serper":
      case "search":
        return {
          icon: BsGoogle,
          bg: "bg-white border border-[#E5E5E5]",
          color: "text-[#4285F4]",
          label: "G"
        };
      case "test":
      case "echo":
        return {
          icon: TestTube2,
          bg: "bg-[#8B5CF6]",
          color: "text-white",
          label: "T"
        };
      case "firecrawler":
        return {
          icon: FiZap,
          bg: "bg-[#EF4444]",
          color: "text-white",
          label: "F"
        };
      case "agent":
        return {
          icon: FiCpu,
          bg: "bg-[#111]",
          color: "text-white",
          label: "A"
        };
      case "system":
        return {
          icon: FiTerminal,
          bg: "bg-[#4B5563]",
          color: "text-white",
          label: "S"
        };
      case "github":
        return {
          icon: SiGithub,
          bg: "bg-[#181717]",
          color: "text-white",
          label: "GH"
        };
      case "openai":
        return {
          icon: SiOpenai,
          bg: "bg-[#10a37f]",
          color: "text-white",
          label: "GPT"
        };
      case "google":
      case "gemini":
        return {
          icon: SiGooglegemini,
          bg: "bg-white border border-[#E5E5E5]",
          color: "text-[#4285F4]",
          label: "G"
        };
      case "anthropic":
        return {
          icon: SiAnthropic,
          bg: "bg-[#D97757]",
          color: "text-white",
          label: "CLA"
        };
      default:
        return {
          icon: FiLayers,
          bg: "bg-[#111]",
          color: "text-white",
          label: serviceLower.slice(0, 1).toUpperCase()
        };
    }
  };

  const config = getLogoConfig();
  const IconComponent = config.icon as any;

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200",
        config.bg,
        sizeClasses[size],
        className
      )}
    >
      <IconComponent className={cn(config.color, iconSizeClasses[size])} />
    </div>
  );
}
