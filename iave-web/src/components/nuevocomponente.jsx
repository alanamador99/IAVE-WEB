import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react';

const GanttChart = () => {
  const [selectedPhase, setSelectedPhase] = useState(null);

  const phases = [
    {
      id: 1,
      name: "ETAPA 1: ANÁLISIS Y DISEÑO",
      duration: "3 semanas",
      start: 1,
      length: 3,
      color: "bg-blue-500",
      deliverables: [
        "Documento de Arquitectura Técnica",
        "Especificación de Requerimientos",
        "Modelo de Datos documentado"
      ],
      tips: [
        "Usa herramientas como Lucidchart o Draw.io para diagramas",
        "Considera patrones de arquitectura: MVC, Microservicios, Capas",
        "Documenta decisiones arquitectónicas (ADRs)"
      ]
    },
    {
      id: 2,
      name: "ETAPA 2: DESARROLLO Y CÓDIGO",
      duration: "6 semanas",
      start: 4,
      length: 6,
      color: "bg-green-500",
      deliverables: [
        "Código Fuente documentado",
        "Documentación técnica",
        "Evidencias de seguridad"
      ],
      tips: [
        "Implementa estándares de código (ESLint, Prettier)",
        "Usa Git con commits descriptivos",
        "Aplica principios SOLID y Clean Code",
        "Documenta con JSDoc o similar"
      ]
    },
    {
      id: 3,
      name: "ETAPA 3: TESTING Y CALIDAD",
      duration: "3 semanas",
      start: 10,
      length: 3,
      color: "bg-yellow-500",
      deliverables: [
        "Plan de Pruebas ejecutado",
        "Reporte de Cobertura",
        "Certificado de Seguridad (SAST/DAST)",
        "Métricas de performance"
      ],
      tips: [
        "Herramientas: Jest, Selenium, JMeter",
        "Busca cobertura mínima del 80%",
        "Usa SonarQube para SAST",
        "OWASP ZAP para DAST"
      ]
    },
    {
      id: 4,
      name: "ETAPA 4: DEPLOYMENT",
      duration: "2 semanas",
      start: 13,
      length: 2,
      color: "bg-purple-500",
      deliverables: [
        "Procedimientos de Deployment",
        "Plan de Disaster Recovery"
      ],
      tips: [
        "Automatiza con CI/CD (Jenkins, GitLab CI)",
        "Usa scripts de rollback",
        "Documenta cada paso del despliegue",
        "Realiza backups antes de deployment"
      ]
    },
    {
      id: 5,
      name: "ETAPA 5: OPERACIÓN Y SOPORTE",
      duration: "2 semanas",
      start: 15,
      length: 2,
      color: "bg-red-500",
      deliverables: [
        "Manual de Operaciones",
        "Documentación de APIs"
      ],
      tips: [
        "Usa Swagger/OpenAPI para APIs",
        "Crea guías paso a paso con capturas",
        "Incluye FAQs y troubleshooting",
        "Documenta logs y monitoreo"
      ]
    }
  ];

  const weeks = Array.from({ length: 17 }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Calendar className="text-blue-600" />
          Diagrama de Gantt - Proyecto de Desarrollo
        </h1>
        <p className="text-gray-600">Duración total estimada: 16 semanas (4 meses)</p>
      </div>

      {/* Gantt Chart */}
      <div className="mb-8 overflow-x-auto">
        <div className="min-w-max">
          {/* Header */}
          <div className="flex mb-2">
            <div className="w-64 font-semibold text-sm text-gray-700 pr-4">Etapa</div>
            <div className="flex-1 flex">
              {weeks.map(week => (
                <div key={week} className="w-12 text-center text-xs text-gray-600 border-l border-gray-200">
                  S{week}
                </div>
              ))}
            </div>
          </div>

          {/* Phases */}
          {phases.map(phase => (
            <div key={phase.id} className="mb-3">
              <div className="flex items-center">
                <div className="w-64 pr-4">
                  <button
                    onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                    className="text-left text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    {phase.name}
                    <div className="text-xs text-gray-500 mt-1">{phase.duration}</div>
                  </button>
                </div>
                <div className="flex-1 flex relative h-10 items-center">
                  {weeks.map(week => (
                    <div key={week} className="w-12 border-l border-gray-200 h-full"></div>
                  ))}
                  <div
                    className={`absolute h-8 ${phase.color} rounded shadow-md cursor-pointer hover:shadow-lg transition-shadow`}
                    style={{
                      left: `${(phase.start - 1) * 48}px`,
                      width: `${phase.length * 48}px`
                    }}
                    onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                  ></div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedPhase === phase.id && (
                <div className="mt-3 ml-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        Entregables:
                      </h3>
                      <ul className="space-y-1">
                        {phase.deliverables.map((del, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{del}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Info size={16} className="text-blue-600" />
                        Consejos:
                      </h3>
                      <ul className="space-y-1">
                        {phase.tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-purple-500 mt-1">→</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle size={18} className="text-blue-600" />
          Recomendaciones Generales:
        </h3>
        <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Mantén reuniones semanales de seguimiento con el gerente</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Usa herramientas de gestión como Jira o Trello</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Documenta todo en tiempo real, no al final</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Solicita revisiones tempranas de entregables críticos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Considera un buffer del 20% para imprevistos</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Haz control de versiones de todos los documentos</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        Haz clic en cada etapa para ver detalles, entregables y consejos específicos
      </div>
    </div>
  );
};

export default GanttChart;