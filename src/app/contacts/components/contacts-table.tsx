import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Contact } from "@/types/contact"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { PencilIcon, CheckIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ContactsTableProps {
  contacts: Contact[]
  isLoading?: boolean
  isError?: Error | null
  onUpdateContact?: (contactId: string, updatedData: Partial<Contact>) => Promise<void>
}

export function ContactsTable({
  contacts,
  isLoading = false,
  isError = null,
  onUpdateContact,
}: ContactsTableProps) {
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Contact>>({})

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return "-";
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact.id)
    setEditData({
      name: contact.name,
      fields: {
        ...contact.fields,
        email: contact.fields?.email || contact.fields?.primaryEmail || "",
        phone: contact.fields?.phone || contact.fields?.primaryPhone || "",
      }
    })
  }

  const handleSave = async () => {
    if (editingContact && onUpdateContact) {
      await onUpdateContact(editingContact, editData)
      setEditingContact(null)
      setEditData({})
    }
  }

  const handleCancel = () => {
    setEditingContact(null)
    setEditData({})
  }

  const handleChange = (field: string, value: string) => {
    if (field === 'name') {
      setEditData(prev => ({ ...prev, name: value }))
    } else {
      setEditData(prev => ({
        ...prev,
        fields: {
          ...(prev.fields || {}),
          [field]: value
        }
      }))
    }
  }

  if (isError) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          Error loading contacts. Please try again later.
        </p>
      </div>
    )
  }

  const columnWidths = {
    id: "150px",
    name: "200px",
    email: "250px",
    phone: "150px",
    createdAt: "200px",
    updatedAt: "200px"
  };

  const tableStyles = {
    table: {
      width: '100%',
      tableLayout: 'fixed' as const
    },
    cell: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const
    }
  };

  return (
    <div className="rounded-md border">
      {/* Fixed Header */}
      <div className="bg-white dark:bg-background border-b">
        <Table style={tableStyles.table}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ ...tableStyles.cell, width: columnWidths.id }}>Contact ID</TableHead>
              <TableHead style={{ ...tableStyles.cell, width: columnWidths.name }}>Name</TableHead>
              <TableHead style={{ ...tableStyles.cell, width: columnWidths.email }}>Email</TableHead>
              <TableHead style={{ ...tableStyles.cell, width: columnWidths.phone }}>Phone</TableHead>
              <TableHead style={{ ...tableStyles.cell, width: columnWidths.createdAt }}>Created At</TableHead>
              <TableHead style={{ ...tableStyles.cell, width: columnWidths.updatedAt }}>Updated At</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable Body */}
      <div className="max-h-[600px] overflow-auto">
        <Table style={tableStyles.table}>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`${index}-loading`}>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.id }}>
                    <Skeleton className="h-6 w-[100px]" />
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.name }}>
                    <Skeleton className="h-6 w-[150px]" />
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.email }}>
                    <Skeleton className="h-6 w-[180px]" />
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.phone }}>
                    <Skeleton className="h-6 w-[120px]" />
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.createdAt }}>
                    <Skeleton className="h-6 w-[100px]" />
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.updatedAt }}>
                    <Skeleton className="h-6 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground h-[400px]"
                >
                  No contacts found
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow 
                  key={`${contact.id}-${contact.customerId}`}
                  className="group relative"
                >
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.id }} className="font-medium">
                    {contact.id}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.name }}>
                    {editingContact === contact.id ? (
                      <Input 
                        value={editData.name || ''} 
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="h-8 w-full"
                      />
                    ) : (
                      contact.name || "-"
                    )}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.email }}>
                    {editingContact === contact.id ? (
                      <Input 
                        value={editData.fields?.email || ''} 
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="h-8 w-full"
                      />
                    ) : (
                      contact.fields?.email || contact.fields?.primaryEmail || "-"
                    )}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.phone }}>
                    {editingContact === contact.id ? (
                      <Input 
                        value={editData.fields?.phone || ''} 
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="h-8 w-full"
                      />
                    ) : (
                      contact.fields?.phone || contact.fields?.primaryPhone || "-"
                    )}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.createdAt }}>
                    {formatDate(contact.createdTime || contact.created_at)}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.updatedAt }}>
                    {formatDate(contact.updatedTime || contact.updated_at)}
                  </TableCell>
                  
                  {editingContact === contact.id ? (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleSave}
                        className="h-8 w-8"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleCancel}
                        className="h-8 w-8"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleEdit(contact)}
                        className="h-8 w-8"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 