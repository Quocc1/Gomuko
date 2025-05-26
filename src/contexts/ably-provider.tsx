import { useEffect, useState, ReactNode } from "react";
import Ably from "ably";
import AblyContext from "./ably-context";

let ablyInstance: Ably.Realtime | null = null;

export const AblyProvider = ({ children }: { children: ReactNode }) => {
  const [ably, setAbly] = useState<Ably.Realtime | null>(null);
  const clientId = ably?.auth.clientId;

  useEffect(() => {
    if (!ablyInstance) {
      console.log("[AblyProvider] Creating new Ably instance");
      ablyInstance = new Ably.Realtime({ authUrl: "/api" });

      ablyInstance.connection.on("connected", () => {
        console.log("[AblyProvider] Connected to Ably");
      });

      ablyInstance.connection.on("disconnected", () => {
        console.log("[AblyProvider] Disconnected from Ably");
      });

      ablyInstance.connection.on("failed", (error) => {
        console.error("[AblyProvider] Connection failed:", error);
      });
    }

    setAbly(ablyInstance);

    // Cleanup function
    return () => {
      // Don't close the connection here, as it's a singleton
      // Only close when the app is actually unmounting
      console.log(
        "[AblyProvider] Component unmounting, but keeping Ably instance alive"
      );
    };
  }, [clientId]);

  return <AblyContext.Provider value={ably}>{children}</AblyContext.Provider>;
};
