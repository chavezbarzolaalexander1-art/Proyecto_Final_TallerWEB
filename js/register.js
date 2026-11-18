document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.querySelector('.auth-card--register .auth-form');
    if (!formRegistro) return;

    formRegistro.addEventListener('submit', (e) => {
        e.preventDefault();

        const nuevoUsuario = {
            nombres: document.getElementById('reg-nombres').value.trim(),
            apellidos: document.getElementById('reg-apellidos').value.trim(),
            dni: document.getElementById('reg-dni').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };

        const usuarios = JSON.parse(localStorage.getItem('meddi_usuarios')) || [];

        const existeEmail = usuarios.some(u => u.email.toLowerCase() === nuevoUsuario.email.toLowerCase());
        const existeDni = usuarios.some(u => u.dni === nuevoUsuario.dni);

        if (existeEmail) {
            alert('El correo electrónico ya se encuentra registrado. Intenta iniciar sesión.');
            return;
        }

        if (existeDni) {
            alert('El Documento de Identidad (DNI) ya está registrado en el sistema.');
            return;
        }

        usuarios.push(nuevoUsuario);
        localStorage.setItem('meddi_usuarios', JSON.stringify(usuarios));

        localStorage.setItem('meddi_sesion_activa_email', nuevoUsuario.email);
        localStorage.setItem('meddi_es_admin', 'false');

        alert('¡Cuenta registrada exitosamente!');

        const urlRetorno = sessionStorage.getItem('meddi_redirect_post_login');
        if (urlRetorno) {
            sessionStorage.removeItem('meddi_redirect_post_login');
            window.location.href = urlRetorno;
        } else {
            window.location.href = 'perfil.html';
        }
    });
});