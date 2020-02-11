import bigintBuffer = require('bigint-buffer');
import {TLVTypeHandler} from '../tlv_type_handler';

export class TypeTu64Handler implements TLVTypeHandler<bigint> {

	fromBuffer(buffer: Buffer): bigint {
		const untrimmedBuffer = Buffer.alloc(8, 0);
		buffer.copy(untrimmedBuffer, untrimmedBuffer.length - buffer.length);
		return bigintBuffer.toBigIntBE(untrimmedBuffer);
	}

	toBuffer(value: bigint | number): Buffer {
		const buffer = bigintBuffer.toBufferBE(BigInt(value), 8);

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
