import { NextRequest, NextResponse } from 'next/server';
import { Contact } from '@/models/contact';
import { connectToDatabase } from '@/lib/mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH request received for contact ID:', params.id);
    const contactId = params.id;
    const data = await request.json();
    console.log('Request data:', JSON.stringify(data, null, 2));

    // Get customerId from request body
    const customerId = data.customerId;
    console.log('Using customerId from request body:', customerId);
    
    // Remove customerId from data to avoid updating it in the contact
    if (data.customerId) {
      delete data.customerId;
    }

    // Connect to MongoDB
    await connectToDatabase();
    console.log('Connected to MongoDB');
    
    // Find the contact without customer verification
    const contact = await Contact.findOne({
      id: contactId
    });

    if (!contact) {
      console.log('Contact not found:', contactId);
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    console.log('Found contact:', JSON.stringify(contact, null, 2));

    // Update the contact
    const updateData: any = {};
    
    if (data.name) {
      updateData.name = data.name;
    }
    
    if (data.fields) {
      // For each field in the update data
      Object.entries(data.fields).forEach(([key, value]) => {
        // Use MongoDB dot notation to update nested fields
        updateData[`fields.${key}`] = value;
      });
    }

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Update the contact in MongoDB
    await Contact.updateOne(
      { id: contactId },
      { $set: updateData }
    );
    console.log('Contact updated in MongoDB');

    // Get the updated contact
    const updatedContact = await Contact.findOne({
      id: contactId
    });

    if (!updatedContact) {
      console.log('Failed to retrieve updated contact');
      throw new Error('Failed to retrieve updated contact');
    }

    console.log('Updated contact:', JSON.stringify(updatedContact, null, 2));

    // Send the update to the integration app webhook
    const webhookUrl = 'https://api.integration.app/webhooks/app-events/802541f3-76a3-4559-b8d4-4145af7c4386';
    console.log('Webhook URL:', webhookUrl);
    
    // Prepare the payload according to the required schema
    const webhookPayload = {
      type: 'updated',
      data: updatedContact, // Send the entire contact object as data
      customerId: customerId // Use the customerId from the request body
    };

    console.log('Webhook payload:', JSON.stringify(webhookPayload, null, 2));

    try {
      // Use a simple fetch to send the webhook instead of the integration client
      console.log('Sending webhook request...');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      
      console.log('Webhook response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.log('Webhook error response:', responseText);
        throw new Error(`Webhook request failed with status ${response.status}`);
      }
      
      const responseData = await response.text();
      console.log('Webhook response data:', responseData);
      console.log('Contact update sent to integration app webhook');
    } catch (webhookError) {
      console.error('Error sending contact update to webhook:', webhookError);
      // Continue with the response even if webhook fails
    }

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 