import { Pool } from 'pg';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { unstable_noStore } from 'next/cache';

export async function POST(req) {
  unstable_noStore();

  try {
    const connectionString = process.env.NEON;
    const pool = new Pool({
      connectionString: connectionString,
    });

    const { email, password, firstName, lastName, userName } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO "User" (Username, Email, PasswordHash, FirstName, LastName)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING UserID;
    `;
    const values = [userName, email, hashedPassword, firstName, lastName];

    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();

    console.log('Query executed successfully:\n', query, values);

    return NextResponse.json({ message: 'User registered.', userId: result.rows[0].UserID }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'An error occurred while registering the user.' }, { status: 500 });
  }
}