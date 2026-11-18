// Base de datos local de doctores por especialidad y capacidad máxima diaria por turno
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
    {id: 'doc-12', nombre: 'Dra. Patricia Cordova Salazar', especialidad: 'reumatologia', cuposMax: {manana: 3, tarde: 3}},
    {id: 'doc-13', nombre: 'Dr. Luis Fernando Paredes', especialidad: 'hematologia', cuposMax: {manana: 2, tarde: 2}},
    {id: 'doc-14', nombre: 'Lic. Claudia Romero Díaz', especialidad: 'psicologia', cuposMax: {manana: 3, tarde: 3}},
    {id: 'doc-15', nombre: 'Lic. Rosa Elena Huamán', especialidad: 'enfermeria', cuposMax: {manana: 4, tarde: 4}}
];

document.addEventListener('DOMContentLoaded', () => {
    configurarRestriccionFechaMinima();
    inicializarFlujoCascadaCitas();
    inicializarModalResumen();
    aplicarEspecialidadDesdeURL();
    restaurarBorradorCita();
});

// 1. UTILIDADES DE FECHA (A PARTIR DE MAÑANA)
function formatearFechaISO(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function obtenerFechaMananaISO() {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return formatearFechaISO(manana);
}

function obtenerProximosDias(cantidad = 5) {
    const dias = [];
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    for (let i = 1; i <= cantidad; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + i);
        const iso = formatearFechaISO(fecha);
        const etiqueta = `${nombresDias[fecha.getDay()]} ${String(fecha.getDate()).padStart(2, '0')} ${nombresMeses[fecha.getMonth()]}`;
        dias.push({iso, etiqueta});
    }
    return dias;
}

function configurarRestriccionFechaMinima() {
    const inputFecha = document.getElementById('fecha-tentativa');
    if (!inputFecha) return;
    inputFecha.setAttribute('min', obtenerFechaMananaISO());
}

// 2. CÁLCULO DE CUPOS DISPONIBLES POR DOCTOR Y POR FECHA ESPECÍFICA
function obtenerCuposDisponiblesPorFecha(docId, fechaISO) {
    const doc = DOCTORES_SISTEMA.find(d => d.id === docId);
    if (!doc || !fechaISO) return {manana: 0, tarde: 0};

    const citasGuardadas = JSON.parse(localStorage.getItem('meddi_citas')) || [];

    const ocupadosManana = citasGuardadas.filter(
        c => c.doctorId === docId && c.fecha === fechaISO && c.turno === 'manana'
    ).length;

    const ocupadosTarde = citasGuardadas.filter(
        c => c.doctorId === docId && c.fecha === fechaISO && c.turno === 'tarde'
    ).length;

    return {
        manana: Math.max(0, (doc.cuposMax.manana || 0) - ocupadosManana),
        tarde: Math.max(0, (doc.cuposMax.tarde || 0) - ocupadosTarde)
    };
}

