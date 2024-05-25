import HomePage from "@/components/Home";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { getUserMessages } from "./api/dbfunctions/dbfunction";
const Page = async () => {
  let currentOffset = 0;
  const session = await getServerSession(authOptions);
  console.log(session.userId);
  const messages = await getUserMessages({ userId: session?.userId });
  console.log(messages);
  return (
    <div>
      <HomePage session={session} messages={messages} />
    </div>
  );
};

export default Page;
