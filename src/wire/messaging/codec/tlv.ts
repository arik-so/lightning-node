import BigSize from './big_size.js';

export default class TLV {

	public readonly type: bigint;
	public readonly value: Buffer;

	public constructor(type: bigint | number, value: Buffer) {
		this.type = BigInt(type);
		this.value = value;
	}

	public get tlvSize(): number {
		const typeSize = new BigSize(this.type).length;
		const lengthSize = new BigSize(this.dataSize).length;
		return typeSize + lengthSize + this.dataSize;
	}

	public get dataSize(): number {
		return this.value.length;
	}

	public toBuffer(): Buffer {
		const typeBuffer = new BigSize(this.type).toBuffer();
		const lengthBuffer = new BigSize(this.dataSize).toBuffer();
		return Buffer.concat([typeBuffer, lengthBuffer, this.value]);
	}

	public static parse(undelimitedTLVBuffer: Buffer): TLV {
		const typeBuffer = BigSize.parse(undelimitedTLVBuffer);
		const lengthBuffer = undelimitedTLVBuffer.slice(typeBuffer.length);
		const length = BigSize.parse(lengthBuffer);
		const startIndex = length.length;
		const endIndex = startIndex + Number(length.value);
		const data = lengthBuffer.slice(startIndex, endIndex);
		return new TLV(typeBuffer.value, data);
	}
}
