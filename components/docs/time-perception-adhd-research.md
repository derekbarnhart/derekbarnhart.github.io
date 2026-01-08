# Time Perception and ADHD: Research Brief for Time Indicators

This brief summarizes empirical findings on human time perception and ADHD-related differences, then derives design principles and candidate strategies for glanceable, motivating time indicators that can replace or augment a standard digital clock.

## Scope and Methodology

- Objective: Distill robust psychological and HCI evidence to guide prototypes that convey passage of time and reduce “time blindness.”
- Databases: PubMed, Google Scholar, PsycINFO (psych/neuro), ACM Digital Library (HCI/UX).
- Time window: Foundational work and reviews through 2024.
- Keywords: “time perception,” “interval timing,” “prospective vs retrospective timing,” “attentional gate,” “scalar expectancy theory,” “ADHD time perception,” “temporal bisection,” “time reproduction,” “dopamine timing,” “delay discounting,” “ambient display,” “glanceable display,” “episodic future thinking.”
- Inclusion: Human studies or integrative reviews; seconds-to-minutes scale; ADHD studies with timing or temporal decision-making outcomes; HCI/UX work on ambient/peripheral displays.
- Exclusion: Non-human only; purely pharmacological without timing measures; single-case anecdotes; non-empirical blog/marketing.
- Evidence weighting: Meta-analyses/reviews > robust experimental studies > theory papers; HCI used to translate constraints into design patterns.

Limitations: This is a focused evidence scan, not a systematic review; references are exemplars anchoring design implications.

## Key Findings: Human Time Perception

- Internal clocks and scalar property: Seconds-to-minutes timing follows scalar variability (error proportional to interval). Pacemaker–accumulator models explain effects of arousal and attention.
- Prospective vs retrospective timing: When attending to time (prospective), diversion of attention shortens perceived duration; when judging after the fact (retrospective), richer memory traces lengthen perceived duration.
- Arousal and novelty: Elevated arousal can speed the internal clock (intervals feel longer). Oddball or novel events show duration expansion.
- Uncertainty growth: Noise increases with interval length; external cues and segmentation reduce estimation error.
- Entrainment and rhythm: Regular rhythms and continuous motion support temporal prediction and pacing, usable peripherally.

References: Gibbon (1977); Zakay & Block (1997); Eagleman (2008); Coull, Cheng & Meck (2011).

## ADHD-Specific Evidence

- Interval timing variability: ADHD groups show higher variability in time estimation, reproduction, and motor timing (e.g., tapping), particularly in seconds-range tasks and under executive load.
- Neurocognitive links: Differences implicate fronto-striatal circuits and dopaminergic modulation; stimulants can partially normalize activation patterns in timing tasks.
- Attention and gate control: Reduced sustained attention/distractibility predict larger prospective timing errors (fewer “clock samples” through the attentional gate).
- Delay aversion and present bias: Preference for immediacy underweights future outcomes and deadlines, affecting pacing and planning.
- Prospective memory: Time-based prospective memory is more fragile; externalization and salient cues improve adherence.

References: Noreika, Falter & Rubia (2013); Sonuga‑Barke (2002); Coull, Cheng & Meck (2011); Eagleman (2008).

## Design Principles for Time Indicators

- Externalize time: Keep time visible/persistent to offload working memory and reduce self-prompting.
- Peripheral, low-effort: Favor continuous motion and simple shape change over numerals; readable at a glance.
- Multi-scale redundancy: Combine absolute time with relative time and chunk markers; support seconds→minutes→hours via concentric or stacked encodings.
- Segment and anchor: Subdivide intervals and show upcoming anchors (meetings/breaks) as spatial landmarks.
- Salience without overload: Use restrained color/motion; gentle rhythms/haptics; avoid strobing/high frequency.
- Predictive transparency: Show ETA and uncertainty bands; indicate ahead/behind status for pacing.
- Motivation-aware: Use goal-gradient and loss framing ethically; avoid deceptive progress illusions.

