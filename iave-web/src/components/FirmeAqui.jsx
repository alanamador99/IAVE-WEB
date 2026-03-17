//Este componente es una implementación personalizada de un lienzo de firma. No utiliza la librería react-signature-canvas para evitar conflictos de versión de React. En su lugar, se implementa manualmente la funcionalidad de dibujo en un canvas HTML5, con métodos expuestos para limpiar, verificar si está vacío y obtener el canvas completo (simulado como "recortado"). El componente principal "FirmaInput" utiliza este lienzo para permitir al usuario dibujar su firma, limpiarla o guardarla como una imagen base64.
import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';

// Implementación manual de SignatureCanvas para evitar conflictos de versión de React
const SignatureCanvas = forwardRef(({ penColor = 'black', canvasProps = {} }, ref) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false); // Para rastrear si está vacío sin re-renderizar constantemente

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn.current = false;
      }
    },
    isEmpty: () => !hasDrawn.current,
    getTrimmedCanvas: () => {
      // Devuelve el canvas completo (simulado). Para recorte real se necesitaría lógica de píxeles.
      return canvasRef.current; 
    }
  }));

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevenir scroll en móviles
    isDrawing.current = true;
    hasDrawn.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;
  };

  const stopDrawing = (e) => {
    // e.preventDefault();
    isDrawing.current = false;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); // Reset path para no conectar líneas distantes
  };

  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    // Actualizar inicio para suavizar (opcional, context mantiene estado)
    ctx.beginPath(); 
    ctx.moveTo(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      {...canvasProps}
      onMouseDown={startDrawing}
      onMouseUp={stopDrawing}
      onMouseMove={draw}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchEnd={stopDrawing}
      onTouchMove={draw}
      style={{ ...canvasProps.style, touchAction: 'none' }} // Importante para móviles
    />
  );
});

// Componente principal sin cambios en lógica, solo usa el nuevo SignatureCanvas interno
const FirmaInput = () => {
  const firmaRef = useRef(null);

  // Limpiar el lienzo
  const limpiar = () => firmaRef.current.clear();

  const guardar = () => {
    // Si la librería simulada tiene getTrimmedCanvas pero devuelve el canvas entero, funcionará igual.
    // Si no está vacío, procedemos
    if (firmaRef.current && firmaRef.current.isEmpty && firmaRef.current.isEmpty()) {
       alert("Por favor, ingresa una firma primero.");
       return;
    }
    
    // Acceso via el mock API
    const canvas = firmaRef.current.getTrimmedCanvas(); 
    if (canvas) {
       const imagenBase64 = canvas.toDataURL('image/png');
       console.log("Firma guardada:", imagenBase64);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h3>Firme aquí:</h3>
      <div style={{ border: '1px solid #ccc', display: 'inline-block' }}>
        <SignatureCanvas 
          ref={firmaRef}
          penColor='black'
          canvasProps={{
            width: 500, 
            height: 200, 
            className: 'sigCanvas',
            style: { border: 'none' }
          }}
        />
      </div>
      <div style={{ marginTop: '10px' }}>
        <button onClick={limpiar}>Limpiar</button>
        <button onClick={guardar} style={{ marginLeft: '10px' }}>Guardar Firma</button>
      </div>
    </div>
  );
};

export default FirmaInput;