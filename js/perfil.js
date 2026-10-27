document.addEventListener('DOMContentLoaded', () => {
    const emailActivo = localStorage.getItem('meddi_sesion_activa_email');

    if (!emailActivo && window.location.pathname.includes('perfil.html')) {
        window.location.href = 'login.html';
        return;
    }

    cargarDatosUsuario(emailActivo);
    gestionarAcciones(emailActivo);
    cargarCitasUsuario(emailActivo);
    inicializarManejadorBorradoCitas(emailActivo);
});

function cargarDatosUsuario(emailActivo) {
    const usuarios = JSON.parse(localStorage.getItem('meddi_usuarios')) || [];
    const usuario = usuarios.find(u => u.email.toLowerCase() === emailActivo.toLowerCase());

    if (!usuario) return;

    const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.trim();

    if (document.getElementById('perfil-nombre-header')) document.getElementById('perfil-nombre-header').textContent = nombreCompleto;
    if (document.getElementById('perfil-nombre-completo')) document.getElementById('perfil-nombre-completo').textContent = nombreCompleto;
    if (document.getElementById('perfil-dni')) document.getElementById('perfil-dni').textContent = usuario.dni;
    if (document.getElementById('perfil-telefono')) document.getElementById('perfil-telefono').textContent = usuario.telefono;
    if (document.getElementById('perfil-email')) document.getElementById('perfil-email').textContent = usuario.email;
}

function gestionarAcciones(emailActivo) {
    const btnLogout = document.getElementById('btn-cerrar-sesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('meddi_sesion_activa_email');
            window.location.href = '../index.html';
        });
    }

    const btnEliminar = document.getElementById('btn-eliminar-cuenta');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => {
            const confirmacion = confirm('¿Estás seguro de que deseas eliminar tu cuenta? Se borrarán permanentemente tus datos.');

            if (confirmacion) {
                let usuarios = JSON.parse(localStorage.getItem('meddi_usuarios')) || [];
                usuarios = usuarios.filter(u => u.email.toLowerCase() !== emailActivo.toLowerCase());

                localStorage.setItem('meddi_usuarios', JSON.stringify(usuarios));
                localStorage.removeItem('meddi_sesion_activa_email');

                alert('Tu cuenta ha sido eliminada correctamente.');
                window.location.href = '../index.html';
            }
        });
    }
}

// =========================================================
// GESTIÓN Y TABLA DE CITAS
// =========================================================
function cargarCitasUsuario(emailActivo) {
    const tbody = document.getElementById('cuerpo-tabla-citas');
    const checkTodo = document.getElementById('check-seleccionar-todo');
    const btnBorrar = document.getElementById('btn-borrar-citas');

    if (!tbody) return;

    const todasLasCitas = JSON.parse(localStorage.getItem('meddi_citas')) || [];
    const citasUsuario = todasLasCitas.filter(c => c.emailUsuario.toLowerCase() === emailActivo.toLowerCase());

    tbody.innerHTML = '';
    if (checkTodo) checkTodo.checked = false;
    if (btnBorrar) btnBorrar.disabled = true;

    if (citasUsuario.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="tabla-vacia">No tienes citas programadas actualmente.</td>
            </tr>
        `;
        if (checkTodo) checkTodo.disabled = true;
        return;
    }

    if (checkTodo) checkTodo.disabled = false;

    citasUsuario.forEach(cita => {
        const tr = document.createElement('tr');
        const turnoTexto = cita.turno === 'manana' ? 'Mañana' : 'Tarde';

        tr.innerHTML = `
            <td><input type="checkbox" class="check-cita" data-id="${cita.id}"></td>
            <td>${cita.pacienteNombre}</td>
            <td>${cita.especialidad}</td>
            <td>${cita.doctorNombre}</td>
            <td>${cita.fecha}</td>
            <td><span class="badge-turno ${cita.turno}">${turnoTexto}</span></td>
            <td>${cita.modalidad}</td>
        `;
        tbody.appendChild(tr);
    });

    configurarEventosCheckboxes();
}

function configurarEventosCheckboxes() {
    const checkTodo = document.getElementById('check-seleccionar-todo');
    const checksIndividuales = document.querySelectorAll('.check-cita');
    const btnBorrar = document.getElementById('btn-borrar-citas');

    if (checkTodo) {
        checkTodo.onclick = () => {
            checksIndividuales.forEach(chk => chk.checked = checkTodo.checked);
            actualizarEstadoBotonBorrar();
        };
    }

    checksIndividuales.forEach(chk => {
        chk.onchange = () => {
            if (!chk.checked && checkTodo) checkTodo.checked = false;
            actualizarEstadoBotonBorrar();
        };
    });
}

function actualizarEstadoBotonBorrar() {
    const btnBorrar = document.getElementById('btn-borrar-citas');
    const seleccionados = document.querySelectorAll('.check-cita:checked').length;

    if (btnBorrar) {
        btnBorrar.disabled = seleccionados === 0;
        btnBorrar.textContent = seleccionados > 0
            ? `Borrar (${seleccionados})`
            : 'Borrar seleccionadas';
    }
}

function inicializarManejadorBorradoCitas(emailActivo) {
    const btnBorrar = document.getElementById('btn-borrar-citas');
    if (!btnBorrar) return;

    btnBorrar.addEventListener('click', () => {
        const seleccionados = Array.from(document.querySelectorAll('.check-cita:checked'))
            .map(chk => chk.getAttribute('data-id'));

        if (seleccionados.length === 0) return;

        const confirmacion = confirm(`¿Estás seguro de cancelar y borrar las ${seleccionados.length} citas seleccionadas?`);
        if (!confirmacion) return;

        let todasLasCitas = JSON.parse(localStorage.getItem('meddi_citas')) || [];
        const citasABorrar = todasLasCitas.filter(c => seleccionados.includes(c.id));

        // RESTAURAR CUPOS RESPETANDO CAPACIDADES MÁXIMAS
        citasABorrar.forEach(cita => {
            if (typeof window.cancelarCita === 'function') {
                window.cancelarCita(cita.doctorId, cita.turno);
            }
        });

        // FILTRAR LOCALSTORAGE
        todasLasCitas = todasLasCitas.filter(c => !seleccionados.includes(c.id));
        localStorage.setItem('meddi_citas', JSON.stringify(todasLasCitas));

        alert('Las citas seleccionadas han sido canceladas y borradas correctamente.');
        cargarCitasUsuario(emailActivo);
    });
}