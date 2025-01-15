document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verifica si hay una sesión activa
        const response = await fetch('/check-session');
        const data = await response.json();

        if (data.loggedIn) {
            // Si ya está autenticado, redirige al index.html
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Error al verificar sesión:', error);
    }
});

document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Muestra el mensaje y redirige
            M.toast({ html: `✔️ ${data.message}`, classes: 'green darken-1' });
            setTimeout(() => {
                window.location.href = data.redirectUrl; // Redirige a la URL proporcionada
            }, 1500); // Espera 1.5 segundos para mostrar el mensaje antes de redirigir
        } else {
            // Muestra el mensaje de error
            M.toast({ html: `❌ ${data.message}`, classes: 'red darken-1' });
        }
    } catch (error) {
        M.toast({ html: `❌ Error: ${error.message}`, classes: 'red darken-1' });
    }
});

// JavaScript para alternar entre mostrar y ocultar las contraseñas
document.querySelectorAll('.toggle-password').forEach(function(toggle) {
    toggle.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const passwordField = document.getElementById(targetId);
        const type = passwordField.type === 'password' ? 'text' : 'password';
        passwordField.type = type;
        // Cambiar el ícono
        this.textContent = type === 'password' ? 'visibility' : 'visibility_off';
    });
});


document.querySelector('.register').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('registerModal').style.display = 'block';
});

document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', function () {
        document.getElementById('registerModal').style.display = 'none';
        clearFields();
    });
});

document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const userData = {
        fullName: document.getElementById('name').value,
        email: document.getElementById('email').value,
        username: document.getElementById('regUsername').value,
        password: document.getElementById('regPassword').value

    }

    console.log("Datos de registro", userData);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (response.ok) {
            M.toast({ html: `👤 Usuario creado`, classes: 'green darken-1' });
            document.getElementById('registerModal').style.display = 'none';
            clearFields();
        } else {
            M.toast({ html: `❌ ${data.message}`, classes: 'red darken-1' });
        }
    } catch (error) {
        M.toast({ html: `❌ Error: ${error.message}`, classes: 'red darken-1' });
    }
});

function clearFields() {
    // Limpiar valores de los campos
    document.getElementById('name').value = "";
    document.getElementById('email').value = "";
    document.getElementById('regUsername').value = "";
    document.getElementById('regPassword').value = "";

    // Remover clases de validación
    const fields = ['name', 'email', 'regUsername', 'regPassword'];
    fields.forEach(field => {
        const element = document.getElementById(field);
        element.classList.remove('valid', 'invalid'); // Eliminar estados de Materialize
    });

    // Actualizar visualización de etiquetas flotantes
    M.updateTextFields();
}


// Mostrar el modal "Olvidé mi contraseña"
document.querySelector('.forgot-password').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('forgotPasswordModal').style.display = 'flex';
});

// Cerrar el modal "Olvidé mi contraseña"
document.querySelectorAll('.modal-close').forEach(button => {
    button.addEventListener('click', function () {
        document.getElementById('forgotPasswordModal').style.display = 'none';
        clearEmailField();
    });
});

// Manejar el envío del formulario "Olvidé mi contraseña"
document.getElementById('forgotPasswordForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('forgotEmail').value;
    console.log("Correo de recuperación: ", email);

    try {
        const response = await fetch('/forgot-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        // Manejo de respuestas según el código de estado
        if (response.status === 404) {
            console.log("El correo no fue encontrado, pero mostramos un mensaje genérico.");
            M.toast({
                html: '📧 Revisa tu correo electrónico para restablecer tu contraseña',
                classes: 'green darken-1',
            });
            document.getElementById('forgotPasswordModal').style.display = 'none';
            clearEmailField();
        } else if (response.status === 500) {
            console.log("Error interno del servidor, pero mostramos un mensaje positivo.");
            M.toast({
                html: '📧 Revisa tu correo electrónico para restablecer tu contraseña',
                classes: 'green darken-1',
            });
            document.getElementById('forgotPasswordModal').style.display = 'none';
            clearEmailField();
        } else if (response.ok) {
            M.toast({
                html: '📧 Revisa tu correo electrónico para restablecer tu contraseña',
                classes: 'green darken-1',
            });
            document.getElementById('forgotPasswordModal').style.display = 'none';
            clearEmailField();
        } else {
            // Manejo de otros errores
            const errorMessage = await response.text();
            M.toast({
                html: `❌ Error: ${errorMessage || 'Ocurrió un error inesperado'}`,
                classes: 'red darken-1',
            });
        }
    } catch (error) {
        // Manejo de errores de red o inesperados
        M.toast({ html: `❌ Error de red: ${error.message}`, classes: 'red darken-1' });
    }
});


function clearEmailField() {
    document.getElementById("forgotEmail").value = "";
    document.getElementById("forgotEmail").classList.remove('valid', 'invalid');
    M.updateTextFields();
}