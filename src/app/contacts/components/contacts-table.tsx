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

interface ContactsTableProps {
  contacts: Contact[]
  isLoading?: boolean
  isError?: Error | null
}

export function ContactsTable({
  contacts,
  isLoading = false,
  isError = null,
}: ContactsTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return "-";
    }
  };

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
                <TableRow key={`${contact.id}-${contact.customerId}`}>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.id }} className="font-medium">
                    {contact.id}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.name }}>
                    {contact.name || "-"}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.email }}>
                    {contact.fields?.email || "-"}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.phone }}>
                    {contact.fields?.phone || "-"}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.createdAt }}>
                    {formatDate(contact.createdTime || contact.created_at)}
                  </TableCell>
                  <TableCell style={{ ...tableStyles.cell, width: columnWidths.updatedAt }}>
                    {formatDate(contact.updatedTime || contact.updated_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 