"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon } from "lucide-react";

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      <Card className="min-h-screen w-full bg-gradient-to-br from-green-50 to-green-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <UserIcon className="h-6 w-6" />
            Local Game
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
