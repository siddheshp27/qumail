import HomePage from "@/components/Home";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { getUserMessages } from "./api/dbfunctions/dbfunction";
const Page = async () => {
  const session = await getServerSession(authOptions);
  console.log(session.userId);
  const messages = await getUserMessages({ userId: session?.userId });
  console.log(messages);
  return (
    <div>
      <HomePage session={session} />
    </div>
  );
};

export default Page;
