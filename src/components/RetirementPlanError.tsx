export default function RetirementPlanError({message}:{message:string}) {
  const target = /Medicare|IRMAA/i.test(message) ? ["medicare-enabled", "Review Medicare settings. Confirm the assumptions only if they apply."]
    : /IRA MAGI|contribution/i.test(message) ? ["plan-ira-contributions-heading", "Review annual contributions. Strategy comparisons currently require no active contributions; do not change real assumptions merely to bypass a limitation."]
    : /basis|account|source|destination/i.test(message) ? ["account-editor-heading", "Review account types, owners and basis. Account nicknames do not determine their type."] : null;
  return <div role="alert" className="rounded-xl border border-rose-300 p-4 text-rose-700 dark:text-rose-300"><p>{message}</p>{target&&<a className="mt-2 block underline" href={`#${target[0]}`}>{target[1]}</a>}</div>;
}
