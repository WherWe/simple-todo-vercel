import { sql } from '@vercel/postgres';

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Create the todos table
    await sql`
      CREATE TABLE IF NOT EXISTS todos (
        id serial PRIMARY KEY NOT NULL,
        text text NOT NULL,
        completed boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `;
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

if (require.main === module) {
  setupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { setupDatabase };