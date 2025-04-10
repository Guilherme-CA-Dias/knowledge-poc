import { NextRequest, NextResponse } from 'next/server';
import { getIntegrationClient } from '@/lib/integration-app-client';
import { Contact } from '@/models/contact';
import { connectToDatabase } from '@/lib/mongodb';
import { RECORD_ACTIONS } from '@/lib/constants';

interface WebhookEvent {
  eventType: 'connection.created';
  data: {
    connection: {
      id: string;
      userId: string;
      user: {
        id: string;
        name: string;
        fields: Record<string, any>;
        createdAt: string;
        lastActiveAt: string;
      };
      integrationId: string;
      integration: {
        id: string;
        key: string;
        name: string;
        authType: string;
        parametersSchema: Record<string, any>;
        hasDefaultParameters: boolean;
        hasMissingParameters: boolean;
        hasDocumentation: boolean;
        hasOperations: boolean;
        baseUri: string;
        logoUri: string;
      };
      credentials: string;
      name: string;
      createdAt: string;
      updatedAt: string;
      lastActiveAt: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const event = await request.json() as WebhookEvent;
    const connectionId = event.data.connection.id;
    const results: Array<{ actionKey: string; contactsCount?: number; error?: string }> = [];

    await connectToDatabase();
    const client = await getIntegrationClient({
      customerId: event.data.connection.userId
    });

    // Import contacts for each action type
    for (const action of RECORD_ACTIONS) {
      try {
        let allContacts: any[] = [];
        let hasMoreContacts = true;
        let currentCursor: string | null = null;

        // Fetch all pages of contacts for this action
        while (hasMoreContacts) {
          const result = await client
            .connection(connectionId)
            .action(action.key)
            .run(currentCursor ? { cursor: currentCursor } : null);
          
          const contacts = result.output.records || [];
          allContacts = [...allContacts, ...contacts];

          // Save batch to MongoDB
          if (contacts.length > 0) {
            const contactsToSave = contacts.map(contact => ({
              ...contact,
              customerId: event.data.connection.userId
            }));

            await Promise.all(contactsToSave.map(contact => 
              Contact.updateOne(
                { id: contact.id, customerId: event.data.connection.userId },
                contact,
                { upsert: true }
              )
            ));
          }

          currentCursor = result.output.cursor;
          hasMoreContacts = !!currentCursor;
        }

        results.push({
          actionKey: action.key,
          contactsCount: allContacts.length
        });

      } catch (error) {
        console.error(`Error importing ${action.key}:`, error);
        results.push({
          actionKey: action.key,
          error: 'Failed to import'
        });
      }
    }

    return NextResponse.json({
      success: true,
      connectionId,
      integrationKey: event.data.connection.integration.key,
      results
    });

  } catch (error) {
    console.error('Error in import-all:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 