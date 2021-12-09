import * as bigintBuffer from 'bigint-buffer';

export default class BigSize {

	public readonly value: bigint;

	private static readonly MIN_16_BIT_VALUE = BigInt(0xfd);
	private static readonly MIN_32_BIT_VALUE = BigInt(0x10000);
	private static readonly MIN_64_BIT_VALUE = BigInt(0x100000000);
	private static readonly MAX_VALUE = BigInt(0xffffffffffffffff);

	public constructor(value: number | bigint) {
		this.value = BigInt(value);
	}

	private calculateEncodingDetails(): { prefix: number, length: number } {
		// @ts-ignore
		if (this.value < BigSize.MIN_16_BIT_VALUE) {
			return {length: 1, prefix: null};
		}
		// @ts-ignore
		if (this.value < BigSize.MIN_32_BIT_VALUE) {
			return {length: 3, prefix: 0xfd};
		}
		// @ts-ignore
		if (this.value < BigSize.MIN_64_BIT_VALUE) {
			return {length: 5, prefix: 0xfe};
		}
		return {length: 9, prefix: 0xff};
	}

	/**
	 * Returns the length in bytes
	 */
	public get length(): number {
		return this.calculateEncodingDetails().length;
	}

	public toBuffer(): Buffer {
		const encodingDetails = this.calculateEncodingDetails();
		const buffer = Buffer.alloc(encodingDetails.length, 0);

		// is there a prefix
		if (!encodingDetails.prefix) {
			buffer.writeUInt8(Number(this.value), 0);
			return buffer;
		}

		buffer.writeUInt8(encodingDetails.prefix, 0);

		switch (encodingDetails.length) {
			case 3:
				buffer.writeUInt16BE(Number(this.value), 1);
				break;
			case 5:
				buffer.writeUInt32BE(Number(this.value), 1);
				break;
			case 9:
				const bigiBuffer = bigintBuffer.toBufferBE(this.value, 8);
				bigiBuffer.copy(buffer, 1);
		}

		return buffer;
	}

	public static parse(undelimitedVarintBuffer: Buffer): BigSize {
		const firstByte = undelimitedVarintBuffer[0];
		if (firstByte < this.MIN_16_BIT_VALUE) {
			const value = undelimitedVarintBuffer.readUInt8(0);
			return new BigSize(value);
		}
		if (firstByte === 0xfd) {
			const value = undelimitedVarintBuffer.readUInt16BE(1);
			return new BigSize(value);
		}
		if (firstByte === 0xfe) {
			const value = undelimitedVarintBuffer.readUInt32BE(1);
			return new BigSize(value);
		}
		const buffer = undelimitedVarintBuffer.slice(1, 9);
		const value = bigintBuffer.toBigIntBE(buffer);
		return new BigSize(value);
	}
}
