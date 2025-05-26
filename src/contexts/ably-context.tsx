import { createContext } from "react";
import Ably from "ably";

const AblyContext = createContext<Ably.Realtime | null>(null);

export default AblyContext;
