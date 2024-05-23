"use client";
import React from "react";
import {
  getRegisterChallenge,
  verifyRegistration,
} from "../api/auth/passkey/passkey";
import { startRegistration } from "@simplewebauthn/browser";

export default function Page() {
  const handleRegisterPassKey = async () => {
    const { options } = await getRegisterChallenge();
    const authResult = await startRegistration(options);
    const temp = await verifyRegistration({ creds: authResult });
    console.log(temp);
  };
  return (
    <div>
      <h1 onClick={handleRegisterPassKey}>Register a Pass key</h1>
    </div>
  );
}
