import { fetchConnectedUsers } from "../../services/fetch/fetchConnectedUsers";
import { useEffect, useState } from "react";

export default function ConnectedUsers() {
  const [connectedUsers, setConnectedUsers] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchConnectedUsers();
      if (data?.connected_users) {
        setConnectedUsers(data.connected_users);
      }
    };

    fetchData(); // 初回
    const interval = setInterval(fetchData, 5000); // 5秒ごとに更新

    return () => clearInterval(interval); // クリーンアップ
  }, []);

  return (
    <div>
      <h2>接続中のユーザー</h2>
      <ul>
        {connectedUsers.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </div>
  );
}
