import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message';
import {MessageFieldType} from '../types';
import TLV from '../codec/tlv';

export interface QueryChannelRangeMessageFields {
	chain_hash: Buffer,
	first_blocknum: number,
	number_of_blocks: number,
	query_channel_range_tlvs: TLV[]
}

export class QueryChannelRangeMessage extends LightningMessage {

	protected values: QueryChannelRangeMessageFields;

	constructor(values: QueryChannelRangeMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.QUERY_CHANNEL_RANGE;
	}

	protected getFields(): LightningMessageField[] {
		return [
			{name: 'chain_hash', type: MessageFieldType.HASH},
			{name: 'first_blocknum', type: MessageFieldType.u32},
			{name: 'number_of_blocks', type: MessageFieldType.u32},
			{name: 'query_channel_range_tlvs', type: MessageFieldType.TLV_STREAM}
		];
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number } {
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
