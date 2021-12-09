import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message.js';
import {MessageFieldType} from '../types.js';
import {Point} from 'ecurve';

export interface ChannelAnnouncementMessageFields {
	node_signature_1: Buffer,
	node_signature_2: Buffer,
	bitcoin_signature_1: Buffer,
	bitcoin_signature_2: Buffer,
	len: number,
	features: Buffer,
	chain_hash: Buffer,
	short_channel_id: Buffer,
	node_id_1: Point,
	node_id_2: Point,
	bitcoin_key_1: Point,
	bitcoin_key_2: Point,
}

export class ChannelAnnouncementMessage extends LightningMessage {

	protected values: ChannelAnnouncementMessageFields;

	constructor(values: ChannelAnnouncementMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.CHANNEL_ANNOUNCEMENT;
	}

	protected getFields(): LightningMessageField[] {
		return [
			{name: 'node_signature_1', type: MessageFieldType.SIGNATURE},
			{name: 'node_signature_2', type: MessageFieldType.SIGNATURE},
			{name: 'bitcoin_signature_1', type: MessageFieldType.SIGNATURE},
			{name: 'bitcoin_signature_2', type: MessageFieldType.SIGNATURE},
			{name: 'len', type: MessageFieldType.u16, dynamic_value: true},
			{name: 'features', type: 'features'},
			{name: 'chain_hash', type: MessageFieldType.HASH},
			{name: 'short_channel_id', type: MessageFieldType.SHORT_CHANNEL_ID},
			{name: 'node_id_1', type: MessageFieldType.POINT},
			{name: 'node_id_2', type: MessageFieldType.POINT},
			{name: 'bitcoin_key_1', type: MessageFieldType.POINT},
			{name: 'bitcoin_key_2', type: MessageFieldType.POINT}
		];
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number } {
		if (field.type === 'features') {
			const value = remainingBuffer.slice(0, this.values.len);
			return {value, offsetDelta: this.values.len};
		}
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		if (field.name === 'len') {
			return this.values.features.length;
		}
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
