import useSWR from 'swr';
import { Contact, ContactsResponse } from '@/types/contact';
import { authenticatedFetcher } from '@/lib/fetch-utils';
import { useState, useCallback, useEffect } from 'react';

export function useContacts(actionKey: string | null, search: string = '') {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<ContactsResponse>(
    actionKey ? `/api/contacts?action=${actionKey}${search ? `&search=${encodeURIComponent(search)}` : ''}` : null,
    authenticatedFetcher
  );

  // Reset contacts when action or search changes
  useEffect(() => {
    setAllContacts([]);
  }, [actionKey, search]);

  useEffect(() => {
    if (data?.contacts) {
      setAllContacts(prev => 
        prev.length === 0 ? data.contacts : [...prev, ...data.contacts]
      );
    }
  }, [data]);

  const loadMore = useCallback(async () => {
    if (!data?.cursor || isLoadingMore || !actionKey) return;

    setIsLoadingMore(true);
    try {
      const nextPage = await authenticatedFetcher<ContactsResponse>(
        `/api/contacts?action=${actionKey}&cursor=${data.cursor}${search ? `&search=${encodeURIComponent(search)}` : ''}`
      );
      setAllContacts(prev => [...prev, ...(nextPage.contacts || [])]);
      await mutate({ ...nextPage, contacts: [...allContacts, ...(nextPage.contacts || [])] }, false);
    } catch (error) {
      console.error('Error loading more contacts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [data?.cursor, actionKey, isLoadingMore, allContacts, mutate, search]);

  const importContacts = async () => {
    if (!actionKey || isImporting) return;

    setIsImporting(true);
    try {
      const response = await authenticatedFetcher<{ error?: string }>(
        `/api/contacts/import?action=${actionKey}`
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