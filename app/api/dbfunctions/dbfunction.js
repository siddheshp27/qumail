"use server";
import { Pool } from "pg";
import axios from "axios";
import crypto from "crypto";
import { unstable_noStore } from "next/cache";

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

const getUserMessages = async ({ userId }) => {
  unstable_noStore();
  console.log("test", userId);
  const getDataQuery = `
  SELECT
    "Message".MessageID,
    "Message".Subject,
    "Message".Body,
    "Message".DateSent,
    "User".Email AS SenderEmail,
    "Recipient".IsRead,
    "Recipient".IsArchived,
    "Recipient".IsDeleted
  FROM
      "Message"
  JOIN
      "User" ON "Message".SenderID = "User".UserID
  JOIN
      "Recipient" ON "Message".MessageID = "Recipient".MessageID
  WHERE
      "Recipient".UserID = $1
  ORDER BY "Message".messageid desc 
  LIMIT 10 OFFSET 0;
  `;
  const result = await runQuery(getDataQuery, [userId]);
  return result;
};

async function getAvailableKey() {
  const getKeyQuery = `
    SELECT key_value FROM "quantumkeys" WHERE is_used = false LIMIT 1;
  `;

  const keyResult = await runQuery(getKeyQuery);
  console.log(keyResult);

  if (keyResult.length === 0) {
    const response = await axios.get("http://3.108.228.32:8000/");
    const keys = response.data;

    for (const key of keys) {
      const insertKeyQuery = `
        INSERT INTO "quantumkeys" (key_value, is_used)
        VALUES ($1, false);
      `;
      await runQuery(insertKeyQuery, [key]);
    }
    return keys[0];
  } else {
    return keyResult[0].key_value;
  }
}

function ensureKeyLength(key) {
  const decodedKey = Buffer.from(key, "base64");
  if (decodedKey.length === 32) {
    return decodedKey;
  } else if (decodedKey.length < 32) {
    // Pad the key with zero bytes if it's too short
    const paddedKey = Buffer.alloc(32);
    decodedKey.copy(paddedKey);
    return paddedKey;
  } else {
    // Trim the key if it's too long
    return decodedKey.slice(0, 32);
  }
}

const encryptMessage = async ({ subject, body }) => {
  if (!subject && !body) {
    return { error: "Plaintext is required" };
  }

  try {
    const key = await getAvailableKey();
    const decodedKey = ensureKeyLength(key);

    function encrypt(plaintext, key) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      let encrypted = cipher.update(plaintext, "utf8", "hex");
      encrypted += cipher.final("hex");
      return {
        ciphertext: `${iv.toString("hex")}:${encrypted}`,
      };
    }

    const encryptedSubject = encrypt(subject, decodedKey);
    const encryptedBody = encrypt(body, decodedKey);

    return { encryptedBody, encryptedSubject, key };
  } catch (error) {
    console.error("Error encrypting data:", error);
    return { error: "Failed to encrypt data" };
  }
};

const sendMessage = async ({ receiverEmails, subject, body, senderId }) => {
  const getUserIdByEmailQuery = `
    SELECT "User".UserID
    FROM "User"
    WHERE "User".Email = $1;
  `;

  const insertMessageQuery = `
    INSERT INTO "Message" (Subject, Body, DateSent, SenderID, keyid)
    VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)
    RETURNING "Message".MessageID;
  `;

  const insertRecipientQuery = `
    INSERT INTO "Recipient" (MessageID, UserID, IsRead, IsArchived, IsDeleted)
    VALUES ($1, $2, FALSE, FALSE, FALSE);
  `;

  const connectionString = process.env.NEON;

  const pool = new Pool({
    connectionString: connectionString,
  });

  try {
    const client = await pool.connect();
    try {
      // Begin transaction
      await client.query("BEGIN");

      // Find UserIDs of all recipients
      const recipientIds = [];
      for (const email of receiverEmails) {
        const res = await client.query(getUserIdByEmailQuery, [email]);
        if (res.rows.length > 0) {
          recipientIds.push(res.rows[0].userid);
        } else {
          console.error(`No user found with email: ${email}`);
        }
      }

      if (recipientIds.length === 0) {
        throw new Error("No valid recipients found.");
      }

      // Encrypt the subject and body
      const { encryptedSubject, encryptedBody, key } = await encryptMessage({
        subject,
        body,
      });

      if (encryptedSubject.error || encryptedBody.error) {
        throw new Error("Encryption failed");
      }

      const getKeyId = async (key) => {
        const getKeyIdQuery = `
          SELECT key_id FROM "quantumkeys" WHERE key_value = $1;
        `;
        const id = await runQuery(getKeyIdQuery, [key]);
        return id[0].key_id;
      };

      // Insert the new message and get the MessageID
      const id = await getKeyId(key);
      const messageRes = await client.query(insertMessageQuery, [
        encryptedSubject.ciphertext,
        encryptedBody.ciphertext,
        senderId,
        id,
      ]);
      const newMessageId = messageRes.rows[0].messageid;

      // Insert into Recipient table for each recipient
      for (const userId of recipientIds) {
        await client.query(insertRecipientQuery, [newMessageId, userId]);
      }

      // Mark the keys as used
      const markKeyAsUsed = async (key) => {
        const updateKeyQuery = `
          UPDATE "quantumkeys" SET is_used = true WHERE key_value = $1;
        `;
        await runQuery(updateKeyQuery, [key]);
      };
      await markKeyAsUsed(key);

      // Commit transaction
      await client.query("COMMIT");

      console.log("Email sent successfully!");
    } catch (error) {
      // Rollback transaction in case of error
      await client.query("ROLLBACK");
      console.error("Error sending email:", error);
    } finally {
      // Release the client
      client.release();
    }
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
};

export {
  insertPasskeyData,
  getUserPasskeys,
  getUserPasskey,
  getUserMessages,
  sendMessage,
};
