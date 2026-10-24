// Base de datos local de doctores por especialidad y capacidad máxima por turno
const DOCTORES_SISTEMA = [
    {id: 'doc-1', nombre: 'Dra. Ana Lucía Torres', especialidad: 'geriatria', cuposMax: {manana: 2, tarde: 3}},
    {id: 'doc-2', nombre: 'Dr. Robert Jose Urtado', especialidad: 'medicina-interna', cuposMax: {manana: 3, tarde: 0}},
    {
        id: 'doc-3',
        nombre: 'Dra. Aramis Rafael Carranza',
        especialidad: 'endocrinologia',
        cuposMax: {manana: 1, tarde: 2}
    },
    {id: 'doc-4', nombre: 'Dra. Susan Perez Lira', especialidad: 'nutricion', cuposMax: {manana: 4, tarde: 2}},
    {id: 'doc-5', nombre: 'Dra. Luna Rojas Perez', especialidad: 'psiquiatria', cuposMax: {manana: 0, tarde: 2}},
    {id: 'doc-6', nombre: 'Dra. Valeria Vega Morales', especialidad: 'dermatologia', cuposMax: {manana: 2, tarde: 2}},
    {id: 'doc-7', nombre: 'Dr. Jorge Delgado Rios', especialidad: 'neumologia', cuposMax: {manana: 3, tarde: 1}},
    {
        id: 'doc-8',
        nombre: 'Dra. María Claudia Campos',
        especialidad: 'gastroenterologia',
        cuposMax: {manana: 2, tarde: 2}
    },
    {id: 'doc-9', nombre: 'Dra. Salome Torres Basquez', especialidad: 'cardiologia', cuposMax: {manana: 2, tarde: 0}},
    {id: 'doc-10', nombre: 'Dr. Carlos Mendoza Silva', especialidad: 'neurologia', cuposMax: {manana: 1, tarde: 3}},
    {id: 'doc-11', nombre: 'Dra. Betty Quispe Alca', especialidad: 'oftalmologia', cuposMax: {manana: 2, tarde: 2}},
    {
        id: 'doc-12',
        nombre: 'Dra. Patricia Cordova Salazar',
        especialidad: 'reumatologia',
        cuposMax: {manana: 3, tarde: 3}
    }
];

document.addEventListener('DOMContentLoaded', () => {
    inicializarReinicioDiarioCupos();
    configurarRestriccionFechaMinima();
    inicializarFlujoCascadaCitas();
});

// ==========================================================================
// 1. REINICIO DIARIO AUTOMÁTICO DE CUPOS
// ==========================================================================
function inicializarReinicioDiarioCupos() {
    const hoyStr = obtenerFechaHoyISO();
    const ultimaFechaGuardada = localStorage.getItem('meddi_fecha_cupos');

    if (ultimaFechaGuardada !== hoyStr) {
        // Es un nuevo día o primera ejecución: reiniciamos los cupos con base en la capacidad por defecto
        const cuposIniciales = {};
        DOCTORES_SISTEMA.forEach(doc => {
            cuposIniciales[doc.id] = {...doc.cuposMax};
        });

        localStorage.setItem('meddi_cupos_doctores', JSON.stringify(cuposIniciales));
        localStorage.setItem('meddi_fecha_cupos', hoyStr);
    }
}

function obtenerCuposActuales() {
    return JSON.parse(localStorage.getItem('meddi_cupos_doctores')) || {};
}

function guardarCuposActuales(cupos) {
    localStorage.setItem('meddi_cupos_doctores', JSON.stringify(cupos));
}

// ==========================================================================
// 2. RESTRICCIÓN DE FECHA MÍNIMA (Solo a partir de mañana)
// ==========================================================================
function obtenerFechaHoyISO() {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function configurarRestriccionFechaMinima() {
    const inputFecha = document.getElementById('fecha-tentativa');
    if (!inputFecha) return;

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);

    const yyyy = manana.getFullYear();
    const mm = String(manana.getMonth() + 1).padStart(2, '0');
    const dd = String(manana.getDate()).padStart(2, '0');
    const fechaMinimaISO = `${yyyy}-${mm}-${dd}`;

    inputFecha.setAttribute('min', fechaMinimaISO);
}

