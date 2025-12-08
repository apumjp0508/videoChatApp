export const API_BASE: string =
  process.env.NEXT_PUBLIC_API_BASE || "https://172.20.10.2:3001";


export const WS_BASE =
  API_BASE.replace("https://", "wss://").replace("http://", "ws://");
