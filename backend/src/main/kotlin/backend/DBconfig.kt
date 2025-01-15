package backend

import org.litote.kmongo.KMongo
import org.litote.kmongo.getCollection
import java.util.Date
import org.bson.types.ObjectId
import kotlinx.serialization.Serializable
import kotlinx.serialization.*

import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

object DBconfig {
    private val client = KMongo.createClient() // Conexión predeterminada (mongodb://localhost:27017)
    private val database = client.getDatabase("tasksDB") // Cambia esto por tu DB

    val usersCollection = database.getCollection<Users>("users") // Colección "usuarios"
    val tasksCollection = database.getCollection<Task>("tasks")
}

@Serializable
data class Users(
    @Serializable(with = ObjectIdSerializer::class) var _id: ObjectId? = null,
    val fullName: String? = null,
    val email: String? = null,
    val username: String? = null,
    val password: String? = null,
)

@Serializable
data class Task(
    @Serializable(with = ObjectIdSerializer::class) var _id: ObjectId? = null,
    //var _id: String? = null,
    //val taskId: String,
    val userId: String,
    val title: String,
    val description: String,
    val status: String,
    val priority: String,
    val dueDate: String,
    val createdAt: String
)

object ObjectIdSerializer : KSerializer<ObjectId> {
    override val descriptor: SerialDescriptor =
        PrimitiveSerialDescriptor("ObjectId", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: ObjectId) {
        encoder.encodeString(value.toHexString())
    }

    override fun deserialize(decoder: Decoder): ObjectId {
        return ObjectId(decoder.decodeString())
    }
}
