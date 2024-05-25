"use client";
import { sendMessage } from "@/app/api/dbfunctions/dbfunction";
import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function Compose({ session }) {
  const [value, setValue] = useState("");
  const [subject, setSubject] = useState("");
  const [receivers, setReceivers] = useState([]);
  const handleReceiversChange = (e) => {
    const input = e.target.value;
    const receiverArray = input.split(",").map((email) => email.trim());
    setReceivers(receiverArray);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await sendMessage({
        receiverEmails: receivers,
        subject,
        body: value,
        senderId: session.userId,
      });
      console.log({ receivers, subject, value });
    } catch (error) {
      console.error("Error submitting form", error);
    }
  };
  return (
    <div className="compose-container">
      <input
        type="text"
        placeholder="Enter Receivers (comma separated)"
        onChange={handleReceiversChange}
        className="subject-input text-white placeholder:text-gray-400"
      />
      <input
        type="text"
        placeholder="Enter Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="subject-input text-white placeholder:text-gray-400"
      />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={setValue}
        className="editor"
      />
      <button
        onClick={handleSubmit}
        className="mt-12 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-500"
        type="submit"
      >
        Send
      </button>
      <style jsx>{`
        .compose-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 80vh;
          width: 60vw;
          padding: 20px;
          margin: 5vh auto;
          background-color: #1e1e1e;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }
        .subject-input {
          padding: 10px;
          font-size: 16px;
          margin-bottom: 10px;
          border: 1px solid #333;
          border-radius: 4px;
          background-color: #333;
          color: #fff;
        }

        .editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          border: none;
        }
        :global(.ql-editor) {
          flex: 1;
          padding: 20px;
          font-size: 16px;
          line-height: 1.6;
          background: #2e2e2e;
          color: #fff;
          border: 1px solid #333;
          border-radius: 4px;
          min-height: 20rem;
        }
        :global(.ql-toolbar) {
          border: none;
          background: #ffffff;
          border-radius: 4px 4px 0 0;
        }
        :global(.ql-container) {
          border: none;
        }
      `}</style>
    </div>
  );
}
