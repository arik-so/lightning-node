import LightningMessage from '../wire/messaging/lightning_message.js';

export default interface LightningMessageHandler {
	processMessage(message: LightningMessage): Promise<LightningMessage[]>;
}
