"use client"

import { useState, useEffect } from "react"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useIntegrationApp } from "@integration-app/react"

type LookupType = "phone" | "email"
type Contact = {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  fullName?: string
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
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [editedContact, setEditedContact] = useState<Contact | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [firstConnection, setFirstConnection] = useState<{ id: string, name: string } | null>(null)
  const integrationApp = useIntegrationApp()

  // Fetch first connection on mount
  useEffect(() => {
    const fetchConnection = async () => {
      const connections = await integrationApp.connections.find()
      if (connections.items?.[0]) {
        setFirstConnection(connections.items[0])
      }
    }
    fetchConnection()
  }, [integrationApp])

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

      if (!firstConnection) {
        setResult({ error: "No connection found" })
        return
      }

      const action = lookupType === "phone" 
        ? "find-contact-by-phone" 
        : "find-contact-by-email"

      const params = lookupType === "phone"
        ? { phone: lookupValue }
        : { email: lookupValue }

      const response = await integrationApp
        .connection(firstConnection.id)
        .action(action)
        .run(params)

      console.log('Lookup response:', response)

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

  const handleUpdate = async () => {
    if (!editedContact) return

    if (!firstConnection) {
      setResult({ error: "No connection found" })
      return
    }

    setIsUpdating(true)
    setUpdateSuccess(false)
    
    try {
      console.log('Updating contact:', editedContact)

      const response = await integrationApp
        .connection(firstConnection.id)
        .action("update-contact")
        .run({
            id: editedContact.id,
            first_name: editedContact.first_name,
            last_name: editedContact.last_name,
            email: editedContact.email,
            phone: editedContact.phone,
        });
      console.log('Update contact response:', response)
      setUpdateSuccess(true)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Contact Lookup</h1>
      {firstConnection && (
        <p className="text-sm text-gray-500 mb-6">
          Using: {firstConnection.name}
        </p>
      )}
      
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
                value={editedContact.first_name || ""}
                onChange={(e) => handleContactChange("first_name", e.target.value)}
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input
                value={editedContact.last_name || ""}
                onChange={(e) => handleContactChange("last_name", e.target.value)}
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={editedContact.email || ""}
                onChange={(e) => handleContactChange("email", e.target.value)}
                placeholder="Email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <Input
                type="tel"
                value={editedContact.phone || ""}
                onChange={(e) => handleContactChange("phone", e.target.value)}
                placeholder="Phone Number"
              />
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Contact'}
            </Button>
            {updateSuccess && (
              <p className="mt-2 text-green-600 text-sm">Contact updated successfully!</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 