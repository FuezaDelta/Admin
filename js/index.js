import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA8HzpUL5LAvOCk6nmZvd_mB2vAB7FSYME",
    authDomain: "fuerza-delta.firebaseapp.com",
    projectId: "fuerza-delta",
    storageBucket: "fuerza-delta.appspot.com",
    messagingSenderId: "273501560145",
    appId: "1:273501560145:web:e6f01a832b054e01e1c770"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("fechaNacimiento").addEventListener("change", function () {
    const nacimiento = new Date(this.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    document.getElementById("edad").value = edad;
});

window.buscarCliente = async function () {
    const cedula = document.getElementById("cedula").value;
    if (!cedula) {
        alert("Por favor ingresa una cédula para buscar.");
        return;
    }
    const ref = doc(db, "clientes", cedula);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const c = snap.data();
        document.getElementById("nombre").value = c.nombre || "";
        document.getElementById("telefono").value = c.telefono || "";
        document.getElementById("fechaNacimiento").value = c.fechaNacimiento || "";
        document.getElementById("edad").value = c.edad || "";
        document.getElementById("sexo").value = c.sexo || "Masculino";
        document.getElementById("plan").value = c.plan || "1";
        document.getElementById("fechaIngreso").value = c.fechaIngreso || "";
        document.getElementById("valorPagado").value = c.valorPagado || "";

        const hoy = new Date();
        const fechaVencimiento = new Date(c.fechaVencimiento);
        const estado = hoy <= fechaVencimiento
            ? "<span class='estado-activo'>Activo</span>"
            : "<span class='estado-vencido'>Vencido</span>";

        document.getElementById("resultado").innerHTML =
            `Cliente encontrado. Estado de la membresía: ${estado}`;
    } else {
        document.getElementById("resultado").innerText = "⚠️ Cliente no encontrado. Puedes registrar uno nuevo.";
        document.getElementById("registro").reset();
        document.getElementById("cedula").value = cedula;
    }
};

window.buscarClientePorApellido = async function () {
    const apellidoBusqueda = document.getElementById("apellidoBusqueda").value;
    const resultadosContainer = document.getElementById("resultadosBusquedaApellido");

    if (!apellidoBusqueda) {
        alert("Por favor ingresa un apellido para buscar.");
        resultadosContainer.innerHTML = "";
        return;
    }

    resultadosContainer.innerHTML = "<p>Buscando clientes cuyo nombre contiene: <strong>" + apellidoBusqueda + "</strong>...</p>";

    try {
        const clientesSnap = await getDocs(collection(db, "clientes"));
        let resultados = [];

        clientesSnap.forEach((docu) => {
            const data = docu.data();
            if (data.nombre && data.nombre.toLowerCase().includes(apellidoBusqueda.toLowerCase())) {
                resultados.push({ id: docu.id, ...data });
            }
        });

        resultadosContainer.innerHTML = "";

        if (resultados.length > 0) {
            let listaHTML = "<h3>Clientes encontrados cuyo nombre contiene: " + apellidoBusqueda + "</h3><ul>";
            resultados.forEach(cliente => {
                listaHTML += `<li><strong>${cliente.nombre}</strong> - Cédula: ${cliente.cedula} - Teléfono: ${cliente.telefono || 'No registrado'}</li>`;
                // Puedes agregar más detalles aquí si lo deseas
            });
            listaHTML += "</ul>";
            resultadosContainer.innerHTML = listaHTML;
        } else {
            resultadosContainer.innerHTML = `<p>No se encontraron clientes cuyo nombre contenga: <strong>${apellidoBusqueda}</strong>.</p>`;
        }

    } catch (error) {
        console.error("Error al buscar por apellido: ", error);
        resultadosContainer.innerHTML = "<p class='error'>❌ Error al realizar la búsqueda.</p>";
    }
};

document.getElementById("registro").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const cedula = document.getElementById("cedula").value;
    const telefono = document.getElementById("telefono").value;
    const fechaNacimiento = document.getElementById("fechaNacimiento").value;
    const edad = parseInt(document.getElementById("edad").value);
    const sexo = document.getElementById("sexo").value;
    const plan = parseInt(document.getElementById("plan").value);
    const valorPagado = parseInt(document.getElementById("valorPagado").value);
    const fechaIngreso = new Date(document.getElementById("fechaIngreso").value);
    const apellido = document.getElementById("apellido").value || ""; // Obtener el apellido

    const fechaVencimiento = new Date(fechaIngreso);
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plan);
    const fechaIngresoStr = fechaIngreso.toISOString().split('T')[0];
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

    try {
        await setDoc(doc(db, "clientes", cedula), {
            nombre,
            cedula,
            telefono,
            fechaNacimiento,
            edad,
            sexo,
            plan,
            valorPagado,
            fechaIngreso: fechaIngresoStr,
            fechaVencimiento: fechaVencimientoStr,
            apellido // Guardar el apellido
        });

        const hoy = new Date();
        const estado = hoy <= fechaVencimiento
            ? "<span class='estado-activo'>Activo</span>"
            : "<span class='estado-vencido'>Vencido</span>";

        document.getElementById("resultado").innerHTML =
            `✅ Cliente <strong>${nombre}</strong> actualizado correctamente.<br>Su membresía vence el <strong>${fechaVencimientoStr}</strong>.<br>Estado: ${estado}`;

        verificarVencimientos();

    } catch (error) {
        console.error("Error al registrar: ", error);
        document.getElementById("resultado").innerText = "❌ Error al guardar los datos.";
    }
});

async function verificarVencimientos() {
    const container = document.getElementById("vencenManana");
    container.innerHTML = "";

    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    const fechaObjetivo = mañana.toISOString().split('T')[0];

    const clientesSnap = await getDocs(collection(db, "clientes"));
    clientesSnap.forEach((docu) => {
        const data = docu.data();
        if (data.fechaVencimiento === fechaObjetivo) {
            const link = `https://wa.me/57${data.telefono}?text=Hola%20${encodeURIComponent(data.nombre)},%20te%20saludamos%20desde%20el%20Gimnasio%20Fuerza%20Delta.%20Tu%20membres%C3%ADa%20vence%20ma%C3%B1ana.%20%E2%9C%85%20Sigue%20mejorando%20tu%20salud%20y%20bienestar.%20%C2%A1Te%20esperamos%20para%20renovar%20y%20seguir%20entrenando!`;
            const div = document.createElement("div");
            div.innerHTML = `<strong>${data.nombre}</strong> (${data.telefono}) vence el ${data.fechaVencimiento}<br><a class='whatsapp-link' target='_blank' href='${link}'>📲 Enviar WhatsApp</a><br><br>`;
            container.appendChild(div);
        }
    });
}

verificarVencimientos();