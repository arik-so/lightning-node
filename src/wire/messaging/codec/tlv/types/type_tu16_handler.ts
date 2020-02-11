import {TLVTypeHandler} from '../tlv_type_handler';

export class TypeTu16Handler implements TLVTypeHandler<number> {

	fromBuffer(buffer: Buffer): number {
		const untrimmedBuffer = Buffer.alloc(2, 0);
		buffer.copy(untrimmedBuffer, untrimmedBuffer.length - buffer.length);
		return untrimmedBuffer.readUInt16BE(0);
	}

	toBuffer(value: number): Buffer {
		const buffer = Buffer.alloc(2, 0);
		buffer.writeUInt16BE(value, 0);

		let trimOffset = 0;
		for (let i = 0; i < buffer.length; i++) {
			if (buffer[i] === 0) {
				trimOffset++;
			} else {
				break;
			}
		}
		return buffer.slice(trimOffset);
	}

}
