import LightningMessageHandler from '../handler.js';
import LightningMessage, {LightningMessageTypes} from '../../wire/messaging/lightning_message.js';
import {PingMessage} from '../../wire/messaging/messages/ping.js';
import {PongMessage} from '../../wire/messaging/messages/pong.js';

export default class PingHandler implements LightningMessageHandler {

	async processMessage(message: PingMessage): Promise<LightningMessage[]> {
		if (message.getType() !== LightningMessageTypes.PING) {
			return [];
		}
		const responseLength = message['values'].num_pong_bytes;
		const pongMessage = new PongMessage({
			ignored: Buffer.alloc(responseLength, 0)
		});
		return [pongMessage];
	}

}
