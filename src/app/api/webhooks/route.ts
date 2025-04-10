import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Contact } from '@/models/contact';

interface WebhookPayload {
  customerId: string;
  data: {
    id: string | number;
    name?: string;
    fields?: {
      [key: string]: string | number | boolean | null | undefined;
    };
    createdTime?: string;
    updatedTime?: string;
    [key: string]: string | number | boolean | null | undefined | Record<string, string | number | boolean | null | undefined>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as WebhookPayload;
    console.log('Received webhook payload:', {
      customerId: payload.customerId,
      recordId: payload.data.id
    });

    await connectToDatabase();

    // Ensure we have the required fields
    if (!payload.customerId || !payload.data.id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for existing contact
    const existingContact = await Contact.findOne({
      id: payload.data.id.toString(),
      customerId: payload.customerId
    });

    // Compare contacts to check if update is needed
    if (existingContact) {
      // Convert both contacts to comparable objects
      const existingData = {
        ...existingContact.toObject(),
        _id: undefined, // Exclude MongoDB _id from comparison
        __v: undefined, // Exclude version from comparison
        updatedTime: undefined // Exclude updatedTime from comparison
      };

      const newData = {
        ...payload.data,
        id: payload.data.id.toString(),
        customerId: payload.customerId,
        _id: undefined,
        __v: undefined,
        updatedTime: undefined
      };

      // Only update if data has changed
      if (JSON.stringify(existingData) === JSON.stringify(newData)) {
        console.log('Contact unchanged, skipping update:', payload.data.id);
        return NextResponse.json({ 
          success: true,
          contactId: payload.data.id,
          _id: existingContact._id,
          customerId: payload.customerId,
          status: 'unchanged'
        });
      }
    }

    // Update or insert the contact
    const result = await Contact.findOneAndUpdate(
      { 
        id: payload.data.id.toString(),
        customerId: payload.customerId 
      },
      {
        $set: {
          ...payload.data,
          id: payload.data.id.toString(),
          customerId: payload.customerId,
          updatedTime: new Date().toISOString()
        }
      },
      { 
        upsert: true,
        new: true // Return the updated/inserted document
      }
    );

    console.log('Contact updated:', {
      id: payload.data.id,
      _id: result._id,
      customerId: payload.customerId,
      status: existingContact ? 'updated' : 'created'
    });

    return NextResponse.json({ 
      success: true,
      contactId: payload.data.id,
      _id: result._id,
      customerId: payload.customerId,
      status: existingContact ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 