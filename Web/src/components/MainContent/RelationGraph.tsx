import { motion } from "framer-motion";
import { Users, Zap } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SessionEvent } from "../../types";

interface RelationGraphProps {
  topology?: string; // kept for backward compat but not used for rendering
  agents: string[];
  supervisorId?: string;
  events?: SessionEvent[];
  className?: string;
  isAnimated?: boolean;
}

export function RelationGraph({ 
  agents = [], 
  events,
  className,
  isAnimated = true 
}: RelationGraphProps) {
  
  // Circle layout for all agents
  const nodes = agents.map((id, index) => {
    const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
    return { 
      id, 
      index, 
      x: 50 + 32 * Math.cos(angle), 
      y: 50 + 32 * Math.sin(angle) 
    };
  });

  // Derive connections from events only (no template mode)
  const connections = (events || []).map((event, idx) => {
    const fromNode = nodes.find(n => n.id === event.from);
    const toNode = nodes.find(n => n.id === event.to);
    if (!fromNode || !toNode) return null;
    
    // Check if reverse already exists for offset
    const hasReverse = events!.some((e, i) => i < idx && e.from === event.to && e.to === event.from);
    
    return { from: fromNode, to: toNode, type: event.type, index: idx, hasReverse, label: event.label };
  }).filter(Boolean) as any[];

  // If no events, show all potential connections as faint lines
  const templateConnections = (!events || events.length === 0) ? 
    nodes.flatMap((a, i) => nodes.slice(i + 1).map(b => ({ from: a, to: b }))) : [];

  if (nodes.length === 0) return null;

  return (
    <div className={cn("relative bg-[#000] border border-[#18181B] rounded-2xl overflow-hidden", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full p-6">
        <defs>
           <filter id="glow-pulse">
              <feGaussianBlur stdDeviation="1" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
           </filter>
        </defs>

        {/* Template connections (faint, when no events) */}
        {templateConnections.map((conn, i) => (
           <line key={`t-${i}`} x1={conn.from.x} y1={conn.from.y} x2={conn.to.x} y2={conn.to.y} stroke="#18181B" strokeWidth="0.5" strokeDasharray="2,3" />
        ))}

        {/* Event-based connections */}
        {connections.map((conn, i) => {
          const dx = conn.to.x - conn.from.x;
          const dy = conn.to.y - conn.from.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const nx = dist > 0 ? -dy / dist : 0;
          const ny = dist > 0 ? dx / dist : 0;
          const offset = conn.hasReverse ? 2 : 0;
          
          const x1 = conn.from.x + nx * offset;
          const y1 = conn.from.y + ny * offset;
          const x2 = conn.to.x + nx * offset;
          const y2 = conn.to.y + ny * offset;
          
          return (
             <g key={`e-${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF4A00" strokeWidth="0.6" strokeOpacity="0.3" />
                {isAnimated && (
                   <motion.circle
                     r="0.8"
                     fill="#FF4A00"
                     filter="url(#glow-pulse)"
                     animate={{ 
                       cx: [x1, x2],
                       cy: [y1, y2],
                       opacity: [0, 1, 1, 0]
                     }}
                     transition={{ 
                       duration: 1.8, 
                       repeat: Infinity, 
                       ease: "easeInOut",
                       delay: conn.index * 0.6
                     }}
                   />
                )}
             </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
           const isActive = events?.some(e => e.from === node.id || e.to === node.id);
           return (
             <g key={node.id}>
                <circle 
                  cx={node.x} cy={node.y} r="5" 
                  fill="#09090B" 
                  stroke={isActive ? "#FF4A00" : "#27272A"} 
                  strokeWidth="1" 
                />
                {isActive && isAnimated && (
                   <motion.circle 
                     cx={node.x} cy={node.y} r="7"
                     fill="none" stroke="#FF4A00" strokeWidth="0.4"
                     animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                     transition={{ duration: 2, repeat: Infinity }}
                   />
                )}
                <foreignObject x={node.x - 3} y={node.y - 3} width="6" height="6">
                   <div className="w-full h-full flex items-center justify-center">
                      {isActive 
                        ? <Zap className="w-2.5 h-2.5 text-[#FF4A00]" />
                        : <Users className="w-2.5 h-2.5 text-[#3F3F46]" />
                      }
                   </div>
                </foreignObject>
             </g>
           );
        })}
      </svg>
    </div>
  );
}
