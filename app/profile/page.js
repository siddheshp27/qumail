import React from "react";

export default function Page() {
  const handleRegisterPassKey = async () => {
    const response = await getPassKey();
  };
  return (
    <div>
      <h1>Register a Pass key</h1>
    </div>
  );
}
