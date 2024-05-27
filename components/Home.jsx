"use client";
import Compose from "@/components/Compose";
import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const demoEmails = [
  {
    id: 1,
    sender: "John Doe",
    subject: "Meeting Reminder",
    preview: "Just a reminder about the meeting tomorrow at 10 AM...",
    date: "2024-05-24",
  },
  {
    id: 2,
    sender: "Jane Smith",
    subject: "Project Update",
    preview: "The latest update on the project is as follows...",
    date: "2024-05-23",
  },
  {
    id: 3,
    sender: "Events Team",
    subject: "Invitation to Event",
    preview: "You are invited to our annual event happening next month...",
    date: "2024-05-22",
  },
];

const HomePage = ({ session, messages }) => {
  const [isCompose, setIsCompose] = useState(false);
  const [expandedMessage, setExpandedMessage] = useState(null);

  const handleSignOut = async () => {
    const res = await signOut();
  };

  const toggleReadMore = (messageId) => {
    setExpandedMessage((prev) => (prev === messageId ? null : messageId));
  };
  const notify = () => {
    toast.success("Email Sent successfully !", {
      position: "top-center",
    });
  };

  return (
    <div className="dark flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-gray-100">QuMail</h2>
        </div>

        <nav className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsCompose((prev) => !prev)}
              className="ml-3 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-500"
            >
              {!isCompose ? "Compose" : "Close Editor"}
            </button>
          </div>
          <a
            href="#"
            className="block px-6 py-2 text-gray-300 hover:bg-gray-700"
          >
            Inbox
          </a>
          <a
            href="#"
            className="block px-6 py-2 text-gray-300 hover:bg-gray-700"
          >
            Sent
          </a>
          <a
            href="#"
            className="block px-6 py-2 text-gray-300 hover:bg-gray-700"
          >
            Drafts
          </a>
          <a
            href="#"
            className="block px-6 py-2 text-gray-300 hover:bg-gray-700"
          >
            Trash
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Search mail"
              className="px-4 py-2 border rounded-l-md border-gray-700 focus:outline-none focus:ring focus:border-blue-300"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-500">
              Search
            </button>
          </div>
          <div className="ml-auto">
            <Link
              href="/loginwithpasskey"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Create passkey
            </Link>
          </div>

          <div className="relative group">
            <button className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-full focus:outline-none">
              <span className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full uppercase">
                {session.userName.charAt(0)}
              </span>
            </button>
            <div className="absolute right-0 mt-2 bg-gray-800 text-white rounded-lg shadow-lg py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="px-4 py-2">
                <p className="font-semibold text-white">{session.userName}</p>
                <p className="text-sm text-gray-400">{session.user.email}</p>
              </div>
              <div className="border-t border-gray-700"></div>
              <div className="px-4 py-2">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-white bg-red-600 rounded hover:bg-red-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isCompose && (
            <Compose
              session={session}
              setIsCompose={setIsCompose}
              notify={notify}
            />
          )}
          {!isCompose && (
            <div className="space-y-4">
              {messages.map((message) => {
                const { messageid, body, senderemail, subject, datesent } =
                  message;
                const isExpanded = expandedMessage === messageid;
                let preview = body;
                if (!isExpanded) {
                  const tempDiv = document.createElement("div");
                  tempDiv.innerHTML = body;
                  preview = tempDiv.textContent || tempDiv.innerText || "";
                  if (preview.length > 20) {
                    const cutoff = preview.slice(0, 30).lastIndexOf(" ");
                    preview =
                      cutoff > 0
                        ? preview.slice(0, cutoff) + "..."
                        : preview.slice(0, 30) + "...";
                  }
                }
                return (
                  <div
                    key={messageid}
                    className="p-4 bg-gray-800 shadow-sm rounded-lg hover:bg-gray-700"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-gray-100">{subject}</h3>
                      <span className="text-sm text-gray-400">
                        {new Date(datesent).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{senderemail}</p>
                    <div className="text-gray-400">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: isExpanded ? body : preview,
                        }}
                      />
                      <button
                        onClick={() => toggleReadMore(messageid)}
                        className="text-blue-400 hover:underline mt-2"
                      >
                        {isExpanded ? "Show Less" : "Read More"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
