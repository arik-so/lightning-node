import LightningMessage, {LightningMessageField} from '../lightning_message';

export class UnsupportedMessage extends LightningMessage {

	protected readonly type;

	constructor(type) {
		super();
		this.type = type;
	}

	public getType(): number {
		return this.type;
	}

	protected getFields(): LightningMessageField[] {
		return [];
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
