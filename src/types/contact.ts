export interface Contact {
  id: string;
  customerId: string;
  name: string;
  createdTime?: string;
  updatedTime?: string;
  created_at?: string;  // keep for backward compatibility
  updated_at?: string;  // keep for backward compatibility
  uri?: string;
  fields?: {
    domain?: string;
    industry?: string;
    [key: string]: any;
  };
}

export interface ContactsResponse {
  contacts: Contact[];
  cursor?: string;
} 