// ==========================================================================
// 3. DEPENDENCIA EN CASCADA Y FILTRADO DINÁMICO
// ==========================================================================
function inicializarFlujoCascadaCitas() {
    const selectEspecialidad = document.getElementById('especialidad');
    const selectDoctor = document.getElementById('doctor');
    const selectModalidad = document.getElementById('modalidad');
    const inputFecha = document.getElementById('fecha-tentativa');
    const selectTurno = document.getElementById('turno-preferido');
    const formCita = document.getElementById('form-cita');

    if (!selectEspecialidad || !selectDoctor) return;

    // EVENTO 1: Cambio de Especialidad
    selectEspecialidad.addEventListener('change', () => {
        const especialidadSeleccionada = selectEspecialidad.value;

        // Limpiar selector de doctor
        selectDoctor.innerHTML = '';

        if (!especialidadSeleccionada) {
            selectDoctor.disabled = true;
            selectDoctor.innerHTML = '<option value="" disabled selected>Primero selecciona una especialidad</option>';
            resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
            return;
        }

        // Filtrar doctores por especialidad
        const doctoresFiltrados = DOCTORES_SISTEMA.filter(doc => doc.especialidad === especialidadSeleccionada);

        if (doctoresFiltrados.length === 0) {
            selectDoctor.disabled = true;
            selectDoctor.innerHTML = '<option value="" disabled selected>No hay doctores disponibles para esta especialidad</option>';
            resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
            return;
        }

        selectDoctor.innerHTML = '<option value="" disabled selected>Selecciona un doctor</option>';
        doctoresFiltrados.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.nombre;
            selectDoctor.appendChild(option);
        });

        selectDoctor.disabled = false;
        resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
    });

    // EVENTO 2: Cambio de Doctor
    selectDoctor.addEventListener('change', () => {
        if (selectDoctor.value) {
            selectModalidad.disabled = false;
            inputFecha.disabled = false;
        } else {
            resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
        }
        // Si ya había fecha, re-validar los turnos con el nuevo doctor
        if (inputFecha.value) {
            validarTurnosPorDisponibilidad();
        }
    });

    // EVENTO 3: Cambio de Fecha
    inputFecha.addEventListener('change', () => {
        if (inputFecha.value) {
            selectTurno.disabled = false;
            validarTurnosPorDisponibilidad();
        } else {
            resetearCamposDependientes([selectTurno]);
        }
    });

    // Envío del formulario: descuento de cupo
    if (formCita) {
        formCita.addEventListener('submit', (e) => {
            e.preventDefault();

            const docId = selectDoctor.value;
            const turno = selectTurno.value;

            if (descontarCupo(docId, turno)) {
                alert('¡Solicitud de cita enviada exitosamente! Tu cupo ha sido reservado.');
                formCita.reset();
                // Bloquear nuevamente por flujo cascada
                selectDoctor.disabled = true;
                selectDoctor.innerHTML = '<option value="" disabled selected>Primero selecciona una especialidad</option>';
                resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
                window.location.href = '../index.html';
            } else {
                alert('El turno seleccionado ya no cuenta con cupos disponibles.');
            }
        });
    }
}

function resetearCamposDependientes(elementos) {
    elementos.forEach(el => {
        if (!el) return;
        el.value = '';
        el.disabled = true;
    });
}

// ==========================================================================
// 4. BLOQUEO DE TURNOS POR DISPONIBILIDAD DE CUPOS
// ==========================================================================
function validarTurnosPorDisponibilidad() {
    const selectDoctor = document.getElementById('doctor');
    const selectTurno = document.getElementById('turno-preferido');

    if (!selectDoctor.value) return;

    const docId = selectDoctor.value;
    const cupos = obtenerCuposActuales();
    const cuposDoctor = cupos[docId] || {manana: 0, tarde: 0};

    const optManana = selectTurno.querySelector('option[value="manana"]');
    const optTarde = selectTurno.querySelector('option[value="tarde"]');

    if (optManana) {
        if (cuposDoctor.manana <= 0) {
            optManana.disabled = true;
            optManana.textContent = 'Mañana (8:00 am - 1:00 pm) - AGOTADO';
        } else {
            optManana.disabled = false;
            optManana.textContent = `Mañana (8:00 am - 1:00 pm) - (${cuposDoctor.manana} cupos)`;
        }
    }

    if (optTarde) {
        if (cuposDoctor.tarde <= 0) {
            optTarde.disabled = true;
            optTarde.textContent = 'Tarde (2:00 pm - 7:00 pm) - AGOTADO';
        } else {
            optTarde.disabled = false;
            optTarde.textContent = `Tarde (2:00 pm - 7:00 pm) - (${cuposDoctor.tarde} cupos)`;
        }
    }

    // Si la opción que estaba seleccionada se deshabilita, reiniciar la selección
    if (selectTurno.selectedOptions[0]?.disabled) {
        selectTurno.value = '';
    }
}

