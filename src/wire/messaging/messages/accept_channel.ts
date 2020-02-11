import LightningMessage, {LightningMessageField, LightningMessageTypes} from '../lightning_message';
import {MessageFieldType} from '../types';
import {Point} from 'ecurve';

export interface AcceptChannelMessageFields {
	temporary_channel_id: Buffer,
	dust_limit_satoshis: bigint,
	max_htlc_value_in_flight_msat: bigint,
	channel_reserve_satoshis: bigint,
	htlc_minimum_msat: bigint,
	minimum_depth: number,
	to_self_delay: number,
	max_accepted_htlcs: number,
	funding_pubkey: Point,
	revocation_basepoint: Point,
	payment_basepoint: Point,
	delayed_payment_basepoint: Point,
	htlc_basepoint: Point,
	first_per_commitment_point: Point,
	shutdown_len?: number | null,
	shutdown_scriptpubkey?: Buffer | null,
}

export class AcceptChannelMessage extends LightningMessage {

	protected values: AcceptChannelMessageFields;

	constructor(values: AcceptChannelMessageFields) {
		super();
		this.values = values;
	}

	public getType(): number {
		return LightningMessageTypes.ACCEPT_CHANNEL;
	}

	protected getFields(): LightningMessageField[] {
		return [
			{name: 'temporary_channel_id', type: MessageFieldType.HASH},
			{name: 'dust_limit_satoshis', type: MessageFieldType.u64},
			{name: 'max_htlc_value_in_flight_msat', type: MessageFieldType.u64},
			{name: 'channel_reserve_satoshis', type: MessageFieldType.u64},
			{name: 'htlc_minimum_msat', type: MessageFieldType.u64},
			{name: 'minimum_depth', type: MessageFieldType.u32},
			{name: 'to_self_delay', type: MessageFieldType.u16},
			{name: 'max_accepted_htlcs', type: MessageFieldType.u16},
			{name: 'funding_pubkey', type: MessageFieldType.POINT},
			{name: 'revocation_basepoint', type: MessageFieldType.POINT},
			{name: 'payment_basepoint', type: MessageFieldType.POINT},
			{name: 'delayed_payment_basepoint', type: MessageFieldType.POINT},
			{name: 'htlc_basepoint', type: MessageFieldType.POINT},
			{name: 'first_per_commitment_point', type: MessageFieldType.POINT}
			// {name: 'shutdown_len', type: MessageFieldType.u16},
			// {name: 'shutdown_scriptpubkey', type: 'shutdown_scriptpubkey'}
		];
	}

	protected parseCustomField(remainingBuffer: Buffer, field: LightningMessageField): { value: any; offsetDelta: number } {
		return undefined;
	}

	protected getDynamicValue(field: LightningMessageField): any {
		return undefined;
	}

	protected serializeCustomField(field: LightningMessageField, value: any): Buffer {
		return undefined;
	}

}
