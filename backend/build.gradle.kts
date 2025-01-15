import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    kotlin("jvm")
    id("io.ktor.plugin") version "2.3.4" // Cambia el número de versión según el que estés usando
    kotlin("plugin.serialization") version "1.9.10"
    application
}

group = "com.alapan"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    implementation("io.ktor:ktor-server-core:2.3.4") // Core de Ktor
    implementation("io.ktor:ktor-server-netty:2.3.4") // Netty para el servidor
    implementation("io.ktor:ktor-server-content-negotiation:2.3.4") // Para JSON (opcional)
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.4") // Serialización con kotlinx-json
    implementation("io.ktor:ktor-server-html-builder:2.3.4") // Para generar HTML dinámico (opcional)
    implementation("io.ktor:ktor-server-sessions:2.3.4") // Soporte para sesiones en Ktor
    implementation("org.mongodb:mongodb-driver-core:4.10.1") // Verifica la versión actual
    implementation("org.litote.kmongo:kmongo-coroutine:4.9.0") // Versión más reciente

    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0") // kotlinx serialization-json
    implementation("org.litote.kmongo:kmongo:4.10.0") // KMongo para MongoDB
    implementation("org.slf4j:slf4j-simple:2.0.7") // Logging

    testImplementation(kotlin("test")) // Pruebas
}

tasks.test {
    useJUnitPlatform()
}

// Configura la tarea personalizada `runDev`
tasks.register<JavaExec>("runDev") {
    group = "application" // Para categorizar la tarea
    mainClass.set("backend.MainKt") // Asegúrate de que sea la clase principal del backend
    classpath = sourceSets["main"].runtimeClasspath
    jvmArgs = listOf("-Dio.ktor.development=true") // Activa el modo desarrollo
}

application {
    mainClass.set("backend.MainKt") // Clase principal del backend
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17) // O usa "21" si prefieres JVM 21
    }
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17)) // Cambia a 21 si usas Corretto 21
        vendor.set(JvmVendorSpec.matching("Amazon")) // Especifica el uso de Amazon Corretto
    }
}