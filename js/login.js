document.addEventListener('DOMContentLoaded', () => {
    inicializarAdminPorDefecto();

    const formLogin = document.querySelector('.auth-card:not(.auth-card--register) .auth-form');
    if (!formLogin) return;

    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const usuarios = JSON.parse(localStorage.getItem('meddi_usuarios')) || [];

        // Buscar el usuario por su correo
        const usuarioEncontrado = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!usuarioEncontrado) {
            alert('No existe ninguna cuenta con este correo electrónico. Por favor, regístrate.');
            return;
        }

        if (usuarioEncontrado.password !== password) {
            alert('La contraseña ingresada es incorrecta.');
            return;
        }

        // Guardamos la sesión activa y verificamos si tiene rol de administrador
        localStorage.setItem('meddi_sesion_activa_email', usuarioEncontrado.email);
        localStorage.setItem('meddi_es_admin', usuarioEncontrado.rol === 'admin' ? 'true' : 'false');

        window.location.href = 'perfil.html';
    });
});

// Crea la cuenta administrador en localStorage si no existe
function inicializarAdminPorDefecto() {
    const usuarios = JSON.parse(localStorage.getItem('meddi_usuarios')) || [];
    const adminEmail = 'admin@medikali.pe';

    const existeAdmin = usuarios.some(u => u.email.toLowerCase() === adminEmail);

    if (!existeAdmin) {
        const cuentaAdmin = {
            nombres: 'Administrador',
            apellidos: 'Meddi',
            dni: '00000000',
            telefono: '960398072',
            email: adminEmail,
            password: 'admin123',
            rol: 'admin'
        };
        usuarios.push(cuentaAdmin);
        localStorage.setItem('meddi_usuarios', JSON.stringify(usuarios));
    }
}