import LightningMessageHandler from '../handler';
import LightningMessage from '../../wire/messaging/lightning_message';

export default class InitHandler implements LightningMessageHandler{
	async processMessage(message: LightningMessage): Promise<LightningMessage[]> {
		return [message];
	}
}
