export default function Whiteboard() {
  const section1 = [
    {
      title: "What the app already is",
      text: "A disciplined trading decision system, not a casual market chat tool. It checks whether the data is valid before it says anything meaningful.",
    },
    {
      title: "What it is not",
      text: "Not a prediction toy, not an always-chatty AI, and not something that should force a trade idea when conditions are weak.",
    },
    {
      title: "Why NO TRADE matters",
      text: "The system is supposed to say 'no trade' often. That is evidence of discipline, not failure.",
    },
    {
      title: "Contract-specific thinking",
      text: "Each contract is treated like a different market with different drivers. Oil is not read like bonds. Bonds are not read like the euro. The app should feel specialized, not generic.",
    },
    {
      title: "What the new feature adds",
      text: "A pre-market briefing layer called Watchman. Its job is to prepare the operator before live decision-making begins.",
    },
  ];

  const section2 = [
    {
      title: "1. Scheduler / Conductor",
      text: "Starts the pre-market process at the right time.",
    },
    {
      title: "2. Data Collector",
      text: "Pulls together overnight levels, prior day context, calendar risk, and cross-market signals.",
    },
    {
      title: "3. Brief Writer",
      text: "Turns facts into structured operator language, but does not freestyle.",
    },
    {
      title: "4. Internal Editor / Auditor",
      text: "Checks whether the brief is grounded in the actual data and follows the rules.",
    },
    {
      title: "5. Shared Thesis Library",
      text: "Keeps the morning brief aligned with the same logic the live trade engine uses later.",
    },
    {
      title: "6. Record Keeper",
      text: "Stores the run, the inputs, the brief, and the scores so the system keeps receipts.",
    },
  ];

  const designImplications = [
    "Preparation mode must feel different from live evaluation mode.",
    "'No trade' must feel valid and intentional, not empty.",
    "Show what the system sees, not just what it concludes.",
    "Make trigger conditions obvious so the operator knows when to ask for a live read.",
    "Build trust signals: validated, scored, saved.",
  ];

  return (
    <div className="min-h-screen bg-stone-100 p-6 md:p-10 text-stone-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-stone-500">Whiteboard Companion</div>
              <h1 className="text-3xl md:text-5xl font-semibold leading-tight mt-2">Sections 1 and 2 in Plain English</h1>
              <p className="mt-3 text-base md:text-lg text-stone-600 max-w-3xl">
                Use this while listening. It is built for a non-developer helping design the app.
              </p>
            </div>
            <div className="bg-amber-100 text-amber-900 rounded-2xl px-4 py-3 text-sm md:text-base font-medium">
              Core idea: this is a disciplined pre-market briefing system, not a generic AI market commentator.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Section 1</h2>
              <span className="text-sm rounded-full bg-stone-100 px-3 py-1 text-stone-600">What this product is</span>
            </div>
            <div className="mt-6 space-y-4">
              {section1.map((item, i) => (
                <div key={i} className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
                  <div className="text-lg font-semibold">{item.title}</div>
                  <div className="mt-2 text-stone-700 leading-7">{item.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Section 2</h2>
              <span className="text-sm rounded-full bg-stone-100 px-3 py-1 text-stone-600">How it works</span>
            </div>
            <div className="mt-6 space-y-4">
              {section2.map((item, i) => (
                <div key={i} className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
                  <div className="text-lg font-semibold">{item.title}</div>
                  <div className="mt-2 text-stone-700 leading-7">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
          <h2 className="text-2xl font-semibold">The actual workflow</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            {[
              "Gather facts",
              "Package market context",
              "Write the morning brief",
              "Validate and score it",
              "Operator watches for trigger, then asks for live evaluation",
            ].map((step, i) => (
              <div key={i} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 min-h-[120px] flex items-center justify-center text-base font-medium leading-6">
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
            <h2 className="text-2xl font-semibold">What the operator should get each morning</h2>
            <div className="mt-5 space-y-3">
              {[
                "What market structure matters today",
                "What conditions would activate a real thesis",
                "What warning signs mean hold back",
                "What should make the operator request a live read",
              ].map((item, i) => (
                <div key={i} className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-950 font-medium">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
            <h2 className="text-2xl font-semibold">Design implications</h2>
            <div className="mt-5 space-y-3">
              {designImplications.map((item, i) => (
                <div key={i} className="rounded-2xl bg-sky-50 border border-sky-200 p-4 text-sky-950 leading-7">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-stone-900 text-stone-50 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="text-sm uppercase tracking-[0.2em] text-stone-400">Bottom line</div>
          <div className="mt-3 text-2xl md:text-3xl font-semibold leading-tight max-w-5xl">
            Section 1 defines the product doctrine. Section 2 defines the machinery that turns that doctrine into a trustworthy pre-market briefing.
          </div>
        </div>
      </div>
    </div>
  );
}
