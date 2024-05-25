import { getServerSession } from "next-auth";


export const config = {
  providers: [], // rest of your config
};

export function auth(...args) {
  return getServerSession(...args, config);
}