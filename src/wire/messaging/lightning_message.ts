import bigintBuffer = require('bigint-buffer');
import ecurve = require('ecurve');
import {MessageFieldType, MessageFieldTypeHandler} from './types';
import {Point} from 'ecurve';
import TLV from './codec/tlv';
import * as debugModule from 'debug';

const debug = debugModule('bolt02:lightning-message');
const secp256k1 = ecurve.getCurveByName('secp256k1');

export interface LightningMessageField {
	readonly name: string;
	readonly type: MessageFieldType | string;
	readonly dynamic_value?: boolean;
}

export enum LightningMessageTypes {
	INIT = 16,
	ERROR = 17,
	PING = 18,
	PONG = 19,

	OPEN_CHANNEL = 32,
	ACCEPT_CHANNEL = 33,
	FUNDING_CREATED = 34,
	FUNDING_SIGNED = 35,
	FUNDING_LOCKED = 36,

	SHUTDOWN = 38,
	CLOSING_SIGNED = 39,

	UPDATE_ADD_HTLC = 128,
	UPDATE_FULFILL_HTLC = 130,
	UPDATE_FAIL_HTLC = 131,
	UPDATE_FAIL_MALFORMED_HTLC = 135,

	CHANNEL_ANNOUNCEMENT = 256,
	NODE_ANNOUNCEMENT = 257,
	CHANNEL_UPDATE = 258,

	QUERY_SHORT_CHANNEL_IDS = 261,
	REPLY_SHORT_CHANNEL_IDS_END = 262,
	QUERY_CHANNEL_RANGE = 263,
	REPLY_CHANNEL_RANGE = 264
}

export default abstract class LightningMessage {

	protected values = {};

	public get length(): number {
		const buffer = this.toBuffer();
		return buffer.length;
	}

	public static parse(buffer: Buffer): LightningMessage {
		// dynamic imports to avoid circular dependency
		const {OpenChannelMessage} = require('./messages/open_channel');
		const {AcceptChannelMessage} = require('./messages/accept_channel');
		const {InitMessage} = require('./messages/init');
		const {PingMessage} = require('./messages/ping');
		const {PongMessage} = require('./messages/pong');
		const {UnsupportedMessage} = require('./messages/unsupported');
		const {ChannelAnnouncementMessage} = require('./messages/channel_announcement');
		const {NodeAnnouncementMessage} = require('./messages/node_announcement');
		const {QueryShortChannelIdsMessage} = require('./messages/query_short_channel_ids');
		const {ReplyShortChannelIdsEndMessage} = require('./messages/reply_short_channel_ids_end');
		const {QueryChannelRangeMessage} = require('./messages/query_channel_range');
		const {ReplyChannelRangeMessage} = require('./messages/reply_channel_range');

		const type = buffer.readUInt16BE(0);
		debug('Parsing message of type %s (%d)', LightningMessageTypes[type], type);
		const undelimitedData = buffer.slice(2);
		let message: LightningMessage;
		switch (type) {
			case LightningMessageTypes.OPEN_CHANNEL:
				message = new OpenChannelMessage({});
				break;
			case LightningMessageTypes.ACCEPT_CHANNEL:
				message = new AcceptChannelMessage({});
				break;
			case LightningMessageTypes.INIT:
				message = new InitMessage({});
				break;
			case LightningMessageTypes.PING:
				message = new PingMessage({});
				break;
			case LightningMessageTypes.PONG:
				message = new PongMessage({});
				break;
			case LightningMessageTypes.CHANNEL_ANNOUNCEMENT:
				message = new ChannelAnnouncementMessage({});
				break;
			case LightningMessageTypes.NODE_ANNOUNCEMENT:
				message = new NodeAnnouncementMessage({});
				break;
			case LightningMessageTypes.QUERY_SHORT_CHANNEL_IDS:
				message = new QueryShortChannelIdsMessage({});
				break;
			case LightningMessageTypes.REPLY_SHORT_CHANNEL_IDS_END:
				message = new ReplyShortChannelIdsEndMessage({});
				break;
			case LightningMessageTypes.QUERY_CHANNEL_RANGE:
				message = new QueryChannelRangeMessage({});
				break;
			case LightningMessageTypes.REPLY_CHANNEL_RANGE:
				message = new ReplyChannelRangeMessage({});
				break;
			default:
				message = new UnsupportedMessage(type);
				return message;
		}
		return message.parseData(undelimitedData);
	}

