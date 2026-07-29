export function AgentCandidateProfile({ application }) {
  if (!application) return null

  const hasProfile =
    application.description ||
    application.message ||
    application.cvText ||
    application.cvFileName

  if (!hasProfile) return null

  return (
    <div className="agent-candidate-profile">
      <h4>Perfil do candidato</h4>
      {application.description ? (
        <div className="agent-candidate-block">
          <strong>Apresentação</strong>
          <p>{application.description}</p>
        </div>
      ) : application.message ? (
        <div className="agent-candidate-block">
          <strong>Mensagem</strong>
          <p>{application.message}</p>
        </div>
      ) : null}
      {application.cvText ? (
        <div className="agent-candidate-block">
          <strong>Currículo (texto)</strong>
          <pre className="agent-candidate-cv">{application.cvText}</pre>
        </div>
      ) : null}
      {application.cvFileName && application.cvFileData ? (
        <div className="agent-candidate-block">
          <strong>Currículo (ficheiro)</strong>
          <a className="button filter-button" href={application.cvFileData} download={application.cvFileName}>
            Descarregar {application.cvFileName}
          </a>
        </div>
      ) : null}
    </div>
  )
}
