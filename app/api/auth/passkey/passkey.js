"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

const challengeStore = {};
const userStore = {};

const getRegisterChallenge = async (email) => {
  const url = process.env.URL;
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("No active session found");
  }

  console.log(session);
  console.log(process.env.URL);

  const challengePayload = await generateRegistrationOptions({
    rpID: url,
    rpName: "My Qumail Machine",
    userName: email,
  });

  challengeStore[email] = challengePayload;
  session.challengePayload = challengePayload; // Store challenge in session
  // Optionally, you can store other session-specific data here

  return { options: challengePayload };
};

const verifyRegistration = async (req) => {
  const { email, creds } = req;
  const url = process.env.URL;

  const session = await getServerSession(authOptions);

  if (!session || !session.challengePayload) {
    console.log(session);
    throw new Error("No active session or challenge payload found");
  }

  const currentOptions = session.challengePayload; // Retrieve challenge from session
  const verification = await verifyRegistrationResponse({
    expectedChallenge: currentOptions.challenge,
    expectedOrigin: process.env.EXPECTED_ORIGIN,
    expectedRPID: url,
    response: creds,
  });

  if (!verification.verified) return { error: "verification failed" };

  // Add pass key to user
  const { registrationInfo } = verification;
  const {
    credentialID,
    credentialPublicKey,
    counter,
    credentialDeviceType,
    credentialBackedUp,
  } = registrationInfo;

  const userData = {
    user: email,
    webAuthnUserID: currentOptions.user.id,
    id: credentialID,
    publicKey: credentialPublicKey,
    counter: counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: creds.response.transports,
  };

  console.log(userData);
  session.userData = userData; // Store user data in session

  return userData;
};

export { getRegisterChallenge, verifyRegistration };
