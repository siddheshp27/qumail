import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function runQuery(query, values) {
  const connectionString = process.env.NEON;

  const pool = new Pool({
    connectionString: connectionString,
  });

  try {
    const client = await pool.connect();
    const result = await client.query(query, values);
    client.release();
    console.log("Query executed successfully:\n", query, values);
    return result.rows;
  } catch (err) {
    console.error("Error executing query:", err);
    throw err;
  }
}

async function insertPasskeyData(userData) {
  const publicKeyHex = Buffer.from(userData.publicKey).toString("hex");
  const transportsString = userData.transports.join(",");
  const userQuery = `SELECT UserID FROM "User" WHERE Username = $1`;
  const userResult = await runQuery(userQuery, [userData.user]);
  const userID = userResult[0].userid;

  const insertQuery = `
        INSERT INTO "passkeys" (
          cred_id, 
          cred_public_key, 
          internal_user_id, 
          webauthn_user_id, 
          counter, 
          device_type, 
          backed_up, 
          transports
        ) VALUES (
          $1, 
          decode($2, 'hex'), 
          $3, 
          $4, 
          $5, 
          $6, 
          $7, 
          $8
        );
      `;

  await runQuery(insertQuery, [
    userData.id,
    publicKeyHex,
    userID,
    userData.webAuthnUserID,
    userData.counter,
    userData.deviceType,
    userData.backedUp,
    transportsString,
  ]);

  console.log("Passkey data inserted successfully");
}

const getUserPasskeys = async (userName) => {
  const getDataQuery = `
  SELECT
    p.cred_id,
    p.cred_public_key,
    p.internal_user_id,
    p.webauthn_user_id,
    p.counter,
    p.device_type,
    p.backed_up,
    p.transports,
    p.created_at,
    p.last_used,
    u.Username AS user
  FROM
    "passkeys" p
  JOIN
    "User" u ON p.internal_user_id = u.UserID
  WHERE
    u.Username = $1;
`;

  const result = await runQuery(getDataQuery, [userName]);
  try {
    if (result.length === 0) {
      throw new Error("No passkey data found for the user");
    }

    const passkeyData = result.map((row) => {
      // Converting the hex string back to Uint8Array for the publicKey
      const publicKeyBuffer = Buffer.from(row.cred_public_key, "hex");
      const publicKeyArray = new Uint8Array(publicKeyBuffer);

      return {
        user: row.user,
        webAuthnUserID: row.webauthn_user_id,
        id: row.cred_id,
        publicKey: publicKeyArray,
        counter: row.counter,
        deviceType: row.device_type,
        backedUp: row.backed_up,
        transports: row.transports ? row.transports.split(",") : [],
        createdAt: row.created_at,
        lastUsed: row.last_used,
      };
    });

    return passkeyData;
  } catch (error) {
    console.error("Error fetching passkey data: ", error);
    return null;
  }
};
const getUserPasskey = async (userName, id) => {
  const getDataQuery = `
  SELECT
    p.cred_id,
    p.cred_public_key,
    p.internal_user_id,
    p.webauthn_user_id,
    p.counter,
    p.device_type,
    p.backed_up,
    p.transports,
    p.created_at,
    p.last_used,
    u.Username AS user
  FROM
    "passkeys" p
  JOIN
    "User" u ON p.internal_user_id = u.UserID
  WHERE
    u.Username = $1 
    and
    p.cred_id = $2;
`;

  const result = await runQuery(getDataQuery, [userName, id]);
  try {
    if (result.length === 0) {
      throw new Error("No passkey data found for the user");
    }

    const passkeyData = result.map((row) => {
      // Converting the hex string back to Uint8Array for the publicKey
      const publicKeyBuffer = Buffer.from(row.cred_public_key, "hex");
      const publicKeyArray = new Uint8Array(publicKeyBuffer);

      return {
        user: row.user,
        webAuthnUserID: row.webauthn_user_id,
        id: row.cred_id,
        publicKey: publicKeyArray,
        counter: row.counter,
        deviceType: row.device_type,
        backedUp: row.backed_up,
        transports: row.transports ? row.transports.split(",") : [],
        createdAt: row.created_at,
        lastUsed: row.last_used,
      };
    });

    return passkeyData[0];
  } catch (error) {
    console.error("Error fetching passkey data: ", error);
    return null;
  }
};

export { insertPasskeyData, getUserPasskeys, getUserPasskey };
