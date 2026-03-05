"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { NoteCreator } from "@/types/note";

interface Props {
  profile: NoteCreator;
  articleCount: number;
}

export function ProfileCard({ profile, articleCount }: Props) {
  return (
    <Card className="border-slate-800 bg-slate-900 shadow-sm">
      <CardContent className="flex items-start gap-4 p-4">
        {profile.user_profile_image_path && (
          <img
            src={profile.user_profile_image_path}
            alt={profile.nickname}
            className="h-14 w-14 rounded-full object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-50 truncate">
            {profile.nickname}
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            @{profile.urlname}
          </p>
          <p className="text-sm text-slate-400 mt-1 line-clamp-2">
            {profile.profile
              ? profile.profile.slice(0, 50) +
                (profile.profile.length > 50 ? "..." : "")
              : "プロフィール未設定"}
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-slate-300">
              フォロワー{" "}
              <span className="font-bold text-emerald-400">
                {profile.follower_count >= 0
                  ? profile.follower_count.toLocaleString()
                  : "非公開"}
              </span>
            </span>
            <span className="text-slate-300">
              記事数{" "}
              <span className="font-bold text-emerald-400">
                {articleCount.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
