import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message';
import {MessageFieldType} from '../types';

export interface PingMessageFields {
	num_pong_bytes: number,
	byteslen?: number,
	ignored: Buffer
}

export class PingMessage extends LightningMessage {

	protected values: PingMessageFields;

	constructor(values: PingMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.PING;
	}

	private static readonly FIELDS: LightningMessageField[] = [
		{name: 'num_pong_bytes', type: MessageFieldType.u16},
		{name: 'byteslen', type: MessageFieldType.u16, dynamic_value: true},
		{name: 'ignored', type: 'ignored'}
	];

	protected getFields(): LightningMessageField[] {
		return PingMessage.FIELDS;
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number } {
		if (field.type === 'ignored') {
			const value = remainingBuffer.slice(0, this.values.byteslen);
			return {value, offsetDelta: this.values.byteslen};
		}
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		if (field.name === 'byteslen') {
			return this.values.ignored.length;
		}
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
