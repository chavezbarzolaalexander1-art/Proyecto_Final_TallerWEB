document.addEventListener('DOMContentLoaded', () => {
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

        // Si las credenciales son correctas, guardamos la sesión activa
        localStorage.setItem('meddi_sesion_activa_email', usuarioEncontrado.email);
        window.location.href = 'perfil.html';
    });
});