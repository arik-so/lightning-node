import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message.js';
import {MessageFieldType} from '../types.js';
import TLV from '../codec/tlv.js';

export interface QueryShortChannelIdsMessageFields {
	chain_hash: Buffer,
	len?: number,
	encoded_short_ids: Buffer,
	query_short_channel_ids_tlvs: TLV[]
}

export class QueryShortChannelIdsMessage extends LightningMessage {

	protected values: QueryShortChannelIdsMessageFields;

	constructor(values: QueryShortChannelIdsMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.QUERY_SHORT_CHANNEL_IDS;
	}

	protected getFields(): LightningMessageField[] {
		return [
			{name: 'chain_hash', type: MessageFieldType.HASH},
			{name: 'len', type: MessageFieldType.u16, dynamic_value: true},
			{name: 'encoded_short_ids', type: 'encoded_short_ids'},
			{name: 'query_short_channel_ids_tlvs', type: MessageFieldType.TLV_STREAM}
		];
	}

	public get shortChannelIds(): Buffer[] {
		if (this.values.encoded_short_ids[0] !== 0) {
			throw new Error('unsupported short id encoding');
		}

		const channelIds: Buffer[] = [];
		for (let i = 1; i < this.values.encoded_short_ids.length; i += 8) {
			const currentChannelId = this.values.encoded_short_ids.slice(i, i + 8);
			channelIds.push(currentChannelId);
		}

		return channelIds;
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number } {
		if (field.type === 'encoded_short_ids') {
			const value: Buffer = remainingBuffer.slice(0, this.values.len);
			return {value, offsetDelta: this.values.len};
		}
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		if (field.name === 'len') {
			return this.values.encoded_short_ids.length;
		}
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
