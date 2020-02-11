import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message';
import {MessageFieldType} from '../types';
import {Point} from 'ecurve';

export interface NodeAnnouncementMessageFields {
	signature: Buffer,
	flen?: number,
	features: Buffer,
	timestamp: number,
	node_id: Point,
	rgb_color: Buffer,
	alias: Buffer,
	addrlen?: number,
	addresses: Buffer
}

export class NodeAnnouncementMessage extends LightningMessage {

	protected values: NodeAnnouncementMessageFields;

	constructor(values: NodeAnnouncementMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.NODE_ANNOUNCEMENT;
	}

	protected getFields(): LightningMessageField[] {
		return [
			{name: 'signature', type: MessageFieldType.SIGNATURE},
			{name: 'flen', type: MessageFieldType.u16, dynamic_value: true},
			{name: 'features', type: 'features'},
			{name: 'timestamp', type: MessageFieldType.u32},
			{name: 'node_id', type: MessageFieldType.POINT},
			{name: 'rgb_color', type: MessageFieldType.COLOR},
			{name: 'alias', type: MessageFieldType.HASH},
			{name: 'addrlen', type: MessageFieldType.u16, dynamic_value: true},
			{name: 'addresses', type: 'addresses'}
		];
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number } {
		if (field.type === 'features') {
			const value = remainingBuffer.slice(0, this.values.flen);
			return {value, offsetDelta: this.values.flen};
		} else if (field.type === 'addresses') {
			const value = remainingBuffer.slice(0, this.values.addrlen);
			return {value, offsetDelta: this.values.addrlen};
		}
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		if (field.name === 'flen') {
			return this.values.features.length;
		} else if (field.name === 'addrlen') {
			return this.values.addresses.length;
		}
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
