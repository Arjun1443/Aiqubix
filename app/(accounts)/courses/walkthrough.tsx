"use client";

import { useEffect, useState } from "react";

export function Walkthrough({ steps }: { steps: string[] }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (active + 1 >= steps.length) setPlaying(false);
      else setActive(active + 1);
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [active, playing, steps.length]);

  return (
    <figure className="lesson-walkthrough">
      <figcaption className="lesson-small-heading">Walk through the idea</figcaption>
      <ol className="lesson-steps">
        {steps.map((step, index) => (
          <li key={step} aria-current={active === index ? "step" : undefined}>
            <button type="button" onClick={() => { setPlaying(false); setActive(index); }}>
              <span aria-hidden="true">{index + 1}</span>{step}
            </button>
          </li>
        ))}
      </ol>
      <button className="academy-button academy-button-secondary" type="button" onClick={() => {
        if (!playing && active === steps.length - 1) setActive(0);
        setPlaying(!playing);
      }}>{playing ? "Pause walkthrough" : "Play walkthrough"}</button>
    </figure>
  );
}
