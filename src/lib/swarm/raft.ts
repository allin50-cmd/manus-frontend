import type { RufloMessaging, RaftLogEntry, RaftState } from './types';

interface VoteReq { type: 'raft_vote_req'; term: number; candidateId: string; lastLogIndex: number; lastLogTerm: number }
interface VoteResp { type: 'raft_vote_resp'; term: number; voteGranted: boolean; fromId: string }
interface AppendReq { type: 'raft_append'; term: number; leaderId: string; leaderCommit: number }

const ELECTION_MIN = 1500;
const ELECTION_MAX = 3000;
const HB_INTERVAL = 500;

export class RaftNode {
  state: RaftState = 'Follower';
  currentTerm = 0;
  leaderId: string | null = null;

  private votedFor: string | null = null;
  private log: RaftLogEntry[] = [];
  private commitIndex = -1;
  private votes = new Set<string>();
  private electionTimer: ReturnType<typeof setTimeout> | null = null;
  private hbTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private agentId: string,
    private messaging: RufloMessaging,
    private onCommit: (entry: RaftLogEntry) => void,
  ) {
    messaging.subscribe('raft_vote_req', (msg, from) => this.onVoteReq(msg as unknown as VoteReq, from));
    messaging.subscribe('raft_vote_resp', (msg) => this.onVoteResp(msg as unknown as VoteResp));
    messaging.subscribe('raft_append', (msg) => this.onAppend(msg as unknown as AppendReq));
    this.resetElectionTimer();
  }

  destroy() {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    if (this.hbTimer) clearInterval(this.hbTimer);
  }

  propose(command: unknown) {
    if (this.state !== 'Leader') return;
    const entry: RaftLogEntry = { term: this.currentTerm, index: this.log.length, command };
    this.log.push(entry);
    this.onCommit(entry);
  }

  private resetElectionTimer() {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    const timeout = ELECTION_MIN + Math.random() * (ELECTION_MAX - ELECTION_MIN);
    this.electionTimer = setTimeout(() => this.startElection(), timeout);
  }

  private startElection() {
    this.state = 'Candidate';
    this.currentTerm++;
    this.votedFor = this.agentId;
    this.votes = new Set([this.agentId]);
    const req: VoteReq = {
      type: 'raft_vote_req',
      term: this.currentTerm,
      candidateId: this.agentId,
      lastLogIndex: this.log.length - 1,
      lastLogTerm: this.log.at(-1)?.term ?? 0,
    };
    this.messaging.getPeers().forEach((p) => this.messaging.send(p, req as unknown as Record<string, unknown>));
    this.resetElectionTimer();
  }

  private onVoteReq(req: VoteReq, from: string) {
    if (req.term > this.currentTerm) { this.currentTerm = req.term; this.state = 'Follower'; this.votedFor = null; }
    const logOk = req.lastLogTerm > (this.log.at(-1)?.term ?? 0) ||
      (req.lastLogTerm === (this.log.at(-1)?.term ?? 0) && req.lastLogIndex >= this.log.length - 1);
    const grant = req.term >= this.currentTerm && logOk && (this.votedFor === null || this.votedFor === req.candidateId);
    if (grant) this.votedFor = req.candidateId;
    const resp: VoteResp = { type: 'raft_vote_resp', term: this.currentTerm, voteGranted: grant, fromId: this.agentId };
    this.messaging.send(from, resp as unknown as Record<string, unknown>);
  }

  private onVoteResp(resp: VoteResp) {
    if (resp.term > this.currentTerm) { this.currentTerm = resp.term; this.state = 'Follower'; return; }
    if (this.state !== 'Candidate') return;
    if (resp.voteGranted) {
      this.votes.add(resp.fromId);
      const majority = Math.floor((this.messaging.getPeers().length + 1) / 2) + 1;
      if (this.votes.size >= majority) this.becomeLeader();
    }
  }

  private becomeLeader() {
    if (this.electionTimer) clearTimeout(this.electionTimer);
    this.state = 'Leader';
    this.leaderId = this.agentId;
    this.hbTimer = setInterval(() => {
      const hb: AppendReq = { type: 'raft_append', term: this.currentTerm, leaderId: this.agentId, leaderCommit: this.commitIndex };
      this.messaging.getPeers().forEach((p) => this.messaging.send(p, hb as unknown as Record<string, unknown>));
    }, HB_INTERVAL);
  }

  private onAppend(req: AppendReq) {
    if (req.term < this.currentTerm) return;
    if (this.hbTimer) { clearInterval(this.hbTimer); this.hbTimer = null; }
    this.currentTerm = req.term;
    this.state = 'Follower';
    this.leaderId = req.leaderId;
    this.commitIndex = req.leaderCommit;
    this.resetElectionTimer();
  }
}
