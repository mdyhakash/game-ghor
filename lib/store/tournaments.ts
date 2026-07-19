import {
  nextPowerOfTwo,
  type Tournament,
  type TournamentStatus,
  type Participant,
  type Match,
  type MatchStatus,
} from "@/lib/data";
import { KEYS, read, write, uid, isBrowser } from "./keys";
import { shuffle } from "./bookings";

// -----------------------------------------------------------------------
// Tournaments — public read functions (used by the /tournaments pages)
// and admin management (create tournament, add players, auto-generate a
// single-elimination bracket, and record match results as it progresses).
// -----------------------------------------------------------------------
export const DEMO_SEEDED_KEY = "levelup_demo_tournament_seeded";

/** One-time demo tournament so the /tournaments UI isn't empty on first
 * load. Runs at most once per browser (flagged in localStorage) and never
 * re-adds itself, so deleting/editing the demo data is safe. */
export function seedDemoTournamentIfNeeded() {
  if (!isBrowser()) return;
  if (window.localStorage.getItem(DEMO_SEEDED_KEY)) return;
  window.localStorage.setItem(DEMO_SEEDED_KEY, "1");

  const created = createTournament({
    name: "Valorant Clash — Season 1",
    gameTitle: "Valorant",
    maxPlayers: 8,
    entryFee: 200,
    prizePool: "৳5,000 + trophy",
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    description:
      "Demo tournament (seeded automatically) — 8-player single elimination bracket.",
  });
  if ("error" in created) return;

  const demoPlayers = [
    "Rafi",
    "Nabil",
    "Shuvo",
    "Tanvir",
    "Arif",
    "Mahin",
    "Fahim",
    "Rakib",
  ];
  for (const name of demoPlayers) {
    addParticipant(created.tournament.id, name);
  }
  generateFixture(created.tournament.id);
}

export function getTournaments() {
  seedDemoTournamentIfNeeded();
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const participants = read<Participant[]>(KEYS.participants, []);
  return tournaments
    .slice()
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )
    .map((t) => ({
      ...t,
      participantCount: participants.filter((p) => p.tournamentId === t.id)
        .length,
    }));
}

export function getTournamentDetail(id: string) {
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === id);
  if (!tournament) return null;

  const participants = read<Participant[]>(KEYS.participants, []).filter(
    (p) => p.tournamentId === id,
  );
  const nameOf = (pid: string | null) =>
    pid ? (participants.find((p) => p.id === pid)?.name ?? "Unknown") : null;

  const matches = read<Match[]>(KEYS.matches, [])
    .filter((m) => m.tournamentId === id)
    .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex)
    .map((m) => ({
      ...m,
      participantAName: nameOf(m.participantAId),
      participantBName: nameOf(m.participantBId),
      winnerName: nameOf(m.winnerId),
    }));

  const roundsCount =
    matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 0;
  const rounds = Array.from({ length: roundsCount }, (_, i) => ({
    round: i + 1,
    matches: matches.filter((m) => m.round === i + 1),
  }));

  return { tournament, participants, rounds };
}

export function createTournament(input: {
  name: string;
  gameTitle: string;
  maxPlayers: number;
  entryFee: number;
  prizePool: string;
  startDate: string;
  description: string;
}): { error: string } | { tournament: Tournament } {
  const {
    name,
    gameTitle,
    maxPlayers,
    entryFee,
    prizePool,
    startDate,
    description,
  } = input;
  if (!name.trim()) return { error: "Enter a tournament name" };
  if (![4, 8, 16, 32].includes(maxPlayers))
    return { error: "Max players must be 4, 8, 16, or 32" };
  if (!startDate) return { error: "Pick a start date" };

  const tournament: Tournament = {
    id: uid(),
    name: name.trim(),
    gameTitle: gameTitle.trim() || "Custom",
    maxPlayers,
    entryFee: entryFee || 0,
    prizePool: prizePool.trim(),
    startDate,
    description: description.trim(),
    status: "UPCOMING",
    createdAt: new Date().toISOString(),
  };

  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  write(KEYS.tournaments, [...tournaments, tournament]);
  return { tournament };
}

export function addParticipant(
  tournamentId: string,
  name: string,
  phone?: string,
): { error: string } | { participant: Participant } {
  if (!name.trim()) return { error: "Enter a player/team name" };

  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "UPCOMING")
    return { error: "Fixture already generated — can't add players now" };

  const participants = read<Participant[]>(KEYS.participants, []);
  const count = participants.filter(
    (p) => p.tournamentId === tournamentId,
  ).length;
  if (count >= tournament.maxPlayers) return { error: "Tournament is full" };

  const participant: Participant = {
    id: uid(),
    tournamentId,
    name: name.trim(),
    phone: phone?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  write(KEYS.participants, [...participants, participant]);
  return { participant };
}

export function removeParticipant(tournamentId: string, participantId: string) {
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (tournament && tournament.status !== "UPCOMING") return; // fixture already made — don't allow removal

  const participants = read<Participant[]>(KEYS.participants, []);
  write(
    KEYS.participants,
    participants.filter((p) => p.id !== participantId),
  );
}