Grounding: attentional gate + scalar variability (need continuous, low-load cues); present bias/delay aversion (salient near-term markers); arousal/novelty (sparingly to resist habituation).

## Strategy Catalog to Convey Passage of Time

- Shrinking resource: Draining ring/bar/stacked tokens to make time depletion salient.
- Continuous motion: A hand/orbiter completing revolutions per interval; angular position maps to elapsed time.
- Concentric rings: Outer day, inner hour, inner-most minutes; ticks for upcoming anchors.
- Chunk markers: Subdivision ticks (e.g., 5-min) with subtle micro-pulses at boundaries.
- Color temperature shift: Slow cool→warm gradient across an interval; urgency tiers near end.
- Rhythm and haptics: Gentle metronome or low-amplitude haptics at fixed/adaptive intervals.
- Event-aligned countdowns: Tiles attached to calendar anchors with filling/emptying arcs.
- ETA with confidence: Progress with ± uncertainty shading to calibrate expectations.
- Episodic future cues: Tiny vignettes/icons cue the “after” state to reduce discounting.
- Reflective estimation: Quick pre-task estimate and post-task feedback for calibration.

Evidence links: continuous/peripheral cues (Zakay & Block; Eagleman), multi-scale/chunking (scalar variability), goal gradients/loss framing (behavioral econ), episodic future thinking (discounting), entrainment (timing accuracy).

## Prototype Concepts (for Implementation)

- Time Ring (1–60 min): Circular ring drains; 12 ticks; optional 5‑min micro‑pulse; color shifts across urgency zones. Variant: multi‑ring (hours/minutes).
  - Emphasizes: shrinking resource, continuous motion, chunk markers, color temperature shift.
  - Required info (to implement):
    - Interval spec: `duration` (s/min) and `mode` (countdown or elapsed) with `startTime` or `endTime`.
    - Chunking: `chunkSize` (1/2/5 min), tick density, whether to micro‑pulse on chunk boundaries.
    - Visuals: ring size/thickness, colors and thresholds (e.g., warn at 20%, danger at 10%), label style for optional numeric time.
    - Motion: sweep angle mapping (`angle = 360 * elapsed/duration`), update cadence (~10–15 Hz logical; 60 FPS CSS transform), reduced‑motion fallback (discrete ticks only).
    - Cues: optional boundary pulse (CSS scale/opacity), subtle sound/haptic toggles.
    - API: start/pause/reset methods; properties as attributes for a Web Component.

- Orbit Clock: Dot orbits once per interval (e.g., 25 min); periphery‑friendly movement; optional lap counter.
  - Emphasizes: continuous motion, chunk markers (sector ticks), rhythm (micro‑pulse each lap).
  - Required info (to implement):
    - Orbit spec: `period` (s/min), `startTime`, and `phase` handling across pauses/resumes.
    - Ticks: major/minor sectors (e.g., 12 majors, 60 minors), optional glow on crossing.
    - Visuals: orbit radius, dot size/contrast, background ring style, lap counter placement.
    - Motion: angular velocity (`deg/s = 360/period`), easing (linear), update cadence and reduced‑motion fallback (jump per tick).
    - Cues: micro‑pulse or soft tick at 0°; user toggles for audio/haptics.
    - API: start/stop/reset; readable `lapsCompleted` state.

- Token Stack: 12 tokens for 5‑min blocks; tokens “drop” with a soft tick; user can allocate tokens to tasks.
  - Emphasizes: shrinking resource, chunk markers, goal‑gradient/visible depletion.
  - Required info (to implement):
    - Token spec: `tokens` count and `tokenDuration` (e.g., 12 × 5 min), depletion order (top→bottom or right→left).
    - Allocation: optional mapping of tokens → sub‑tasks (labels/colors), editable or read‑only.
    - Timing: schedule for token removal tied to wall time vs manual step; resume behavior after pause.
    - Visuals: token shape (pill/circle), spacing, colors for remaining/used/current.
    - Cues: subtle drop animation, boundary tick, optional haptic/audio.
    - API: set/get allocation, manual consume/undo, emit events on token transitions.

