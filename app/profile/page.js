"use client";
import React from "react";
import {
  getRegisterChallenge,
  verifyRegistration,
} from "../api/auth/passkey/passkey";
import { startRegistration } from "@simplewebauthn/browser";

export default function Page() {
  const handleRegisterPassKey = async () => {
    const email = "siddheshpatil003@gmail.com";
    const response = await getRegisterChallenge(email);
    const { options } = response;
    const authResult = await startRegistration(options);
    // console.log(authResult);
    const temp = await verifyRegistration({ email, creds: authResult });
    console.log(temp);
  };
  return (
    <div>
      <h1 onClick={handleRegisterPassKey}>Register a Pass key</h1>
    </div>
  );
}
