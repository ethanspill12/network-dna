interface AttackLabProps {
  onExit: () => void
  onStartC2: () => void
}

const scenarios = [
  {
    id: 'c2',
    index: '01',
    title: 'C2 BEACONING',
    description: 'Observe how unusually regular outbound communication can alter a network fingerprint.',
    status: 'AVAILABLE',
    available: true,
  },
  {
    id: 'scan',
    index: '02',
    title: 'PORT SCAN',
    description: 'Explore rapid connection attempts across multiple network services.',
    status: 'COMING SOON',
    available: false,
  },
  {
    id: 'exfiltration',
    index: '03',
    title: 'DATA EXFILTRATION',
    description: 'Examine unusual outbound data volume and destination changes.',
    status: 'COMING SOON',
    available: false,
  },
]

export function AttackLab({ onExit, onStartC2 }: AttackLabProps) {
  return (
    <main className="attack-lab">
      <header className="site-header attack-lab-header">
        <button className="back-button" type="button" onClick={onExit}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.5 4-6 6 6 6M7 10h9" /></svg>
          <span>RETURN TO NETWORK DNA</span>
        </button>
        <div className="capture-name attack-lab-mode"><span className="status-dot" />SIMULATION / EDUCATIONAL MODE</div>
      </header>

      <section className="attack-lab-stage" aria-labelledby="attack-lab-title">
        <div className="attack-lab-copy">
          <span className="section-index">ATTACK LAB / CONTROLLED SIMULATION</span>
          <h1 id="attack-lab-title">LEARN THE<br />PATTERN.</h1>
          <p>See how behavior worth investigating changes Network DNA—without generating real network traffic.</p>
        </div>

        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <article key={scenario.id} className={`scenario-card ${scenario.available ? 'is-available' : 'is-disabled'}`}>
              <div className="scenario-meta"><span>{scenario.index}</span><strong>{scenario.status}</strong></div>
              <h2>{scenario.title}</h2>
              <p>{scenario.description}</p>
              <button type="button" disabled={!scenario.available} onClick={scenario.available ? onStartC2 : undefined}>
                {scenario.available ? 'RUN SAFE SIMULATION' : 'NOT YET AVAILABLE'}
                {scenario.available && <span aria-hidden="true">→</span>}
              </button>
            </article>
          ))}
        </div>

        <div className="simulation-disclaimer">
          <span>SAFE LAB ENVIRONMENT</span>
          This scenario replays deterministic in-app data. It does not create traffic, contact an external host, or prove malware activity.
        </div>
      </section>
    </main>
  )
}