- Sandglass Field: Particle “sand” flows top→bottom; flow rate encodes remaining fraction; gust pulses at chunk boundaries.
  - Emphasizes: shrinking resource, continuous motion/flow, chunk boundary salience.
  - Required info (to implement):
    - Interval spec: `duration`, `startTime`/`endTime`, countdown or elapsed.
    - Simulation: particle count (performance cap), flow mapping (`particlesActive ∝ remaining`), gravity path (linear/curved), boundary gust magnitude.
    - Visuals: container size, sand color(s)/gradient, occlusion/fade for depth cue.
    - Performance: target FPS and graceful degradation (reduce particles, switch to CSS mask) plus reduced‑motion fallback to linear bar.
    - Cues: boundary gust at each chunk, warn/danger tinting near end.
    - API: start/pause/reset; quality preset attribute.

- Ladder Progress + Checkpoints: Horizontal bar with subgoal rungs; ETA + uncertainty ribbon.
  - Emphasizes: chunk markers, ETA with confidence, segment & anchor.
  - Required info (to implement):
    - Progress model: `duration` or dynamic `progress` input (0–1), method for ETA (`ETA = now + (1−p)/p * elapsed` or task‑provided).
    - Uncertainty: variance estimate or heuristic (scalar property: SD ∝ interval), render as band around progress.
    - Rungs: positions/labels for subgoals (array of fractions or times), ahead/behind thresholds.
    - Visuals: bar dimensions, rung style, status colors (ahead/neutral/behind).
    - Cues: light-up on rung crossing; optional gentle nudge when behind trajectory.
    - API: set rungs, supply progress or let component track via `startTime`/`duration`.

- Temperature Bar: Thin background strip warms over interval; unobtrusive until near limit.
  - Emphasizes: color temperature shift, peripheral low‑effort cue, urgency tiers.
  - Required info (to implement):
    - Interval spec: `duration`, `startTime`/`endTime`.
    - Color mapping: gradient stops (cool→neutral→warm) with thresholds (e.g., <20%, 20–80%, >80%).
    - Placement: inline, page edge, or as component background; thickness and contrast targets (WCAG‑friendly).
    - Motion: optional subtle shimmer; reduced‑motion default to color‑only.
    - Cues: escalate saturation in final N% (configurable), optional end‑pulse.
    - API: attributes for thresholds, palette, and orientation.

- Beat Pacer: Soft audio/haptic beat that accelerates in last 10% to prompt wrap‑up.
  - Emphasizes: rhythm/haptics, chunk boundaries, arousal modulation (gentle).
  - Required info (to implement):
    - Tempo spec: base `interval` between beats (e.g., 60 s / chunk or 2 s cadence), acceleration curve for final zone.
    - Modalities: audio tone (frequency/volume), haptic pattern (intensity/duration); platform capability detection and user consent.
    - Scheduling: clock‑aligned beats vs relative to start; drift correction.
    - Controls: enable/disable per modality, quiet hours, do‑not‑disturb awareness.
    - Accessibility: default off in reduced‑motion/sound‑sensitive modes; configurable ceilings.
    - API: start/stop, set tempo/curve, events for beat fired.

- Concentric Day Planner: Outer 12h ring with anchors; inner 60‑min sweep; center shows next anchor countdown.
  - Emphasizes: concentric rings (multi‑scale redundancy), segment & anchor, event‑aligned countdowns.
  - Required info (to implement):
    - Timebase: current `now`, timezone, 12/24h configuration, day start.
    - Data: list of calendar events (start/end, type, color), and policy for overlapping events.
    - Rings: scales for day/hour/minute, tick density, sweep behavior for the current hour.
    - Visuals: ring sizes, label density, anchor markers (icons/labels), contrast in dark/light.
    - Cues: pre‑anchor warnings (e.g., 5/2/0 min), micro‑pulses at hour transitions.
    - API: method to inject/update events, navigate days, and sync to system clock.

