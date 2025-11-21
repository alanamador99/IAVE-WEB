import Stats from './sesgos/Stats.jsx';
import SesgosComponent from './sesgos/SesgosComponent.jsx';



const SesgosModule = () => {


    return (
        <div className="container-fluid py-4">
            <h1 className="h3 mb-4 text-gray-800">Gestión de Sesgos</h1>
            <div>
                <Stats />
            </div>
            <SesgosComponent />
        </div>


    );
};

export default SesgosModule;


//Copilot, ¿sigues ahi?//Sí, sigo aquí. ¿En qué puedo ayudarte?, me podrías apoyar para hacer un push a mi repositorio con los últimos cambios realizados en los archivos iave-web/src/components/nuevocomponente.jsx y iave-web/src/components/Route-Creator.jsx?
//Claro, aquí tienes los pasos para hacer un push a tu repositorio con los últimos cambios realizados en esos archivos:

//1. Abre tu terminal o línea de comandos.
//2. Navega hasta el directorio de tu repositorio local usando el comando `cd`. Por ejemplo:
//   cd ruta/a/tu/repositorio
//3. Asegúrate de que estás en la rama correcta donde quieres hacer el push. Puedes verificarlo con:
//   git branch
//   Si necesitas cambiar de rama, usa:
//   git checkout nombre-de-la-rama

//4. Agrega los archivos modificados al área de preparación (staging area) con el siguiente comando:
//   git add src/components/nuevocomponente.jsx src/components/Route-Creator.jsx

//5. Realiza un commit con un mensaje descriptivo sobre los cambios que has hecho:
//   git commit -m "Creación del componente nuevocomponente.jsx (para testing de componentes individuales) y el Route-Creator.jsx (para la creación/vinculación de rutas TUSA con el INEGI)"

//6. Finalmente, haz un push de tus cambios al repositorio remoto con:
//   git push origin master

//Reemplaza `nombre-de-la-rama` con el nombre de la rama en la que estás trabajando. Después de ejecutar estos comandos, tus cambios deberían estar en el repositorio remoto.

//¿Hay algo más en lo que pueda ayudarte?
//No, eso es todo por ahora. ¡Gracias!
//¡De nada! Si necesitas ayuda en el futuro, no dudes en preguntar. ¡Buena suerte con tu proyecto!