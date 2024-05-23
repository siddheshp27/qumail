"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import {
  getUserPasskey,
  getUserPasskeys,
  insertPasskeyData,
} from "../../dbfunctions/dbfunction";

const challengeStore = {};
const sessionStorage = {};

const getRegisterChallenge = async () => {
  const url = process.env.URL;
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("No active session found");
  }
  const userName = session.user.userName;
  const challengePayload = await generateRegistrationOptions({
    rpID: url,
    rpName: "My Qumail Machine",
    userName,
  });

  challengeStore[userName] = { challengePayload, timeStamp: Date.now() };
  return { options: challengePayload };
};

const verifyRegistration = async (req) => {
  const { creds } = req;
  const url = process.env.URL;
  const session = await getServerSession(authOptions);
  console.log(session);
  const userName = session.user.userName;

  if (
    !session ||
    !challengeStore[userName] ||
    (challengeStore[userName].timeStamp - Date.now()) / 1000 > 300
  ) {
    console.log(session);
    throw new Error("No active session or challenge payload found or Expired ");
  }

  const currentOptions = challengeStore[userName].challengePayload; // Retrieve challenge from session
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
    user: userName,
    webAuthnUserID: currentOptions.user.id,
    id: credentialID,
    publicKey: credentialPublicKey,
    counter: counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: creds.response.transports,
  };
  await insertPasskeyData(userData);
  console.log(userData);

  return userData;
};

const getAuthenticationChallenge = async (userName) => {
  const url = process.env.URL;
  const userPasskeys = await getUserPasskeys(userName);
  console.log(userPasskeys);
  const options = await generateAuthenticationOptions({
    rpID: url,
    allowCredentials: userPasskeys.map((passkey) => ({
      id: passkey.id,
      transports: passkey.transports,
    })),
  });
  sessionStorage[userName] = { authOptions: options };

  return { options };
};

const verifyAuthentication = async ({ userName, body }) => {
  const url = process.env.URL;

  const passkey = await getUserPasskey(userName, body.id);
  console.log(passkey);
  if (!passkey) {
    throw new Error(`Could not find passkey ${body.id} for user ${userName}`);
  }
  const currentOptions = sessionStorage[userName].authOptions;
  console.log(currentOptions);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: currentOptions.challenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN,
      expectedRPID: url,
      authenticator: {
        credentialID: passkey.id,
        credentialPublicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports,
      },
    });
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
  const { verified } = verification;
  console.log(verified);
  return { verified };
};
export {
  getRegisterChallenge,
  verifyRegistration,
  getAuthenticationChallenge,
  verifyAuthentication,
};