// 3. DEPENDENCIA EN CASCADA, TABLA DE HORARIOS Y RESERVA DE CITA
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

        renderizarTablaHorarios(especialidadSeleccionada, inputFecha.value);

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
            renderizarTablaHorarios(selectEspecialidad.value, inputFecha.value);
        } else {
            resetearCamposDependientes([selectTurno]);
        }
    });

    if (formCita) {
        formCita.addEventListener('submit', (e) => {
            e.preventDefault();

            // VALIDAR SI EL USUARIO ESTÁ LOGUEADO ANTES DE ENVIAR
            const emailSesion = localStorage.getItem('meddi_sesion_activa_email');
            if (!emailSesion) {
                guardarBorradorCita();
                sessionStorage.setItem('meddi_redirect_post_login', '../Agendar_Cita/index.html');
                alert('Debes iniciar sesión para poder agendar una cita. Hemos guardado tu progreso para que continúes al ingresar.');
                window.location.href = '../Autth/login.html';
                return;
            }

            const docId = selectDoctor.value;
            const fechaSeleccionada = inputFecha.value;
            const turno = selectTurno.value;

            const cuposDisponibles = obtenerCuposDisponiblesPorFecha(docId, fechaSeleccionada);

            if ((cuposDisponibles[turno] || 0) <= 0) {
                alert('El turno seleccionado para esta fecha ya no cuenta con cupos disponibles.');
                validarTurnosPorDisponibilidad();
                return;
            }

            const correoContacto = document.getElementById('correo-contacto')?.value.trim();
            const docObj = DOCTORES_SISTEMA.find(d => d.id === docId);
            const especialidadTexto = selectEspecialidad.options[selectEspecialidad.selectedIndex].text;
            const modalidadTexto = selectModalidad.options[selectModalidad.selectedIndex].text;
            const sedeTexto = document.getElementById('sede-atencion')?.value || 'Av. Nicolas de Pierola 123, Ate , Lima - Perú';

            const nuevaCita = {
                id: 'cita-' + Date.now(),
                emailUsuario: (emailSesion || correoContacto || '').toLowerCase(),
                pacienteNombre: document.getElementById('nombre-paciente').value.trim(),
                pacienteDni: document.getElementById('dni-paciente').value.trim(),
                edadPaciente: document.getElementById('edad-paciente').value.trim(),
                contactoNombre: document.getElementById('nombre-contacto').value.trim(),
                telefonoContacto: document.getElementById('telefono-contacto').value.trim(),
                sede: sedeTexto,
                especialidad: especialidadTexto,
                doctorId: docId,
                doctorNombre: docObj ? docObj.nombre : 'Médico Especialista',
                modalidad: modalidadTexto,
                fecha: fechaSeleccionada,
                turno: turno,
                motivo: document.getElementById('motivo-consulta').value.trim()
            };

            const citasExistentes = JSON.parse(localStorage.getItem('meddi_citas')) || [];
            citasExistentes.push(nuevaCita);
            localStorage.setItem('meddi_citas', JSON.stringify(citasExistentes));

            // Limpiar borrador guardado tras completar la reserva
            sessionStorage.removeItem('meddi_borrador_cita');

            const especialidadActual = selectEspecialidad.value;
            renderizarTablaHorarios(especialidadActual, fechaSeleccionada);

            mostrarModalResumenCita(nuevaCita);

            formCita.reset();
            resetearPasosAlInicio();
            selectDoctor.disabled = true;
            selectDoctor.innerHTML = '<option value="" disabled selected>Primero selecciona una especialidad</option>';
            resetearCamposDependientes([selectModalidad, inputFecha, selectTurno]);
            renderizarTablaHorarios('', '');
        });
    }
}

// GUARDAR Y RESTAURAR PROGRESO DEL FORMULARIO DE CITA
function guardarBorradorCita() {
    const borrador = {
        especialidad: document.getElementById('especialidad')?.value || '',
        doctor: document.getElementById('doctor')?.value || '',
        modalidad: document.getElementById('modalidad')?.value || '',
        fecha: document.getElementById('fecha-tentativa')?.value || '',
        turno: document.getElementById('turno-preferido')?.value || '',
        motivo: document.getElementById('motivo-consulta')?.value || '',
        pacienteNombre: document.getElementById('nombre-paciente')?.value || '',
        pacienteDni: document.getElementById('dni-paciente')?.value || '',
        edadPaciente: document.getElementById('edad-paciente')?.value || '',
        contactoNombre: document.getElementById('nombre-contacto')?.value || '',
        telefonoContacto: document.getElementById('telefono-contacto')?.value || '',
        correoContacto: document.getElementById('correo-contacto')?.value || '',
        terminos: document.getElementById('terminos')?.checked || false
    };
    sessionStorage.setItem('meddi_borrador_cita', JSON.stringify(borrador));
}

