document.addEventListener('DOMContentLoaded', () => {
    const formContacto = document.querySelector('.formulario-contacto');
    if (!formContacto) return;

    restaurarBorradorContacto();

    formContacto.addEventListener('submit', (e) => {
        e.preventDefault();

        // VALIDAR SI EL USUARIO ESTÁ LOGUEADO ANTES DE ENVIAR
        const emailSesion = localStorage.getItem('meddi_sesion_activa_email');
        if (!emailSesion) {
            guardarBorradorContacto();
            sessionStorage.setItem('meddi_redirect_post_login', '../Contactanos/index.html');
            alert('Debes iniciar sesión para enviar un mensaje. Hemos guardado tu progreso para que continúes al ingresar.');
            window.location.href = '../Autth/login.html';
            return;
        }

        const selectServicio = document.getElementById('servicio-interes');
        const servicioTexto = selectServicio && selectServicio.selectedIndex > 0
            ? selectServicio.options[selectServicio.selectedIndex].text
            : 'Consulta general';

        const ahora = new Date();
        const fechaRegistro = ahora.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const nuevoMensaje = {
            id: 'msg-' + Date.now(),
            nombre: document.getElementById('nombre-contacto').value.trim(),
            correo: document.getElementById('correo-contacto').value.trim(),
            telefono: document.getElementById('telefono-contacto').value.trim(),
            servicio: servicioTexto,
            mensaje: document.getElementById('mensaje-contacto').value.trim(),
            fecha: fechaRegistro
        };

        const mensajesGuardados = JSON.parse(localStorage.getItem('meddi_mensajes_contacto')) || [];
        mensajesGuardados.push(nuevoMensaje);
        localStorage.setItem('meddi_mensajes_contacto', JSON.stringify(mensajesGuardados));

        sessionStorage.removeItem('meddi_borrador_contacto');
        alert('¡Mensaje enviado correctamente! Nuestro equipo se pondrá en contacto contigo.');
        formContacto.reset();
    });
});

function guardarBorradorContacto() {
    const borrador = {
        nombre: document.getElementById('nombre-contacto')?.value || '',
        correo: document.getElementById('correo-contacto')?.value || '',
        telefono: document.getElementById('telefono-contacto')?.value || '',
        servicio: document.getElementById('servicio-interes')?.value || '',
        mensaje: document.getElementById('mensaje-contacto')?.value || ''
    };
    sessionStorage.setItem('meddi_borrador_contacto', JSON.stringify(borrador));
}

function restaurarBorradorContacto() {
    const borradorStr = sessionStorage.getItem('meddi_borrador_contacto');
    if (!borradorStr) return;

    const borrador = JSON.parse(borradorStr);
    if (document.getElementById('nombre-contacto')) document.getElementById('nombre-contacto').value = borrador.nombre || '';
    if (document.getElementById('correo-contacto')) document.getElementById('correo-contacto').value = borrador.correo || '';
    if (document.getElementById('telefono-contacto')) document.getElementById('telefono-contacto').value = borrador.telefono || '';
    if (document.getElementById('servicio-interes') && borrador.servicio) {
        document.getElementById('servicio-interes').value = borrador.servicio;
    }
    if (document.getElementById('mensaje-contacto')) document.getElementById('mensaje-contacto').value = borrador.mensaje || '';

    sessionStorage.removeItem('meddi_borrador_contacto');
}