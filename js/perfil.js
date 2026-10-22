document.addEventListener('DOMContentLoaded', () => {
    const emailActivo = localStorage.getItem('meddi_sesion_activa_email');

    // Protección de ruta: si no hay sesión activa, redirige a login
    if (!emailActivo && window.location.pathname.includes('perfil.html')) {
        window.location.href = 'login.html';
        return;
    }

    cargarDatosUsuario(emailActivo);
    gestionarAcciones(emailActivo);
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
    // Cerrar Sesión
    const btnLogout = document.getElementById('btn-cerrar-sesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('meddi_sesion_activa_email');
            window.location.href = '../index.html';
        });
    }

    // Eliminar Cuenta
    const btnEliminar = document.getElementById('btn-eliminar-cuenta');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', () => {
            const confirmacion = confirm('¿Estás seguro de que deseas eliminar tu cuenta? Se borrarán permanentemente tus datos.');

            if (confirmacion) {
                let usuarios = JSON.parse(localStorage.getItem('meddi_usuarios')) || [];

                // Filtrar para remover únicamente al usuario actual
                usuarios = usuarios.filter(u => u.email.toLowerCase() !== emailActivo.toLowerCase());

                localStorage.setItem('meddi_usuarios', JSON.stringify(usuarios));
                localStorage.removeItem('meddi_sesion_activa_email');

                alert('Tu cuenta ha sido eliminada correctamente.');
                window.location.href = '../index.html';
            }
        });
    }
}