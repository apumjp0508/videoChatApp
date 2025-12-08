"use client";

export async function getLocalStream(
	constraints: MediaStreamConstraints = { video: true, audio: true }
): Promise<MediaStream> {
	const stream = await navigator.mediaDevices.getUserMedia(constraints);
	return stream;
}


