import { checkStatus } from '../../lib/helpers';
import { connect, disconnect } from '../../lib/connect'
import { dropCollection } from '../../lib/db';
import request from 'supertest';
import app from '../../app';
const chance = require('chance').Chance();
import { mockPoll, mockPolls, postPoll } from '../../lib/fixtures/poll';
import { randomVoteQuantities, randomVoteArrays, runVotes } from '../../lib/fixtures/vote';

describe('polls route', () => {

  let createdUser;
  let createdToken;

  beforeEach(async () => {
    await request(app)
      .post('/api/users/signup')
      .send({ email: 'jack@test.com', password: 'abcdef' })
    await request(app)
      .post('/api/users/login')
      .send({ email: 'jack@test.com', password: 'abcdef' })
      .then(res => {
        createdUser = res.body;
        createdToken = res.header['x-auth-token'];
      });

  });
  beforeEach(async () => {
    await dropCollection('polls');
    await dropCollection('votes');
  });
  afterAll(async () => await disconnect());

  test('post to /api/polls', async () => {

    const poll = mockPoll();

    await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${createdToken}`)
      .send(poll)
      .then(res => {
        checkStatus(200)(res);
        expect(res.body).toEqual({
          ...poll,
          _id: expect.any(String),
          __v: expect.any(Number),
          choices: poll.choices.map(choice => ({ ...choice, _id: expect.any(String) }))
        })
      });
  });

  test('get to /api/polls', async () => {

    const polls = mockPolls(10);
    polls.forEach(poll => postPoll(poll, createdToken));

    await request(app)
      .get('/api/polls')
      .then(res => {
        checkStatus(200)(res);
        polls.forEach(poll => {
          expect(res.body).toContainEqual({
            ...poll,
            _id: expect.any(String),
            __v: expect.any(Number),
            choices: poll.choices.map(choice => {
              return { ...choice, _id: expect.any(String) };
            })
          });
        });
      });
  });

  test('get to /api/polls/:id', async () => {

    const poll = mockPoll();
    let createdPoll;

    await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${createdToken}`)
      .send(poll)
      .then(({ body }) => createdPoll = body);

    await request(app)
      .get(`/api/polls/${createdPoll._id}`)
      .then(res => {
        checkStatus(200)(res);
        expect(res.body).toEqual(createdPoll)
    });
  });

  test('post to /api/polls/:id/votes', async () => {

    const poll = mockPoll();
    let createdPoll;

    await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${createdToken}`)
      .send(poll)
      .then(({ body }) => createdPoll = body);

    const vote = {
      poll: createdPoll._id,
      selection: createdPoll.choices[chance.natural({ min: 0, max: 3})]._id
    }

    await request(app)
      .post(`/api/polls/${createdPoll._id}/votes`)
      .set('Authorization', `Bearer ${createdToken}`)
      .send(vote)
      .then(res => {
        checkStatus(200)(res);
        expect(res.body).toEqual({
          ...vote,
          _id: expect.any(String),
          __v: expect.any(Number)
        })
    });
  });

  test('get to /api/polls/:id/results', async () => {

    const poll = mockPoll();
    let createdPoll;

    await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${createdToken}`)
      .send(poll)
      .then(({ body }) => createdPoll = body);

    const quantities = randomVoteQuantities(poll.choices.length)
    const voteArrays = randomVoteArrays(quantities, createdPoll);
    await runVotes(createdPoll, voteArrays, createdToken);

    await request(app)
      .get(`/api/polls/${createdPoll._id}/results`)
      .then(({ body }) => {
        quantities.forEach(quantity => {
          expect(body).toContainEqual({
            _id: expect.any(String),
            count: quantity
          })
        })
      })
  });

});