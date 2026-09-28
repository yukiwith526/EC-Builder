import { useId, useState, type DragEvent, type ChangeEvent } from 'react'

interface Props {
  label: string
  value: string
  onChange: (dataUrl: string) => void
}

export function ImageField({ label, value, onChange }: Props) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const dataUrl = await readImageFile(file)
    onChange(dataUrl)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    void handleFiles(event.dataTransfer.files)
  }

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFiles(event.target.files)
    event.target.value = ''
  }

  return (
    <div className="image-field">
      <span>{label}</span>
      <label
        htmlFor={inputId}
        className={`image-drop ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {value ? <img src={value} alt="" /> : <p>ドラッグ&ドロップ、またはクリックして画像を追加</p>}
        <input id={inputId} type="file" accept="image/*" onChange={onInput} hidden />
      </label>
    </div>
  )
}

export async function readImageFile(file: File): Promise<string> {
  const raw = await fileToDataUrl(file)
  return compressImage(raw)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function compressImage(dataUrl: string, maxSize = 900): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.78))
    }
    image.onerror = () => resolve(dataUrl)
    image.src = dataUrl
  })
}
