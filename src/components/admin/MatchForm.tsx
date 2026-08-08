import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { z } from "zod";
import { cn, formatMatchDate } from "../../lib/utils";
import type { MatchInput } from "../../services/matches";
import type { TableRow } from "../../types/database";

type Player = TableRow<"players">;
type Course = TableRow<"courses">;

const detailsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a match date."),
  courseId: z.string().uuid("Choose a course."),
  holes: z.union([z.literal(9), z.literal(18)]),
  teamSize: z.union([z.literal(1), z.literal(2)]),
});

function scoreLabel(value: MatchInput) {
  if (value.scoreType === "PUSH") return "PUSH";
  if (value.scoreType === "UP") return `${value.scoreValue ?? ""}UP`;
  return `${value.scoreValue ?? ""}&${value.holesRemaining ?? ""}`;
}

function validateTeams(value: MatchInput) {
  if (
    value.team1PlayerIds.length !== value.teamSize ||
    value.team2PlayerIds.length !== value.teamSize ||
    [...value.team1PlayerIds, ...value.team2PlayerIds].some((id) => !id)
  ) {
    return `Choose exactly ${value.teamSize} player${value.teamSize === 1 ? "" : "s"} for each team.`;
  }
  const allPlayers = [...value.team1PlayerIds, ...value.team2PlayerIds];
  if (new Set(allPlayers).size !== allPlayers.length) {
    return "Each player can appear only once in a match.";
  }
  return "";
}

function validateResult(value: MatchInput) {
  if (value.team1Result === "PUSH") {
    return value.scoreType === "PUSH" ? "" : "A pushed match must use a PUSH score.";
  }
  if (value.scoreType === "PUSH") return "Choose a winning score for a match with a winner.";
  if (!value.scoreValue || value.scoreValue < 1 || value.scoreValue > value.holes) {
    return `The leading score must be between 1 and ${value.holes}.`;
  }
  if (!Number.isInteger(value.scoreValue)) {
    return "The winning margin must be a whole number.";
  }
  if (value.scoreType === "UP" && value.holesRemaining !== null) {
    return "An UP score cannot include holes remaining.";
  }
  if (
    value.scoreType === "HOLES_UP" &&
    (!value.holesRemaining ||
    !Number.isInteger(value.holesRemaining) ||
    value.holesRemaining >= value.holes ||
      value.scoreValue <= value.holesRemaining)
  ) {
    return `For a holes-up score, holes remaining must be below ${value.holes} and less than the winning margin.`;
  }
  return "";
}