	protected parseData(undelimitedBuffer: Buffer): LightningMessage {
		let offset = 0;
		const fields = this.getFields();
		for (const currentField of fields) {

			const currentType = currentField.type;
			if (currentType in MessageFieldType) {

				// @ts-ignore
				const currentTypeDetails = MessageFieldTypeHandler.getTypeDetails(currentType);

				if (currentTypeDetails.length) {
					const valueBuffer = undelimitedBuffer.slice(offset, offset + currentTypeDetails.length);
					offset += currentTypeDetails.length;

					// TODO: use custom type handler with valueBuffer
					let value: any = valueBuffer;
					if (currentType === MessageFieldType.u16) {
						value = valueBuffer.readUInt16BE(0);
					} else if (currentType === MessageFieldType.u32) {
						value = valueBuffer.readUInt32BE(0);
					} else if (currentType === MessageFieldType.u64) {
						value = bigintBuffer.toBigIntBE(valueBuffer);
					} else if (currentType === MessageFieldType.POINT) {
						value = ecurve.Point.decodeFrom(secp256k1, valueBuffer);
					} else if (currentType === MessageFieldType.BYTE) {
						value = valueBuffer.readUInt8(0);
					}
					this.values[currentField.name] = value;
				} else if (currentType === MessageFieldType.TLV_STREAM) {
					const remainingBuffer = undelimitedBuffer.slice(offset);
					offset += remainingBuffer.length; // this should be the last value

					// parse the TLV stream
					const tlvs: TLV[] = [];
					let tlvOffset = 0;
					while (tlvOffset < remainingBuffer.length) {
						const remainingTLVBuffer = remainingBuffer.slice(tlvOffset);
						const currentTlv = TLV.parse(remainingTLVBuffer);
						tlvOffset += currentTlv.tlvSize;
						tlvs.push(currentTlv);
					}
					this.values[currentField.name] = tlvs;
				}

			} else {
				// do custom handling
				const customFieldResult = this.parseCustomField(undelimitedBuffer.slice(offset), currentField);
				this.values[currentField.name] = customFieldResult.value;
				offset += customFieldResult.offsetDelta;
			}

			if (offset >= undelimitedBuffer.length) {
				break;
			}

		}
		return this;
	}

	public toBuffer() {
		let buffer = Buffer.alloc(2);
		buffer.writeUInt16BE(this.getType(), 0);

		const fields = this.getFields();
		for (const currentField of fields) {
			const currentType = currentField.type;
			let value = this.values[currentField.name];

			if (currentField.dynamic_value) {
				value = this.getDynamicValue(currentField);
			}

			if (value instanceof Buffer) {
				// we don't need to do anything custom
				buffer = Buffer.concat([buffer, value]);
			} else if (currentType in MessageFieldType) {

				// @ts-ignore
				const currentTypeDetails = MessageFieldTypeHandler.getTypeDetails(currentType);

				if (currentTypeDetails.length) {
					const valueBuffer = Buffer.alloc(currentTypeDetails.length, 0);

					if (currentType === MessageFieldType.u16) {
						valueBuffer.writeUInt16BE(value, 0);
					} else if (currentType === MessageFieldType.u32) {
						valueBuffer.writeUInt32BE(value, 0);
					} else if (currentType === MessageFieldType.u64) {
						bigintBuffer.toBufferBE(value as bigint, 8).copy(valueBuffer);
					} else if (currentType === MessageFieldType.POINT) {
						(value as Point).getEncoded(true).copy(valueBuffer);
					} else if (currentType === MessageFieldType.BYTE) {
						valueBuffer.writeUInt8(value, 0);
					}
					buffer = Buffer.concat([buffer, valueBuffer]);

				} else if (currentType === MessageFieldType.TLV_STREAM) {
					const tlvs = value as TLV[];
					const tlvBuffers = tlvs.map(tlv => tlv.toBuffer());
					const valueBuffer = Buffer.concat(tlvBuffers);
					buffer = Buffer.concat([buffer, valueBuffer]);
				}

			} else {
				// do custom handling
				// TODO: figure out way to avoid logic duplication
				const valueBuffer = this.serializeCustomField(currentField, value);
				buffer = Buffer.concat([buffer, valueBuffer]);
			}
		}
		return buffer;
	}

	public abstract getType(): number;

	protected abstract getFields(): LightningMessageField[];

	protected abstract parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number };

	protected abstract getDynamicValue(field: LightningMessageField): any;

	// may actually never be used
	protected abstract serializeCustomField(field: LightningMessageField, value: any): Buffer;

	public getTypeName(): string {
		return LightningMessageTypes[this.getType()];
	}

}
