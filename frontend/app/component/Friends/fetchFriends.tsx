"use client";

import { useEffect, useState } from "react";
import { fetchFriends } from "../../services/fetch/fetchFriends";

export default function FetchFriendPage() {
  const [friends, setFriends] = useState<Array<{ ID: number; username: string }>>([]);

  useEffect(() => {
    const fetchData = async () => {
      const fetchedFriends = await fetchFriends();
      setFriends(fetchedFriends);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">友達リスト</h2>
      {!friends || friends.length === 0 ? (
        <p>友達はまだいません。</p>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li key={friend.ID} className="mb-2">
              {friend.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
