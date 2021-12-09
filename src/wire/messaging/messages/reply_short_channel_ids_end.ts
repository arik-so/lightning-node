import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message.js';
import {MessageFieldType} from '../types.js';

export interface ReplyShortChannelIdsEndMessageFields {
	chain_hash: Buffer,
	complete: number,
}

export class ReplyShortChannelIdsEndMessage extends LightningMessage {

	protected values: ReplyShortChannelIdsEndMessageFields;

	constructor(values: ReplyShortChannelIdsEndMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.REPLY_SHORT_CHANNEL_IDS_END;
	}

	protected getFields(): LightningMessageField[] {
		return [
			{name: 'chain_hash', type: MessageFieldType.HASH},
			{name: 'complete', type: MessageFieldType.BYTE}
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
