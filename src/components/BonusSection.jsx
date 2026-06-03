export default function BonusSection({ bonusChallenges, bonusPicks, confirmed, onBonusPick }) {
  const activeChallenges = bonusChallenges.filter(c => c.active);

  if (activeChallenges.length === 0) {
    return (
      <div className="bonus-section empty">
        <div className="bonus-empty-icon">🎯</div>
        <p>No hay retos bonus activos por ahora.</p>
        <p className="muted">El administrador puede añadir nuevos retos en cualquier momento.</p>
      </div>
    );
  }

  return (
    <div className="bonus-section">
      <div className="bonus-header">
        <h3>Retos Bonus</h3>
        <p>Acerta estos retos para ganar puntos adicionales al final del torneo.</p>
      </div>

      <div className="bonus-grid">
        {activeChallenges.map(challenge => {
          const userPick = bonusPicks[challenge.id];
          const isResolved = challenge.resolved;
          const isCorrect = isResolved && userPick?.value?.toLowerCase().trim() === challenge.correct_value?.toLowerCase().trim();

          return (
            <div key={challenge.id} className={`bonus-card ${isResolved ? (isCorrect ? 'bonus-win' : 'bonus-lose') : ''}`}>
              <div className="bonus-card-header">
                <span className="bonus-points">+{challenge.points} pts</span>
                {isResolved && (
                  <span className={`bonus-result ${isCorrect ? 'correct' : 'wrong'}`}>
                    {isCorrect ? '✓ Correcto' : '✗ Incorrecto'}
                  </span>
                )}
              </div>
              <h4>{challenge.title}</h4>
              {challenge.description && <p className="bonus-desc">{challenge.description}</p>}

              {isResolved && challenge.correct_value && (
                <div className="bonus-answer">
                  Respuesta correcta: <strong>{challenge.correct_value}</strong>
                </div>
              )}

              {!isResolved && (
                <div className="bonus-input-area">
                  {challenge.deadline && (
                    <p className="bonus-deadline">
                      Límite: {new Date(challenge.deadline).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                  <input
                    type="text"
                    placeholder={challenge.type === 'player' ? 'Nombre del jugador...' : challenge.type === 'team' ? 'Nombre de la selección...' : 'Tu respuesta...'}
                    value={userPick?.value || ''}
                    onChange={e => onBonusPick(challenge.id, e.target.value)}
                    disabled={confirmed}
                    className="bonus-text-input"
                  />
                  {userPick?.value && !confirmed && (
                    <p className="bonus-saved">✓ Guardado: "{userPick.value}"</p>
                  )}
                </div>
              )}

              {isResolved && userPick?.value && (
                <div className="bonus-my-pick">Tu respuesta: <em>"{userPick.value}"</em></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
