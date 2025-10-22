import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
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
    return NextResponse.json({ message: 'Database setup complete!' });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: 'Failed to setup database', details: error },
      { status: 500 }
    );
  }
}