import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/server-auth';
import { getIntegrationClient } from '@/lib/integration-app-client';
import { Contact } from '@/models/contact';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const client = await getIntegrationClient(auth);
    const connectionsResponse = await client.connections.find();
    const firstConnection = connectionsResponse.items?.[0];

    if (!firstConnection) {
      return NextResponse.json({ success: false, error: 'No connection found' });
    }

    let allContacts = [];
    let hasMoreContacts = true;
    let currentCursor = null;

    // Keep fetching while there are more contacts
    while (hasMoreContacts) {
      console.log(`Fetching contacts with cursor: ${currentCursor}`);
      
      // Call synchronous action in Integration App
      const result = await client
        .connection(firstConnection.id)
        .action('get-contacts')
        .run(currentCursor ? { cursor: currentCursor } : null);

      const contacts = result.output.records || [];
      allContacts = [...allContacts, ...contacts];

      // Save batch to MongoDB
      if (contacts.length > 0) {
        const contactsToSave = contacts.map(contact => ({
          ...contact,
          customerId: auth.customerId
        }));

        await Promise.all(contactsToSave.map(contact => 
          Contact.updateOne(
            { id: contact.id, customerId: auth.customerId },
            contact,
            { upsert: true }
          )
        ));

        console.log(`Saved ${contacts.length} contacts to MongoDB`);
      }

      // Check if there are more contacts to fetch
      currentCursor = result.output.cursor;
      hasMoreContacts = !!currentCursor;

      if (hasMoreContacts) {
        console.log('More contacts available, continuing to next page...');
      }
    }

    console.log(`Import completed. Total contacts: ${allContacts.length}`);

    return NextResponse.json({ 
      success: true,
      contactsCount: allContacts.length 
    });
  } catch (error) {
    console.error('Error in import:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 