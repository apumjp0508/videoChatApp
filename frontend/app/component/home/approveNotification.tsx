"use client";

import { useUserStore } from "../../types/userStore";
import { useNotificationStore } from "../../types/communication/notificationStore";
import { useCallOfferStore } from "../../types/VideooChat/callOfferStore";
import { acceptFriendRequest, acceptCallRequest, declineCallRequest } from "../../services/signaling/globalActions";
import IncomingCallToast from "./incomingCallToast";
import { useMemo } from "react";

export default function NotificationListener({ userID }: { userID: number }) {
  const { user } = useUserStore();
  const friendRequests = useNotificationStore((s) => s.friendRequests);
  const offersMap = useCallOfferStore((s) => s.offers);
  const callOffers = useMemo(() => Array.from(offersMap.keys()), [offersMap]);

  const ApproveRequest = async (requestUserID: number) => {
    await acceptFriendRequest(Number(requestUserID), Number(user?.id ?? 0));
    alert("フレンド申請を承認しました。");
  };

  return (
    <>
      {/* 友達承認トースト */}
      <div className="fixed bottom-4 right-4 space-y-2">
        {Object.entries(friendRequests).map(([reqID, notif]) => (
          <div
            key={reqID}
            className="bg-blue-500 text-white px-4 py-2 rounded shadow-md animate-bounce"
          >
            <p>
              <strong>From User ID:</strong> {reqID}
            </p>

            <p>{notif.message}</p>

            <button
              type="button"
              onClick={() => ApproveRequest(Number(reqID))}
              className="mt-2 bg-white text-blue-600 px-2 py-1 rounded"
            >
              リクエスト承認
            </button>
          </div>
        ))}
      </div>

      {/* 通話リクエストトースト */}
      <IncomingCallToast
        offers={callOffers}
        onAccept={acceptCallRequest}
        onDecline={declineCallRequest}
      />
    </>
  );
}
