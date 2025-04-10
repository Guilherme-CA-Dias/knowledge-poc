"use client"

import { useState } from "react"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useIntegrationApp } from "@integration-app/react"

type LookupType = "phone" | "email"
type Contact = {
  firstName?: string
  lastName?: string
  primaryEmail?: string
  [key: string]: unknown
}
type LookupResult = {
  error?: string
  contact?: Contact
}

export default function LookupPage() {
  const [lookupType, setLookupType] = useState<LookupType>("phone")
  const [lookupValue, setLookupValue] = useState("")
  const [result, setResult] = useState<LookupResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editedContact, setEditedContact] = useState<Contact | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const integrationApp = useIntegrationApp()

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLookupType(e.target.value as LookupType)
    setLookupValue("")
    setHasSearched(false)
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLookupValue(e.target.value)
    setHasSearched(false)
  }

  const handleLookup = async () => {
    try {
      if (!lookupValue) return
      
      setIsLoading(true)
      setResult(null)
      setEditedContact(null)
      setHasSearched(true)

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

      const response = await integrationApp
        .connection(firstConnection.id)
        .action(action)
        .run(params)

      const contact = response?.output?.fields as Contact
      setEditedContact(contact)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactChange = (field: keyof Contact, value: string) => {
    if (!editedContact) return
    setEditedContact({ ...editedContact, [field]: value })
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
            onChange={handleValueChange}
            placeholder={lookupType === "phone" ? "Enter phone number" : "Enter email"}
          />
        </div>

        <Button onClick={handleLookup} disabled={isLoading}>
          Find
        </Button>
      </div>

      {result?.error && (
        <div className="mt-8 text-red-600">
          Error: {result.error}
        </div>
      )}

      {!isLoading && !result?.error && !editedContact && hasSearched && (
        <div className="mt-8 text-gray-600 text-sm">
          No contact found
        </div>
      )}

      {editedContact && (
        <div className="mt-8 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Contact Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <Input
                value={editedContact.firstName || ""}
                onChange={(e) => handleContactChange("firstName", e.target.value)}
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input
                value={editedContact.lastName || ""}
                onChange={(e) => handleContactChange("lastName", e.target.value)}
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={editedContact.primaryEmail || ""}
                onChange={(e) => handleContactChange("primaryEmail", e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 