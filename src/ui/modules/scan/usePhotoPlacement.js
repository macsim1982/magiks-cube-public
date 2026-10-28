import { useEffect, useRef, useState } from 'react';

const HOME = { x: 0, y: 0, zoom: 1 };
const clampZoom = (zoom) => Math.min(4, Math.max(1, zoom));

/**
 * Une photo importée, à caler sous le cadre du scan : on la glisse au doigt
 * ou à la souris, on la zoome à la molette ou au curseur. `stage` va sur le
 * cadre : son côté (`frame`, en px) sert à caler la photo. `natural` : la
 * taille d’origine de la photo, connue une fois chargée (`onLoad`).
 */
export function usePhotoPlacement() {
  const stage = useRef(null);
  const drag = useRef(null);
  const [file, setFile] = useState(null);
  const [natural, setNatural] = useState(null);
  const [frame, setFrame] = useState(0);
  const [place, setPlace] = useState(HOME);

  useEffect(() => {
    const el = stage.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(() => setFrame(el.getBoundingClientRect().width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (file) URL.revokeObjectURL(file.url);
  }, [file]);

  const zoomBy = (factor) => setPlace((p) => ({ ...p, zoom: clampZoom(p.zoom * factor) }));
  const release = () => {
    drag.current = null;
  };
  const pointer = {
    onPointerDown: (event) => {
      if (!file) return;
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event) => {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      drag.current = { ...start, x: event.clientX, y: event.clientY };
      setPlace((p) => ({ ...p, x: p.x + event.clientX - start.x, y: p.y + event.clientY - start.y }));
    },
    onPointerUp: release,
    onPointerCancel: release,
    onWheel: file ? (event) => zoomBy(event.deltaY < 0 ? 1.08 : 1 / 1.08) : undefined,
  };

  return {
    stage,
    file,
    natural,
    frame,
    place,
    pointer,
    onLoad: (event) => {
      const { naturalWidth, naturalHeight } = event.currentTarget;
      setNatural({ naturalWidth, naturalHeight });
    },
    open: (chosen) => {
      setPlace(HOME);
      setNatural(null);
      setFile({ url: URL.createObjectURL(chosen) });
    },
    reset: () => {
      setFile(null);
      setPlace(HOME);
    },
    zoomTo: (zoom) => setPlace((p) => ({ ...p, zoom })),
  };
}
