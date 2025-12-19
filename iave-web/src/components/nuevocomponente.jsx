import React, { useEffect, useRef } from 'react';

const MyComponent = () => {
  // 1. Crear una referencia al botón
  const buttonRef = useRef(null);

  // 2. Definir el manejador de eventos del teclado
  const handleKeyDown = (event) => {
    // Verificar si se presionó Ctrl (o Cmd en Mac, usando event.metaKey) y Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault(); // Evitar el comportamiento predeterminado (ej. salto de línea en un textarea)
      // Simular un clic en el botón referenciado
      if (buttonRef.current) {
        buttonRef.current.click();
      }
    }
  };

  // 3. Añadir y limpiar el detector de eventos globalmente
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    // Función de limpieza que se ejecuta al desmontar el componente
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // El array de dependencias vacío asegura que se configure solo una vez

  // 4. Definir la función que se ejecuta al hacer clic en el botón
  const handleButtonClick = () => {
    alert('¡Botón clicado con éxito!');
    // Aquí puedes añadir la lógica que desees, como enviar un formulario
  };

  return (
    <div>
      <p>Presiona Ctrl + Enter para hacer clic en el botón de abajo:</p>
      <button ref={buttonRef} onClick={handleButtonClick}>
        Hacer clic
      </button>
      {/* Un área de texto opcional para probar el preventDefault */}
      <textarea placeholder="Escribe algo aquí..."></textarea>
    </div>
  );
};

export default MyComponent;
