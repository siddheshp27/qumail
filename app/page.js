import HomePage from "@/components/Home";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { getUserMessages } from "./api/dbfunctions/dbfunction";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
const Page = async () => {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  let currentOffset = 0;
  console.log(session?.userId);
  const messages = await getUserMessages({ userId: session?.userId });
  console.log(messages);
  return (
    <div>
      <HomePage session={session} messages={messages} />
    </div>
  );
};

export default Page;
