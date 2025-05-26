"use client";

import { Menu } from "../components/menu";
import { RoomList } from "../components/room-list";
import styles from "../styles/Home.module.css";

function PageContent() {
  return (
    <div className={styles.container}>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
          Caro Online
        </h1>
        <p className="mt-2 text-gray-600 text-lg">
          The Ultimate Five-in-a-Row Experience
        </p>
      </div>
      <Menu />
      <div className="mt-12 w-full max-w-7xl mx-auto">
        <RoomList />
      </div>
    </div>
  );
}

export default function HomePage() {
  return <PageContent />;
}
