import Peer from '../wire/peer';
import Channel from './channel';

export default class Controller {

	public async openChannel(peer: Peer): Promise<Channel> {
		return new Channel();
	}

}