function restaurarBorradorCita() {
    const borradorStr = sessionStorage.getItem('meddi_borrador_cita');
    if (!borradorStr) return;

    const borrador = JSON.parse(borradorStr);
    const selectEspecialidad = document.getElementById('especialidad');
    const selectDoctor = document.getElementById('doctor');
    const selectModalidad = document.getElementById('modalidad');
    const inputFecha = document.getElementById('fecha-tentativa');
    const selectTurno = document.getElementById('turno-preferido');

    if (borrador.especialidad && selectEspecialidad) {
        selectEspecialidad.value = borrador.especialidad;
        selectEspecialidad.dispatchEvent(new Event('change'));
    }

    if (borrador.doctor && selectDoctor && !selectDoctor.disabled) {
        selectDoctor.value = borrador.doctor;
        selectDoctor.dispatchEvent(new Event('change'));
    }

    if (borrador.modalidad && selectModalidad && !selectModalidad.disabled) {
        selectModalidad.value = borrador.modalidad;
    }

    if (borrador.fecha && inputFecha && !inputFecha.disabled) {
        inputFecha.value = borrador.fecha;
        inputFecha.dispatchEvent(new Event('change'));
    }

    if (borrador.turno && selectTurno && !selectTurno.disabled) {
        const opcionTurno = selectTurno.querySelector(`option[value="${borrador.turno}"]`);
        if (opcionTurno && !opcionTurno.disabled) {
            selectTurno.value = borrador.turno;
        }
    }

    if (document.getElementById('motivo-consulta')) document.getElementById('motivo-consulta').value = borrador.motivo || '';
    if (document.getElementById('nombre-paciente')) document.getElementById('nombre-paciente').value = borrador.pacienteNombre || '';
    if (document.getElementById('dni-paciente')) document.getElementById('dni-paciente').value = borrador.pacienteDni || '';
    if (document.getElementById('edad-paciente')) document.getElementById('edad-paciente').value = borrador.edadPaciente || '';
    if (document.getElementById('nombre-contacto')) document.getElementById('nombre-contacto').value = borrador.contactoNombre || '';
    if (document.getElementById('telefono-contacto')) document.getElementById('telefono-contacto').value = borrador.telefonoContacto || '';
    if (document.getElementById('correo-contacto')) document.getElementById('correo-contacto').value = borrador.correoContacto || '';
    if (document.getElementById('terminos')) document.getElementById('terminos').checked = Boolean(borrador.terminos);

    // Ubicar directamente en el paso 3 donde quedó antes de iniciar sesión
    irAPaso(3);
    sessionStorage.removeItem('meddi_borrador_cita');
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
    const inputFecha = document.getElementById('fecha-tentativa');
    const selectTurno = document.getElementById('turno-preferido');

    if (!selectDoctor.value || !inputFecha.value) return;

    const cuposDoctor = obtenerCuposDisponiblesPorFecha(selectDoctor.value, inputFecha.value);

    const optManana = selectTurno.querySelector('option[value="manana"]');
    const optTarde = selectTurno.querySelector('option[value="tarde"]');

    if (optManana) {
        if (cuposDoctor.manana <= 0) {
            optManana.disabled = true;
            optManana.textContent = 'Mañana (8:00 am - 1:00 pm) - AGOTADO';
        } else {
            optManana.disabled = false;
            optManana.textContent = `Mañana (8:00 am - 1:00 pm) - (${cuposDoctor.manana} ${cuposDoctor.manana === 1 ? 'cupo' : 'cupos'})`;
        }
    }

    if (optTarde) {
        if (cuposDoctor.tarde <= 0) {
            optTarde.disabled = true;
            optTarde.textContent = 'Tarde (2:00 pm - 7:00 pm) - AGOTADO';
        } else {
            optTarde.disabled = false;
            optTarde.textContent = `Tarde (2:00 pm - 7:00 pm) - (${cuposDoctor.tarde} ${cuposDoctor.tarde === 1 ? 'cupo' : 'cupos'})`;
        }
    }

    if (selectTurno.selectedOptions[0]?.disabled) {
        selectTurno.value = '';
    }
}

