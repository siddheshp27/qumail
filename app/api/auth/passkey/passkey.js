"use server";
const challengeStore = {};
const userStore = {};
// const {generateRegistrationOptions} =
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
const getRegisterChallenge = async (email) => {
  //check for email...
  const url = process.env.URL;
  console.log(process.env.URL);
  const challengePayload = await generateRegistrationOptions({
    rpID: url,
    rpName: "My Qumail Machine",
    userName: email,
  });
  challengeStore[email] = challengePayload;
  return { options: challengePayload };
};

const verifyRegistration = async (req) => {
  const { email, creds } = req;
  const url = process.env.URL;

  //chk if email exists
  const currentOptions = challengeStore[email];
  const verification = await verifyRegistrationResponse({
    expectedChallenge: currentOptions.challenge,
    expectedOrigin: process.env.EXPECTED_ORIGIN,
    expectedRPID: url,
    response: creds,
  });

  if (!verification.verified) return { error: "verification failed" };
  //add pass key to user
  const { registrationInfo } = verification;
  const {
    credentialID,
    credentialPublicKey,
    counter,
    credentialDeviceType,
    credentialBackedUp,
  } = registrationInfo;
  console.log({
    user: email,
    webAuthnUserID: currentOptions.user.id,
    id: credentialID,
    publicKey: credentialPublicKey,
    counter: counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: creds.response.transports,
  });
  return {
    user: email,
    webAuthnUserID: currentOptions.user.id,
    id: credentialID,
    publicKey: credentialPublicKey,
    counter: counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: creds.response.transports,
  };
};

export { getRegisterChallenge, verifyRegistration };
