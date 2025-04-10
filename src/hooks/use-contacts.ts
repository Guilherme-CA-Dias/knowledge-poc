import useSWR from 'swr';
import { Contact, ContactsResponse } from '@/types/contact';
import { authenticatedFetcher } from '@/lib/fetch-utils';
import { useState, useCallback, useEffect } from 'react';

export function useContacts(search: string = '') {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<ContactsResponse>(
    `/api/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    authenticatedFetcher
  );

  // Reset contacts when search changes
  useEffect(() => {
    setAllContacts([]);
  }, [search]);

  useEffect(() => {
    if (data?.contacts) {
      setAllContacts(prev => 
        prev.length === 0 ? data.contacts : [...prev, ...data.contacts]
      );
    }
  }, [data]);

  const loadMore = useCallback(async () => {
    if (!data?.cursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = await authenticatedFetcher<ContactsResponse>(
        `/api/contacts?${search ? `search=${encodeURIComponent(search)}&` : ''}cursor=${data.cursor}`
      );
      setAllContacts(prev => [...prev, ...(nextPage.contacts || [])]);
      await mutate({ ...nextPage, contacts: [...allContacts, ...(nextPage.contacts || [])] }, false);
    } catch (error) {
      console.error('Error loading more contacts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [data?.cursor, isLoadingMore, allContacts, mutate, search]);

  const importContacts = async () => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      const response = await authenticatedFetcher<{ error?: string }>(
        '/api/contacts/import'
      );

      if (response.error) {
        throw new Error(response.error);
      }

      await mutate();
    } catch (error) {
      console.error('Error importing contacts:', error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    contacts: allContacts,
    isLoading,
    isError: error,
    hasMore: !!data?.cursor,
    loadMore,
    isLoadingMore,
    importContacts,
    isImporting
  };
} 