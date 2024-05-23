import { Pool } from 'pg';
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {},
            async authorize(credentials) {
                const { userName, password } = credentials;
                console.log(userName,password)
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
                    console.log(user)
                    // Check if the PasswordHash exists
                    if (!user) {
                        client.release();
                        console.log("Empty password")
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(password, user);

                    client.release();

                    if (!passwordsMatch) {
                        return null;
                    } else {
                        console.log("User found");
                        return { userName };
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
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };