import LightningMessageHandler from '../handler';
import LightningMessage, {LightningMessageTypes} from '../../wire/messaging/lightning_message';
import {PingMessage} from '../../wire/messaging/messages/ping';
import {PongMessage} from '../../wire/messaging/messages/pong';

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
