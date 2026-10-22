document.addEventListener('DOMContentLoaded', () => {
    actualizarBarraNavegacion();
});

function actualizarBarraNavegacion() {
    const emailActivo = localStorage.getItem('meddi_sesion_activa_email');
    const menu = document.querySelector('.menu-navegacion');
    if (!menu) return;

    const btnLogin = menu.querySelector('.Login-Boton')?.parentElement;
    const btnRegister = menu.querySelector('.Register-Boton')?.parentElement;

    // Calcular la ruta correcta a Autth/perfil.html según la ubicación actual
    const path = window.location.pathname;
    let rutaPerfil = 'Autth/perfil.html';

    if (path.includes('/Autth/')) {
        rutaPerfil = 'perfil.html';
    } else if (
        path.includes('/Servicios/') || path.includes('/Especialidades/') ||
        path.includes('/Staff/') || path.includes('/Nosotros/') ||
        path.includes('/Blog/') || path.includes('/Contactanos/') ||
        path.includes('/Agendar_Cita/')
    ) {
        rutaPerfil = '../Autth/perfil.html';
    }

    let itemPerfil = document.getElementById('item-perfil-menu');

    if (emailActivo) {
        // Ocultar botones de Login y Register
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnRegister) btnRegister.style.display = 'none';

        // Insertar o actualizar el botón "Mi Perfil"
        if (!itemPerfil) {
            itemPerfil = document.createElement('li');
            itemPerfil.id = 'item-perfil-menu';
            itemPerfil.className = 'Boton-menu';
            itemPerfil.innerHTML = `<a href="${rutaPerfil}" class="Perfil-Boton">Mi Perfil</a>`;
            menu.appendChild(itemPerfil);
        } else {
            itemPerfil.style.display = 'block';
            const link = itemPerfil.querySelector('a');
            if (link) link.href = rutaPerfil;
        }
    } else {
        if (btnLogin) btnLogin.style.display = '';
        if (btnRegister) btnRegister.style.display = '';
        if (itemPerfil) itemPerfil.style.display = 'none';
    }
}