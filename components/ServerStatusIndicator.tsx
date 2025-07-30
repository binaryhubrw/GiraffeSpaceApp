"use client"

import { useServerStatus } from '@/hooks/useServerStatus'
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const ServerStatusIndicator = () => {
  const { isOnline, isChecking, lastCheck, error, checkServerStatus } = useServerStatus()

  const getStatusInfo = () => {
    if (isChecking) {
      return {
        icon: RefreshCw,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        text: 'Checking...',
        tooltip: 'Checking server connectivity...'
      }
    }

    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        text: 'Offline',
        tooltip: `Server is not responding. Last check: ${lastCheck?.toLocaleTimeString() || 'Never'}`
      }
    }

    return {
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      text: 'Online',
      tooltip: `Server is online. Last check: ${lastCheck?.toLocaleTimeString() || 'Never'}`
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkServerStatus}
              disabled={isChecking}
              className="p-1 h-auto"
            >
              <div className={`p-1 rounded-full ${statusInfo.bgColor}`}>
                <IconComponent 
                  className={`w-4 h-4 ${statusInfo.color} ${isChecking ? 'animate-spin' : ''}`} 
                />
              </div>
            </Button>
            
            <Badge 
              variant={!isOnline ? "destructive" : isChecking ? "secondary" : "default"}
              className="text-xs"
            >
              {statusInfo.text}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium">{statusInfo.tooltip}</p>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Click to check server status
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 