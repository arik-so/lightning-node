import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message.js';
import {MessageFieldType} from '../types.js';

export interface InitMessageFields {
	gflen?: number,
	global_features: Buffer,
	lflen?: number,
	local_features: Buffer
}

export class InitMessage extends LightningMessage {

	protected values: InitMessageFields;

	constructor(values: InitMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.INIT;
	}

	private static readonly FIELDS: LightningMessageField[] = [
		{name: 'gflen', type: MessageFieldType.u16, dynamic_value: true},
		{name: 'global_features', type: 'global_features'},
		{name: 'lflen', type: MessageFieldType.u16, dynamic_value: true},
		{name: 'local_features', type: 'local_features'}
	];

	protected getFields(): LightningMessageField[] {
		return InitMessage.FIELDS;
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number } {
		if (field.type === 'global_features') {
			const value = remainingBuffer.slice(0, this.values.gflen);
			return {value, offsetDelta: this.values.gflen};
		}
		if (field.type === 'local_features') {
			const value = remainingBuffer.slice(0, this.values.lflen);
			return {value, offsetDelta: this.values.lflen};
		}
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		if (field.name === 'gflen') {
			return this.values.global_features.length;
		}
		if (field.name === 'lflen') {
			return this.values.local_features.length;
		}
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
