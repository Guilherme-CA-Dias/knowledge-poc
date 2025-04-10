import { useEffect, useState } from "react"
import { useIntegrationApp } from "@integration-app/react"
import type { Integration as IntegrationAppIntegration } from "@integration-app/sdk"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SyncButtonProps {
  integration: IntegrationAppIntegration
}

export function SyncButton({ integration }: SyncButtonProps) {
  const integrationApp = useIntegrationApp()
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFlowState = async () => {
      if (!integration.connection?.id) return
      
      try {
        const flowState = await integrationApp
          .connection(integration.connection.id)
          .flow('receive-contact-events')
          .get()

        setIsEnabled(flowState.enabled)
      } catch (error) {
        console.error(`Failed to fetch flow state for ${integration.name}:`, error)
        setIsEnabled(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFlowState()
  }, [integration.connection?.id, integration.name, integrationApp])

  const handleToggle = async () => {
    if (!integration.connection?.id || isLoading) return
    
    setIsLoading(true)
    try {
      await integrationApp
        .connection(integration.connection.id)
        .flow('receive-contact-events')
        .patch({ enabled: !isEnabled })

      setIsEnabled(!isEnabled)
    } catch (error) {
      console.error("Failed to toggle sync:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!integration.connection?.id) return null

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            onClick={handleToggle}
            disabled={isLoading}
            variant="ghost"
            className="relative min-w-[120px]"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div
                  className={`absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${
                    isEnabled ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                  {isEnabled ? "Disable Sync" : "Enable Sync"}
                </span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isEnabled
            ? "Syncing is enabled. Click to disable"
            : "Syncing is disabled. Click to enable"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 