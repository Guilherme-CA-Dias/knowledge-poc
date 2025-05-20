"use client"

import { ContactsTable } from "./components/contacts-table"
import { useContacts } from "@/hooks/use-contacts"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, Search } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Contact } from '@/types/contact'
import useSWR, { mutate } from 'swr'
import { useAuth } from "@/app/auth-provider"

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  })
  if (!res.ok) throw new Error('Failed to fetch contacts')
  return res.json()
}

export default function RecordsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { contacts, isLoading, hasMore, loadMore, importContacts, isImporting } = useContacts(
    searchQuery
  );
  const [updateStatus, setUpdateStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: boolean;
    message: string;
  }>({
    loading: false,
    success: false,
    error: false,
    message: '',
  });
  const { data, error } = useSWR('/api/contacts', fetcher);
  const { customerId } = useAuth();

  const handleUpdateContact = async (contactId: string, updatedData: Partial<Contact>) => {
    try {
      setUpdateStatus({
        loading: true,
        success: false,
        error: false,
        message: 'Updating contact...'
      });
      
      // Include customerId in the request body
      const requestData = {
        ...updatedData,
        customerId: customerId // Add customerId from auth context
      };
      
      console.log('Sending update with customerId:', customerId);
      
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error('Failed to update contact')
      }

      // Refresh the contacts data
      mutate('/api/contacts')
      
      setUpdateStatus({
        loading: false,
        success: true,
        error: false,
        message: 'Contact updated successfully'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({
          ...prev,
          success: false,
          message: ''
        }));
      }, 3000);
      
    } catch (error) {
      console.error('Error updating contact:', error)
      setUpdateStatus({
        loading: false,
        success: false,
        error: true,
        message: 'Failed to update contact. Please try again.'
      });
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setUpdateStatus(prev => ({
          ...prev,
          error: false,
          message: ''
        }));
      }, 3000);
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground mt-2">
          Select a contact type to view and manage your contacts
        </p>
      </div>

      {/* Contact Type Selection and Search */}
      <div className="grid gap-6 md:grid-cols-[1fr,auto,auto]">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search contacts..."
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button 
          onClick={() => importContacts()} 
          disabled={isImporting}
          className="w-fit"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Import Contacts
            </>
          )}
        </Button>
      </div>

      {/* Status Messages */}
      {updateStatus.message && (
        <div className={`p-4 rounded-md ${
          updateStatus.loading ? "bg-blue-50 text-blue-700" :
          updateStatus.success ? "bg-green-50 text-green-700" :
          updateStatus.error ? "bg-red-50 text-red-700" : ""
        }`}>
          {updateStatus.message}
        </div>
      )}

      {/* Contacts Table */}
      <div className="mt-6">
        <ContactsTable 
          contacts={data?.contacts || []}
          isLoading={isLoading}
          isError={error}
          onUpdateContact={handleUpdateContact}
        />
      </div>
    </div>
  );
} 