function descontarCupo(docId, turno) {
    const cupos = obtenerCuposActuales();
    if (cupos[docId] && cupos[docId][turno] > 0) {
        cupos[docId][turno] -= 1;
        guardarCuposActuales(cupos);
        return true;
    }
    return false;
}

// ==========================================================================
// 5. FUNCIÓN AUXILIAR DE CANCELACIÓN (REUTILIZABLE PARA EL FUTURO)
// ==========================================================================
/**
 * Restaura/Suma 1 cupo disponible al doctor y turno indicados.
 * @param {string} idDoctor - Identificador único del doctor (ej. 'doc-1')
 * @param {string} turno - Turno a cancelar ('manana' | 'tarde')
 * @returns {boolean} - Devuelve true si la restauración fue exitosa.
 */
function cancelarCita(idDoctor, turno) {
    const cupos = obtenerCuposActuales();
    const docObj = DOCTORES_SISTEMA.find(d => d.id === idDoctor);

    if (!cupos[idDoctor] || !docObj) {
        console.warn(`No se encontró registro para el doctor con ID: ${idDoctor}`);
        return false;
    }

    const maxCupos = docObj.cuposMax[turno] || 0;
    const cupoActual = cupos[idDoctor][turno] || 0;

    // Evita superar el límite máximo diario asignado
    if (cupoActual < maxCupos) {
        cupos[idDoctor][turno] += 1;
        guardarCuposActuales(cupos);
        console.log(`Cupo devuelto al doctor ${idDoctor} en turno ${turno}. Cupos actuales: ${cupos[idDoctor][turno]}`);
        return true;
    } else {
        console.log(`El turno ${turno} del doctor ${idDoctor} ya tiene el máximo de cupos permitidos (${maxCupos}).`);
        return false;
    }
}

// Exportamos la función al scope global para consumo externo
window.cancelarCita = cancelarCita;

// ==========================================================================
// PASOS MULTIPASO DEL FORMULARIO (EXISTENTES)
// ==========================================================================
function siguientePaso(pasoActual) {
    const bloqueActual = document.querySelector(`.bloque-paso-${pasoActual}`);
    const camposObligatorios = bloqueActual.querySelectorAll('input[required], select[required], textarea[required]');
    let pasoValido = true;

    camposObligatorios.forEach(campo => {
        if (!campo.checkValidity()) {
            campo.reportValidity();
            pasoValido = false;
            return;
        }
    });

    if (!pasoValido) return;

    bloqueActual.classList.remove('activo');
    const siguienteBloque = document.querySelector(`.bloque-paso-${pasoActual + 1}`);
    if (siguienteBloque) {
        siguienteBloque.classList.add('activo');
    }

    document.querySelector(`#indicador-${pasoActual}`).classList.remove('activo');
    document.querySelector(`#indicador-${pasoActual + 1}`).classList.add('activo');
}

function anteriorPaso(pasoActual) {
    const bloqueActual = document.querySelector(`.bloque-paso-${pasoActual}`);
    bloqueActual.classList.remove('activo');

    const pasoAnterior = document.querySelector(`.bloque-paso-${pasoActual - 1}`);
    if (pasoAnterior) {
        pasoAnterior.classList.add('activo');
    }

    document.querySelector(`#indicador-${pasoActual}`).classList.remove('activo');
    document.querySelector(`#indicador-${pasoActual - 1}`).classList.add('activo');
}