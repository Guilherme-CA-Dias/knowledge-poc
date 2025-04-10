"use client"

import { ContactsTable } from "./components/contacts-table"
import { useContacts } from "@/hooks/use-contacts"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2, Search } from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"

export default function RecordsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { contacts, isLoading, hasMore, loadMore, importContacts, isImporting } = useContacts(
    searchQuery
  );

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

      {/* Contacts Table */}
      <div className="mt-6">
        <ContactsTable 
          contacts={contacts}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
} 