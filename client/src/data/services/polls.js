import { get, post } from '../lib/request';

const POLLS_API = '/api/polls';

export const getPolls = () =>  get(`${POLLS_API}`);

export const getPoll = id => get(`${POLLS_API}/${id}`);

export const getResults = id => get(`${POLLS_API}/${id}/results`);

export const postPoll = poll => post(`${POLLS_API}`, poll);

export const postVote = (id, vote) => post(`${POLLS_API}/${id}/votes`, vote);