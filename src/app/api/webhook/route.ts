import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Contact } from '@/models/contact';

interface WebhookPayload {
  userId: string;
  externalContactId: string;
  externalContactDeleted: boolean;
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
    const customerId = payload.userId;
    const externalContactId = payload.externalContactId;
    const externalContactDeleted = payload.externalContactDeleted;

    console.log('Received webhook payload:', {
      customerId,
      externalContactId,
      externalContactDeleted: payload.externalContactDeleted,
    });

    await connectToDatabase();

    // Ensure we have the required fields
    if (!customerId || !externalContactId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle contact deletion if specified
    if (externalContactDeleted) {
      // Find and delete the contact (if it exists)
      const deletedContact = await Contact.findOneAndDelete({
        id: externalContactId.toString(),
        customerId
      });

      console.log('Contact deletion attempt:', {
        id: externalContactId,
        _id: deletedContact?._id,
        customerId,
        status: deletedContact ? 'deleted' : 'not_found'
      });

      return NextResponse.json({ 
        success: true,
        contactId: externalContactId,
        _id: deletedContact?._id,
        customerId,
        status: deletedContact ? 'deleted' : 'not_found'
      });
    }

    // Check for existing contact
    const existingContact = await Contact.findOne({
      id: externalContactId.toString(),
      customerId
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
        id: externalContactId.toString(),
        customerId,
        _id: undefined,
        __v: undefined,
        updatedTime: undefined
      };

      // Only update if data has changed
      if (JSON.stringify(existingData) === JSON.stringify(newData)) {
        console.log('Contact unchanged, skipping update:', externalContactId);
        return NextResponse.json({ 
          success: true,
          contactId: externalContactId,
          _id: existingContact._id,
          customerId,
          status: 'unchanged'
        });
      }
    }

    // Update or insert the contact
    const result = await Contact.findOneAndUpdate(
      { 
        id: externalContactId.toString(),
        customerId 
      },
      {
        $set: {
          ...payload.data,
          id: externalContactId.toString(),
          customerId,
          updatedTime: new Date().toISOString()
        }
      },
      { 
        upsert: true,
        new: true // Return the updated/inserted document
      }
    );

    console.log('Contact updated:', {
      id: externalContactId,
      _id: result._id,
      customerId,
      status: existingContact ? 'updated' : 'created'
    });

    return NextResponse.json({ 
      success: true,
      contactId: externalContactId,
      _id: result._id,
      customerId,
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