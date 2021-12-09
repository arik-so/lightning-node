import LightningMessageHandler from '../handler.js';
import LightningMessage from '../../wire/messaging/lightning_message.js';

export default class InitHandler implements LightningMessageHandler{
	async processMessage(message: LightningMessage): Promise<LightningMessage[]> {
		return [message];
	}
}
