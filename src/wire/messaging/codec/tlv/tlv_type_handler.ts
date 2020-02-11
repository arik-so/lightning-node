export interface TLVTypeHandler<T> {

	fromBuffer(buffer: Buffer): T;

	toBuffer(value: T): Buffer;

}
