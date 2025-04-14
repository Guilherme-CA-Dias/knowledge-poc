import mongoose from 'mongoose';

export interface IContact {
  id: string;
  name: string;
  createdTime?: string;
  updatedTime?: string;
  uri?: string;
  fields?: {
    domain?: string;
    industry?: string;
    [key: string]: any;
  };
  customerId: string;
}

// Specify the database name
const dbName = 'local-deployments';

const contactSchema = new mongoose.Schema<IContact>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    createdTime: String,
    updatedTime: String,
    uri: String,
    fields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Connect to the specific database
const connection = mongoose.connection.useDb(dbName);

// This creates a 'contacts' collection in the local-deployments database
export const Contact = connection.models.Contact || connection.model<IContact>('Contact', contactSchema); 