import MerkleTree, {MerkleNode} from '../src/chain/merkle';
import chai = require('chai');

const assert = chai.assert;

describe('Merkle Tree Tests', () => {

	it('should test Merkle root calculation', () => {

		const root = new MerkleTree(
			new MerkleNode(Buffer.from('b337c28c30846620599f060577db352cd66b3a6cc2fd4812388c519a30a1d33b', 'hex'), true),
			new MerkleNode(Buffer.from('6d95e85d4d7305728e583765884280ea382841fac8656c3d7594989ea11190a9', 'hex'), true)
		);
		const hash = root.hash.reverse();

		assert.equal(hash.toString('hex'), '25c8487847de572c21bff029a95d9a9fecd9f4c2736984b979d37258cd47bd1f')
	});

});
