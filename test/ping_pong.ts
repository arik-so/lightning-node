import {default as chai} from 'chai';
import Node from '../src/node/node.js';
import {PingMessage} from '../src/wire/messaging/messages/ping.js';
import {LightningMessageTypes} from '../src/wire/messaging/lightning_message.js';

const assert = chai.assert;

describe('Ping Pong Test', () => {
	it('should send a ping to Alex B\'s node', async () => {
		// 027455aef8453d92f4706b560b61527cc217ddf14da41770e8ed6607190a1851b8@3.13.29.161:9735
		const node = new Node();
		const socket = node.connect('3.13.29.161', 9735, Buffer.from('027455aef8453d92f4706b560b61527cc217ddf14da41770e8ed6607190a1851b8', 'hex'));
		// const pubKey = Buffer.from('03078aa515f9d6022326019fc27fe16dd1af9fa31d19a8a056febf05923650959b', 'hex')
		// const socket = node.connect('localhost', 9735, pubKey);

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
