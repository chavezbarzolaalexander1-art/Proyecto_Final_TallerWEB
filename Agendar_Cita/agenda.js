// Base de datos local de doctores por especialidad y capacidad máxima por turno
const DOCTORES_SISTEMA = [
    {id: 'doc-1', nombre: 'Dra. Ana Lucía Torres', especialidad: 'geriatria', cuposMax: {manana: 2, tarde: 3}},
    {id: 'doc-2', nombre: 'Dr. Robert Jose Urtado', especialidad: 'medicina-interna', cuposMax: {manana: 3, tarde: 0}},
    {id: 'doc-3', nombre: 'Dra. Aramis Rafael Carranza', especialidad: 'endocrinologia', cuposMax: {manana: 1, tarde: 2}},
    {id: 'doc-4', nombre: 'Dra. Susan Perez Lira', especialidad: 'nutricion', cuposMax: {manana: 4, tarde: 2}},
    {id: 'doc-5', nombre: 'Dra. Luna Rojas Perez', especialidad: 'psiquiatria', cuposMax: {manana: 0, tarde: 2}},
    {id: 'doc-6', nombre: 'Dra. Valeria Vega Morales', especialidad: 'dermatologia', cuposMax: {manana: 2, tarde: 2}},
    {id: 'doc-7', nombre: 'Dr. Jorge Delgado Rios', especialidad: 'neumologia', cuposMax: {manana: 3, tarde: 1}},
    {id: 'doc-8', nombre: 'Dra. María Claudia Campos', especialidad: 'gastroenterologia', cuposMax: {manana: 2, tarde: 2}},
    {id: 'doc-9', nombre: 'Dra. Salome Torres Basquez', especialidad: 'cardiologia', cuposMax: {manana: 2, tarde: 0}},
    {id: 'doc-10', nombre: 'Dr. Carlos Mendoza Silva', especialidad: 'neurologia', cuposMax: {manana: 1, tarde: 3}},
    {id: 'doc-11', nombre: 'Dra. Betty Quispe Alca', especialidad: 'oftalmologia', cuposMax: {manana: 2, tarde: 2}},
    {id: 'doc-12', nombre: 'Dra. Patricia Cordova Salazar', especialidad: 'reumatologia', cuposMax: {manana: 3, tarde: 3}}
];

document.addEventListener('DOMContentLoaded', () => {
    inicializarReinicioDiarioCupos();
    configurarRestriccionFechaMinima();
    inicializarFlujoCascadaCitas();
});

// 1. REINICIO DIARIO AUTOMÁTICO DE CUPOS
function inicializarReinicioDiarioCupos() {
    const hoyStr = obtenerFechaHoyISO();
    const ultimaFechaGuardada = localStorage.getItem('meddi_fecha_cupos');

    if (ultimaFechaGuardada !== hoyStr) {
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

// 2. RESTRICCIÓN DE FECHA MÍNIMA
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

// 3. DEPENDENCIA EN CASCADA Y RESERVA DE CITA
function inicializarFlujoCascadaCitas() {
    const selectEspecialidad = document.getElementById('especialidad');
    const selectDoctor = document.getElementById('doctor');
    const selectModalidad = document.getElementById('modalidad');
    const inputFecha = document.getElementById('fecha-tentativa');
    const selectTurno = document.getElementById('turno-preferido');
    const formCita = document.getElementById('form-cita');

    if (!selectEspecialidad || !selectDoctor) return;

    selectEspecialidad.addEventListener('change', () => {
        const especialidadSeleccionada = selectEspecialidad.value;
        selectDoctor.innerHTML = '';

        if (!especialidadSeleccionada) {
            selectDoctor.disabled = true;
            selectDoctor.innerHTML = '<option value="" disabled selected>Primero selecciona una especialidad</option>';
            resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
            return;
        }

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

    selectDoctor.addEventListener('change', () => {
        if (selectDoctor.value) {
            selectModalidad.disabled = false;
            inputFecha.disabled = false;
        } else {
            resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
        }
        if (inputFecha.value) {
            validarTurnosPorDisponibilidad();
        }
    });

    inputFecha.addEventListener('change', () => {
        if (inputFecha.value) {
            selectTurno.disabled = false;
            validarTurnosPorDisponibilidad();
        } else {
            resetearCamposDependientes([selectTurno]);
        }
    });

    if (formCita) {
        formCita.addEventListener('submit', (e) => {
            e.preventDefault();

            const docId = selectDoctor.value;
            const turno = selectTurno.value;

            if (descontarCupo(docId, turno)) {
                // GUARDAR CITA EN LOCALSTORAGE
                const emailSesion = localStorage.getItem('meddi_sesion_activa_email');
                const correoContacto = document.getElementById('correo-contacto')?.value.trim();
                const docObj = DOCTORES_SISTEMA.find(d => d.id === docId);

                const nuevaCita = {
                    id: 'cita-' + Date.now(),
                    emailUsuario: (emailSesion || correoContacto || '').toLowerCase(),
                    pacienteNombre: document.getElementById('nombre-paciente').value.trim(),
                    pacienteDni: document.getElementById('dni-paciente').value.trim(),
                    especialidad: selectEspecialidad.options[selectEspecialidad.selectedIndex].text,
                    doctorId: docId,
                    doctorNombre: docObj ? docObj.nombre : 'Médico Especialista',
                    modalidad: selectModalidad.options[selectModalidad.selectedIndex].text,
                    fecha: inputFecha.value,
                    turno: turno,
                    motivo: document.getElementById('motivo-consulta').value.trim()
                };

                const citasExistentes = JSON.parse(localStorage.getItem('meddi_citas')) || [];
                citasExistentes.push(nuevaCita);
                localStorage.setItem('meddi_citas', JSON.stringify(citasExistentes));

                alert('¡Solicitud de cita enviada exitosamente! Tu cupo ha sido reservado.');
                formCita.reset();
                selectDoctor.disabled = true;
                selectDoctor.innerHTML = '<option value="" disabled selected>Primero selecciona una especialidad</option>';
                resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
                window.location.href = '../Autth/perfil.html';
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

function cancelarCita(idDoctor, turno) {
    const cupos = obtenerCuposActuales();
    const docObj = DOCTORES_SISTEMA.find(d => d.id === idDoctor);

    if (!cupos[idDoctor] || !docObj) return false;

    const maxCupos = docObj.cuposMax[turno] || 0;
    const cupoActual = cupos[idDoctor][turno] || 0;

    if (cupoActual < maxCupos) {
        cupos[idDoctor][turno] += 1;
        guardarCuposActuales(cupos);
        return true;
    }
    return false;
}

window.DOCTORES_SISTEMA = DOCTORES_SISTEMA;
window.cancelarCita = cancelarCita;

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