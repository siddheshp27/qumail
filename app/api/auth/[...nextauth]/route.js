import { Pool } from "pg";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { auth } from "@/app/session";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {},
      async authorize(credentials) {
        const { userName, password, passkeyauth } = credentials;
        let userResult;
        try {
          const connectionString = process.env.NEON;
          const pool = new Pool({
            connectionString: connectionString,
          });

          const client = await pool.connect();
          const userQuery = `SELECT userid, email , passwordhash FROM "User" WHERE Username = $1`;
          userResult = await client.query(userQuery, [userName]);
          client.release();
        } catch (error) {
          console.log("Error: ", error);
          return null;
        }

        if (!passkeyauth) {
          if (userResult.rows.length === 0) {
            return null;
          }

          const user = userResult.rows[0].passwordhash;
          console.log(user);

          if (!user) {
            console.log("Empty password");
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user);

          if (!passwordsMatch) {
            return null;
          } else {
            console.log("User found");
            return {
              userName,
              email: userResult.rows[0].email,
              userId: userResult.rows[0].userid,
            }; // Return user information here
          }
        } else {
          return {
            userName,
            email: userResult.rows[0].email,
            userId: userResult.rows[0].userid,
          };
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: ["/login", "/loginwithpasskey"],
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userName = user.userName;
        token.email = user.email;
        token.userId = user.userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.userName = token.userName;
        session.accesstoken = token.jti;
        session.email = token.email;
        session.userId = token.userId;
      }
      return session;
    },
  },
};

export const config = authOptions;
export { auth };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
