import { Pool } from 'pg';
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { auth } from '@/app/session';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        const { userName, password } = credentials;

        try {
          const connectionString = process.env.NEON;
          const pool = new Pool({
            connectionString: connectionString,
          });

          const client = await pool.connect();
          const userQuery = `SELECT PasswordHash FROM "User" WHERE Username = $1`;
          const userResult = await client.query(userQuery, [userName]);

          if (userResult.rows.length === 0) {
            client.release();
            return null;
          }

          const user = userResult.rows[0].passwordhash;
          console.log(user);

          if (!user) {
            client.release();
            console.log("Empty password");
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user);
          client.release();

          if (!passwordsMatch) {
            return null;
          } else {
            console.log("User found");
            return { userName }; // Return user information here
          }
        } catch (error) {
          console.log("Error: ", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user;
      }
      return session;
    },
  },
};

export const config = authOptions;
export { auth };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
