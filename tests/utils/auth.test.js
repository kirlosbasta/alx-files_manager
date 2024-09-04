import { expect } from 'chai';
import sinon from 'sinon';
import { ObjectId } from 'mongodb';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import { getUser } from '../../utils/auth';

describe('getUser', () => {
  it('should return null if token is not provided', async () => {
    const req = { headers: {} };
    const user = await getUser(req);
    expect(user).to.be.null;
  });

  it('should return null if token is not found in Redis', async () => {
    const req = { headers: { 'x-token': 'invalid-token' } };
    sinon.stub(redisClient, 'get').resolves(null);
    const user = await getUser(req);
    expect(user).to.be.null;
    sinon.restore();
  });

  it('should return null if user is not found in the database', async () => {
    const req = { headers: { 'x-token': 'valid-token' } };
    sinon.stub(redisClient, 'get').resolves('user-id');
    sinon.stub(dbClient.users, 'findOne').resolves(null);
    const user = await getUser(req);
    expect(user).to.be.null;
    sinon.restore();
  });

  it('should return the user if found in the database', async () => {
    const req = { headers: { 'x-token': 'valid-token' } };
    sinon.stub(redisClient, 'get').resolves('user-id');
    sinon
      .stub(dbClient.users, 'findOne')
      .resolves({ _id: new ObjectId('user-id'), email: 'John Doe' });
    const user = await getUser(req);
    expect(user).to.deep.equal({
      _id: new ObjectId('user-id'),
      email: 'John Doe',
    });
    sinon.restore();
  });
});
