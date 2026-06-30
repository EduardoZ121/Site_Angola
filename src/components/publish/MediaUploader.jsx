import { useRef, useState } from 'react'

export function MediaUploader({ photos = [], coverIndex = 0, onChange, max = 8 }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function readFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, max - photos.length)
    if (!files.length) return
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(file)
          }),
      ),
    ).then((items) => {
      onChange([...photos, ...items].slice(0, max))
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  function removePhoto(index) {
    const next = photos.filter((_, i) => i !== index)
    const nextCover = coverIndex >= next.length ? 0 : coverIndex === index ? 0 : coverIndex > index ? coverIndex - 1 : coverIndex
    onChange(next, nextCover)
  }

  function movePhoto(index, direction) {
    const target = index + direction
    if (target < 0 || target >= photos.length) return
    const next = [...photos]
    ;[next[index], next[target]] = [next[target], next[index]]
    let nextCover = coverIndex
    if (coverIndex === index) nextCover = target
    else if (coverIndex === target) nextCover = index
    onChange(next, nextCover)
  }

  return (
    <div className="media-uploader">
      <div
        className={`media-dropzone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          readFiles(event.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
      >
        <p>Arraste fotografias para aqui ou clique para seleccionar</p>
        <span>Máximo {max} imagens • JPG ou PNG</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => readFiles(event.target.files)}
        />
      </div>

      {photos.length ? (
        <ul className="media-grid">
          {photos.map((photo, index) => (
            <li key={`${photo.slice(0, 24)}-${index}`} className={index === coverIndex ? 'is-cover' : ''}>
              <img src={photo} alt={`Foto ${index + 1}`} loading="lazy" />
              <div className="media-actions" onClick={(event) => event.stopPropagation()}>
                <button type="button" onClick={() => onChange(photos, index)}>
                  {index === coverIndex ? 'Capa' : 'Definir capa'}
                </button>
                <button type="button" onClick={() => movePhoto(index, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button type="button" onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1}>
                  ↓
                </button>
                <button type="button" className="danger" onClick={() => removePhoto(index)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