/** Automatic fixture maker: randomly draws the current participants into a
 * single-elimination bracket, padding with byes up to the next power of two,
 * and auto-advances anyone who drew a bye straight into round 2. */
export function generateFixture(
  tournamentId: string,
): { error: string } | { ok: true } {
  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  if (!tournament) return { error: "Tournament not found" };

  const participants = read<Participant[]>(KEYS.participants, []).filter(
    (p) => p.tournamentId === tournamentId,
  );
  if (participants.length < 2)
    return { error: "Need at least 2 participants to generate a fixture" };

  const bracketSize = nextPowerOfTwo(participants.length);
  const totalRounds = Math.log2(bracketSize);

  // Random draw: shuffle participants, pad with byes, then shuffle again so
  // byes land in random slots instead of always at the end of the bracket.
  const shuffledIds = shuffle(participants.map((p) => p.id));
  const slots: (string | null)[] = [
    ...shuffledIds,
    ...Array(bracketSize - shuffledIds.length).fill(null),
  ];
  const shuffledSlots = shuffle(slots);

  const newMatches: Match[] = [];

  // Round 1 — real pairings (and byes)
  for (let i = 0; i < bracketSize / 2; i++) {
    const a = shuffledSlots[i * 2];
    const b = shuffledSlots[i * 2 + 1];
    const isBye = !a || !b;
    newMatches.push({
      id: uid(),
      tournamentId,
      round: 1,
      matchIndex: i,
      participantAId: a,
      participantBId: b,
      winnerId: isBye ? (a ?? b) : null,
      scoreA: null,
      scoreB: null,
      status: isBye ? "COMPLETED" : "PENDING",
    });
  }

  // Later rounds — empty placeholders, filled in as earlier rounds finish
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      newMatches.push({
        id: uid(),
        tournamentId,
        round,
        matchIndex: i,
        participantAId: null,
        participantBId: null,
        winnerId: null,
        scoreA: null,
        scoreB: null,
        status: "PENDING",
      });
    }
  }

  // Propagate round-1 byes straight into round 2
  if (totalRounds >= 2) {
    for (const m of newMatches.filter((m) => m.round === 1 && m.winnerId)) {
      const next = newMatches.find(
        (n) => n.round === 2 && n.matchIndex === Math.floor(m.matchIndex / 2),
      );
      if (next) {
        if (m.matchIndex % 2 === 0) next.participantAId = m.winnerId;
        else next.participantBId = m.winnerId;
      }
    }
  }

  // Replace any existing matches for this tournament with the fresh bracket
  const allMatches = read<Match[]>(KEYS.matches, []).filter(
    (m) => m.tournamentId !== tournamentId,
  );
  write(KEYS.matches, [...allMatches, ...newMatches]);

  write(
    KEYS.tournaments,
    tournaments.map((t) =>
      t.id === tournamentId
        ? { ...t, status: "ONGOING" as TournamentStatus }
        : t,
    ),
  );

  return { ok: true };
}

export function recordMatchResult(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  scoreA?: number,
  scoreB?: number,
): { error: string } | { ok: true } {
  const matches = read<Match[]>(KEYS.matches, []);
  const match = matches.find(
    (m) => m.id === matchId && m.tournamentId === tournamentId,
  );
  if (!match) return { error: "Match not found" };
  if (!match.participantAId || !match.participantBId)
    return { error: "Both players aren't set yet" };
  if (winnerId !== match.participantAId && winnerId !== match.participantBId) {
    return { error: "Winner must be one of the two players" };
  }

  let updated = matches.map((m) =>
    m.id === matchId
      ? {
          ...m,
          winnerId,
          status: "COMPLETED" as MatchStatus,
          scoreA: scoreA ?? null,
          scoreB: scoreB ?? null,
        }
      : m,
  );

  const tournaments = read<Tournament[]>(KEYS.tournaments, []);
  const tournament = tournaments.find((t) => t.id === tournamentId);
  const participantCount = read<Participant[]>(KEYS.participants, []).filter(
    (p) => p.tournamentId === tournamentId,
  ).length;
  const bracketSize =
    participantCount > 0 ? nextPowerOfTwo(participantCount) : 0;
  const totalRounds = bracketSize > 1 ? Math.log2(bracketSize) : 0;

  // Advance the winner into their next-round slot, if there is one
  if (match.round < totalRounds) {
    const nextRound = match.round + 1;
    const nextIndex = Math.floor(match.matchIndex / 2);
    updated = updated.map((m) => {
      if (
        m.tournamentId !== tournamentId ||
        m.round !== nextRound ||
        m.matchIndex !== nextIndex
      )
        return m;
      return match.matchIndex % 2 === 0
        ? { ...m, participantAId: winnerId }
        : { ...m, participantBId: winnerId };
    });
  }

  write(KEYS.matches, updated);

  // That was the final — the tournament is over
  if (match.round === totalRounds && tournament) {
    write(
      KEYS.tournaments,
      tournaments.map((t) =>
        t.id === tournamentId
          ? { ...t, status: "COMPLETED" as TournamentStatus }
          : t,
      ),
    );
  }

  return { ok: true };
}
