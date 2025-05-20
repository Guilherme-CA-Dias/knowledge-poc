import { useEffect, useState } from "react"
import { useIntegrationApp } from "@integration-app/react"
import type { Integration as IntegrationAppIntegration } from "@integration-app/sdk"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface SyncButtonProps {
  integration: IntegrationAppIntegration
  label: string
  flowSelector: string
}

export function FlowToggle({ integration, label, flowSelector }: SyncButtonProps) {
  const integrationApp = useIntegrationApp()
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [flowState, setFlowState] = useState<string | null>(null)

  useEffect(() => {
    const fetchFlowState = async () => {
      if (!integration.connection?.id) return
      
      try {
        // Get the current flow enabled state
        const flowData = await integrationApp
          .connection(integration.connection.id)
          .flow(flowSelector)
          .get({ autoCreate: true })

        console.log(`Flow data for ${integration.name}:`, flowData)
        
        // Check if flow state is READY
        setFlowState(flowData.flow?.state || null)
        
        // Set enabled based on both the enabled flag and the READY state
        const isReady = flowData.flow?.state === "READY"
        setIsEnabled(flowData.enabled && isReady)
      } catch (error) {
        console.error(`Failed to fetch flow state for ${integration.name}:`, error)
        setIsEnabled(false)
        setFlowState(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFlowState()
  }, [integration.connection?.id, integration.name, integrationApp, flowSelector])

  const handleToggle = async () => {
    if (!integration.connection?.id || isLoading) return
    
    setIsLoading(true)
    try {
      // Toggle the flow enabled state
      await integrationApp
        .connection(integration.connection.id)
        .flow(flowSelector)
        .patch({ enabled: !isEnabled })

      setIsEnabled(!isEnabled)
    } catch (error) {
      console.error("Failed to toggle sync:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!integration.connection?.id) return null

  // Determine if the toggle should be disabled
  const isToggleDisabled = isLoading || flowState !== "READY"

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="continuous-import" className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative h-6 w-11 flex items-center">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center -ml-2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          <Switch
            id="continuous-import"
            checked={!!isEnabled}
            onCheckedChange={handleToggle}
            disabled={isToggleDisabled}
          />
        )}
      </div>
      {flowState && flowState !== "READY" && (
        <span className="text-xs text-amber-600 ml-2">
          Flow not ready
        </span>
      )}
    </div>
  )
} 