// 4. TABLA DE HORARIOS Y CUPOS POR ESPECIALIDAD (DESDE MAÑANA)
function renderizarTablaHorarios(especialidadSeleccionada, fechaResaltada = '') {
    const contenedor = document.getElementById('contenedor-tabla-horarios');
    if (!contenedor) return;

    if (!especialidadSeleccionada) {
        contenedor.innerHTML = `
            <div class="mensaje-vacio-horarios">
                Selecciona una especialidad para consultar la disponibilidad de cupos por fecha.
            </div>
        `;
        return;
    }

    const doctores = DOCTORES_SISTEMA.filter(d => d.especialidad === especialidadSeleccionada);

    if (doctores.length === 0) {
        contenedor.innerHTML = `
            <div class="mensaje-vacio-horarios">
                No hay médicos registrados para esta especialidad en este momento.
            </div>
        `;
        return;
    }

    const dias = obtenerProximosDias(5);

    if (fechaResaltada && !dias.some(d => d.iso === fechaResaltada)) {
        const [yyyy, mm, dd] = fechaResaltada.split('-');
        dias.push({iso: fechaResaltada, etiqueta: `${dd}/${mm}/${yyyy}`});
    }

    let html = `
        <table class="tabla-horarios-cupos">
            <thead>
                <tr>
                    <th>Doctor Especialista</th>
                    <th>Turno / Horario</th>
                    ${dias.map(d => `<th class="${d.iso === fechaResaltada ? 'columna-fecha-activa' : ''}">${d.etiqueta}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    doctores.forEach(doc => {
        html += `
            <tr>
                <td rowspan="2" class="celda-doctor-horario"><strong>${doc.nombre}</strong></td>
                <td class="celda-turno-horario">Mañana<br><small>8:00 am - 1:00 pm</small></td>
                ${dias.map(d => {
            if ((doc.cuposMax.manana || 0) === 0) {
                return `<td><span class="badge-cupo no-atiende">No atiende</span></td>`;
            }
            const disp = obtenerCuposDisponiblesPorFecha(doc.id, d.iso).manana;
            if (disp <= 0) {
                return `<td><span class="badge-cupo agotado">Agotado (0)</span></td>`;
            }
            return `<td><span class="badge-cupo disponible">${disp} ${disp === 1 ? 'cupo' : 'cupos'}</span></td>`;
        }).join('')}
            </tr>
        `;

        html += `
            <tr>
                <td class="celda-turno-horario">Tarde<br><small>2:00 pm - 7:00 pm</small></td>
                ${dias.map(d => {
            if ((doc.cuposMax.tarde || 0) === 0) {
                return `<td><span class="badge-cupo no-atiende">No atiende</span></td>`;
            }
            const disp = obtenerCuposDisponiblesPorFecha(doc.id, d.iso).tarde;
            if (disp <= 0) {
                return `<td><span class="badge-cupo agotado">Agotado (0)</span></td>`;
            }
            return `<td><span class="badge-cupo disponible">${disp} ${disp === 1 ? 'cupo' : 'cupos'}</span></td>`;
        }).join('')}
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    contenedor.innerHTML = html;
}

// 5. VINCULACIÓN CON EL SELECTOR DE ESPECIALIDAD DESDE INICIO
function aplicarEspecialidadDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const especialidadParam = params.get('especialidad');
    const selectEspecialidad = document.getElementById('especialidad');

    if (especialidadParam && selectEspecialidad) {
        const existeOpcion = Array.from(selectEspecialidad.options).some(opt => opt.value === especialidadParam);
        if (existeOpcion) {
            selectEspecialidad.value = especialidadParam;
            selectEspecialidad.dispatchEvent(new Event('change'));
        }
    }
}

// 6. MODAL DE RESUMEN DE LA CITA
function inicializarModalResumen() {
    const modal = document.getElementById('modal-resumen-cita');
    const btnCerrar = document.getElementById('btn-cerrar-modal');

    if (!modal || !btnCerrar) return;

    btnCerrar.addEventListener('click', () => {
        modal.classList.remove('activo');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('activo');
        }
    });
}

function mostrarModalResumenCita(cita) {
    const modal = document.getElementById('modal-resumen-cita');
    const contenedorDetalle = document.getElementById('detalle-resumen-cita');
    const btnPerfil = document.getElementById('btn-ir-perfil-modal');

    if (!modal || !contenedorDetalle) return;

    const turnoDetalle = cita.turno === 'manana'
        ? 'Mañana (8:00 am - 1:00 pm)'
        : 'Tarde (2:00 pm - 7:00 pm)';

    contenedorDetalle.innerHTML = `
        <div class="fila-resumen"><span>Paciente:</span><strong>${cita.pacienteNombre} (DNI: ${cita.pacienteDni})</strong></div>
        <div class="fila-resumen"><span>Especialidad:</span><strong>${cita.especialidad}</strong></div>
        <div class="fila-resumen"><span>Doctor:</span><strong>${cita.doctorNombre}</strong></div>
        <div class="fila-resumen"><span>Modalidad:</span><strong>${cita.modalidad}</strong></div>
        <div class="fila-resumen"><span>Sede:</span><strong>${cita.sede}</strong></div>
        <div class="fila-resumen"><span>Fecha y Turno:</span><strong>${cita.fecha} — ${turnoDetalle}</strong></div>
        <div class="fila-resumen"><span>Contacto:</span><strong>${cita.contactoNombre} (${cita.telefonoContacto})</strong></div>
    `;

    const sesionActiva = localStorage.getItem('meddi_sesion_activa_email');
    if (btnPerfil) {
        btnPerfil.style.display = sesionActiva ? 'inline-block' : 'none';
    }

    modal.classList.add('activo');
}

function cancelarCita() {
    return true;
}

window.DOCTORES_SISTEMA = DOCTORES_SISTEMA;
window.cancelarCita = cancelarCita;

// 7. NAVEGACIÓN ENTRE PASOS DEL FORMULARIO
function siguientePaso(pasoActual) {
    const bloqueActual = document.querySelector(`.bloque-paso-${pasoActual}`);
    const camposObligatorios = bloqueActual.querySelectorAll('input[required], select[required], textarea[required]');
    let pasoValido = true;

    for (const campo of camposObligatorios) {
        if (!campo.checkValidity()) {
            campo.reportValidity();
            pasoValido = false;
            break;
        }
    }

    if (!pasoValido) return;
    irAPaso(pasoActual + 1);
}

function anteriorPaso(pasoActual) {
    irAPaso(pasoActual - 1);
}

function irAPaso(numeroPaso) {
    document.querySelectorAll('.bloque-paso').forEach((bloque, idx) => {
        bloque.classList.toggle('activo', idx === numeroPaso - 1);
    });
    document.querySelectorAll('.paso-item').forEach((ind, idx) => {
        ind.classList.toggle('activo', idx === numeroPaso - 1);
    });
}

function resetearPasosAlInicio() {
    irAPaso(1);
}