All can be shipped as Web Components (SVG/CSS transforms) with configurable interval length, chunk size, and cue intensity.

## Evaluation Plan (Lean, Iterative)

- Tasks: Time‑boxed work bouts (10–30 min), on‑time starts for scheduled anchors, simple prospective memory probes.
- Design: Within‑subject crossover; include adults with self‑reported ADHD and neurotypical controls.
- Metrics: Start latency, overrun rate, estimation error, subjective workload (NASA‑TLX), helpfulness, distraction.
- Instrumentation: Passive glance logging and cue interactions; micro‑surveys; opt‑in haptic/audio toggles.
- Analysis: Compare indicators vs baseline digital clock; analyze heterogeneity (e.g., stronger discounting → token designs).

## Limitations and Considerations

- Heterogeneity: ADHD presentations differ; allow personalization of cue intensity/frequency.
- Sensory sensitivity: Provide strong accessibility controls; avoid flicker; support high contrast.
- Habituation: Rotate minor visuals or allow user-selected novelty to maintain salience.
- Ethics: Be transparent about ETA uncertainty; avoid manipulative progress illusions.

## References

- Gibbon, J. (1977). Scalar expectancy theory and Weber’s law in time. Psychological Review, 84(3), 279–325. https://doi.org/10.1037/0033-295X.84.3.279
- Zakay, D., & Block, R. A. (1997). Prospective and retrospective duration judgments: An executive-control perspective. Acta Psychologica, 96(2–3), 273–298. https://doi.org/10.1016/S0001-6918(97)00023-6
- Eagleman, D. M. (2008). Human time perception and its illusions. Current Opinion in Neurobiology, 18(2), 131–136. https://doi.org/10.1016/j.conb.2008.06.002
- Coull, J. T., Cheng, R.-K., & Meck, W. H. (2011). Neuroanatomical and neurochemical substrates of timing. Neuropsychopharmacology, 36(1), 3–25. https://doi.org/10.1038/npp.2010.113
- Noreika, V., Falter, C. M., & Rubia, K. (2013). Timing deficits in attention-deficit/hyperactivity disorder (ADHD): Evidence from neurocognitive and neuroimaging studies. Neuroscience & Biobehavioral Reviews, 37(2), 224–238. https://doi.org/10.1016/j.neubiorev.2012.11.007
- Sonuga‑Barke, E. J. S. (2002). Psychological models of ADHD. Psychological Bulletin, 128(1), 58–81. https://doi.org/10.1037/0033-2909.128.1.58
- Peters, J., & Büchel, C. (2010). Episodic future thinking reduces reward delay discounting through an enhancement of prefrontal–mediotemporal interactions. PNAS, 107(15), 6329–6334. https://doi.org/10.1073/pnas.0911180107
- Weiser, M., & Brown, J. S. (1996). Designing Calm Technology. Xerox PARC essay. https://calmtech.com/
- Pousman, Z., & Stasko, J. (2006). A taxonomy of ambient information systems: Four design dimensions. In Proceedings of AVI ’06, 67–74. https://doi.org/10.1145/1133265.1133277

## Appendix: Source Selection Notes

- Prioritized integrative reviews and well-cited theory papers to maximize signal and generalizability.
- Included ADHD timing reviews that synthesize behavioral and imaging evidence (Noreika et al.).
- Incorporated behavioral economics evidence (delay discounting, episodic future thinking) to address motivational aspects of time blindness.
- Selected HCI work on ambient/peripheral displays to translate cognitive constraints into UI design patterns.
- Considered but deprioritized: pharmacological studies without timing outcomes; non-human models without converging human evidence; single-case reports.