function SegmentedButton({
  selected,
  children,
  onClick,
  disabled = false,
}: {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "button min-w-0 flex-1 border px-3",
        selected ? "border-fairway-900 bg-fairway-900 text-white" : "bg-white text-fairway-900",
      )}
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="mb-5 grid grid-cols-4 gap-2" aria-label="Match entry progress">
      {["Details", "Teams", "Result", "Review"].map((label, index) => (
        <li key={label} className="min-w-0" aria-current={index + 1 === step ? "step" : undefined}>
          <span className={cn("block h-1.5 rounded-full", index + 1 <= step ? "bg-fairway-700" : "bg-fairway-100")} />
          <span className={cn("mt-2 block truncate text-[0.65rem] font-bold uppercase tracking-wide", index + 1 === step ? "text-fairway-800" : "text-slate-400")}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function MatchForm({
  initialValue,
  players,
  courses,
  submitLabel,
  isSubmitting,
  submissionError,
  onSubmit,
}: {
  initialValue: MatchInput;
  players: Player[];
  courses: Course[];
  submitLabel: string;
  isSubmitting: boolean;
  submissionError: string;
  onSubmit: (value: MatchInput) => void;
}) {
  const [step, setStep] = useState(1);
  const [value, setValue] = useState(initialValue);
  const [stepError, setStepError] = useState("");
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (step > 1) stepHeadingRef.current?.focus();
  }, [step]);

  function update(patch: Partial<MatchInput>) {
    setValue((current) => ({ ...current, ...patch }));
    setStepError("");
  }

  function next() {
    let error = "";
    if (step === 1) {
      const result = detailsSchema.safeParse(value);
      error = result.success ? "" : (result.error.issues[0]?.message ?? "Complete the match details.");
    } else if (step === 2) {
      error = validateTeams(value);
    } else if (step === 3) {
      error = validateResult(value);
    }

    if (error) {
      setStepError(error);
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function submit() {
    const details = detailsSchema.safeParse(value);
    if (!details.success) {
      setStep(1);
      setStepError(details.error.issues[0]?.message ?? "Complete the match details.");
      return;
    }
    const teamsError = validateTeams(value);
    if (teamsError) {
      setStep(2);
      setStepError(teamsError);
      return;
    }
    const resultError = validateResult(value);
    if (resultError) {
      setStep(3);
      setStepError(resultError);
      return;
    }
    onSubmit(value);
  }

  function selectTeamSize(teamSize: 1 | 2) {
    update({
      teamSize,
      team1PlayerIds: value.team1PlayerIds.slice(0, teamSize),
      team2PlayerIds: value.team2PlayerIds.slice(0, teamSize),
    });
  }

  function setWinner(winner: 0 | 1 | 2) {
    if (winner === 0) {
      update({
        team1Result: "PUSH",
        team2Result: "PUSH",
        scoreType: "PUSH",
        scoreValue: null,
        holesRemaining: null,
      });
    } else {
      update({
        team1Result: winner === 1 ? "WIN" : "LOSS",
        team2Result: winner === 2 ? "WIN" : "LOSS",
        scoreType: value.scoreType === "PUSH" ? "UP" : value.scoreType,
        scoreValue: value.scoreValue ?? 1,
        holesRemaining: value.scoreType === "HOLES_UP" ? (value.holesRemaining ?? 1) : null,
      });
    }
  }

  function setPlayer(team: 1 | 2, index: number, playerId: string) {
    const key = team === 1 ? "team1PlayerIds" : "team2PlayerIds";
    const nextPlayers = [...value[key]];
    nextPlayers[index] = playerId;
    update({ [key]: nextPlayers });
  }

  const selectedIds = new Set([...value.team1PlayerIds, ...value.team2PlayerIds].filter(Boolean));
  const playerName = (id: string) => players.find((player) => player.id === id)?.name ?? "Unknown player";
  const course = courses.find((item) => item.id === value.courseId);

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator step={step} />
      <div className="card">
        {step === 1 && (
          <section aria-labelledby="match-details-title">
            <h2 ref={stepHeadingRef} tabIndex={-1} id="match-details-title" className="text-xl font-extrabold">Match details</h2>
            <div className="mt-5 space-y-5">
              <label className="block text-sm font-bold" htmlFor="match-date">
                Date
                <input id="match-date" type="date" className="control mt-2" value={value.date} onChange={(event) => update({ date: event.target.value })} />
              </label>
              <label className="block text-sm font-bold" htmlFor="match-course">
                Course
                <select id="match-course" className="control mt-2" value={value.courseId} onChange={(event) => update({ courseId: event.target.value })}>
                  <option value="">Choose a course</option>
                  {courses.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.location}</option>)}
                </select>
              </label>
              <fieldset>
                <legend className="text-sm font-bold">Holes</legend>
                <div className="mt-2 flex gap-2">
                  {[9, 18].map((holes) => <SegmentedButton key={holes} selected={value.holes === holes} onClick={() => update({ holes: holes as 9 | 18 })}>{holes}</SegmentedButton>)}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-bold">Format</legend>
                <div className="mt-2 flex gap-2">
                  <SegmentedButton selected={value.teamSize === 1} onClick={() => selectTeamSize(1)}>1v1</SegmentedButton>
                  <SegmentedButton selected={value.teamSize === 2} onClick={() => selectTeamSize(2)} disabled={players.length < 4}>2v2</SegmentedButton>
                </div>
                {players.length < 4 && <p className="mt-2 text-xs text-slate-500">Add four players to enable 2v2.</p>}
              </fieldset>
            </div>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="teams-title">
            <h2 ref={stepHeadingRef} tabIndex={-1} id="teams-title" className="text-xl font-extrabold">Choose teams</h2>
            <p className="mt-2 text-sm text-slate-600">Each player can be selected only once.</p>
            {([1, 2] as const).map((team) => {
              const ids = team === 1 ? value.team1PlayerIds : value.team2PlayerIds;
              return (
                <fieldset key={team} className="mt-5">
                  <legend className="eyebrow">Team {team}</legend>
                  <div className="mt-2 space-y-2">
                    {Array.from({ length: value.teamSize }, (_, index) => (
                      <label key={index} className="block">
                        <span className="sr-only">Team {team} player {index + 1}</span>
                        <select className="control" value={ids[index] ?? ""} onChange={(event) => setPlayer(team, index, event.target.value)}>
                          <option value="">Choose player {index + 1}</option>
                          {players.map((player) => (
                            <option key={player.id} value={player.id} disabled={selectedIds.has(player.id) && ids[index] !== player.id}>
                              {player.name} · {player.elo_rating} ELO
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="result-title">
            <h2 ref={stepHeadingRef} tabIndex={-1} id="result-title" className="text-xl font-extrabold">Result</h2>
            <fieldset className="mt-5">
              <legend className="text-sm font-bold">Winner</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <SegmentedButton selected={value.team1Result === "WIN"} onClick={() => setWinner(1)}>Team 1</SegmentedButton>
                <SegmentedButton selected={value.team2Result === "WIN"} onClick={() => setWinner(2)}>Team 2</SegmentedButton>
                <SegmentedButton selected={value.team1Result === "PUSH"} onClick={() => setWinner(0)}>Push</SegmentedButton>
              </div>
            </fieldset>
            {value.team1Result !== "PUSH" && (
              <>
                <fieldset className="mt-5">
                  <legend className="text-sm font-bold">Score format</legend>
                  <div className="mt-2 flex gap-2">
                    <SegmentedButton selected={value.scoreType === "UP"} onClick={() => update({ scoreType: "UP", scoreValue: value.scoreValue ?? 1, holesRemaining: null })}>UP / 1UP</SegmentedButton>
                    <SegmentedButton selected={value.scoreType === "HOLES_UP"} onClick={() => update({ scoreType: "HOLES_UP", scoreValue: Math.max(value.scoreValue ?? 2, 2), holesRemaining: value.holesRemaining ?? 1 })}>Holes up / 2&amp;1</SegmentedButton>
                  </div>
                </fieldset>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <label className="block text-sm font-bold" htmlFor="score-value">
                    {value.scoreType === "UP" ? "Winning margin" : "Holes up"}
                    <input id="score-value" type="number" inputMode="numeric" min="1" max={value.holes} step="1" className="control mt-2" value={value.scoreValue ?? ""} onChange={(event) => update({ scoreValue: event.target.value ? Number(event.target.value) : null })} />
                  </label>
                  {value.scoreType === "HOLES_UP" && (
                    <label className="block text-sm font-bold" htmlFor="holes-remaining">
                      Holes remaining
                      <input id="holes-remaining" type="number" inputMode="numeric" min="1" max={value.holes - 1} step="1" className="control mt-2" value={value.holesRemaining ?? ""} onChange={(event) => update({ holesRemaining: event.target.value ? Number(event.target.value) : null })} />
                    </label>
                  )}
                </div>
              </>
            )}
            {value.team1Result === "PUSH" && (
              <p className="mt-5 rounded-xl bg-fairway-50 px-4 py-3 text-sm font-semibold text-fairway-800">
                Push selected. The score will be recorded as PUSH.
              </p>
            )}
          </section>
        )}

        {step === 4 && (
          <section aria-labelledby="review-title">
            <div className="flex items-center gap-2 text-fairway-700"><Check aria-hidden="true" size={18} /><p className="eyebrow">Ready to save</p></div>
            <h2 ref={stepHeadingRef} tabIndex={-1} id="review-title" className="mt-2 text-2xl font-extrabold">Review match</h2>
            <dl className="mt-5 divide-y rounded-xl border px-4">
              <div className="flex justify-between gap-4 py-3"><dt className="text-sm text-slate-500">Course</dt><dd className="text-right font-bold">{course?.name ?? "Unknown course"}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-sm text-slate-500">Date</dt><dd className="text-right font-bold">{formatMatchDate(value.date, "MMMM d, yyyy")}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-sm text-slate-500">Format</dt><dd className="text-right font-bold">{value.holes} holes · {value.teamSize}v{value.teamSize}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-sm text-slate-500">Team 1</dt><dd className="text-right font-bold">{value.team1PlayerIds.map(playerName).join(" + ")}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-sm text-slate-500">Team 2</dt><dd className="text-right font-bold">{value.team2PlayerIds.map(playerName).join(" + ")}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-sm text-slate-500">Result</dt><dd className="text-right font-bold">{value.team1Result === "PUSH" ? "Push" : value.team1Result === "WIN" ? "Team 1 wins" : "Team 2 wins"} · {scoreLabel(value)}</dd></div>
            </dl>
            <p className="mt-4 rounded-xl bg-trophy-100/60 px-4 py-3 text-sm leading-6 text-trophy-700">
              This backend does not expose a safe rating preview. ELO effects will be calculated atomically when the match is saved.
            </p>
            {submissionError && <p className="mt-4 text-sm font-semibold text-red-700" role="alert">{submissionError}</p>}
          </section>
        )}

        {stepError && <p className="mt-4 text-sm font-semibold text-red-700" role="alert">{stepError}</p>}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button className="button-secondary px-3 sm:px-5" type="button" onClick={() => { setStep((current) => current - 1); setStepError(""); }} disabled={isSubmitting}>
              <ArrowLeft aria-hidden="true" size={18} />Back
            </button>
          ) : <span />}
          {step < 4 ? (
            <button className="button-primary px-3 sm:px-5" type="button" onClick={next}>
              Continue<ArrowRight aria-hidden="true" size={18} />
            </button>
          ) : (
            <button className="button-primary px-3 sm:px-5" type="button" onClick={submit} disabled={isSubmitting}>
              <Save aria-hidden="true" size={18} />{isSubmitting ? "Saving…" : submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
