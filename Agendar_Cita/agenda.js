// Función para avanzar al siguiente paso
function siguientePaso(pasoActual) {
    // 1. Buscamos el contenedor del paso actual
    const bloqueActual = document.querySelector(`.bloque-paso-${pasoActual}`);

    // 2. Seleccionamos solo los inputs obligatorios (required) de ESTE paso
    const camposObligatorios = bloqueActual.querySelectorAll('input[required], select[required], textarea[required]');
    let pasoValido = true;

    // 3. Revisamos uno por uno si están completos
    camposObligatorios.forEach(campo => {
        if (!campo.checkValidity()) {
            campo.reportValidity(); // Muestra el mensaje flotante del navegador si está vacío
            pasoValido = false;
            return;
        }
    });

    // Si falta llenar algún campo obligatorio, cortamos la función aquí y no avanza
    if (!pasoValido) return;

    // 4. Ocultamos el paso actual quitándole la clase 'activo'
    bloqueActual.classList.remove('activo');

    // 5. Mostramos el paso siguiente agregándole la clase 'activo'
    const siguienteBloque = document.querySelector(`.bloque-paso-${pasoActual + 1}`);
    if (siguienteBloque) {
        siguienteBloque.classList.add('activo');
    }

    // 6. Actualizamos los colores de la barra de progreso de arriba
    document.querySelector(`#indicador-${pasoActual}`).classList.remove('activo');
    document.querySelector(`#indicador-${pasoActual + 1}`).classList.add('activo');
}

// Función para retroceder al paso anterior
function anteriorPaso(pasoActual) {
    // 1. Ocultamos el paso actual
    const bloqueActual = document.querySelector(`.bloque-paso-${pasoActual}`);
    bloqueActual.classList.remove('activo');

    // 2. Mostramos el paso anterior
    const pasoAnterior = document.querySelector(`.bloque-paso-${pasoActual - 1}`);
    if (pasoAnterior) {
        pasoAnterior.classList.add('activo');
    }

    // 3. Actualizamos la barra de progreso
    document.querySelector(`#indicador-${pasoActual}`).classList.remove('activo');
    document.querySelector(`#indicador-${pasoActual - 1}`).classList.add('activo');
}