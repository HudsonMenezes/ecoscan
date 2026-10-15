import { useState } from 'react';
import { strings } from '@/config/strings';
import { ImageIcon } from './icons';

type ImageDropZoneProps = {
  onFile: (file: File) => void;
  disabled?: boolean;
  // `button`: botão compacto (celular). `dropzone`: área grande que aceita arrastar e soltar (computador).
  variant: 'button' | 'dropzone';
  // Destaque quando enviar arquivo é o único caminho (sem câmera).
  prominent?: boolean;
};

export function ImageDropZone({ onFile, disabled, variant, prominent }: ImageDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (file) onFile(file);
  }

  const dropHandlers =
    variant === 'dropzone' && !disabled
      ? {
          onDragOver: (event: React.DragEvent) => {
            event.preventDefault();
            setDragging(true);
          },
          onDragLeave: () => setDragging(false),
          onDrop: (event: React.DragEvent) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) onFile(file);
          },
        }
      : {};

  const base = variant === 'dropzone' ? 'dropzone' : 'action-button';
  const tone = prominent ? `${base}--green` : `${base}--secondary`;
  const className = `${base} ${tone}${dragging ? ' dropzone--active' : ''}`;

  return (
    <label className={className} {...dropHandlers}>
      <ImageIcon size={variant === 'dropzone' ? 48 : 32} />
      <span>{strings.camera.upload}</span>
      {variant === 'dropzone' && (
        <span className="dropzone__hint">
          {dragging ? strings.camera.dropActive : strings.camera.dropHint}
        </span>
      )}
      {/* Sem o atributo capture: o celular oferece câmera e galeria. */}
      <input
        type="file"
        accept="image/*"
        className="visually-hidden"
        disabled={disabled}
        onChange={handleChange}
      />
    </label>
  );
}
