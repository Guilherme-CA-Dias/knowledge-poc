"use client"

import { useState } from "react"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useIntegrationApp } from "@integration-app/react"

type LookupType = "phone" | "email"
type LookupResult = {
  error?: string
  contact?: unknown
}

export default function LookupPage() {
  const [lookupType, setLookupType] = useState<LookupType>("phone")
  const [lookupValue, setLookupValue] = useState("")
  const [result, setResult] = useState<LookupResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const integrationApp = useIntegrationApp()

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLookupType(e.target.value as LookupType)
    setLookupValue("")
  }

  const handleLookup = async () => {
    try {
      if (!lookupValue) return
      
      setIsLoading(true)
      setResult(null)

      const connections = await integrationApp.connections.find()
      const firstConnection = connections.items?.[0]
      
      if (!firstConnection) {
        setResult({ error: "No connection found" })
        return
      }

      const action = lookupType === "phone" 
        ? "find-contact-by-phone" 
        : "find-contact-by-email"

      const params = lookupType === "phone"
        ? { phoneNumber: lookupValue }
        : { email: lookupValue }

      // Call the action to find contact
      const response = await integrationApp
        .connection(firstConnection.id)
        .action(action)
        .run(params)

      setResult({ contact: response.output })
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Contact Lookup</h1>
      
      <div className="flex gap-4 items-end max-w-2xl">
        <div className="flex-1">
          <Select 
            value={lookupType}
            onChange={handleTypeChange}
            className="w-full"
          >
            <option value="phone">Find by phone number</option>
            <option value="email">Find by email</option>
          </Select>
        </div>

        <div className="flex-1">
          <Input
            type={lookupType === "email" ? "email" : "text"}
            value={lookupValue}
            onChange={(e) => setLookupValue(e.target.value)}
            placeholder={lookupType === "phone" ? "Enter phone number" : "Enter email"}
          />
        </div>

        <Button onClick={handleLookup} disabled={isLoading}>
          Find
        </Button>
      </div>

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 