import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<{
    src?: string;
    name: string;
    fallback: string;
  }>;
  max?: number;
}

export function AvatarGroup({ avatars, max = 3, className, ...props }: AvatarGroupProps) {
  const displayedAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn("flex -space-x-2", className)} {...props}>
      {displayedAvatars.map((avatar, i) => (
        <TooltipProvider key={i} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="ring-2 ring-background">
                <AvatarImage src={avatar.src} alt={avatar.name} />
                <AvatarFallback>{avatar.fallback}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{avatar.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      
      {remainingCount > 0 && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground font-medium text-xs ring-2 ring-background">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-52">
              <p className="text-xs">
                {avatars.slice(max).map(a => a.name).join(", ")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}