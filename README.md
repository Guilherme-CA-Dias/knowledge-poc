# CRM Integration Example

This is a template for an application showcasing integration capabilities using [Integration.app](https://integration.app). The app is built with Next.js and demonstrates how to:

* implement user authentication and integration token generation
* manage integrations
* manage field mappings
* import all CRM contacts
* continuously sync updates from CRM contacts
* lookup contact by email or phone number
* update a contact

This repo also includes files to create the required actions and flows in your own Integration.app workspace. See below for details.

## Prerequisites

- Node.js 18+ installed
- Integration.app workspace credentials (Workspace Key and Secret)

## App Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
# Copy the sample environment file
cp .env-sample .env
```

4. Edit `.env` and add your Integration.app credentials:

```env
INTEGRATION_APP_WORKSPACE_KEY=your_workspace_key_here
INTEGRATION_APP_WORKSPACE_SECRET=your_workspace_secret_here
MONGODB_URI=your_mongodb_connection_string
```

You can find these credentials in your Integration.app workspace settings.

## Workspace Setup

This app requires some Actions and a Flow. To re-create those in your own Integration.app workspace, first install the [Membrance CLI](https://www.npmjs.com/package/@integration-app/membrane-cli) tool.

The CLI tool was used to populate the `/membrane` directory with the required components.

To set up your workspace, update the `membrane.config.yml` file with your workspace details and push to it using the CLI tool.

## Running the Application

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app` - Next.js app router pages and API routes
  - `/api` - Backend API routes for contacts and integration token management
  - `/contacts` - Example implementation of external data import
  - `/integrations` - Integration and field mapping management
  - `/lookup` - Looking up contact by phone or email, and updating contact
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and helpers
- `/src/models` - Data models and types
- `/public` - Static assets

## Template Features

### Authentication

The template implements a simple authentication mechanism using a randomly generated UUID as the customer ID. This simulates a real-world scenario where your application would have proper user authentication. The customer ID is used to:

- Identify the user/customer in the integration platform
- Generate integration tokens for external app connections
- Associate imported data with specific customers

### Contacts Example

The template includes a complete example of importing and managing users from an external application:

- Contact data model and TypeScript types
- API routes for contact import and retrieval
- React components for displaying contact data
- Integration with SWR for efficient data fetching
- Example of using the Integration.app client for data import

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## License

MIT
