export function ValidationSummary({ errors = [] }) {
  if (!errors.length) return null
  return (
    <div className="publish-validation panel-card" role="alert">
      <strong>Corrija os seguintes campos:</strong>
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  )
}
