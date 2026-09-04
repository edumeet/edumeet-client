// Codecs the E2EE worker can split correctly. Opus and VP8/VP9 have a fixed or cheaply derived clear
// header, so the SFU keeps what it needs for forwarding and the rest is encrypted. H264 does not: the
// browser packetizes NAL units AFTER our transform has run, so encrypting past a fixed offset leaves
// the packetizer walking ciphertext and the stream is broken rather than protected.
export const E2EE_PROTECTABLE_CODEC = /^(audio\/opus|video\/vp8|video\/vp9)$/i;

export const isProtectableCodec = (mimeType?: string): boolean => E2EE_PROTECTABLE_CODEC.test(mimeType ?? '');

type CodecLike = { mimeType: string };

export type SendCodecChoice = {
	e2ee: boolean;
	kind?: string;
	requested?: string;
};

// With E2EE on, choose a codec the worker can protect instead of leaving it to negotiation, which is
// free to settle on H264. Without E2EE this keeps the previous behaviour exactly: the codec that was
// asked for, or nothing, in which case negotiation decides.
export const chooseSendCodec = <T extends CodecLike>(codecs: T[] | undefined, choice: SendCodecChoice): T | undefined => {
	if (choice.e2ee && choice.kind === 'video') return codecs?.find((c) => E2EE_PROTECTABLE_CODEC.test(c.mimeType));

	return codecs?.find((c) => c.mimeType.toLowerCase() === choice.requested);
};
