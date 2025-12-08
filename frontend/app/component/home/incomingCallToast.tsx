"use client";

export default function IncomingCallToast({
	offers,
	onAccept,
	onDecline,
}: {
	offers: number[];
	onAccept: (fromUserID: number) => Promise<void> | void;
	onDecline: (fromUserID: number) => void;
}) {
	if (!offers || offers.length === 0) return null;
	return (
		<div className="fixed bottom-4 left-4 space-y-2">
			{offers.map((from) => (
				<div
					key={from}
					className="bg-pink-600 text-white px-4 py-2 rounded shadow-md"
				>
					<p className="font-semibold">着信中: User {from}</p>
					<div className="mt-2 flex gap-2">
						<button
							type="button"
							onClick={() => onAccept(from)}
							className="bg-white text-pink-600 px-3 py-1 rounded"
						>
							通話に参加
						</button>
						<button
							type="button"
							onClick={() => onDecline(from)}
							className="bg-white/80 text-gray-700 px-3 py-1 rounded"
						>
							拒否
						</button>
					</div>
				</div>
			))}
		</div>
	);
}


