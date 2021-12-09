import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message.js';
import {MessageFieldType} from '../types.js';

export interface PongMessageFields {
	byteslen?: number,
	ignored: Buffer
}

export class PongMessage extends LightningMessage {

	protected values: PongMessageFields;

	constructor(values: PongMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.PONG;
	}

	private static readonly FIELDS: LightningMessageField[] = [
		{name: 'byteslen', type: MessageFieldType.u16, dynamic_value: true},
		{name: 'ignored', type: 'ignored'}
	];

	protected getFields(): LightningMessageField[] {
		return PongMessage.FIELDS;
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
