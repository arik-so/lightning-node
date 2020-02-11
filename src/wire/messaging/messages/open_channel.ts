import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message';
import {Point} from 'ecurve';
import {MessageFieldType} from '../types';

export interface OpenChannelMessageFields {
	chain_hash: Buffer,
	temporary_channel_id: Buffer,
	funding_satoshis: bigint,
	push_msat: bigint,
	dust_limit_satoshis: bigint,
	max_htlc_value_in_flight_msat: bigint,
	channel_reserve_satoshis: bigint,
	htlc_minimum_msat: bigint,
	feerate_per_kw: number,
	to_self_delay: number,
	max_accepted_htlcs: number,
	funding_pubkey: Point,
	revocation_basepoint: Point,
	payment_basepoint: Point,
	delayed_payment_basepoint: Point,
	htlc_basepoint: Point,
	first_per_commitment_point: Point,
	channel_flags: number,
	shutdown_len?: number | null,
	shutdown_scriptpubkey?: Buffer | null,
}

export class OpenChannelMessage extends LightningMessage {

	protected values: OpenChannelMessageFields;

	constructor(values: OpenChannelMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.OPEN_CHANNEL;
	}

	private static readonly FIELDS: LightningMessageField[] = [
		{name: 'chain_hash', type: MessageFieldType.HASH},
		{name: 'temporary_channel_id', type: MessageFieldType.HASH},
		{name: 'funding_satoshis', type: MessageFieldType.u64},
		{name: 'push_msat', type: MessageFieldType.u64},
		{name: 'dust_limit_satoshis', type: MessageFieldType.u64},
		{name: 'max_htlc_value_in_flight_msat', type: MessageFieldType.u64},
		{name: 'channel_reserve_satoshis', type: MessageFieldType.u64},
		{name: 'htlc_minimum_msat', type: MessageFieldType.u64},
		{name: 'feerate_per_kw', type: MessageFieldType.u32},
		{name: 'to_self_delay', type: MessageFieldType.u16},
		{name: 'max_accepted_htlcs', type: MessageFieldType.u16},
		{name: 'funding_pubkey', type: MessageFieldType.POINT},
		{name: 'revocation_basepoint', type: MessageFieldType.POINT},
		{name: 'payment_basepoint', type: MessageFieldType.POINT},
		{name: 'delayed_payment_basepoint', type: MessageFieldType.POINT},
		{name: 'htlc_basepoint', type: MessageFieldType.POINT},
		{name: 'first_per_commitment_point', type: MessageFieldType.POINT},
		{name: 'channel_flags', type: MessageFieldType.BYTE},
		// {name: 'shutdown_len', type: MessageFieldType.u16},
		// {name: 'shutdown_scriptpubkey', type: 'shutdown_scriptpubkey'}
	];

	protected getFields(): LightningMessageField[] {
		return OpenChannelMessage.FIELDS;
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any, offsetDelta: number } {
		if (field.type === 'shutdown_scriptpubkey') {
			const value = remainingBuffer.slice(0, this.values.shutdown_len);
			return {value, offsetDelta: this.values.shutdown_len};
		}
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
