import LightningMessage from '../wire/messaging/lightning_message';

export default interface LightningMessageHandler {
	processMessage(message: LightningMessage): Promise<LightningMessage[]>;
}
