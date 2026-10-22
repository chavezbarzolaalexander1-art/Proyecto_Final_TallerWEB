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

        // Obtener la lista de usuarios (o array vacío si no existe)
        const usuarios = JSON.parse(localStorage.getItem('meddi_usuarios')) || [];

        // VALIDACIÓN: Verificar si el correo o el DNI ya existen
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

        // Agregar el nuevo usuario a la lista y guardar
        usuarios.push(nuevoUsuario);
        localStorage.setItem('meddi_usuarios', JSON.stringify(usuarios));

        // Iniciar sesión automáticamente
        localStorage.setItem('meddi_sesion_activa_email', nuevoUsuario.email);

        alert('¡Cuenta registrada exitosamente!');
        window.location.href = 'perfil.html';
    });
});