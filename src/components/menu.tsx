"use client";

import { SinglePlayerCard } from "./menu/single-player-card";
import { TwoPlayersCard } from "./menu/two-players-card";
import { OnlineCard } from "./menu/online-card";
import { useRouter } from "next/navigation";

export function Menu() {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-6 p-4 md:p-6 w-full max-w-7xl mx-auto">
      <SinglePlayerCard onPlay={() => router.push('/play/ai')} />
      <TwoPlayersCard onPlay={() => router.push('/play/local')} />
      <OnlineCard />
    </div>
  );
}
