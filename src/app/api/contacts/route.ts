import { NextRequest, NextResponse } from 'next/server';
import { getAuthFromRequest } from '@/lib/server-auth';
import { Contact } from '@/models/contact';
import { connectToDatabase } from '@/lib/mongodb';
import { RecordActionKey } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting GET request for contacts...');
    
    const auth = getAuthFromRequest(request);
    if (!auth.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') as RecordActionKey;
    const cursor = searchParams.get('cursor');
    const search = searchParams.get('search');

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB and fetch contacts
    await connectToDatabase();
    
    // Build the query
    const query: any = {
      customerId: auth.customerId
    };

    // Add search conditions if search query exists
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { id: searchRegex },
        { name: searchRegex },
        { 'fields.industry': searchRegex },
        { 'fields.domain': searchRegex }
      ];
    }

    // Query MongoDB with pagination
    const pageSize = 100;
    const contacts = await Contact.find(query)
      .sort({ _id: 1 })
      .skip(cursor ? parseInt(cursor) : 0)
      .limit(pageSize + 1)
      .lean();

    // Check if there are more contacts
    const hasMore = contacts.length > pageSize;
    const resultsToReturn = hasMore ? contacts.slice(0, -1) : contacts;
    const nextCursor = hasMore ? (cursor ? parseInt(cursor) : 0) + pageSize : null;

    return NextResponse.json({
      contacts: resultsToReturn,
      cursor: nextCursor?.toString()
    });

  } catch (error) {
    console.error('Error fetching contacts from MongoDB:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 