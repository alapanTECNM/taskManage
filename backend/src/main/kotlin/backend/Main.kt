package backend

import backend.DBconfig.usersCollection
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.http.content.*
import org.litote.kmongo.*
import io.ktor.server.request.receive
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.sessions.*
import kotlinx.serialization.Serializable
import org.bson.types.ObjectId
import org.bson.Document
import org.litote.kmongo.eq

// Función principal para ejecutar el servidor
fun main() {
    embeddedServer(
        Netty,
        watchPaths = listOf("webMongoDB"),
        module = Application::myapp,
        port = 8080
    ).start(wait = true)
}

// Función `module` para la configuración del servidor
fun Application.myapp() {
    // Instala el plugin de ContentNegotiation para manejar JSON
    install(ContentNegotiation) {
        json()
    }

    // Instala el plugin de sesiones
    install(Sessions) {
        cookie<UserSession>("USER_SESSION", storage = SessionStorageMemory()) {
            cookie.path = "/"
            cookie.httpOnly = true // Seguridad adicional
            cookie.extensions["SameSite"] = "Strict" // Protección contra CSRF
        }
    }

    routing {
        // Ruta para servir archivos estáticos
        static("/") {
            resources("static") // Carpeta con los archivos HTML, CSS, JS
            defaultResource("/static/login.html") // Archivo por defecto
        }

        // Ruta para manejar el login
        post("/login") {
            val credentials = call.receive<Credentials>() // Recibe datos del cliente

            // Busca el usuario en la base de datos
            val user = usersCollection.findOne(Users::username eq credentials.username)
            println("Usuario encontrado: $user")

            if (user != null && user.password == credentials.password) {
                // Establece la sesión del usuario con _id

                call.sessions.set(UserSession(userId = user._id.toString()))
                call.respond(HttpStatusCode.OK, mapOf("message" to "Login exitoso", "redirectUrl" to "/index.html"))
                println("Login exitoso")
            } else {
                call.respond(HttpStatusCode.Unauthorized, mapOf("message" to "Credenciales incorrectas"))
                println("Credenciales incorrectas")
            }
        }

        post("/register") {
            println("Registro en progreso")
            val registerData = call.receive<Users>()
            println("Usuario a registrar: $registerData")

            // Validar si el usuario ya existe por username
            val existingUser = DBconfig.usersCollection.findOne(Users::username eq registerData.username)

            // Validar si el email ya existe
            val existingEmail = DBconfig.usersCollection.findOne(Users::email eq registerData.email)

            if (existingUser != null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("message" to "El nombre de usuario ya existe"))
            } else if (existingEmail != null) {
                call.respond(HttpStatusCode.BadRequest, mapOf("message" to "El correo electrónico ya está registrado"))
            } else {
                // Si no existen duplicados, registrar el usuario
                DBconfig.usersCollection.insertOne(registerData)
                call.respond(HttpStatusCode.OK, mapOf("message" to "Registro exitoso"))
            }
        }


        // Recuperar contraseña
        put("/forgot-password") {
            println("Reseteando contraseña...")

            try {
                // Leer y deserializar el JSON recibido
                val emailReset = call.receive<Users>() // Asegúrate de que la clase `Users` tenga una propiedad `email`
                println("Dato del correo recibido: $emailReset")
                val email = emailReset.email
                println("Correo: $email")

                if (email.isNullOrEmpty()) {
                    call.respond(HttpStatusCode.BadRequest, "El correo electrónico es requerido")
                    return@put
                }

                // Buscar al usuario por correo electrónico
                val user = DBconfig.usersCollection.findOne(Users::email eq email)

                if (user == null) {
                    call.respond(HttpStatusCode.NotFound, "Usuario no encontrado con el correo proporcionado")
                    return@put
                }

                // Generar una nueva contraseña predeterminada
                val defaultPassword = "Default@123" // Define tu contraseña predeterminada

                // Actualizar la contraseña en la base de datos
                val updateResult = DBconfig.usersCollection.updateOne(
                    Users::_id eq user._id, // Filtrar por el ID del usuario encontrado
                    setValue(Users::password, defaultPassword) // Actualizar el campo de la contraseña
                )

                println("updateResult: $updateResult")

                if (updateResult.modifiedCount > 0) {
                    call.respond(HttpStatusCode.OK, "La contraseña ha sido restablecida con éxito")
                } else {
                    call.respond(HttpStatusCode.InternalServerError, "Error al actualizar la contraseña")
                }

            } catch (e: Exception) {
                println("Error al restablecer contraseña: ${e.message}")
                call.respond(HttpStatusCode.InternalServerError, "Error interno del servidor")
            }
        }


        put("/update-user") {
            println("Editando usuario...")
            try {
                // Leer y deserializar el JSON recibido
                val updateUser = call.receive<Users>()
                println("Datos usuario modificados: $updateUser")

                // Crea una lista de actualizaciones a partir de los datos recibidos
                val updates = Document()
                updateUser.fullName?.let { updates["fullName"] = it }
                updateUser.email?.let { updates["email"] = it }
                updateUser.username?.let { updates["username"] = it }
                updateUser.password?.let { updates["password"] = it }

                println("updates: $updates")

                if (updates.isEmpty()) {
                    call.respond(HttpStatusCode.BadRequest, "No se proporcionaron datos para actualizar")
                    return@put
                }

                // Realizar la operación de actualización en la colección
                val userId = call.sessions.get<UserSession>()?.userId
                println("Actual userId: $userId")
                val updateResult = DBconfig.usersCollection.updateOne(
                    Users::_id eq ObjectId(userId), // Filtro para encontrar el documento por ID
                    Document("\$set", updates) // Actualización usando $set
                )

                println("updateResult: $updateResult")

                if (updateResult.modifiedCount > 0) {
                    call.respond(HttpStatusCode.OK, "Tarea actualizada con éxito")
                } else {
                    call.respond(HttpStatusCode.NotFound, "Tarea no encontrada")
                }


            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, "ID de tarea inválido")
            }
        }



        // Manage tasks
        // Ruta para obtener las tareas del usuario
        get("/profileData") {
            val session = call.sessions.get<UserSession>()
            if (session != null) {
                val profileData = DBconfig.usersCollection.findOneById(ObjectId(session.userId))
                call.respond(profileData as Any)
            } else {
                call.respond(HttpStatusCode.Unauthorized, "No autorizado")
            }
        }

        get("/tasks") {
            val session = call.sessions.get<UserSession>()
            if (session != null) {
                val userTasks = DBconfig.tasksCollection
                    .find("{ 'userId': '${session.userId}' }")
                    .toList()
                call.respond(userTasks)
            } else {
                call.respond(HttpStatusCode.Unauthorized, "No autorizado")
            }
        }



        // Ruta para agregar una tarea
        post("/tasks") {
            try {
                val newTask = call.receive<Task>()
                println("Creando tasks, datos recibidos: $newTask")

                // Generar _id para task
                val newTaskId = ObjectId()
                newTask._id = newTaskId
                println("id de la task guardada: $newTaskId")

                // Guardar en MongoDB
                DBconfig.tasksCollection.insertOne(newTask)

                // Responder al cliente
                call.respond(
                    mapOf(
                        "message" to "Tarea agregada exitosamente",
                        "status" to "ok",
                        "_id" to newTaskId.toString()
                    )
                )
            } catch (e: Exception) {
                call.respond(mapOf("error" to e.message))
            }
        }

        delete("/tasks/{taskId}") {
            val taskId = call.parameters["taskId"]

            println("Deletando task: $taskId")

            if (taskId == null) {
                call.respond(HttpStatusCode.BadRequest, "El ID de la tarea es requerido")
                return@delete
            }

            val result = DBconfig.tasksCollection.deleteOneById(ObjectId(taskId))

            if (result.deletedCount > 0) {
                call.respond(HttpStatusCode.OK, "Tarea eliminada con éxito")
            } else {
                call.respond(HttpStatusCode.NotFound, "Tarea no encontrada")
            }
        }

        // Ruta para actualizar datos
        put("/tasks/{taskId}") {
            val taskId = call.parameters["taskId"]
            println("Task a editar: $taskId")

            if (taskId == null) {
                call.respond(HttpStatusCode.BadRequest, "El ID de la tarea es requerido")
                return@put
            }

            try {
                val objectId = ObjectId(taskId) // Convertir taskId a ObjectId

                // Leer y deserializar el JSON recibido
                val updateRequest = call.receive<Task>()

                println("updateRequest: $updateRequest")

                // Crea una lista de actualizaciones a partir de los datos recibidos
                val updates = Document()
                updateRequest.title?.let { updates["title"] = it }
                updateRequest.description?.let { updates["description"] = it }
                updateRequest.priority?.let { updates["priority"] = it }
                updateRequest.dueDate?.let { updates["dueDate"] = it }

                println("updates: $updates")

                if (updates.isEmpty()) {
                    call.respond(HttpStatusCode.BadRequest, "No se proporcionaron datos para actualizar")
                    return@put
                }

                // Realizar la operación de actualización en la colección
                val updateResult = DBconfig.tasksCollection.updateOne(
                    Task::_id eq objectId, // Filtro para encontrar el documento por ID
                    Document("\$set", updates) // Actualización usando $set
                )

                println("updateResult: $updateResult")

                if (updateResult.modifiedCount > 0) {
                    call.respond(HttpStatusCode.OK, "Tarea actualizada con éxito")
                } else {
                    call.respond(HttpStatusCode.NotFound, "Tarea no encontrada")
                }


            } catch (e: IllegalArgumentException) {
                call.respond(HttpStatusCode.BadRequest, "ID de tarea inválido")
            }
        }



        get("/check-session") {
            val session = call.sessions.get<UserSession>()
            if (session != null) {
                val userId = ObjectId(session.userId) // Obtenemos el ObjectId de la sesión
                val user = usersCollection.findOneById(userId) // Buscamos el usuario por su _id
                if (user != null) {
                    call.respond(SessionResponse(loggedIn = true, username = user.username)) // Devolvemos la sesión con el username
                } else {
                    call.respond(SessionResponse(loggedIn = false)) // Sesión inválida si no se encuentra el usuario
                }
            } else {
                call.respond(SessionResponse(loggedIn = false)) // No hay sesión
            }
        }


        // Ruta para cerrar sesión
        get("/logout") {
            call.sessions.clear<UserSession>()
            call.respondRedirect("/")
        }


        // Ruta para verificar la conexión con MongoDB
        get("/mongo-status") {
            try {
                // Verificar si la colección existe
                val count = usersCollection.countDocuments()
                call.respondText("Conexión a Mongo exitosa. Documentos en la colección: $count")
            } catch (e: Exception) {
                call.respondText("Error al conectar con Mongo: ${e.message}")
            }
        }
    }
}

// Clases para manejar los datos y sesiones
@Serializable
data class Credentials(
    val username: String,
    val password: String)

@Serializable
data class UserSession(val userId: String)

@Serializable
data class SessionResponse(
    val loggedIn: Boolean,
    val username: String? = null
)