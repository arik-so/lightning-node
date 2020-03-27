import chai = require('chai');
import Node from '../src/node/node';
import {PingMessage} from '../src/wire/messaging/messages/ping';
import {LightningMessageTypes} from '../src/wire/messaging/lightning_message';

const assert = chai.assert;

describe('Ping Pong Test', () => {
	it('should send a ping to Alex B\'s node', async () => {
		// 027455aef8453d92f4706b560b61527cc217ddf14da41770e8ed6607190a1851b8@3.13.29.161:9735
		const node = new Node();
		const socket = node.connect('3.13.29.161', 9735, Buffer.from('027455aef8453d92f4706b560b61527cc217ddf14da41770e8ed6607190a1851b8', 'hex'));

		await socket.receive();
		const pingMessage = new PingMessage({
			num_pong_bytes: 13,
			ignored: Buffer.alloc(1)
		});
		socket.send(pingMessage);
		socket.flush();
		const pongResponse = await socket.receive();
		assert.equal(pongResponse.length, 1);
		assert.equal(pongResponse[0].getType(), LightningMessageTypes.PONG);
	})
});
