import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { strings } from '@/config/strings';
import { ImageDropZone } from './ImageDropZone';

function photo(name = 'foto.jpg') {
  return new File(['x'], name, { type: 'image/jpeg' });
}

describe('ImageDropZone', () => {
  it('escolher um arquivo chama onFile', async () => {
    const onFile = vi.fn();
    render(<ImageDropZone variant="button" onFile={onFile} />);
    const file = photo();

    await userEvent.upload(screen.getByLabelText(strings.camera.upload), file);

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('no modo dropzone, arrastar destaca a área e soltar entrega o arquivo', () => {
    const onFile = vi.fn();
    render(<ImageDropZone variant="dropzone" onFile={onFile} />);
    const zone = screen.getByText(strings.camera.dropHint).closest('label')!;
    const file = photo();

    fireEvent.dragOver(zone, { dataTransfer: { files: [file] } });
    expect(zone).toHaveClass('dropzone--active');
    expect(screen.getByText(strings.camera.dropActive)).toBeInTheDocument();

    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(zone).not.toHaveClass('dropzone--active');
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('desabilitada, ignora o arquivo solto', () => {
    const onFile = vi.fn();
    render(<ImageDropZone variant="dropzone" disabled onFile={onFile} />);
    const zone = screen.getByText(strings.camera.dropHint).closest('label')!;

    fireEvent.drop(zone, { dataTransfer: { files: [photo()] } });

    expect(onFile).not.toHaveBeenCalled();
  });

  it('o modo botão não aceita arrastar e soltar', () => {
    const onFile = vi.fn();
    render(<ImageDropZone variant="button" onFile={onFile} />);
    const button = screen.getByText(strings.camera.upload).closest('label')!;

    fireEvent.drop(button, { dataTransfer: { files: [photo()] } });

    expect(onFile).not.toHaveBeenCalled();
    expect(screen.queryByText(strings.camera.dropHint)).toBeNull();
  });
});
